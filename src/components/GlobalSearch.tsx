'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// --- ВОТ ЭТОЙ СТРОКИ НЕ ХВАТАЛО ---
import { searchMultiAction } from '@/app/actions'; 

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Открытие/закрытие по Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Фокус на инпут
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Живой поиск
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          // Вызываем Server Action
          const data = await searchMultiAction(query); 
          setResults(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const closeSearch = () => setIsOpen(false);

  return (
    <>
      {/* Кнопка-триггер */}
      <button 
        onClick={() => setIsOpen(true)}
        className="group p-2 rounded-full hover:bg-white/10 transition-colors relative"
      >
        <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={closeSearch}></div>

          <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center px-4 border-b border-white/5 h-16">
              <svg className="w-6 h-6 text-slate-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent text-xl text-white placeholder-slate-600 focus:outline-none h-full"
                placeholder="Поиск фильмов и сериалов..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={closeSearch} className="px-2 py-1 text-xs font-bold text-slate-500 border border-white/10 rounded bg-white/5">ESC</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              {loading && (
                <div className="py-10 text-center text-slate-500 flex flex-col items-center gap-2">
                   <div className="w-6 h-6 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                   <span>Ищем во вселенной...</span>
                </div>
              )}

              {!loading && results.length === 0 && query.length > 1 && (
                <div className="py-10 text-center text-slate-500">
                  Ничего не найдено
                </div>
              )}

              {!loading && results.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/${item.media_type}/${item.id}`}
                  onClick={closeSearch}
                  className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold group-hover:text-pink-400 transition-colors truncate">
                      {item.title || item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.media_type === 'movie' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {item.media_type === 'movie' ? 'Movie' : 'TV'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(item.release_date || item.first_air_date || '').split('-')[0]}
                      </span>
                      <span className="text-xs text-yellow-500 flex items-center gap-1">
                        ★ {item.vote_average?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-slate-600 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              ))}
            </div>
            
            {!loading && results.length > 0 && (
                <div className="px-4 py-2 bg-white/5 text-[10px] text-slate-500 border-t border-white/5 flex justify-between">
                    <span>Показаны лучшие совпадения</span>
                    <span>CineRizon Search</span>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
