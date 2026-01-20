'use client';

import { useRef, useState, MouseEvent } from 'react';
import Link from 'next/link';

type Genre = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

type Props = {
  genres: Genre[];
  currentGenreId: string;
};

export default function GenreSlider({ genres, currentGenreId }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    setIsDragging(false);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    // Небольшая задержка, чтобы клик по ссылке не сработал сразу после перетаскивания
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Скорость прокрутки (* 2 для ускорения)
    
    // Если мы сдвинулись хоть немного, считаем это перетаскиванием
    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
    
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // Блокируем переход по ссылке, если это было перетаскивание
  const handleClick = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="sticky top-[100px] z-50 -mx-4 md:-mx-8 px-4 md:px-8 py-6 bg-[#050505] border-y border-white/10 shadow-2xl transition-all duration-300 mt-8"
    >
      {/* Градиентные маски по бокам */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none" />

      <div 
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`
          flex gap-2 overflow-x-auto pb-1 pt-1 relative z-0
          scrollbar-hide snap-x 
          ${isDown ? 'cursor-grabbing select-none' : 'cursor-grab'}
        `}
        // Дополнительно скрываем скроллбар стилями, если класс scrollbar-hide не сработает
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
      >
        {genres.map((g) => {
          const isActive = g.id === currentGenreId;
          return (
            <Link
              key={g.id}
              href={`/discover?genre=${g.id}`}
              onClick={handleClick}
              draggable={false} // Отключаем нативный драг ссылок
              className={`
                relative flex-shrink-0 snap-start
                flex items-center gap-2 px-5 py-3 rounded-xl 
                font-bold text-sm transition-all duration-300
                select-none
                ${isActive 
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-20' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'}
              `}
            >
              <span className={isActive ? 'scale-110' : 'opacity-70'}>{g.emoji}</span>
              <span>{g.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Скрываем вебкит скроллбар глобально для этого блока */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
