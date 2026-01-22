'use client';

import { useEffect, useRef } from 'react';

export default function KinoboxPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ЖЕСТКО ЗАДАННЫЕ ПАРАМЕТРЫ ПОИСКА
    // Вы можете поменять их здесь на нужные вам
    const searchParams = {
        kinopoisk: 435, // Пример: "Зеленая миля"
        // imdb: 'tt0120689', 
        // title: 'Зеленая миля'
    };

    const initPlayer = () => {
      // Проверяем, загрузилась ли библиотека и есть ли контейнер
      if (typeof window !== 'undefined' && (window as any).kbox && containerRef.current) {
        try {
          (window as any).kbox(containerRef.current, {
            search: searchParams,
            menu: {
              enable: true,
              default: 'menu_list',
              mobile: 'menu_button',
              format: '{N} :: {T} ({Q})',
              limit: 5,
              open: false,
            },
            players: {} // Здесь можно настроить приоритет плееров
          });
        } catch (e) {
          console.error('Kinobox init error:', e);
        }
      }
    };

    // Логика загрузки скрипта
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
      // Если скрипт уже есть, просто инициализируем плеер
      initPlayer();
    }

    // Функция очистки (опционально, если плеер создает глобальные сайд-эффекты)
    return () => {
        // Логика очистки, если требуется библиотекой
    };
  }, []); // Пустой массив зависимостей - срабатывает 1 раз при монтировании

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Онлайн плеер</h1>
      {/* Контейнер для плеера. Важно задать высоту! */}
      <div 
        ref={containerRef} 
        className="kinobox_player" 
        style={{ width: '100%', height: '500px', backgroundColor: '#000' }} 
      />
    </div>
  );
}
