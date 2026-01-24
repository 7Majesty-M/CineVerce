import { db } from '@/db';
import { reviews, follows, watchlist, users, watchedHistory, favorites } from '@/db/schema';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { getMovieById, getTVShowById } from '@/lib/tmdb';
import ProfileClientView from '@/components/ProfileClientView';
import ProfileHeader from '@/components/ProfileHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getUserFavorites } from '@/lib/db-queries'; // (или путь к вашему файлу)

export const dynamic = 'force-dynamic';

export default async function UniversalProfilePage(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const targetUserId = params.userId;
  const userFavorites = await getUserFavorites(targetUserId);

  // 1. ПОЛУЧАЕМ ТЕКУЩЕГО ЮЗЕРА (КТО СМОТРИТ)
  const session = await auth();
  const currentUserId = session?.user?.id;
  const isOwnProfile = currentUserId === targetUserId;

  // 2. ПОЛУЧАЕМ ДАННЫЕ ЦЕЛЕВОГО ЮЗЕРА ИЗ БД
  const userResult = await db.select().from(users).where(eq(users.id, targetUserId));
  const targetUser = userResult[0];

  if (!targetUser) {
    return notFound();
  }

  // --- 1. ЗАГРУЗКА ДАННЫХ ИЗ БД ---

  // Оценки
  const userReviews = await db.select()
    .from(reviews)
    .where(eq(reviews.userId, targetUserId));

  // Watchlist (Буду смотреть)
  const userWatchlist = await db.select()
    .from(watchlist)
    .where(eq(watchlist.userId, targetUserId))
    .orderBy(desc(watchlist.createdAt));

  // История просмотров (FIX: ТЕПЕРЬ ФИКСИРОВАННЫЙ СТАРТ ВМЕСТО 365 ДНЕЙ)
  
  // Дата начала отсчета (например, запуск проекта или начало 2024 года)
  // ВАЖНО: Эта дата не меняется, поэтому старые квадратики не будут исчезать
  const PROJECT_START_DATE = new Date('2024-01-01'); 

  const rawHistoryStats = await db
    .select({
      date: sql<string>`DATE(${watchedHistory.watchedAt})`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(watchedHistory)
    .where(
      and(
        eq(watchedHistory.userId, targetUserId),
        // Берем все записи от начала проекта (или можно убрать это условие, чтобы брать вообще всё)
        sql`${watchedHistory.watchedAt} >= ${PROJECT_START_DATE.toISOString()}`
      )
    )
    .groupBy(sql`DATE(${watchedHistory.watchedAt})`)
    .orderBy(sql`DATE(${watchedHistory.watchedAt})`);

  // Создаем полный массив дней от СТАРТА до СЕГОДНЯ
  const generateFullHistoryData = () => {
    const data: any[] = [];
    
    // Начинаем с фиксированной даты
    let currentDate = new Date(PROJECT_START_DATE);
    const today = new Date();

    // Цикл: пока текущая дата меньше или равна сегодняшней
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Воскресенье

      // Ищем данные для этого дня
      const dayData = rawHistoryStats.find(s => s.date === dateStr);

      data.push({
        date: dateStr,
        dayOfWeek,
        count: dayData?.count || 0,
        fullDate: currentDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });

      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  const activityData = generateFullHistoryData();

  // Общее количество просмотров
  const totalWatchedResult = await db
    .select({ count: count() })
    .from(watchedHistory)
    .where(eq(watchedHistory.userId, targetUserId));

  const totalWatchedCount = totalWatchedResult[0]?.count || 0;

  // Подписки
  let isFollowing = false;
  if (currentUserId && !isOwnProfile) {
    const followCheck = await db.select().from(follows).where(and(
      eq(follows.followerId, currentUserId),
      eq(follows.followingId, targetUserId)
    ));
    isFollowing = followCheck.length > 0;
  }

  // Считаем подписчиков
  const followersData = await db.select({ count: count() }).from(follows).where(eq(follows.followingId, targetUserId));
  const followingData = await db.select({ count: count() }).from(follows).where(eq(follows.followerId, targetUserId));

  const followersCount = followersData[0].count;
  const followingCount = followingData[0].count;

  // --- 2. ОБРАБОТКА ДАННЫХ ДЛЯ UI ---

  // Статистика для радара (на основе рецензий)
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

  // История рецензий (последние действия)
  const sortedReviews = userReviews.sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());

  const history = await Promise.all(
    sortedReviews.map(async (review) => {
      let mediaData: any = null;
      try {
        if (review.mediaType === 'movie') {
          mediaData = await getMovieById(String(review.mediaId));
        } else {
          mediaData = await getTVShowById(String(review.mediaId));
        }
      } catch (e) { }

      const safeData = mediaData as any;
      return {
        ...review,
        poster_path: safeData?.poster_path,
        title: safeData?.title || safeData?.name || 'Неизвестно',
        year: (safeData?.release_date || safeData?.first_air_date || '').split('-')[0]
      };
    })
  );

  // Watchlist
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

      const safeData = mediaData as any;
      return {
        ...item,
        poster_path: safeData?.poster_path,
        title: safeData?.title || safeData?.name || 'Неизвестно',
      };
    })
  );

  // Уровни (рассчитываем на основе кол-ва рецензий ИЛИ просмотров)
  const totalActivity = totalReviews + totalWatchedCount;

  const getLevel = (count: number) => {
    if (count >= 100) return { name: 'Киноман-Легенда', next: 200, progress: 100, color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (count >= 50) return { name: 'Главный Критик', next: 100, progress: (count / 100) * 100, color: 'text-red-400', bg: 'bg-red-500' };
    if (count >= 20) return { name: 'Насмотренный', next: 50, progress: (count / 50) * 100, color: 'text-purple-400', bg: 'bg-purple-500' };
    if (count >= 5) return { name: 'Любитель', next: 20, progress: (count / 20) * 100, color: 'text-blue-400', bg: 'bg-blue-500' };
    return { name: 'Новичок', next: 5, progress: (count / 5) * 100, color: 'text-slate-400', bg: 'bg-slate-500' };
  };

  const level = getLevel(totalActivity);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 selection:bg-pink-500/30">
      <Navbar />

      {/* КНОПКА НАЗАД */}
      <div className="fixed top-8 left-6 md:left-12 z-50 pt-20">
        <Link href="/" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-sm font-bold text-slate-300 hover:text-white">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          На главную
        </Link>
      </div>

      {/* НОВЫЙ ПРОФИЛЬНЫЙ ХЕДЕР */}
      <ProfileHeader
        user={{
          firstName: targetUser.name?.split(' ')[0] || 'User',
          lastName: targetUser.name?.split(' ').slice(1).join(' ') || '',
          imageUrl: targetUser.image || ''
        }}
        stats={{
          followers: followersCount,
          following: followingCount,
          reviews: totalReviews,
          watched: totalWatchedCount
        }}
        level={level}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        targetUserId={targetUserId}
      />

      <ProfileClientView
        radarData={radarData}
        history={history}
        watchlist={watchlistWithData}
        totalReviews={totalReviews}
        averageScore={averageScore}
        activityData={activityData}
        favoriteItems={userFavorites} 
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
