'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WatchlistButton from './WatchlistButton';
import AddToListDropdown from './AddToListDropdown';

export default function TrailerCard({ item, isActive }: { item: any, isActive: boolean }) {
  const [isMuted, setIsMuted] = useState(true);
  const [showMuteIcon, setShowMuteIcon] = useState(false);

  // Сброс состояния при смене слайда
  useEffect(() => {
    if (!isActive) {
      setIsMuted(true); 
    }
  }, [isActive]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowMuteIcon(true);
    setTimeout(() => setShowMuteIcon(false), 1000);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      
      {/* --- ВИДЕО СЛОЙ --- */}
      {isActive ? (
        <div className="absolute inset-0 z-0 pointer-events-none transform scale-[1.35] md:scale-105 origin-center">
          <iframe
            src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${item.trailerKey}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0`}
            className="w-full h-full object-cover pointer-events-none opacity-100"
            allow="autoplay; encrypted-media"
            style={{ pointerEvents: 'none' }} 
          />
        </div>
      ) : (
        // Превью (Постер)
        <div className="absolute inset-0 z-0">
           <img 
             src={`https://image.tmdb.org/t/p/original${item.backdrop_path || item.poster_path}`} 
             className="w-full h-full object-cover opacity-50 blur-sm scale-105" 
             alt={item.title}
           />
        </div>
      )}

      {/* --- ГРАДИЕНТНЫЕ МАСКИ --- */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
      
      {/* Виньетка по бокам */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none" />

      {/* --- КЛИКАБЕЛЬНАЯ ЗОНА ДЛЯ ЗВУКА --- */}
      <div 
        onClick={toggleMute}
        className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center"
      >
          {/* Иконка звука по центру */}
          <div className={`transition-all duration-500 transform ${showMuteIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
             <div className="bg-black/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10">
                {isMuted ? (
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                ) : (
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                )}
             </div>
          </div>
      </div>

      {/* --- ПРАВАЯ ПАНЕЛЬ (TikTok Style) --- */}
      <div className="absolute right-3 md:right-5 bottom-28 md:bottom-32 z-30 flex flex-col gap-4 md:gap-5 items-center">
        
        {/* Аватар-постер */}
        <Link href={`/movie/${item.id}`} className="relative group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-white p-[2px] overflow-hidden shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-12 bg-gradient-to-br from-purple-500 to-pink-500 animate-[spin_15s_linear_infinite]">
                <img 
                    src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} 
                    className="w-full h-full rounded-full object-cover" 
                    alt={item.title}
                />
            </div>
            {/* Плюсик */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-125">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/>
                </svg>
            </div>
        </Link>

        {/* Буду смотреть */}
        <div className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-xl transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95">
               <div className="scale-110 md:scale-125">
                 <WatchlistButton mediaId={item.id} mediaType="movie" compact={true} />
               </div>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Буду смотреть</span>
        </div>

        {/* В список */}
        <div className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-xl transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95">
                <div className="scale-110 md:scale-125">
                  <AddToListDropdown 
                    mediaId={item.id} 
                    mediaType="movie" 
                    compact={true} 
                    position="left"
                  />
                </div>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">В список</span>
        </div>

        {/* Кнопка звука */}
        <button 
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full backdrop-blur-xl flex items-center justify-center border-2 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 ${isMuted ? 'bg-red-500/80 border-red-400 text-white' : 'bg-white/5 border-white/20 text-white'}`}
        >
             {isMuted ? (
                 <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                 </svg>
             ) : (
                 <div className="flex gap-1 items-end h-5">
                    <span className="w-1 bg-white rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2"></span>
                    <span className="w-1 bg-white rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-5"></span>
                    <span className="w-1 bg-white rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-3"></span>
                 </div>
             )}
        </button>
      </div>

      {/* --- НИЖНЯЯ ИНФОРМАЦИЯ --- */}
      <div className="absolute bottom-0 left-0 w-full z-30 p-4 md:p-8 pb-10 md:pb-16 pointer-events-none">
         <div className="pointer-events-auto max-w-[82%] md:max-w-[65%]">
             
             {/* Заголовок */}
             <Link href={`/movie/${item.id}`} className="block group mb-3">
                 <h2 className="text-white font-black text-3xl md:text-5xl drop-shadow-2xl leading-tight group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                    {item.title}
                 </h2>
             </Link>
             
             {/* Метаданные */}
             <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-5 md:mb-6">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-wide shadow-lg">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {item.vote_average.toFixed(1)}
                </div>
                <div className="px-3 py-1 rounded-lg border-2 border-white/40 text-white text-xs md:text-sm font-bold backdrop-blur-md bg-black/20 shadow-lg">
                    {item.release_date?.split('-')[0]}
                </div>
                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white text-xs md:text-sm font-bold backdrop-blur-md border border-white/20 shadow-lg">
                    Фильм
                </div>
             </div>

             {/* Кнопка */}
             <Link 
                href={`/movie/${item.id}`}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-900/50 border border-white/10"
             >
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                Подробнее о фильме
             </Link>
         </div>
      </div>
    </div>
  );
}