// src/app/lists/page.tsx
import { db } from '@/db';
import { listMembers, lists } from '@/db/schema'; // Импортируем из схемы
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';
import CreateListButton from '@/components/CreateListButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <p>Войдите, чтобы создавать коллекции.</p>
        </div>
    );
  }

  // Получаем списки, в которых я состою (как владелец или участник)
  // Делаем JOIN: listMembers -> lists
  const myLists = await db.select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      isPublic: lists.isPublic,
      role: listMembers.role,
      createdAt: lists.createdAt
  })
  .from(listMembers)
  .innerJoin(lists, eq(listMembers.listId, lists.id))
  .where(eq(listMembers.userId, userId))
  .orderBy(desc(lists.createdAt));

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
              <h1 className="text-4xl font-black mb-2">Мои коллекции</h1>
              <p className="text-slate-400">Создавайте списки для себя и друзей</p>
          </div>
          <CreateListButton />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myLists.map(list => (
            <Link key={list.id} href={`/lists/${list.id}`} className="group relative bg-[#111] hover:bg-[#161616] p-6 rounded-[2rem] border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    📁
                </div>
                {list.role === 'admin' && (
                    <span className="text-[10px] font-bold bg-pink-500/10 text-pink-400 px-2 py-1 rounded uppercase tracking-wider">Owner</span>
                )}
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-pink-400 transition-colors">{list.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{list.description || "Без описания"}</p>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>{new Date(list.createdAt!).toLocaleDateString()}</span>
                  <span className="group-hover:translate-x-1 transition-transform">Открыть →</span>
              </div>
            </Link>
          ))}
          
          {myLists.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
              <div className="text-6xl mb-4 opacity-30">📭</div>
              <h3 className="text-xl font-bold text-white mb-2">Пока пусто</h3>
              <p className="text-slate-500">Создайте свой первый список, чтобы начать коллекционировать.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
