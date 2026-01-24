'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { setFavorite, removeFavorite, searchForFavorites } from '@/app/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FavItem = {
  slotIndex: number;
  mediaId?: number;
  mediaType?: string;
  posterPath?: string;
  title?: string;
};

export default function FavoritesSection({ 
  items = [], 
  isOwnProfile 
}: { 
  items: FavItem[], 
  isOwnProfile: boolean 
}) {
  const router = useRouter();
  
  // State для поиска
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State для удаления
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null); // Если не null, значит открыто окно удаления
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ЛОГИКА ПОИСКА ---
  const openSearch = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    setQuery('');
    setResults([]);
    setIsSearchOpen(true);
  };

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

  const handleSelect = async (mediaId: number, mediaType: string) => {
    if (selectedSlot === null) return;
    await setFavorite(mediaId, mediaType, selectedSlot);
    setIsSearchOpen(false);
    router.refresh();
  };

  // --- ЛОГИКА УДАЛЕНИЯ ---
  
  // 1. Нажали на корзину -> Открыли модалку
  const initiateRemove = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSlotToDelete(slotIndex);
  };

  // 2. Нажали "Да, удалить"
  const confirmDelete = async () => {
    if (slotToDelete === null) return;
    setIsDeleting(true);
    await removeFavorite(slotToDelete);
    setIsDeleting(false);
    setSlotToDelete(null); // Закрываем окно
    router.refresh();
  };

  const slots = [0, 1, 2, 3].map(i => (items || []).find(item => item.slotIndex === i) || { slotIndex: i });

  return (
    <div className="max-w-6xl mx-auto px-6 mb-16 relative z-20">
      
      {/* ЗАГОЛОВОК */}
      <div className="flex items-center gap-4 mb-6">
         <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/20 rounded-full">
            <span className="text-xs font-black text-pink-400 uppercase tracking-widest drop-shadow-sm">Top 4</span>
         </div>
         <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Любимые тайтлы</span>
         <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
      </div>

      {/* СЕТКА */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[240px] md:h-[320px]">
        {slots.map((slot) => (
          <div 
            key={slot.slotIndex} 
            className={`
                relative group w-full h-full rounded-2xl overflow-hidden transition-all duration-500
                ${slot.mediaId 
                    ? 'shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)] hover:scale-[1.02] border border-white/5' 
                    : 'bg-[#0f0f0f]/40 border-2 border-dashed border-white/5 hover:border-white/20 hover:bg-white/5'
                }
            `}
          >
            {slot.mediaId && slot.posterPath ? (
              <Link href={`/${slot.mediaType === 'movie' ? 'movie' : 'tv'}/${slot.mediaId}`} className="w-full h-full block relative">
                <Image 
                  src={`https://image.tmdb.org/t/p/w500${slot.posterPath}`} 
                  alt="Poster" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-sm line-clamp-2 leading-tight drop-shadow-md translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {slot.title}
                    </p>
                </div>
                
                {/* КНОПКА УДАЛЕНИЯ */}
                {isOwnProfile && (
                  <button 
                    onClick={(e) => initiateRemove(e, slot.slotIndex)} // <-- Вызываем новую функцию
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 duration-300 shadow-lg border border-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </Link>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isOwnProfile ? (
                  <button 
                    onClick={() => openSearch(slot.slotIndex)}
                    className="w-full h-full flex flex-col items-center justify-center group/btn"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center mb-3 group-hover/btn:scale-110 group-hover/btn:border-pink-500/50 group-hover/btn:from-pink-500/20 transition-all duration-300 shadow-xl">
                        <svg className="w-6 h-6 text-slate-500 group-hover/btn:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover/btn:text-slate-300 transition-colors">
                        Добавить
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                     <span className="text-3xl mb-2 grayscale opacity-50">🍿</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- МОДАЛКА УДАЛЕНИЯ (КРАСИВАЯ) --- */}
      {slotToDelete !== null && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
             {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
                onClick={() => setSlotToDelete(null)}
            />
            
            {/* Карточка подтверждения */}
            <div className="relative bg-[#0F0F0F] w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                
                {/* Иконка опасности */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Убрать из избранного?</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Этот фильм пропадет из вашего топа, но останется в истории оценок.
                </p>

                <div className="flex gap-3 w-full">
                    <button 
                        onClick={() => setSlotToDelete(null)}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition-colors"
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Удалить'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* --- МОДАЛКА ПОИСКА --- */}
      {isSearchOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsSearchOpen(false)} />
          
          <div className="relative bg-[#0a0a0a] w-full max-w-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
               <div className="p-2 bg-white/5 rounded-xl">
                 <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <input 
                 autoFocus
                 className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-600 font-medium"
                 placeholder="Найти фильм или сериал..."
                 value={query}
                 onChange={handleSearch}
               />
               <button onClick={() => setIsSearchOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               {isSearching && (
                 <div className="py-12 flex flex-col items-center text-slate-500 animate-pulse">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-xs font-bold uppercase tracking-wider">Ищем в базе...</span>
                 </div>
               )}
               
               {!isSearching && results.map(item => (
                 <button 
                   key={item.id}
                   onClick={() => handleSelect(item.id, item.media_type)}
                   className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all text-left group border border-transparent hover:border-white/5"
                 >
                    <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden relative flex-shrink-0 shadow-md group-hover:shadow-lg transition-all">
                       {item.poster_path ? (
                         <Image src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt="" fill className="object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 text-xs">No img</div>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 group-hover:text-pink-400 transition-colors truncate text-base">
                            {item.title || item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${item.media_type === 'movie' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {item.media_type === 'movie' ? 'Фильм' : 'Сериал'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                                {(item.release_date || item.first_air_date || '').split('-')[0]}
                            </span>
                        </div>
                    </div>
                 </button>
               ))}
               
               {!isSearching && results.length === 0 && query.length > 2 && (
                   <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                       <span className="text-sm font-medium">Ничего не найдено</span>
                   </div>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
