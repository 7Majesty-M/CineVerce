'use client';

import { useState, useRef, useEffect } from 'react';
import TrailerCard from '@/components/TrailerCard';

export default function TrailerFeed({ items }: { items: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  let scrollTimeout: NodeJS.Timeout;

  // Определение активного слайда при скролле
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight } = containerRef.current;
      const index = Math.round(scrollTop / clientHeight);
      
      if (index !== activeIndex && index >= 0 && index < items.length) {
        setActiveIndex(index);
      }

      // Индикатор скролла
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  };

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      const { clientHeight } = containerRef.current;
      
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex < items.length - 1) {
          containerRef.current.scrollTo({
            top: (activeIndex + 1) * clientHeight,
            behavior: 'smooth'
          });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) {
          containerRef.current.scrollTo({
            top: (activeIndex - 1) * clientHeight,
            behavior: 'smooth'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, items.length]);

  // Cleanup timeout
  useEffect(() => {
    return () => clearTimeout(scrollTimeout);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Контейнер с видео */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.map((item, index) => (
          <div key={item.id} className="h-full w-full snap-start snap-always relative">
            <TrailerCard 
              item={item} 
              isActive={index === activeIndex} 
            />
          </div>
        ))}
      </div>

      {/* Индикатор прогресса (справа) */}
      <div className={`fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 transition-opacity duration-300 ${isScrolling ? 'opacity-100' : 'opacity-30'}`}>
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: index * containerRef.current.clientHeight,
                  behavior: 'smooth'
                });
              }
            }}
            className={`w-1.5 md:w-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'h-8 md:h-10 bg-white shadow-lg shadow-white/50' 
                : 'h-1.5 md:h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Перейти к видео ${index + 1}`}
          />
        ))}
      </div>

      {/* Счетчик видео */}
      <div className="fixed top-6 md:top-8 right-6 md:right-8 z-40 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-xl">
        <span className="text-white font-bold text-sm md:text-base">
          {activeIndex + 1} / {items.length}
        </span>
      </div>

      {/* Подсказка для скролла (показывается только на первом видео) */}
      {activeIndex === 0 && (
        <div className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-white font-bold text-sm md:text-base">Листай вниз</span>
          </div>
        </div>
      )}
    </div>
  );
}