import { db } from '@/db';
import { lists, listItems, listMembers, users } from '@/db/schema';
import { auth } from '@/auth'; // NextAuth
import { eq, and, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getMovieById, getTVShowById } from '@/lib/tmdb';
import Link from 'next/link';
import AddMemberButton from '@/components/AddMemberButton';
import RemoveItemButton from '@/components/RemoveItemButton';

export const dynamic = 'force-dynamic';

export default async function ListDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const listId = Number(params.id);
  
  // 1. АВТОРИЗАЦИЯ
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect('/');

  // 2. ПОЛУЧЕНИЕ СПИСКА (Через db.select)
  const listData = await db.select().from(lists).where(eq(lists.id, listId)).limit(1);
  const list = listData[0];

  if (!list) notFound();

  // 3. ПРОВЕРКА ДОСТУПА
  const membershipData = await db.select()
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
    .limit(1);
  
  const membership = membershipData[0];

  if (!membership && !list.isPublic) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">🔒 Доступ запрещен</h1>
                <Link href="/lists" className="mt-6 inline-block text-pink-500 hover:underline">Вернуться к моим спискам</Link>
            </div>
        </div>
    );
  }

  const isAdmin = membership?.role === 'admin';

  // 4. ПОЛУЧЕНИЕ УЧАСТНИКОВ
  const members = await db.select({
      id: users.id,
      name: users.name,
      imageUrl: users.image, // В NextAuth поле называется 'image'
      role: listMembers.role
  })
  .from(listMembers)
  .innerJoin(users, eq(listMembers.userId, users.id))
  .where(eq(listMembers.listId, listId));

  // 5. ПОЛУЧЕНИЕ ФИЛЬМОВ
  const items = await db.select().from(listItems).where(eq(listItems.listId, listId)).orderBy(desc(listItems.createdAt));

  const itemsWithData = await Promise.all(items.map(async (item) => {
      let mediaData: any = null;
      try {
          if (item.mediaType === 'movie') mediaData = await getMovieById(String(item.mediaId));
          else mediaData = await getTVShowById(String(item.mediaId));
      } catch (e) {}
      
      const safeData = mediaData as any;

      return { 
          ...item, 
          poster: safeData?.poster_path, 
          title: safeData?.title || safeData?.name || 'Загрузка...' 
      };
  }));

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 bg-[#111] p-8 rounded-[2.5rem] border border-white/5 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
            
            <Link href="/lists" className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 inline-block transition-colors">← Мои коллекции</Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl md:text-6xl font-black">{list.name}</h1>
                        {!list.isPublic && <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase text-slate-400">Private</span>}
                    </div>
                    <p className="text-slate-400 text-lg max-w-xl">{list.description || "Коллекция фильмов и сериалов"}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-black/20 p-2 pr-4 rounded-full border border-white/5 backdrop-blur-md relative z-50">
                    <div className="flex -space-x-3 pl-2">
                        {members.map(m => (
                            <img key={m.id} src={m.imageUrl || ''} className="w-10 h-10 rounded-full border-2 border-[#111]" title={m.name || ''} />
                        ))}
                    </div>
                    {isAdmin && (
                        <div className="relative z-50">
                            <AddMemberButton listId={listId} />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* ITEMS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {itemsWithData.map(item => (
                <div key={item.id} className="group relative aspect-[2/3] bg-slate-800 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl">
                    <Link href={`/${item.mediaType}/${item.mediaId}`}>
                        {item.poster ? (
                            <img src={`https://image.tmdb.org/t/p/w500${item.poster}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                            <span className="font-bold text-sm text-white line-clamp-2">{item.title}</span>
                            <span className="text-[10px] text-pink-400 font-bold uppercase mt-1">{item.mediaType}</span>
                        </div>
                    </Link>
                    
                    {(isAdmin || item.addedBy === userId) && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <RemoveItemButton itemId={item.id} listId={listId} />
                        </div>
                    )}
                </div>
            ))}
            
            {itemsWithData.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
                    <div className="text-6xl mb-4 opacity-30">🍿</div>
                    <h3 className="text-xl font-bold text-white mb-2">Коллекция пуста</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Перейдите на страницу любого фильма и нажмите "Добавить в список", чтобы наполнить эту коллекцию.</p>
                    <Link href="/" className="mt-6 inline-block bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        Найти фильмы
                    </Link>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
