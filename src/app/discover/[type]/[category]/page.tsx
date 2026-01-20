// src/app/discover/[type]/[category]/page.tsx

import { getMediaCollection } from '@/app/actions';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

// Словарь для красивых заголовков
const TITLES: Record<string, string> = {
  now_playing: 'Сейчас в кино',
  upcoming: 'Скоро на экранах',
  top_rated: 'Топ рейтинг',
  popular: 'Популярное сейчас',
  on_the_air: 'Сейчас в эфире',
  airing_today: 'Выходят сегодня'
};

export default async function CategoryPage(props: { params: Promise<{ type: string; category: string }> }) {
  const params = await props.params;
  const { type, category } = params;
  
  // Загружаем данные
  const items = await getMediaCollection(type as 'movie' | 'tv', category as any);

  const title = TITLES[category] || 'Подборка';
  const typeLabel = type === 'movie' ? 'Фильмы' : 'Сериалы';

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30">
      <Navbar />
      
      <div className="container mx-auto px-6 py-32">
        {/* Заголовок */}
        <div className="mb-12">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{typeLabel}</div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                {title}
            </h1>
        </div>

        {/* Сетка */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {items.map((item: any) => {
                const date = item.release_date || item.first_air_date;
                const year = date ? date.split('-')[0] : 'N/A';
                
                return (
                    <div key={item.id} className="group relative">
                        <Link href={`/${type}/${item.id}`} className="block relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#121212] border border-white/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            {item.poster_path ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                                    alt={item.title || item.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
                            )}
                            
                            {/* Рейтинг */}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-yellow-400 border border-white/10">
                                ★ {item.vote_average.toFixed(1)}
                            </div>

                            {/* Оверлей с кнопками (как везде) */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="relative z-50">
                                    <AddToListDropdown mediaId={item.id} mediaType={type as any} compact={true} />
                                </div>
                                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="relative z-40">
                                    <WatchlistButton mediaId={item.id} mediaType={type as any} isInWatchlist={false} compact={true} />
                                </div>
                            </div>
                        </Link>
                        
                        <div className="mt-3 px-1">
                            <h3 className="font-bold text-slate-200 text-sm truncate group-hover:text-white transition-colors">
                                {item.title || item.name}
                            </h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-500 font-medium border border-white/10 px-1.5 py-0.5 rounded">
                                    {year}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
        
        {items.length === 0 && (
            <div className="text-center text-slate-500 py-20">Список пуст или не удалось загрузить данные.</div>
        )}
      </div>
    </div>
  );
}
