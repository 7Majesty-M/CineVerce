import { db } from '@/db';
import { lists, listItems, listMembers, users } from '@/db/schema';
import { auth } from '@/auth'; 
import { eq, and, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getMovieById, getTVShowById } from '@/lib/tmdb';
import Link from 'next/link';

// Импорт компонентов
import AddMemberButton from '@/components/AddMemberButton';
import RemoveItemButton from '@/components/RemoveItemButton';
import EditableListTitle from '@/components/EditableListTitle';

export const dynamic = 'force-dynamic';

export default async function ListDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const listId = Number(params.id);
  
  // ------------------------------------------------------------------
  // 1. АВТОРИЗАЦИЯ И ПОЛУЧЕНИЕ ДАННЫХ
  // ------------------------------------------------------------------
  const session = await auth();
  const userId = session?.user?.id;

  // Получаем сам список
  const listData = await db.select().from(lists).where(eq(lists.id, listId)).limit(1);
  const list = listData[0];
  
  if (!list) notFound();

  // Проверка прав доступа
  let isAdmin = false;
  let isMember = false;

  if (userId) {
      const membershipData = await db.select()
        .from(listMembers)
        .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
        .limit(1);
      
      const membership = membershipData[0];
      if (membership) {
          isMember = true;
          isAdmin = membership.role === 'admin';
      }
  }

  // Блокировка доступа к приватному списку
  if (!list.isPublic && !isMember) {
      if (!userId) redirect('/api/auth/signin');
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <div className="text-center p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl">
                <div className="text-5xl mb-4">🔒</div>
                <h1 className="text-3xl font-bold mb-2">Доступ ограничен</h1>
                <p className="text-slate-400 mb-6">Это приватная коллекция. Доступ только по приглашению.</p>
                <Link href="/lists" className="px-6 py-2 rounded-full bg-white text-black font-bold hover:bg-slate-200 transition">
                    Вернуться к моим спискам
                </Link>
            </div>
        </div>
      );
  }

  // Получаем участников
  const members = await db.select({
      id: users.id,
      name: users.name,
      imageUrl: users.image,
      role: listMembers.role
  })
  .from(listMembers)
  .innerJoin(users, eq(listMembers.userId, users.id))
  .where(eq(listMembers.listId, listId));

  // Получаем фильмы из БД
  const items = await db.select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(desc(listItems.createdAt));
  
  // Обогащаем данными из TMDB API
  const itemsWithData = await Promise.all(items.map(async (item) => {
      let mediaData: any = null;
      try {
          if (item.mediaType === 'movie') mediaData = await getMovieById(String(item.mediaId));
          else mediaData = await getTVShowById(String(item.mediaId));
      } catch (e) { console.error(e); }
      
      const safeData = mediaData as any;
      return { 
          ...item, 
          poster: safeData?.poster_path, 
          title: safeData?.title || safeData?.name || 'Загрузка...' 
      };
  }));

  // ------------------------------------------------------------------
  // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ------------------------------------------------------------------
  const getPlural = (n: number, one: string, few: string, many: string) => {
    if (n % 10 === 1 && n % 100 !== 11) return one;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
    return many;
  };
  const countLabel = getPlural(items.length, 'Фильм', 'Фильма', 'Фильмов');

  // ------------------------------------------------------------------
  // 3. RENDER
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* === HEADER === */}
        <div className="mb-12 bg-[#111] p-6 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
            {/* Фоновые эффекты */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-pink-500/10 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
            
            {/* Навигация */}
            <Link href="/lists" className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 inline-flex items-center gap-2 transition-colors group/link">
                <span className="group-hover/link:-translate-x-1 transition-transform">←</span>
                Мои коллекции
            </Link>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                
                {/* ЛЕВАЯ КОЛОНКА: ИНФО */}
                <div className="flex-1 min-w-0 w-full relative z-10">
                    
                    {/* Бейдж статуса (Private) - НАД заголовком */}
                    {!list.isPublic && (
                        <div className="flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <span>Private Collection</span>
                            </div>
                        </div>
                    )}

                    {/* Заголовок (Редактируемый) */}
                    <div className="mb-4">
                        <EditableListTitle 
                            listId={listId} 
                            initialName={list.name} 
                            canEdit={isAdmin} 
                        />
                    </div>
                    
                    {/* Описание */}
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                        {list.description || "В этой коллекции пока нет описания."}
                    </p>
                </div>
                
                {/* ПРАВАЯ КОЛОНКА: ВИДЖЕТЫ */}
                <div className="flex flex-wrap items-stretch gap-4 w-full lg:w-auto relative z-10">
                    
                    {/* Виджет 1: Счетчик */}
                    <div className="flex flex-col items-center justify-center min-w-[140px] px-6 py-5 bg-white/[0.03] hover:bg-white/[0.06] rounded-3xl border border-white/5 backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl group/stats cursor-default">
                        <span className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                            {items.length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 group-hover/stats:text-white transition-colors uppercase tracking-[0.2em] mt-2">
                            {countLabel}
                        </span>
                    </div>

                    {/* Виджет 2: Участники */}
                    <div className="flex flex-col justify-center min-w-[140px] px-6 py-5 bg-white/[0.03] hover:bg-white/[0.06] rounded-3xl border border-white/5 backdrop-blur-md transition-all hover:shadow-xl">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
                            Команда
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex -space-x-4">
                                {members.map(m => (
                                    <div key={m.id} className="relative group/avatar hover:z-20 transition-all hover:-translate-y-1 hover:scale-110">
                                        <img 
                                            src={m.imageUrl || ''} 
                                            className="w-10 h-10 rounded-full border-2 border-[#181818] object-cover bg-slate-800 shadow-lg" 
                                            title={m.name || ''} 
                                        />
                                    </div>
                                ))}
                            </div>
                            {isAdmin && (
                                <div className="pl-4 border-l border-white/10">
                                    <AddMemberButton listId={listId} />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* === СЕТКА ФИЛЬМОВ === */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {itemsWithData.map((item, index) => (
                <div 
                    key={item.id} 
                    className="group relative flex flex-col"
                    // Небольшая задержка анимации для каскадного эффекта (опционально можно добавить fade-in)
                >
                    {/* Постер */}
                    <div className="relative aspect-[2/3] bg-slate-800 rounded-2xl overflow-hidden border border-white/5 shadow-lg transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)] group-hover:border-pink-500/30 group-hover:-translate-y-2">
                        <Link href={`/${item.mediaType}/${item.mediaId}`} className="block w-full h-full">
                            {item.poster ? (
                                <img src={`https://image.tmdb.org/t/p/w500${item.poster}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs uppercase font-bold tracking-widest bg-slate-900">
                                    No Image
                                </div>
                            )}
                            
                            {/* Градиент с названием при наведении */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>

                        {/* Кнопка удаления (видна при наведении) */}
                        {(isAdmin || item.addedBy === userId) && (
                            <div className="absolute top-2 right-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                <RemoveItemButton itemId={item.id} listId={listId} />
                            </div>
                        )}
                    </div>

                    {/* Текстовая информация под постером */}
                    <div className="mt-3 px-1">
                        <h3 className="font-bold text-base text-slate-200 group-hover:text-white transition-colors line-clamp-1 leading-snug">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                {item.mediaType}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Пустое состояние */}
            {itemsWithData.length === 0 && (
                <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                    <div className="text-7xl mb-6 opacity-20 grayscale animate-pulse">🍿</div>
                    <h3 className="text-2xl font-black text-white mb-2">Здесь пока пусто</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                        Этот список ждет первых шедевров. Найдите фильм и добавьте его сюда.
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-200 hover:scale-105 transition-all shadow-lg shadow-white/10">
                        <span>Найти фильмы</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
