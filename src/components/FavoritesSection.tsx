'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { setFavorite, removeFavorite, searchForFavorites } from '@/app/actions';
import Link from 'next/link';

type FavItem = {
  slotIndex: number;
  mediaId?: number;
  mediaType?: string;
  posterPath?: string;
  title?: string;
};

export default function FavoritesSection({ 
  items, 
  isOwnProfile 
}: { 
  items: FavItem[], 
  isOwnProfile: boolean 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  // State для поиска
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Открыть модалку для слота
  const openSearch = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    setQuery('');
    setResults([]);
    setIsModalOpen(true);
  };

  // Поиск при вводе
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      const res = await searchForFavorites(val);
      setResults(res || []);
      setIsSearching(false);
    }
  };

  // Сохранить выбор
  const handleSelect = async (mediaId: number, mediaType: string) => {
    if (selectedSlot === null) return;
    await setFavorite(mediaId, mediaType, selectedSlot);
    setIsModalOpen(false);
  };

  // Удалить
  const handleRemove = async (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Чтобы не кликнулось по ссылке
    if (confirm('Убрать из избранного?')) {
      await removeFavorite(slotIndex);
    }
  };

  // Рендер 4 слотов (0, 1, 2, 3)
  const slots = [0, 1, 2, 3].map(i => items.find(item => item.slotIndex === i) || { slotIndex: i });

  return (
    <div className="max-w-5xl mx-auto px-6 mb-12 -mt-10 relative z-20">
      <div className="flex items-center gap-2 mb-4">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Любимые фильмы</span>
         <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-4 h-[120px] md:h-[280px]">
        {slots.map((slot) => (
          <div key={slot.slotIndex} className="relative group w-full h-full rounded-xl overflow-hidden bg-[#151515] border border-white/5 shadow-xl transition-all hover:scale-[1.02]">
            
            {/* ЕСЛИ ЕСТЬ ФИЛЬМ */}
            {slot.mediaId && slot.posterPath ? (
              <Link href={`/${slot.mediaType === 'movie' ? 'movie' : 'tv'}/${slot.mediaId}`} className="w-full h-full block relative">
                <Image 
                  src={`https://image.tmdb.org/t/p/w500${slot.posterPath}`} 
                  alt="Poster" 
                  fill 
                  className="object-cover"
                />
                
                {/* Градиент снизу */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Кнопка удаления (только для владельца) */}
                {isOwnProfile && (
                  <button 
                    onClick={(e) => handleRemove(e, slot.slotIndex)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-red-400 hover:bg-black transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </Link>
            ) : (
              /* ЕСЛИ ПУСТО */
              <div className="w-full h-full flex items-center justify-center">
                {isOwnProfile ? (
                  <button 
                    onClick={() => openSearch(slot.slotIndex)}
                    className="w-full h-full flex flex-col items-center justify-center text-slate-600 hover:text-indigo-400 hover:bg-white/5 transition-colors gap-2"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center text-xl pb-1">+</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Добавить</span>
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                    ?
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* МОДАЛКА ПОИСКА (ПОРТАЛ) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-[#121212] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
               <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 autoFocus
                 className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 font-medium"
                 placeholder="Найти любимый фильм..."
                 value={query}
                 onChange={handleSearch}
               />
               <button onClick={() => setIsModalOpen(false)} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Esc</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
               {isSearching && <div className="p-4 text-center text-slate-500 text-sm">Поиск...</div>}
               
               {!isSearching && results.map(item => (
                 <button 
                    key={item.id}
                    onClick={() => handleSelect(item.id, item.media_type)}
                    className="w-full flex items-center gap-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-left group"
                 >
                    <div className="w-12 h-16 bg-slate-800 rounded-md overflow-hidden relative flex-shrink-0">
                       <Image src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt="" fill className="object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.title || item.name}</div>
                        <div className="text-xs text-slate-500">
                            {(item.release_date || item.first_air_date || '').split('-')[0]} • {item.media_type === 'movie' ? 'Фильм' : 'Сериал'}
                        </div>
                    </div>
                 </button>
               ))}
               
               {!isSearching && results.length === 0 && query.length > 2 && (
                   <div className="p-4 text-center text-slate-500 text-sm">Ничего не найдено</div>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
