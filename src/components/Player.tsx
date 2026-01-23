'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerProps {
  tmdbId: number | string;
  kpId?: number | null; 
  imdbId?: string | null;
  title: string;
  className?: string;
  onError?: (error: Error) => void;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

// ============================================================================
// CONFIG
// ============================================================================

const getVidKingUrl = (tmdbId: number | string, mediaType: string, season?: number, episode?: number) => {
  if (!tmdbId) return null;
  
  const params = new URLSearchParams({ 
    color: 'e50914', 
    nextEpisode: 'true',
    autoplay: '0' 
  });

  if (mediaType === 'tv') {
    const s = season || 1;
    const e = episode || 1;
    return `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${e}?${params}`;
  }
  
  return `https://www.vidking.net/embed/movie/${tmdbId}?${params}`;
};

const IFRAME_ALLOW = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-presentation';

// ============================================================================
// COMPONENT
// ============================================================================

export default function Player({
  tmdbId,
  title,
  className = '',
  mediaType = 'movie',
  season,
  episode,
}: PlayerProps) {
  
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentSrc = useMemo(() => {
    try {
      return getVidKingUrl(tmdbId, mediaType || 'movie', season, episode);
    } catch (e) { return null; }
  }, [tmdbId, mediaType, season, episode]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [iframeKey, currentSrc]); // Сброс при смене src

  const handleRefresh = useCallback(() => setIframeKey(p => p + 1), []);
  const handleLoad = useCallback(() => setIsLoading(false), []);

  return (
    <div className={`flex flex-col gap-4 w-full h-full ${className}`}>
      
      <div className="flex flex-col gap-3 p-3 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] border border-white/5 rounded-xl shadow-lg">
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-300">
                    👑 VidKing Player
                </span>
                <span className="text-[9px] uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    🛡️ Protected
                </span>
            </div>
            
            {mediaType === 'tv' && (
                <span className="text-[10px] text-slate-400 font-mono">
                    S{season || 1} E{episode || 1}
                </span>
            )}
        </div>
      </div>

      <div className="relative group w-full aspect-video min-h-[500px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {currentSrc ? (
          <>
            <iframe
              // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
              // Мы добавляем currentSrc в key. Это заставляет React
              // ПОЛНОСТЬЮ пересоздать iframe при смене серии.
              key={`vidking-${currentSrc}-${iframeKey}`}
              src={currentSrc}
              title={title}
              width="100%"
              height="100%"
              allowFullScreen
              allow={IFRAME_ALLOW}
              sandbox={IFRAME_SANDBOX}
              onLoad={handleLoad}
              className={`w-full h-full border-0 absolute inset-0 z-10 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-20">
                <div className="w-12 h-12 border-4 border-white/10 border-t-red-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400">Загрузка...</p>
              </div>
            )}
            
            <button
                onClick={handleRefresh}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                title="Обновить"
            >
                <RefreshIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-[#0a0a0a]">
            <p className="text-sm">Нет источника (TMDB ID не найден)</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mt-2">
         <p className="text-[11px] text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            💡 Если плеер не запускается, нажмите кнопку обновления ↻ в углу
         </p>
      </div>
    </div>
  );
}

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
