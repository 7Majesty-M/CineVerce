// src/app/profile/[userId]/page.tsx
import { db } from '@/db';
import { reviews, follows, watchlist } from '@/db/schema'; // <--- ДОБАВИЛ watchlist
import { eq, and, count, desc } from 'drizzle-orm'; // <--- ДОБАВИЛ desc для сортировки
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { getMovieById, getTVShowById } from '@/lib/tmdb';
import ProfileClientView from '@/components/ProfileClientView';
import FollowButton from '@/components/FollowButton';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UniversalProfilePage(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const targetUserId = params.userId;
  const { userId: currentUserId } = await auth();

  const isOwnProfile = currentUserId === targetUserId;

  let targetUser;
  try {
    const client = await clerkClient();
    targetUser = await client.users.getUser(targetUserId);
  } catch (e) {
    return notFound();
  }

  // --- 1. ЗАГРУЗКА ДАННЫХ ИЗ БД ---
  
  // Оценки
  const userReviews = await db.select()
    .from(reviews)
    .where(eq(reviews.userId, targetUserId));

  // Watchlist (Буду смотреть) - НОВАЯ ЛОГИКА
  const userWatchlist = await db.select()
    .from(watchlist)
    .where(eq(watchlist.userId, targetUserId))
    .orderBy(desc(watchlist.createdAt)); // Свежие сверху

  // Подписки
  let isFollowing = false;
  if (currentUserId && !isOwnProfile) {
    const followCheck = await db.select().from(follows).where(and(
      eq(follows.followerId, currentUserId),
      eq(follows.followingId, targetUserId)
    ));
    isFollowing = followCheck.length > 0;
  }

  const followersData = await db.select({ count: count() }).from(follows).where(eq(follows.followingId, targetUserId));
  const followingData = await db.select({ count: count() }).from(follows).where(eq(follows.followerId, targetUserId));
  
  const followersCount = followersData[0].count;
  const followingCount = followingData[0].count;

  // --- 2. ОБРАБОТКА ДАННЫХ ДЛЯ UI ---

  // Статистика для радара
  const totalReviews = userReviews.length;
  const totals = { plot: 0, acting: 0, visuals: 0, sound: 0, characters: 0, atmosphere: 0, ending: 0, originality: 0 };

  userReviews.forEach(r => {
    const details = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
    if (details) {
      totals.plot += details.plot || 0;
      totals.acting += details.acting || 0;
      totals.visuals += details.visuals || 0;
      totals.sound += details.sound || 0;
      totals.characters += details.characters || 0;
      totals.atmosphere += details.atmosphere || 0;
      totals.ending += details.ending || 0;
      totals.originality += details.originality || 0;
    }
  });

  const radarData = [
    { subject: 'Сюжет', A: totalReviews ? (totals.plot / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Актеры', A: totalReviews ? (totals.acting / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Визуал', A: totalReviews ? (totals.visuals / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Звук', A: totalReviews ? (totals.sound / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Герои', A: totalReviews ? (totals.characters / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Вайб', A: totalReviews ? (totals.atmosphere / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Финал', A: totalReviews ? (totals.ending / totalReviews).toFixed(1) : 0, fullMark: 10 },
    { subject: 'Идея', A: totalReviews ? (totals.originality / totalReviews).toFixed(1) : 0, fullMark: 10 },
  ];

  const averageScore = totalReviews ? (userReviews.reduce((a, b) => a + b.rating, 0) / totalReviews).toFixed(1) : '0.0';

  // --- 3. ПОДГРУЗКА ИНФОРМАЦИИ С TMDB (Картинки и названия) ---

  // Для истории оценок
  const sortedReviews = userReviews.sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()).slice(0, 5);
  const history = await Promise.all(
    sortedReviews.map(async (review) => {
        let mediaData = null;
        try {
            if (review.mediaType === 'movie') {
                mediaData = await getMovieById(String(review.mediaId));
            } else {
                mediaData = await getTVShowById(String(review.mediaId));
            }
        } catch (e) { }
        return {
            ...review,
            poster_path: mediaData?.poster_path,
            title: mediaData?.title || mediaData?.name || 'Неизвестно',
            year: (mediaData?.release_date || mediaData?.first_air_date || '').split('-')[0]
        };
    })
  );

  // Для Watchlist (НОВОЕ!)
  const watchlistWithData = await Promise.all(
    userWatchlist.map(async (item) => {
        let mediaData: any = null;
        try {
            if (item.mediaType === 'movie') {
                mediaData = await getMovieById(String(item.mediaId));
            } else {
                mediaData = await getTVShowById(String(item.mediaId));
            }
        } catch (e) { }
        return {
            ...item,
            poster_path: mediaData?.poster_path,
            title: mediaData?.title || mediaData?.name || 'Неизвестно',
        };
    })
  );

  // Уровни
  const getLevel = (count: number) => {
      if (count >= 50) return { name: 'Легенда Кино', next: 100, progress: 100, color: 'text-yellow-400', bg: 'bg-yellow-500' };
      if (count >= 20) return { name: 'Главный Критик', next: 50, progress: (count / 50) * 100, color: 'text-red-400', bg: 'bg-red-500' };
      if (count >= 10) return { name: 'Насмотренный', next: 20, progress: (count / 20) * 100, color: 'text-purple-400', bg: 'bg-purple-500' };
      if (count >= 5) return { name: 'Любитель', next: 10, progress: (count / 10) * 100, color: 'text-blue-400', bg: 'bg-blue-500' };
      return { name: 'Новичок', next: 5, progress: (count / 5) * 100, color: 'text-slate-400', bg: 'bg-slate-500' };
  };
  const level = getLevel(totalReviews);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 selection:bg-pink-500/30">
      
      {/* HEADER (Оставляем как есть, добавил только стат по Watchlist для красоты в будущем) */}
      <div className="relative h-96 w-full overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#050505]/90 to-[#050505] z-0"></div>
         <div className="absolute top-0 inset-x-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay z-0"></div>
         <div className="absolute top-[-50%] left-[20%] w-[60%] h-[150%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>

         <div className="absolute top-8 left-6 md:left-12 z-50">
            <Link href="/" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-sm font-bold text-slate-300 hover:text-white">
               <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
               На главную
            </Link>
         </div>

         <div className="container mx-auto px-6 relative z-10 h-full flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#050505] shadow-2xl overflow-hidden relative group">
                    <img src={targetUser.imageUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                
                <div className="flex-1 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest ${level.color}`}>
                            {level.name}
                        </span>
                        {isOwnProfile && <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-slate-300">Это Вы</span>}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2">
                        {targetUser.firstName} {targetUser.lastName}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 mb-4">
                        <div className="flex items-center gap-2 hover:text-white cursor-pointer transition">
                            <span className="text-white text-lg">{followersCount}</span> Подписчиков
                        </div>
                        <div className="flex items-center gap-2 hover:text-white cursor-pointer transition">
                            <span className="text-white text-lg">{followingCount}</span> Подписок
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-lg">{totalReviews}</span> Оценок
                        </div>
                    </div>

                    <div className="w-full max-w-md">
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${level.bg} shadow-[0_0_15px_currentColor] transition-all duration-1000`} style={{ width: `${level.progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {!isOwnProfile && currentUserId && (
                        <FollowButton targetUserId={targetUserId} initialIsFollowing={isFollowing} />
                    )}
                    {isOwnProfile && (
                        <button className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-all text-slate-300 hover:text-white">
                            Редактировать
                        </button>
                    )}
                </div>
            </div>
         </div>
      </div>

      {/* --- CLIENT CONTENT --- */}
      {/* ПЕРЕДАЕМ ЗАГРУЖЕННЫЙ WATCHLIST В КОМПОНЕНТ */}
      <ProfileClientView 
        radarData={radarData} 
        history={history} 
        watchlist={watchlistWithData} // <--- ВОТ ЗДЕСЬ БЫЛО ПУСТО, ТЕПЕРЬ ДАННЫЕ ЕСТЬ
        totalReviews={totalReviews}
        averageScore={averageScore}
      />

    </div>
  );
}
