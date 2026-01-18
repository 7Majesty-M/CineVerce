'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  mediaType: 'movie' | 'tv';
}

export default function TopRatedSlider({ items }: { items: MediaItem[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftBtn(scrollLeft > 0);
      setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth * 0.5 * (direction === 'left' ? -1 : 1);
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    // Убрали отрицательные отступы. Теперь ширина равна ширине контента.
    <div className="relative group/slider w-full"> 
      
      {/* Левая кнопка - висит поверх первой карточки с градиентом */}
      <button 
        onClick={() => scroll('left')}
        className={`absolute -left-4 top-0 bottom-0 z-50 w-20 bg-gradient-to-r from-black via-black/50 to-transparent text-white flex items-center justify-start pl-2 opacity-0 transition-all duration-300 ${showLeftBtn ? 'group-hover/slider:opacity-100' : 'hidden'}`}
      >
        <svg className="w-10 h-10 hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Правая кнопка - висит поверх последней видимой карточки */}
      <button 
        onClick={() => scroll('right')}
        className={`absolute -right-4 top-0 bottom-0 z-50 w-20 bg-gradient-to-l from-black via-black/50 to-transparent text-white flex items-center justify-end pr-2 opacity-0 transition-all duration-300 ${showRightBtn ? 'group-hover/slider:opacity-100' : 'hidden'}`}
      >
        <svg className="w-10 h-10 hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Контейнер скролла */}
      {/* py-10 нужен, чтобы тени карточек и всплывающие цифры не обрезались сверху/снизу */}
      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto py-10 no-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {items.map((item, index) => (
          <div key={`top-${item.id}`} className="snap-start flex-shrink-0">
            <TopRatedCard item={item} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRatedCard({ item, index }: { item: MediaItem; index: number }) {
  const linkHref = `/${item.mediaType}/${item.id}`;
  return (
    <Link href={linkHref} className="group relative block w-64 md:w-80 perspective-1000">
      {/* Цифра теперь не обрезается благодаря py-10 у родителя */}
      <div className="absolute -left-6 -top-8 z-20 text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-600 via-slate-800 to-transparent opacity-80 select-none pointer-events-none drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-4" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>
        {index + 1}
      </div>
      
      <div className="relative rounded-3xl overflow-hidden aspect-[2/3] shadow-2xl border border-white/5 bg-[#0a0a0a] group-hover:border-yellow-500/50 transition-all duration-500 group-hover:shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)] group-hover:-translate-y-3 group-hover:rotate-1">
        {item.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center"><span className="text-4xl">🎬</span></div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
        
        <div className="absolute bottom-5 left-5 right-5 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h4 className="font-bold text-xl leading-tight mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2 drop-shadow-lg">{item.title}</h4>
          <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-slate-300">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 backdrop-blur-md">
               <span>⭐</span>
               <span>{item.vote_average.toFixed(1)}</span>
             </div>
             <span className="text-white/60">{item.release_date?.split('-')[0]}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
