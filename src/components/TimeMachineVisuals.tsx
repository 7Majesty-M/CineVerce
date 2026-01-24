'use client';

import { useSearchParams } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
// Импортируем шрифты (Next.js автоматически их оптимизирует)
import { Cinzel, Courier_Prime, Press_Start_2P, Share_Tech_Mono, Inter } from 'next/font/google';

// 1. Шрифты для эпох
const fontNoir = Cinzel({ subsets: ['latin'], weight: '700' });         // 1920-1950
const fontVintage = Courier_Prime({ subsets: ['latin'], weight: '400' }); // 1950-1979
const fontRetro = Press_Start_2P({ subsets: ['latin'], weight: '400' });  // 1980-1989 (Игры/Аркады)
const fontDigital = Share_Tech_Mono({ subsets: ['latin'], weight: '400' }); // 1990-2009 (Матрица/Web 1.0)
const fontModern = Inter({ subsets: ['latin'] });                         // 2010+

export default function TimeMachineVisuals({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year')) || 2000;

  // Логика определения эпохи
  const era = useMemo(() => {
    if (year < 1955) return 'noir';       // ЧБ, Классика
    if (year < 1978) return 'vintage';    // Зерно, Теплота
    if (year < 1995) return 'retro';      // VHS, Неон
    if (year < 2010) return 'digital';    // Матрица до 2010
    if (year < 2020) return 'streaming';  // 2010-2019: Чистый HD, Netflix style
    return 'future';                      // 2020+: AI, Стекло, Градиенты
  }, [year]);

  // Выбор шрифта
  const currentFont = 
    era === 'noir' ? fontNoir.className :
    era === 'vintage' ? fontVintage.className :
    era === 'retro' ? fontRetro.className :
    era === 'digital' ? fontDigital.className :
    fontModern.className; // Для Streaming и Future используем Inter

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${currentFont}`}>
      
      {/* === ФОНОВЫЕ СЛОИ (База) === */}
      <div className={`fixed inset-0 transition-colors duration-1000 z-0
        ${era === 'noir' ? 'bg-[#151515]' : ''}
        ${era === 'vintage' ? 'bg-[#2b2620]' : ''}
        ${era === 'retro' ? 'bg-[#0b0014]' : ''}
        ${era === 'digital' ? 'bg-[#000d00]' : ''}
        ${era === 'streaming' ? 'bg-[#0f172a]' : ''} /* Темно-синий Slate */
        ${era === 'future' ? 'bg-[#030014]' : ''}    /* Глубокий космос */
      `} />

      {/* === СЛОИ ЭФФЕКТОВ (Overlays) === */}

      {/* 1. ЭРА NOIR (До 1955) */}
      {era === 'noir' && (
        <>
          {/* ЧБ Фильтр */}
          <div className="fixed inset-0 z-50 pointer-events-none backdrop-grayscale contrast-[1.2] brightness-90" />
          {/* Мерцание проектора */}
          <div className="fixed inset-0 z-40 pointer-events-none bg-black/10 animate-flicker mix-blend-multiply" />
          {/* Виньетка */}
          <div className="fixed inset-0 z-40 pointer-events-none bg-[radial-gradient(circle,transparent_40%,black_100%)]" />
          {/* Царапины (Вертикальные линии) */}
          <div className="fixed top-0 left-10 w-[1px] h-full bg-white/20 opacity-30 animate-pulse z-40" />
          <div className="fixed top-0 right-20 w-[2px] h-full bg-white/10 opacity-20 animate-bounce z-40" />
        </>
      )}

      {/* 2. ЭРА VINTAGE (1955-1977) */}
      {era === 'vintage' && (
        <>
          {/* Сепия и мягкость */}
          <div className="fixed inset-0 z-50 pointer-events-none backdrop-sepia-[0.4] backdrop-blur-[0.5px] contrast-90" />
          {/* Теплый оверлей */}
          <div className="fixed inset-0 z-40 pointer-events-none bg-yellow-900/10 mix-blend-overlay" />
          {/* Зерно пленки */}
          <div className="fixed inset-0 z-40 pointer-events-none bg-noise opacity-[0.08]" />
        </>
      )}

      {/* 3. ЭРА RETRO / VHS (1978-1994) */}
      {era === 'retro' && (
        <>
          {/* Сетка внизу */}
          <div className="fixed bottom-0 left-0 w-full h-[50vh] bg-grid-retro z-0 opacity-40 transform perspective-[500px] rotate-x-20" />
          {/* Фиолетовый градиент */}
          <div className="fixed inset-0 z-40 pointer-events-none bg-gradient-to-t from-pink-500/10 to-blue-500/10 mix-blend-screen" />
          {/* Scanlines (горизонтальные полосы) */}
          <div className="fixed inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_4px,3px_100%] pointer-events-none" />
        </>
      )}

      {/* 4. ЭРА DIGITAL / MATRIX (1995-2009) */}
      {era === 'digital' && (
        <>
           {/* Зеленоватый оттенок */}
           <div className="fixed inset-0 z-40 pointer-events-none bg-green-900/10 mix-blend-overlay" />
           {/* Мелкая цифровая сетка */}
           <div className="fixed inset-0 z-0 opacity-10 bg-[radial-gradient(#0f0_1px,transparent_1px)] [background-size:16px_16px]" />
           {/* Глитч-линия */}
           <div className="fixed top-1/2 left-0 w-full h-1 bg-white/20 blur-sm animate-pulse z-50 opacity-20" />
        </>
      )}

      {/* 5. ЭРА STREAMING (2010-2019) */}
      {era === 'streaming' && (
        <>
           {/* Строгий градиент (Premium Dark) */}
           <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900 via-[#0a0a0a] to-black opacity-90" />
           {/* Легкое синее свечение сверху */}
           <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none z-10" />
        </>
      )}

      {/* 6. ЭРА FUTURE / AI (2020+) */}
      {era === 'future' && (
        <>
           {/* Aurora Background (Цветные пятна) */}
           <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse z-0" />
           <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse z-0 delay-1000" />
           <div className="fixed top-[20%] right-[20%] w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] animate-pulse z-0 delay-500" />
           
           {/* Texture */}
           <div className="fixed inset-0 bg-noise opacity-[0.03] z-40 pointer-events-none" />
        </>
      )}

      {/* === КОНТЕНТ === */}
      <div className={`relative z-10 
        ${era === 'retro' ? 'animate-rgb' : ''} 
        ${era === 'noir' ? 'tracking-[0.2em]' : ''}
        ${era === 'streaming' ? 'antialiased tracking-tight' : ''}
      `}>
        {children}
      </div>

    </div>
  );
}
