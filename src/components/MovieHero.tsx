'use client';

import { useState, createContext, useContext, useEffect } from 'react';

// Контекст
const HeroContext = createContext<{
  isPlaying: boolean;
  play: () => void;
  stop: () => void;
} | null>(null);

// Кнопка
export function PlayHeroButton() {
  const ctx = useContext(HeroContext);
  if (!ctx) return null;

  return (
    <button
      onClick={ctx.play}
      className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black tracking-wide transition-all duration-500 hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] active:scale-95 z-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-shine duration-1000" />
      <svg className="w-5 h-5 fill-black group-hover:scale-110 transition-transform duration-500" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      <span>СМОТРЕТЬ ТРЕЙЛЕР</span>
    </button>
  );
}

interface MovieHeroProps {
  backdropPath: string | null;
  videoKey: string | null;
  children: React.ReactNode;
}

export default function MovieHero({ backdropPath, videoKey, children }: MovieHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  const play = () => {
    setIsPlaying(true);
    // Ждем 2 секунды, пока YouTube прогрузится и уберет черный экран
    setTimeout(() => {
      setIsVideoVisible(true);
    }, 2000); 
  };

  const stop = () => {
    setIsVideoVisible(false);
    setTimeout(() => setIsPlaying(false), 800);
  };

  const safePlay = () => {
    if (videoKey) play();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <HeroContext.Provider value={{ isPlaying, play: safePlay, stop }}>
      <div className="relative w-full h-[85vh] overflow-hidden group/hero bg-black select-none">
        
        {/* --- LAYER 1: BACKDROP --- */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className={`absolute inset-0 transition-transform duration-[3000ms] ease-out ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                {backdropPath ? (
                    <img 
                        src={`https://image.tmdb.org/t/p/original${backdropPath}`} 
                        alt="Backdrop" 
                        className="w-full h-full object-cover opacity-60" 
                    />
                ) : (
                    <div className="w-full h-full bg-[#050505]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_130%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>
        </div>

        {/* --- LAYER 2: IFRAME --- */}
        {isPlaying && videoKey && (
            <div className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ease-in-out ${isVideoVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] pointer-events-none">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&loop=1&playlist=${videoKey}&vq=hd1080`}
                        className="w-full h-full object-cover"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="absolute inset-0 shadow-[inset_0_0_250px_rgba(0,0,0,0.9)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none"></div>
            </div>
        )}

        {/* --- LAYER 3: CONTENT --- */}
        <div 
            className={`relative z-20 w-full h-full transition-all duration-[1200ms] ease-in-out
                ${isPlaying 
                    ? 'opacity-0 translate-y-10 scale-105 blur-xl pointer-events-none tracking-[0.5em]'
                    : 'opacity-100 translate-y-0 scale-100 blur-0 tracking-normal'
                }
            `}
        >
            <div className="w-full h-full transition-all duration-1000">
                {children}
            </div>
        </div>

        {/* --- LAYER 4: STOP BUTTON --- */}
        <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-1000 delay-700
            ${isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}>
            <button 
                onClick={stop}
                className="group flex items-center gap-3 pl-4 pr-6 py-3 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 text-white font-medium hover:bg-white/10 transition-all hover:scale-105 ring-1 ring-white/5 shadow-2xl hover:shadow-white/10 cursor-pointer pointer-events-auto"
            >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <span className="tracking-wide text-sm">ЗАКРЫТЬ ТРЕЙЛЕР</span>
            </button>
        </div>

      </div>
    </HeroContext.Provider>
  );
}
