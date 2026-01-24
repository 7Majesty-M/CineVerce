'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TimeMachineControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentYear = new Date().getFullYear();
  const startYear = 1950;
  
  // Если год есть в URL, берем его, иначе по умолчанию 2000
  const initialYear = Number(searchParams.get('year')) || 2000;
  
  const [year, setYear] = useState(initialYear);
  const [isDragging, setIsDragging] = useState(false);

  // Хелпер для определения названия эры
  const getEraLabel = (y: number) => {
    if (y < 1955) return 'Golden Age & Noir';       // ЧБ
    if (y < 1978) return 'Vintage & New Wave';      // Сепия
    if (y < 1995) return 'VHS & Blockbusters';      // Ретровейв
    if (y < 2010) return 'Digital Revolution';      // Матрица
    if (y < 2020) return 'Streaming Era';           // HD / Netflix
    return 'Neo-Future & AI';                       // AI
  };

  // Дебаунс обновления URL
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/time-machine?year=${year}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [year, router]);

  // Вычисляем процент заполнения для слайдера
  const percentage = ((year - startYear) / (currentYear - startYear)) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 mb-12 relative z-20">
      
      {/* --- ИНДИКАТОР ГОДА И ЭРЫ --- */}
      <div className="text-center mb-10 relative">
        
        {/* Огромная цифра на фоне (декор) */}
        <h2 className="text-8xl md:text-9xl font-black text-white/5 select-none absolute left-1/2 -translate-x-1/2 -top-12 w-full blur-sm pointer-events-none">
          {year}
        </h2>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Динамический бейдж Эры */}
          <span className={`
            px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4 border backdrop-blur-md transition-all duration-500 shadow-xl
            ${year < 1955 ? 'border-white/20 bg-black/50 text-slate-300' : ''}
            ${year >= 1955 && year < 1978 ? 'border-orange-500/30 bg-orange-900/20 text-orange-200' : ''}
            ${year >= 1978 && year < 1995 ? 'border-pink-500/50 bg-pink-900/30 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)]' : ''}
            ${year >= 1995 && year < 2010 ? 'border-green-500/40 bg-green-900/30 text-green-400 font-mono border-dashed' : ''}
            ${year >= 2010 && year < 2020 ? 'border-blue-500/30 bg-blue-900/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}
            ${year >= 2020 ? 'border-white/20 bg-white/10 text-white backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]' : ''}
          `}>
            {getEraLabel(year)}
          </span>

          {/* Цифра года с эффектами */}
          <div className={`text-6xl md:text-8xl font-black tabular-nums transition-all duration-300
             ${year < 1955 ? 'text-slate-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}
             ${year >= 1955 && year < 1978 ? 'text-orange-100 sepia' : ''}
             ${year >= 1978 && year < 1995 ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 filter drop-shadow-[2px_2px_0_rgba(255,0,0,0.5)]' : ''}
             ${year >= 1995 && year < 2010 ? 'text-green-400 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : ''}
             ${year >= 2010 && year < 2020 ? 'text-blue-100 drop-shadow-lg' : ''}
             ${year >= 2020 ? 'text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-200 to-blue-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}
          `}>
            {year}
          </div>

        </div>
      </div>

      {/* --- СЛАЙДЕР --- */}
      <div className="relative h-14 flex items-center justify-center group">
        
        {/* Фоновая линия (Трек) */}
        <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-100 ease-out
                    ${year < 1955 ? 'bg-slate-400' : ''}
                    ${year >= 1955 && year < 1978 ? 'bg-orange-600' : ''}
                    ${year >= 1978 && year < 1995 ? 'bg-gradient-to-r from-cyan-500 to-pink-500' : ''}
                    ${year >= 1995 && year < 2010 ? 'bg-green-600' : ''}
                    ${year >= 2010 && year < 2020 ? 'bg-blue-600' : ''}
                    ${year >= 2020 ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-white' : ''}
                `}
                style={{ width: `${percentage}%` }}
             />
        </div>

        {/* Input Range (Невидимый, для управления) */}
        <input
          type="range"
          min={startYear}
          max={currentYear}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Кастомный бегунок */}
        <div 
            className={`absolute h-8 w-8 rounded-full border-4 transition-all duration-75 pointer-events-none z-10 flex items-center justify-center shadow-lg
                ${year < 1955 ? 'bg-black border-slate-300' : ''}
                ${year >= 1955 && year < 1978 ? 'bg-[#3d2e24] border-orange-400' : ''}
                ${year >= 1978 && year < 1995 ? 'bg-indigo-900 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]' : ''}
                ${year >= 1995 && year < 2010 ? 'bg-black border-green-500' : ''}
                ${year >= 2010 && year < 2020 ? 'bg-[#0f172a] border-blue-500' : ''}
                ${year >= 2020 ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''}
            `}
            style={{ 
                left: `calc(${percentage}% - 16px)` 
            }}
        >
            <div className={`w-2 h-2 rounded-full 
                ${year >= 1978 && year < 1995 ? 'bg-cyan-400' : 'bg-current text-transparent'}
            `} />
        </div>
      </div>

      {/* Шкала времени (Подписи) */}
      <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 font-bold mt-2 font-mono uppercase tracking-wider opacity-60">
        <span>{startYear}</span>
        <span className="hidden sm:inline">Golden Age</span>
        <span className="hidden sm:inline">VHS</span>
        <span className="hidden sm:inline">Digital</span>
        <span className="hidden sm:inline">Stream</span>
        <span>{currentYear}</span>
      </div>

    </div>
  );
}
