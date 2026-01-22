'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PlayerProps {
  tmdbId: number | string; // Для VidKing
  kpId?: number | null;    // Для русских плееров
  imdbId?: string | null;  // Дополнительно
  title: string;
  className?: string;
  onError?: (error: Error) => void;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

// ============================================================================
// URL GENERATORS
// ============================================================================

// --- 1. Русские источники (Замена Yohoho) ---

const getRuUrl = (server: string, kpId: number, mediaType: string, season?: number, episode?: number) => {
  if (!kpId) return null;

  switch (server) {
    case 'videocdn':
      // Самый быстрый плеер, работает почти всегда
      // Используем зеркало voidboost для стабильности
      if (mediaType === 'tv') {
         return `https://voidboost.net/embed/tv-series?kinopoisk_id=${kpId}`;
      }
      return `https://voidboost.net/embed/movie?kinopoisk_id=${kpId}`;

    case 'kodik':
      // Лучший для аниме и сериалов
      let kUrl = `https://kodik.info/find-player?kinopoiskID=${kpId}`;
      if (mediaType === 'tv' && season && episode) {
        kUrl += `&season=${season}&episode=${episode}`;
      }
      return kUrl;

    case 'collaps':
      // Хороший резерв
      return `https://api.allvi.dev/embed/kinopoisk/${kpId}`;
      
    default:
      return null;
  }
};

// --- 2. Международный источник (VidKing) ---

const getVidKingUrl = (tmdbId: number | string, mediaType: string, season?: number, episode?: number) => {
  if (!tmdbId) return null;
  const params = new URLSearchParams({ 
    color: 'e50914', 
    nextEpisode: 'true',
    autoplay: '0' 
  });

  if (mediaType === 'tv') {
    if (season && episode) {
      return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?${params}`;
    }
    return null;
  }
  return `https://www.vidking.net/embed/movie/${tmdbId}?${params}`;
};

const IFRAME_ALLOW_POLICY = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
// Разрешаем скрипты, чтобы плееры работали корректно
const IFRAME_SANDBOX_POLICY = 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups';

// ============================================================================
// COMPONENT
// ============================================================================

export default function Player({
  tmdbId,
  kpId,
  imdbId,
  title,
  className = '',
  onError,
  mediaType = 'movie',
  season,
  episode,
}: PlayerProps) {
  
  // Вкладки: ru (Русский) или int (VidKing)
  const [activeTab, setActiveTab] = useState<'ru' | 'int'>(kpId ? 'ru' : 'int');
  
  // Внутри русской вкладки можно менять плеер (по умолчанию videocdn)
  const [ruServer, setRuServer] = useState<'videocdn' | 'kodik' | 'collaps'>('videocdn');
  
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Генерируем ссылку
  const currentSrc = useMemo(() => {
    try {
      if (activeTab === 'ru') {
        return getRuUrl(ruServer, kpId ?? 0, mediaType || 'movie', season, episode);
      } else {
        return getVidKingUrl(tmdbId, mediaType || 'movie', season, episode);
      }
    } catch (error) {
      console.error('Error generating URL:', error);
      return null;
    }
  }, [activeTab, ruServer, kpId, tmdbId, mediaType, season, episode]);

  // Сброс при смене источника
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [iframeKey, currentSrc, activeTab, ruServer]);

  const handleRefresh = useCallback(() => setIframeKey(prev => prev + 1), []);
  const handleIframeLoad = useCallback(() => setIsLoading(false), []);
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  return (
    <div className={`flex flex-col gap-4 w-full h-full ${className}`}>
      
      {/* --- ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
      <div className="flex flex-col gap-3 p-3 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] border border-white/5 rounded-xl shadow-lg">
        
        {/* Главные вкладки (RU / INT) */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setActiveTab('ru')} 
            disabled={!kpId} 
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
              activeTab === 'ru' 
                ? 'bg-red-600 text-white shadow shadow-red-900/20' 
                : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'
            }`}
          >
            🇷🇺 Русские плееры
          </button>
          <button 
            onClick={() => setActiveTab('int')} 
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
              activeTab === 'int' 
                ? 'bg-blue-600 text-white shadow shadow-blue-900/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🌍 VidKing (Original)
          </button>
        </div>

        {/* Подменю для RU вкладки (Выбор источника) */}
        {activeTab === 'ru' && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Источник:</span>
                
                <button 
                    onClick={() => setRuServer('videocdn')}
                    className={`px-3 py-1 text-[11px] font-bold rounded border transition-all ${
                        ruServer === 'videocdn' ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'
                    }`}
                >
                    VideoCDN (Быстрый)
                </button>
                <button 
                    onClick={() => setRuServer('kodik')}
                    className={`px-3 py-1 text-[11px] font-bold rounded border transition-all ${
                        ruServer === 'kodik' ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'
                    }`}
                >
                    Kodik (Сериалы)
                </button>
                <button 
                    onClick={() => setRuServer('collaps')}
                    className={`px-3 py-1 text-[11px] font-bold rounded border transition-all ${
                        ruServer === 'collaps' ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'
                    }`}
                >
                    Collaps
                </button>
                
                <button onClick={handleRefresh} className="ml-auto p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400" title="Обновить">
                    <RefreshIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        )}
      </div>

      {/* --- ЭКРАН ПЛЕЕРА --- */}
      <div className="relative group w-full aspect-video min-h-[500px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {currentSrc ? (
          <>
            <iframe
              key={`${activeTab}-${ruServer}-${iframeKey}`}
              src={currentSrc}
              title={`Video player: ${title}`}
              width="100%"
              height="100%"
              allowFullScreen
              allow={IFRAME_ALLOW_POLICY}
              sandbox={IFRAME_SANDBOX_POLICY}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              referrerPolicy="no-referrer-when-downgrade"
              className={`w-full h-full border-0 absolute inset-0 z-10 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {/* Лоадер */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
                <div className="w-12 h-12 border-4 border-white/10 border-t-red-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400 font-medium">
                    {activeTab === 'ru' 
                        ? `Загрузка ${ruServer === 'videocdn' ? 'VideoCDN' : ruServer}...` 
                        : 'Подключаемся к VidKing...'}
                </p>
              </div>
            )}
            
            {/* Ошибка */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 gap-4">
                <ErrorIcon className="w-16 h-16 text-red-500/50" />
                <div className="text-center px-4">
                  <p className="text-lg font-semibold text-white mb-2">Ошибка загрузки</p>
                  <p className="text-sm text-slate-500 mb-4">Попробуйте переключить источник сверху</p>
                  <button onClick={handleRefresh} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                    Обновить
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-[#0a0a0a] gap-3">
            <NoSourceIcon className="w-16 h-16 opacity-20" />
            <p className="text-sm font-medium">Источник недоступен</p>
            <p className="text-xs text-slate-700">
              {activeTab === 'ru' && !kpId ? 'Нет ID Кинопоиска' : 'Нет данных'}
            </p>
          </div>
        )}
      </div>
      
      {/* --- ФУТЕР --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 px-4 py-3 bg-black/20 border border-white/5 rounded-xl font-mono gap-3">
         <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span>TMDB: {tmdbId}</span>
            </span>
            {kpId && (
              <span className="flex items-center gap-1.5">
                <span className="text-green-400">KP: {kpId}</span>
              </span>
            )}
        </div>
        
        <div className={`px-3 py-1 rounded-full border text-xs font-sans transition-colors ${
            activeTab === 'ru' 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
            {activeTab === 'ru' 
                ? '💡 Если плеер завис — выберите другой источник (Kodik или Collaps)'
                : '💡 В VidKing можно сменить озвучку в настройках плеера'
            }
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function NoSourceIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}
