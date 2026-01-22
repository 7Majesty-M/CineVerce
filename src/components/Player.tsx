'use client';

import { useEffect, useRef } from 'react';

interface PlayerProps {
  kpId?: number | null;
  imdbId?: string | null;
  title: string;
}

export default function Player({ kpId, imdbId, title }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams: Record<string, string | number> = {};

    // 1. Самый надежный способ - ID Кинопоиска
    if (kpId) {
        searchParams.kinopoisk = kpId;
    } 
    // 2. Запасной - IMDb
    else if (imdbId) {
        searchParams.imdb = imdbId;
    } 
    // 3. Последний шанс - название
    else {
        searchParams.title = title;
    }

    const initPlayer = () => {
      if (typeof window !== 'undefined' && (window as any).kbox && containerRef.current) {
        try {
          containerRef.current.innerHTML = ''; 
          (window as any).kbox(containerRef.current, {
            search: searchParams,
            menu: {
              enable: true,       // Оставляем true, чтобы можно было менять озвучку/сезон
              default: 'menu_list',
              mobile: 'menu_button',
              format: '{N} :: {T} ({Q})',
              limit: 5,
              open: false,        // false = НЕ открывать меню поиска принудительно
            },
            players: {} 
          });
        } catch (e) {
          console.error('Kinobox init error:', e);
        }
      }
    };

    const scriptId = 'kinobox-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://kinobox.tv/kinobox.min.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = initPlayer;
    } else {
      initPlayer();
    }
    
    return () => {
        if (containerRef.current) containerRef.current.innerHTML = '';
    };

  }, [kpId, imdbId, title]); 

  return (
    <div 
      ref={containerRef} 
      className="kinobox_player" 
      style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#000', borderRadius: '16px' }} 
    />
  );
}
