'use client';

import { useState, useEffect } from 'react';
import { submitMatchVote, checkSessionMatches } from '@/app/actions';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';

interface Movie {
    id: number;
    title: string;
    poster_path: string;
    overview: string;
    vote_average: number;
    release_date: string;
    backdrop_path?: string;
}

export default function MatchClient({ 
    sessionId, 
    userId, 
    initialMovies 
}: { 
    sessionId: string, 
    userId: string, 
    initialMovies: any[] 
}) {
  const [movies] = useState<Movie[]>(initialMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchFound, setMatchFound] = useState<any>(null);
  
  // Анимация карточки
  const controls = useAnimation();
  const x = useMotionValue(0);
  // Наклон карточки при свайпе: чем дальше x, тем сильнее наклон
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  // Прозрачность штампов LIKE/NOPE
  const opacityLike = useTransform(x, [0, 100], [0, 1]);
  const opacityNope = useTransform(x, [0, -100], [0, 1]);

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1]; // Для эффекта стопки

  // --- ПОЛЛИНГ СОВПАДЕНИЙ ---
  useEffect(() => {
    if (matchFound) return;
    const interval = setInterval(async () => {
        const res = await checkSessionMatches(sessionId);
        if (res.success && res.match) {
            setMatchFound(res.match);
            triggerConfetti();
            clearInterval(interval);
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, matchFound]);

  // --- УПРАВЛЕНИЕ КЛАВИАТУРОЙ ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (matchFound) return;
        if (e.key === 'ArrowRight') handleVote('like');
        if (e.key === 'ArrowLeft') handleVote('dislike');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, matchFound]);

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ec4899', '#a855f7', '#ffffff'] });
  };

  const submitVote = async (movie: Movie, liked: boolean) => {
      const res = await submitMatchVote(sessionId, movie.id, liked);
      if (res.isMatch) {
          const check = await checkSessionMatches(sessionId);
          if (check.match) {
              setMatchFound(check.match);
              triggerConfetti();
          }
      }
  };

  // Голос через кнопки
  const handleVote = async (direction: 'like' | 'dislike') => {
    if (!currentMovie) return;
    
    // Запускаем анимацию улетания
    const xOffset = direction === 'like' ? 500 : -500;
    await controls.start({ x: xOffset, opacity: 0, transition: { duration: 0.3 } });
    
    // Логика переключения
    const movieToVote = currentMovie;
    setCurrentIndex((prev) => prev + 1);
    
    // Сброс позиции для следующей карточки (мгновенно)
    x.set(0);
    controls.set({ x: 0, opacity: 1 });

    submitVote(movieToVote, direction === 'like');
  };

  // Голос через свайп (Framer Motion Drag)
  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 100; // Сколько пикселей нужно протащить
    if (info.offset.x > threshold) {
        handleVote('like');
    } else if (info.offset.x < -threshold) {
        handleVote('dislike');
    } else {
        // Если не дотянули - возвращаем назад
        controls.start({ x: 0, opacity: 1 });
    }
  };

  // --- ЭКРАН "MATCH FOUND" ---
  if (matchFound) {
      return (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in zoom-in-95">
              <div className="text-6xl mb-6 animate-bounce">💖</div>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4 text-center drop-shadow-2xl">IT'S A MATCH!</h1>
              <p className="text-slate-300 text-lg md:text-xl mb-10 text-center font-medium">Идеальный выбор для совместного просмотра</p>
              
              <div className="w-64 md:w-80 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.6)] border-4 border-pink-500/50 mb-8 rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img src={`https://image.tmdb.org/t/p/w500${matchFound.poster_path}`} className="w-full" alt={matchFound.title}/>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-10 text-center max-w-2xl leading-tight">{matchFound.title}</h2>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <Link href={`/movie/${matchFound.id}`} className="flex-1 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform text-center flex items-center justify-center gap-3 shadow-xl">
                      <span>🍿</span> Инфо
                  </Link>
                  <button onClick={() => setMatchFound(null)} className="flex-1 bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                      Искать еще
                  </button>
              </div>
          </div>
      )
  }

  // --- ЭКРАН "ФИЛЬМЫ КОНЧИЛИСЬ" ---
  if (!currentMovie) {
    return (
        <div className="text-center text-white p-10 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md max-w-md w-full relative z-10">
            <div className="text-7xl mb-6">🎬</div>
            <h2 className="text-3xl font-black mb-4">Фильмы закончились!</h2>
            <p className="text-slate-400 mb-8 text-lg">Вы просмотрели всю подборку на сегодня.</p>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-lg w-full">Начать заново</button>
        </div>
    )
  }

  // --- ГЛАВНЫЙ ЭКРАН ---
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-4 lg:px-12 gap-8 xl:gap-16 relative">
        
        {/* ФОНОВЫЕ ЭФФЕКТЫ (Круги за карточкой) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* --- ЛЕВАЯ КОЛОНКА: ИНФО --- */}
        <div className="hidden lg:flex flex-col items-end text-right w-1/4 space-y-6 transition-all duration-300 z-10">
            <div className="space-y-3">
                <h2 className="text-4xl xl:text-5xl font-black leading-none text-white drop-shadow-lg tracking-tight">
                    {currentMovie.title}
                </h2>
                <div className="flex flex-wrap gap-2 justify-end">
                    <span className="text-slate-400 text-lg font-bold border border-white/10 px-3 py-1 rounded-lg bg-black/20">
                        {currentMovie.release_date?.split('-')[0]}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
                <div className="px-5 py-3 rounded-2xl bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-yellow-400 font-black text-2xl shadow-lg">
                    ★ {currentMovie.vote_average.toFixed(1)}
                </div>
            </div>
        </div>

        {/* --- ЦЕНТР: СТОПКА КАРТОЧЕК --- */}
        <div className="flex flex-col items-center justify-center w-full max-w-[380px] relative z-20 h-[600px]">
            
            <div className="relative w-full h-[540px]">
                
                {/* 1. СЛЕДУЮЩАЯ КАРТОЧКА (Подложка) */}
                {nextMovie && (
                    <div className="absolute inset-0 bg-[#151515] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl scale-[0.92] translate-y-4 opacity-60 pointer-events-none transition-transform duration-300">
                        <img src={`https://image.tmdb.org/t/p/w780${nextMovie.poster_path}`} className="w-full h-full object-cover grayscale" alt="Next" />
                    </div>
                )}

                {/* 2. ТЕКУЩАЯ КАРТОЧКА (Draggable) */}
                <motion.div 
                    className="absolute inset-0 bg-[#1a1a1a] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing touch-none"
                    style={{ x, rotate }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7} // Упругость
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    whileTap={{ scale: 1.05 }}
                >
                    {currentMovie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w780${currentMovie.poster_path}`} className="w-full h-full object-cover pointer-events-none" alt={currentMovie.title} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                    )}

                    {/* ШТАМПЫ (LIKE / NOPE) */}
                    <motion.div style={{ opacity: opacityLike }} className="absolute top-10 left-10 border-4 border-green-500 rounded-xl px-4 py-2 transform -rotate-12 z-30">
                        <span className="text-4xl font-black text-green-500 uppercase tracking-widest">LIKE</span>
                    </motion.div>
                    <motion.div style={{ opacity: opacityNope }} className="absolute top-10 right-10 border-4 border-red-500 rounded-xl px-4 py-2 transform rotate-12 z-30">
                        <span className="text-4xl font-black text-red-500 uppercase tracking-widest">NOPE</span>
                    </motion.div>

                    {/* Оверлей для мобилок */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8 pb-32 lg:opacity-0 pointer-events-none"> 
                        <h2 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg line-clamp-2">{currentMovie.title}</h2>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                            <span className="text-yellow-400">★ {currentMovie.vote_average.toFixed(1)}</span>
                            <span>{(currentMovie.release_date || '').split('-')[0]}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* КНОПКИ УПРАВЛЕНИЯ */}
            <div className="absolute -bottom-4 w-full px-6 flex items-center justify-center gap-8 z-30">
                <button 
                    onClick={() => handleVote('dislike')}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-[#1a1a1a] border border-white/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 transition-all duration-300 active:scale-90 shadow-xl"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <button 
                    onClick={() => handleVote('like')}
                    className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center hover:scale-110 hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all duration-300 active:scale-90 shadow-2xl border-4 border-[#050505]"
                >
                    <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
            </div>
        </div>

        {/* --- ПРАВАЯ КОЛОНКА: СЮЖЕТ (Только Desktop) --- */}
        <div className="hidden lg:block w-1/4 space-y-6 text-left z-10">
            <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none group-hover:bg-white/10 transition-colors"></div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-1 bg-slate-600 rounded-full"></span>
                    Сюжет
                </h3>
                <p className="text-slate-200 leading-relaxed text-base font-light line-clamp-[15] text-pretty">
                    {currentMovie.overview || "Описание отсутствует для этого фильма."}
                </p>
            </div>
            
            <div className="text-center opacity-40 text-xs font-bold uppercase tracking-widest text-slate-500">
                Используйте стрелки клавиатуры
            </div>
        </div>

    </div>
  );
}
