'use client';

import { useState } from 'react';
import Link from 'next/link';

// Типизация (можно вынести в общий файл типов, но для простоты оставим тут)
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
    // Можно увеличивать порциями (например +24) или показать сразу все
    // setDisplayCount(prev => prev + 24); 
    setDisplayCount(items.length); // Показываем все сразу
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {visibleItems.map((item) => (
          <Link
            key={`${item.media_type}-${item.id}`}
            href={`/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
            className="group block relative"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#121212] border border-white/10 mb-3 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              {item.poster_path ? (
                 <img
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                 />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
              )}

              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-yellow-400 border border-white/10">
                ★ {item.vote_average.toFixed(1)}
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">
              {item.title || item.name}
            </h4>

            <p className="text-xs text-slate-500 truncate">
              {item.character
                ? `как ${item.character}`
                : (item.release_date || item.first_air_date)?.split('-')[0]}
            </p>
          </Link>
        ))}
      </div>

      {/* КНОПКА ЗАГРУЗИТЬ ЕЩЕ */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="group relative px-8 py-3 rounded-full font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-white transition-all duration-300 active:scale-95 flex items-center gap-2"
          >
            <span>Показать все работы</span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-slate-300">
                {items.length - displayCount}
            </span>
            <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
