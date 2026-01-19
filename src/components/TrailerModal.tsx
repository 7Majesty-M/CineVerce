'use client';

import { useState } from 'react';

interface TrailerModalProps {
  videos: { key: string; name: string; type: string }[];
}

export default function TrailerModal({ videos }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ищем официальный трейлер. Если нет, берем любое видео.
  const trailer = videos.find(v => v.type === 'Trailer') || videos[0];

  if (!trailer) return null; // Если видео нет, кнопку не показываем

  return (
    <>
      {/* КНОПКА ЗАПУСКА */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-3 px-6 py-3 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95"
      >
        <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
           <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span className="uppercase tracking-wider text-sm">Трейлер</span>
      </button>

      {/* МОДАЛЬНОЕ ОКНО */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
          
          {/* Фон (Backdrop) */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Контейнер плеера */}
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
            
            {/* Кнопка закрытия */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&showinfo=0`}
              title={trailer.name}
              className="w-full h-full"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
