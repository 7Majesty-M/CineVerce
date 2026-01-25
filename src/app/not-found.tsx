'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const quotes = [
  { text: "Хьюстон, у нас проблема. Страница не отвечает.", movie: "Аполлон 13" },
  { text: "Это не та страница, которую вы ищете.", movie: "Звёздные войны" },
  { text: "Страницы не существует, Нео. Есть только код.", movie: "Матрица" },
  { text: "Я вижу мертвые ссылки...", movie: "Шестое чувство" },
  { text: "Первое правило Бойцовского клуба: не говорить об этой странице.", movie: "Бойцовский клуб" },
  { text: "Дороги? Там, куда мы отправляемся, страницы не нужны.", movie: "Назад в будущее" },
  { text: "Run, Forest, Run! Отсюда, пока не поздно.", movie: "Форрест Гамп" },
];

export default function NotFound() {
  const [quote, setQuote] = useState(quotes[0]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  // Ref для контейнера, чтобы отслеживать мышь
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-pink-500/30 font-sans"
    >
      
      {/* 1. ИНТЕРАКТИВНЫЙ ФОН (SPOTLIGHT) */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.15), transparent 40%)`
        }}
      ></div>

      {/* 2. CRT / SCANLINE ЭФФЕКТ (Текстура экрана) */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="fixed inset-0 pointer-events-none z-[2] scanlines opacity-10"></div>

      {/* 3. ПАРЯЩАЯ ПЫЛЬ (Частицы) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full opacity-20 animate-float"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 5 + 's',
            }}
          ></div>
        ))}
      </div>

      {/* 4. ОСНОВНОЙ КОНТЕНТ */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl w-full">
        
        {/* Глитч-Заголовок */}
        <div className="relative mb-8 group">
           <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter select-none glitch-layers" data-text="404">
             404
           </h1>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/20 blur-[80px] rounded-full -z-10 group-hover:bg-purple-500/30 transition-all duration-500"></div>
        </div>

        <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-widest mb-8 animate-pulse-slow">
          Плёнка оборвалась
        </h2>

        {/* Цитата в стиле "Сценария" */}
        <div className="w-full relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl mb-10 overflow-hidden group hover:border-white/20 transition-all duration-500">
           {/* Декор: верхняя полоска пленки */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>
           
           <p className="text-xl md:text-2xl text-slate-200 font-serif italic leading-relaxed relative z-10">
             "{quote.text}"
           </p>
           
           <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex gap-2">
                 <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                 <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                 <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-purple-400">
                 {quote.movie}
              </div>
           </div>
        </div>

        {/* 5. ПОИСК И КНОПКИ */}
        <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
                <Link 
                  href="/"
                  className="flex-1 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-slate-200 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  На главную
                </Link>
            </div>
        </div>
      </div>

      {/* 6. ГЛОБАЛЬНЫЕ СТИЛИ ЭФФЕКТОВ */}
      <style jsx>{`
        /* Скан-линии как на старом ТВ */
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.2) 50%,
            rgba(0,0,0,0.2)
          );
          background-size: 100% 4px;
          animation: scanlineMove 10s linear infinite;
        }

        @keyframes scanlineMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }

        /* Анимация пылинок */
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }

        /* Глитч текста (расслоение) */
        .glitch-layers {
          position: relative;
          color: white;
        }
        .glitch-layers::before,
        .glitch-layers::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }
        .glitch-layers::before {
          color: #ff00ff;
          z-index: -1;
          animation: glitch-anim-1 3s infinite linear alternate-reverse;
        }
        .glitch-layers::after {
          color: #00ffff;
          z-index: -2;
          animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        @keyframes glitch-anim-2 {
          0% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
          100% { transform: translate(0); }
        }
        
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}