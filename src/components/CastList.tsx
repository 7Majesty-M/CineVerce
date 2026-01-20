'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

export default function CastList({ cast }: { cast: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Берем топ-20 актеров
  const topCast = cast.slice(0, 20);

  // Проверка позиции скролла
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
  }, [topCast]);

  // Функция прокрутки
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.7) : (clientWidth * 0.7);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (topCast.length === 0) return null;

  return (
    // Родительский div имеет класс group/list, который отслеживает наведение на весь блок
    <div className="mb-16 relative group/list">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
        В главных ролях
      </h3>
      
      <div className="relative">
        
        {/* --- ЛЕВАЯ СТРЕЛКА --- */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            // ИЗМЕНЕНИЕ: group-hover/list:opacity-100
            // Теперь кнопка появляется при наведении на ВЕСЬ список, а не только на кнопку
            className="absolute -left-12 lg:-left-18 top-0 bottom-8 z-50 w-16 md:w-20 flex items-center justify-center opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-purple-600 hover:border-purple-500 hover:scale-110 transition-all shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
          </button>
        )}

        {/* --- КОНТЕЙНЕР (СКРОЛЛ) --- */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-5 pb-8 pt-2 snap-x px-4 md:px-14 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {topCast.map((person) => (
            <Link 
              key={person.id} 
              href={`/person/${person.id}`}
              className="w-[160px] md:w-[200px] flex-shrink-0 snap-start group relative"
            >
              {/* Карточка актера */}
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#121212] border border-white/10 shadow-lg mb-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:border-purple-500/50">
                {person.profile_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                    alt={person.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">
                    👤
                  </div>
                )}
              </div>
              
              {/* Имя актера */}
              <h4 className="font-bold text-base text-slate-200 group-hover:text-white truncate transition-colors">
                {person.name}
              </h4>
              
              {/* Роль */}
              <p className="text-sm text-slate-500 truncate">
                {person.character}
              </p>
            </Link>
          ))}
        </div>

        {/* --- ПРАВАЯ СТРЕЛКА --- */}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            // ИЗМЕНЕНИЕ: group-hover/list:opacity-100
            className="absolute -right-12 lg:-right-18 top-0 bottom-8 z-50 w-16 md:w-20 flex items-center justify-center opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-purple-600 hover:border-purple-500 hover:scale-110 transition-all shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
