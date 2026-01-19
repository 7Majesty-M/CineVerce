'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchMoreMovies, fetchMoreTVShows } from '@/app/actions';

export interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  mediaType: 'movie' | 'tv';
}

interface MediaListProps {
  initialItems: MediaItem[];
  type: 'movie' | 'tv';
}

export default function MediaList({ initialItems, type }: MediaListProps) {
  // ЗАЩИТА: Если initialItems придет undefined, используем пустой массив
  const [items, setItems] = useState<MediaItem[]>(initialItems || []);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Синхронизация пропсов со стейтом (если данные подгрузятся позже)
  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const loadMore = async () => {
    setIsLoading(true);
    const nextPage = page + 1;
    
    try {
      const rawData = type === 'movie' 
        ? await fetchMoreMovies(nextPage) 
        : await fetchMoreTVShows(nextPage);

      // Проверка, что пришел массив
      if (!Array.isArray(rawData)) return;

      const newItems: MediaItem[] = rawData.map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        mediaType: type,
      }));

      setItems((prev) => {
        // Безопасная фильтрация дубликатов
        const prevItems = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(prevItems.map(i => i.id));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
        return [...prevItems, ...uniqueNewItems];
      });

      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Если элементов нет вообще, ничего не рендерим или показываем заглушку
  if (!items) return null;

  return (
    <>
      {/* СЕТКА */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
        {/* ЗАЩИТА: Добавляем '?', чтобы map не падал на undefined */}
        {items?.map((item, index) => (
          <MediaCard 
            key={`${item.mediaType}-${item.id}-${index}`} 
            item={item} 
            index={index} 
            type={type} 
          />
        ))}
      </div>

      {/* КНОПКА ЗАГРУЗКИ */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={loadMore}
          disabled={isLoading}
          className="group relative px-8 py-4 rounded-xl font-bold transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/30 text-white flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
              </svg>
              <span>Показать еще</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

// --- MEDIA CARD ---

function MediaCard({ item, index, type }: { item: MediaItem; index: number; type: 'movie' | 'tv' }) {
  const linkHref = `/${item.mediaType}/${item.id}`;
  
  const glowColor = type === 'movie' ? 'group-hover:shadow-cyan-500/30' : 'group-hover:shadow-pink-500/30';
  const borderColor = type === 'movie' ? 'group-hover:border-cyan-500/50' : 'group-hover:border-pink-500/50';
  const textColor = type === 'movie' ? 'group-hover:text-cyan-400' : 'group-hover:text-pink-400';
  const badgeColor = type === 'movie' ? 'bg-cyan-500' : 'bg-pink-500';

  return (
    <Link 
      href={linkHref} 
      className="group block relative fade-in-card h-full perspective-1000"
      style={{ animationDelay: `${(index % 20) * 0.05}s` }}
    >
      <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-white/5 transition-all duration-500 ${glowColor} ${borderColor} group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:z-10`}>
        
        <div className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/40 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
          <div className={`absolute inset-0 ${badgeColor} opacity-20 rounded-md`}></div>
          <span className="relative z-10">{type === 'movie' ? 'Movie' : 'TV'}</span>
        </div>

        {item.poster_path ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <div className={`w-14 h-14 rounded-full ${badgeColor} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-50 group-hover:scale-100 transition-all duration-300 group-hover:rotate-0 rotate-45`}>
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </>
        ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-800">No Image</div>
        )}
      </div>

      <div className="mt-4 px-1">
        <h4 className={`font-bold text-base text-white/90 ${textColor} transition-colors line-clamp-1 leading-snug`}>
          {item.title}
        </h4>
        <div className="flex items-center justify-between mt-2 text-sm text-slate-500 font-medium">
          <span>{item.release_date?.split('-')[0] || 'N/A'}</span>
          <div className="flex items-center gap-1 text-slate-400">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span>{item.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
