'use client';

import { useState } from 'react';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

interface CreditItem {
  id: number;
  media_type: string;
  poster_path: string | null;
  vote_average: number;
  title?: string;
  name?: string;
  character?: string;
  release_date?: string;
  first_air_date?: string;
}

export default function PersonCreditsGrid({ items }: { items: CreditItem[] }) {
  const INITIAL_COUNT = 24;
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);

  const visibleItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const handleLoadMore = () => {
    setDisplayCount(items.length);
  };

  return (
    <>
      {/* 
          МАКСИМАЛЬНЫЙ РАЗМЕР:
          - grid-cols-2 (мобильные и планшеты) -> 2 карточки в ряд
          - lg:grid-cols-3 (ноутбуки и десктопы) -> ВСЕГО 3 карточки в ряд!
          
          Карточки будут очень широкими и высокими.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
        {visibleItems.map((item) => (
          <Link
            key={`${item.media_type}-${item.id}`}
            href={`/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
            className="group block relative"
          >
            {/* Постер */}
            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden bg-[#121212] border border-white/10 mb-6 transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] group-hover:-translate-y-3">
              
              {item.poster_path ? (
                 <img
                    // Используем original или w780 для максимальной четкости
                    src={`https://image.tmdb.org/t/p/w780${item.poster_path}`} 
                    alt={item.title || item.name}
                    className="w-full h-full object-cover rounded-[2rem]"
                    loading="lazy"
                 />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-700 rounded-[2rem]">No Image</div>
              )}

              {/* Рейтинг (Увеличен) */}
              <div className="absolute top-5 right-5 px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-xl text-base font-bold text-yellow-400 border border-white/10 z-20 shadow-xl">
                ★ {item.vote_average.toFixed(1)}
              </div>

              {/* ОВЕРЛЕЙ С КНОПКАМИ */}
              <div className="absolute inset-0 rounded-[2rem] bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-6 z-30">
                  
                  {/* В список */}
                  <div 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="relative z-50 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300 delay-75 scale-110 origin-bottom-left"
                  >
                      <AddToListDropdown 
                          mediaId={item.id} 
                          mediaType={item.media_type as 'movie' | 'tv'} 
                          compact={true} 
                      />
                  </div>

                  {/* Буду смотреть */}
                  <div 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="relative z-40 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300 delay-100 scale-110 origin-bottom-right"
                  >
                      <WatchlistButton 
                          mediaId={item.id} 
                          mediaType={item.media_type as 'movie' | 'tv'} 
                          isInWatchlist={false} 
                          compact={true} 
                      />
                  </div>
              </div>

            </div>

            {/* Заголовок (Очень крупный) */}
            <h4 className="text-xl md:text-2xl font-bold text-slate-200 group-hover:text-white truncate transition-colors px-2 leading-tight">
              {item.title || item.name}
            </h4>

            <p className="text-base text-slate-500 truncate px-2 mt-2 font-medium">
              {item.character
                ? `как ${item.character}`
                : (item.release_date || item.first_air_date)?.split('-')[0]}
            </p>
          </Link>
        ))}
      </div>

      {/* КНОПКА ЗАГРУЗИТЬ ЕЩЕ */}
      {hasMore && (
        <div className="mt-24 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="group relative px-14 py-6 rounded-full font-bold text-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-white transition-all duration-300 active:scale-95 flex items-center gap-4 shadow-2xl"
          >
            <span>Показать все работы</span>
            <span className="bg-white/10 px-4 py-1 rounded-full text-sm text-slate-300 font-mono">
                {items.length - displayCount}
            </span>
            <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
