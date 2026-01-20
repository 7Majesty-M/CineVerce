'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

interface CollectionListProps {
  title: string;
  items: MediaItem[];
  type: 'movie' | 'tv';
  gradient?: string;
}

export default function CollectionList({ 
  title, 
  items, 
  type, 
  gradient = "from-white to-slate-400" 
}: CollectionListProps) {
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  // --- ЛОГИКА СКРОЛЛА ---
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftBtn(scrollLeft > 0);
      setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollContainer = scrollRef.current;
    window.addEventListener('resize', checkScroll);
    if (scrollContainer) scrollContainer.addEventListener('scroll', checkScroll);
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', checkScroll);
    };
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.6 * (direction === 'left' ? -1 : 1);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    // УМЕНЬШИЛ ВЕРТИКАЛЬНЫЕ ОТСТУПЫ СЕКЦИИ (было py-10 md:py-14)
    <section className="py-6 md:py-10 border-t border-white/5 relative">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        
        {/* ЗАГОЛОВОК */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className={`w-1.5 md:w-2 h-8 md:h-10 rounded-full bg-gradient-to-b ${gradient}`}></div>
            <h3 className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent tracking-tight drop-shadow-sm`}>
              {title}
            </h3>
        </div>

        {/* ОБЕРТКА СЛАЙДЕРА */}
        <div className="relative group/slider w-full">
          
          {/* --- ЛЕВАЯ КНОПКА --- */}
          <button 
            onClick={() => scroll('left')}
            className={`
              absolute -left-3 md:-left-10 top-0 bottom-0 z-50 w-10 md:w-14
              bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent 
              text-white flex items-center justify-start pl-1 md:pl-2
              transition-all duration-300
              ${showLeftBtn ? 'opacity-0 group-hover/slider:opacity-100 cursor-pointer' : 'hidden'}
            `}
          >
             <svg className="w-8 h-8 md:w-10 md:h-10 hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
             </svg>
          </button>

          {/* --- ПРАВАЯ КНОПКА --- */}
          <button 
            onClick={() => scroll('right')}
            className={`
              absolute -right-3 md:-right-10 top-0 bottom-0 z-50 w-10 md:w-14
              bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent 
              text-white flex items-center justify-end pr-1 md:pr-2
              transition-all duration-300
              ${showRightBtn ? 'opacity-0 group-hover/slider:opacity-100 cursor-pointer' : 'hidden'}
            `}
          >
             <svg className="w-8 h-8 md:w-10 md:h-10 hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
             </svg>
          </button>

          {/* --- СПИСОК --- */}
          <div 
            ref={scrollRef}
            className="
                flex gap-5 md:gap-8 
                overflow-x-auto 
                /* УМЕНЬШИЛ НИЖНИЙ ОТСТУП */
                pb-6 pt-4 px-1
                /* ПОЛНОСТЬЮ СКРЫВАЕМ СКРОЛЛБАР */
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                snap-x snap-mandatory scroll-smooth
            "
          >
            {items.map((item) => {
              const dateStr = item.release_date || item.first_air_date;
              const year = dateStr ? dateStr.split('-')[0] : '';
              
              return (
                <Link 
                  key={item.id} 
                  href={`/${type}/${item.id}`}
                  className="
                    snap-start flex-shrink-0
                    w-[180px] sm:w-[220px] lg:w-[280px] 
                    group relative flex flex-col
                  "
                >
                  {/* ПОСТЕР */}
                  <div className="
                    relative aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden bg-[#1a1a1a] 
                    border border-white/5 shadow-lg 
                    transition-all duration-500 ease-out
                    group-hover:-translate-y-2 md:group-hover:-translate-y-3 
                    group-hover:shadow-[0_12px_40px_-10px_rgba(255,255,255,0.1)] 
                    group-hover:border-white/20
                  ">
                    
                    {item.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                        alt={item.title || item.name || ''} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center">
                        <span className="text-3xl opacity-20">🎬</span>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-40">No Image</span>
                      </div>
                    )}
                    
                    {/* Рейтинг */}
                    <div className="absolute top-3 right-3 z-20">
                        <div className="px-2 py-1 rounded-md bg-black/80 border border-white/10 flex items-center gap-1.5 shadow-lg">
                            <span className="text-yellow-400 text-xs md:text-sm">★</span>
                            <span className="text-xs md:text-sm font-bold text-white">{item.vote_average.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Градиент снизу */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* КНОПКИ ДЕЙСТВИЙ */}
                    <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="cursor-pointer">
                            <AddToListDropdown mediaId={item.id} mediaType={type} compact={true} />
                        </div>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="cursor-pointer delay-75">
                            <WatchlistButton mediaId={item.id} mediaType={type} isInWatchlist={false} compact={true} />
                        </div>
                    </div>
                  </div>
                  
                  {/* ТЕКСТ ПОД ПОСТЕРОМ */}
                  <div className="mt-4 px-1">
                      <h4 className="text-base md:text-lg font-bold text-slate-100 leading-snug line-clamp-1 mb-1.5 group-hover:text-blue-400 transition-colors">
                        {item.title || item.name}
                      </h4>
                      
                      <div className="flex items-center gap-2.5 text-slate-500">
                           {year && (
                             <span className="text-[10px] md:text-xs font-medium border border-white/10 px-2 py-0.5 rounded bg-white/5 text-slate-400">
                               {year}
                             </span>
                           )}
                           <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-600">
                             {type === 'movie' ? 'Movie' : 'TV Series'}
                           </span>
                      </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
