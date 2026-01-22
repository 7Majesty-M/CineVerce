'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. НАСТРОЙКИ: Укажите здесь ID фильма, который хотите показать
    // Например: 435 (Зеленая миля), 535341 (1+1) и т.д.
    const searchParams = {
      kinopoisk: 435, 
      // title: 'Зеленая миля' // Можно искать и по названию
    };

    // 2. Функция инициализации плеера
    const initPlayer = () => {
      // Проверяем наличие глобального объекта kbox и контейнера
      if (typeof window !== 'undefined' && (window as any).kbox && containerRef.current) {
        try {
          (window as any).kbox(containerRef.current, {
            search: searchParams,
            menu: {
              enable: true, // Включить меню выбора озвучки/сезона
              default: 'menu_list',
              mobile: 'menu_button',
              format: '{N} :: {T} ({Q})',
              limit: 5,
              open: false,
            },
            players: {} // Здесь можно настроить конкретные плееры (Alloha, Videocdn и т.д.)
          });
        } catch (e) {
          console.error('Ошибка инициализации Kinobox:', e);
        }
      }
    };

    // 3. Загрузка внешнего скрипта
    const scriptId = 'kinobox-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://kinobox.tv/kinobox.min.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Инициализируем плеер, когда скрипт загрузится
      script.onload = initPlayer;
    } else {
      // Если скрипт уже был на странице (например, при навигации), просто запускаем плеер
      initPlayer();
    }
    
    // Очистка при размонтировании (обычно для этого скрипта не требуется, но хорошая практика)
    return () => {
       if (containerRef.current) {
           containerRef.current.innerHTML = '';
       }
    };

  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '2rem', fontWeight: 'bold' }}>
        Домашний кинотеатр
      </h1>

      <div 
        ref={containerRef} 
        className="kinobox_player" 
        style={{ 
          width: '100%', 
          maxWidth: '900px', 
          height: '500px', 
          backgroundColor: '#000', // Черный фон до загрузки плеера
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }} 
      />
      
      <p style={{ marginTop: '20px', color: '#666' }}>
        Приятного просмотра!
      </p>
    </main>
  );
}
