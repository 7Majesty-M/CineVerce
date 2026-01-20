// src/app/lists/page.tsx
import { db } from '@/db';
import { listMembers, lists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import CreateListButton from '@/components/CreateListButton';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             <div className="relative z-10 text-center">
                <h2 className="text-3xl font-black mb-2 tracking-tight">Доступ ограничен</h2>
                <p className="text-slate-400">Войдите в систему, чтобы управлять своей киновселенной.</p>
             </div>
        </div>
    );
  }

  // Получаем списки
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

  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ---
  const getGradient = (id: number | string) => {
    const variants = [
        'from-pink-500 via-rose-500 to-yellow-500',
        'from-blue-400 via-indigo-500 to-purple-500',
        'from-emerald-400 via-teal-500 to-cyan-500',
        'from-orange-400 via-red-500 to-pink-500',
        'from-violet-500 via-purple-500 to-fuchsia-500',
    ];
    // Добавлено String(id), чтобы избежать ошибки .split is not a function
    const index = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % variants.length;
    return variants[index];
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Navbar /> 
      
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 pt-28 px-6 pb-20 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
            <div className="space-y-4 max-w-2xl">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 hover:text-white uppercase transition-colors mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Ваша библиотека
                </Link>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 leading-[0.9]">
                    Мои коллекции
                </h1>
                <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
                    Организуйте фильмы, создавайте подборки для марафонов и делитесь ими с друзьями.
                </p>
            </div>
            
            <div className="shrink-0 relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
               <div className="relative">
                   <CreateListButton />
               </div>
            </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {myLists.map(list => {
              // Получаем цвета для конкретной карточки
              const gradientColors = getGradient(list.id);
              
              return (
                <Link key={list.id} href={`/lists/${list.id}`} className="group relative block h-full">
                    
                    {/* --- 1. ФОНОВОЕ СВЕЧЕНИЕ (GLOW) --- */}
                    {/* Это слой ПОД карточкой. Он создает эффект цветной границы и свечения. */}
                    <div className={`absolute -inset-[1px] bg-gradient-to-br ${gradientColors} rounded-[2rem] opacity-30 group-hover:opacity-100 group-hover:blur-md transition duration-500`}></div>

                    {/* --- 2. ОСНОВНОЕ ТЕЛО КАРТОЧКИ --- */}
                    {/* relative z-10 поднимает контент над свечением */}
                    <div className="relative z-10 h-full bg-[#0E0E0E] rounded-[2rem] overflow-hidden flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                        
                        {/* Верхняя часть (Обложка) */}
                        <div className={`h-32 bg-gradient-to-br ${gradientColors} opacity-80 relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                            
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${
                                    list.isPublic 
                                    ? 'bg-black/20 text-white border-white/20' 
                                    : 'bg-black/40 text-white/70 border-white/10'
                                }`}>
                                    {list.isPublic ? 'Public' : 'Private'}
                                </div>
                            </div>

                            <div className="absolute bottom-3 left-6 w-14 h-14 bg-[#0E0E0E] rounded-2xl flex items-center justify-center p-1 shadow-xl">
    <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-xl">
        📁
    </div>
</div>
                        </div>

                        {/* Контент */}
                        <div className="p-6 pt-10 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all line-clamp-1">
                                    {list.name}
                                </h3>
                                <svg className="w-5 h-5 text-slate-600 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>

                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">
                                {list.description || "Нет описания"}
                            </p>

                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                                    {new Date(list.createdAt!).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                
                                {list.role === 'admin' && (
                                    <span className="text-xs text-white/30 font-medium px-2 py-0.5 rounded bg-white/5">Владелец</span>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
              );
            })}

            {/* EMPTY STATE */}
            {myLists.length === 0 && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center text-center relative border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01] overflow-hidden group">
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
                 
                 <div className="relative z-10 scale-100 group-hover:scale-105 transition-transform duration-500">
                    <div className="w-24 h-24 bg-gradient-to-tr from-slate-800 to-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/10 mx-auto">
                        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Создайте первую коллекцию</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                        Списки помогают структурировать то, что вы хотите посмотреть.
                    </p>
                    <div className="inline-block">
                         <CreateListButton />
                    </div>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
