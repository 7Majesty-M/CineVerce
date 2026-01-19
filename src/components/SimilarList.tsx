'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Recommendation } from '@/lib/tmdb';
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

// Расширенный тип для дат
interface ExtendedRecommendation extends Recommendation {
  release_date?: string;
  first_air_date?: string;
}

export default function SimilarList({ items, type }: { items: Recommendation[], type: 'movie' | 'tv' }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Проверка скролла
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  // Функция прокрутки
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.7) : (clientWidth * 0.7);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-16 fade-in-card relative group/list" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
        Вам может понравиться
      </h3>

      <div className="relative">
        
        {/* --- ЛЕВАЯ СТРЕЛКА --- */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-14 z-40 w-20 flex items-center justify-center bg-gradient-to-r from-black via-black/70 to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
          </button>
        )}

        {/* --- КОНТЕЙНЕР СКРОЛЛА --- */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-6 pb-14 pt-2 pl-1 pr-8 snap-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((rawItem) => {
            const item = rawItem as ExtendedRecommendation;
            const dateStr = item.release_date || item.first_air_date;
            const year = dateStr ? dateStr.split('-')[0] : 'N/A';

            return (
              <Link 
                key={item.id} 
                href={`/${type}/${item.id}`}
                className="w-[220px] md:w-[280px] flex-shrink-0 snap-start group relative"
              >
                {/* Постер */}
                <div className="relative aspect-[2/3] bg-[#121212] border border-white/10 shadow-lg transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:-translate-y-2 rounded-2xl overflow-hidden">
                  
                  {item.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w780${item.poster_path}`} 
                      alt={item.title || item.name || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
                  )}
                  
                  {/* Рейтинг */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-sm font-bold text-yellow-400 border border-white/10 z-20">
                    ★ {item.vote_average.toFixed(1)}
                  </div>

                  {/* Оверлей с кнопками */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 z-30">
                    
                    <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="relative z-50 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                    >
                        <AddToListDropdown 
                            mediaId={item.id} 
                            mediaType={type} 
                            compact={true}
                            // Убрали modal={true}, так как compact={true} уже включает модалку
                        />
                    </div>

                    <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="relative z-40 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100"
                    >
                        <WatchlistButton 
                            mediaId={item.id} 
                            mediaType={type} 
                            isInWatchlist={false}
                            compact={true} 
                        />
                    </div>
                  </div>

                </div>
                
                <h4 className="mt-4 text-lg font-bold text-slate-200 group-hover:text-white truncate transition-colors px-1">
                  {item.title || item.name}
                </h4>
                <div className="flex items-center gap-2 px-1 mt-1">
                     <span className="text-xs text-slate-500 font-medium border border-white/10 px-1.5 py-0.5 rounded">
                        {year}
                     </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* --- ПРАВАЯ СТРЕЛКА --- */}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-14 z-40 w-20 flex items-center justify-center bg-gradient-to-l from-black via-black/70 to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        )}

      </div>
    </div>
  );
}
