'use client';

import { useState, useEffect } from 'react';
import { submitMatchVote, checkSessionMatches } from '@/app/actions';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function MatchClient({ sessionId, initialMovies }: { sessionId: string, initialMovies: any[] }) {
  const [movies, setMovies] = useState(initialMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchFound, setMatchFound] = useState<any>(null);

  const currentMovie = movies[currentIndex];

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

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    const movie = currentMovie;
    setCurrentIndex(prev => prev + 1);
    const res = await submitMatchVote(sessionId, movie.id, direction === 'like');
    if (res.isMatch) {
        const check = await checkSessionMatches(sessionId);
        if(check.match) {
            setMatchFound(check.match);
            triggerConfetti();
        }
    }
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ec4899', '#a855f7', '#ffffff'] });
  };

  if (matchFound) {
      return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in zoom-in-95">
              <div className="text-6xl mb-6 animate-bounce">💖</div>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4 text-center drop-shadow-2xl">IT'S A MATCH!</h1>
              <p className="text-slate-300 text-lg md:text-xl mb-10 text-center font-medium">Идеальный выбор для совместного просмотра</p>
              
              <div className="w-64 md:w-80 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.6)] border-4 border-pink-500/50 mb-8 rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img src={`https://image.tmdb.org/t/p/w500${matchFound.poster_path}`} className="w-full" alt={matchFound.title}/>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-10 text-center max-w-2xl leading-tight">{matchFound.title}</h2>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <Link href={`/movie/${matchFound.id}`} className="flex-1 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform text-center flex items-center justify-center gap-3 shadow-xl">
                      <span>🍿</span> Смотреть инфо
                  </Link>
                  <button onClick={() => setMatchFound(null)} className="flex-1 bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                      Искать еще
                  </button>
              </div>
          </div>
      )
  }

  if (!currentMovie) {
    return (
        <div className="text-center text-white p-10 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
            <h2 className="text-3xl font-black mb-4">Фильмы закончились! 🎬</h2>
            <p className="text-slate-400 mb-8 text-lg">Вы просмотрели всю подборку.</p>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-lg">Начать заново</button>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md relative">
        
        {/* Хедер комнаты */}
        <div className="mb-8 flex items-center gap-3 bg-black/40 border border-white/10 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Room: {sessionId}</span>
        </div>

        {/* Карточка */}
        <div className="relative w-full aspect-[2/3] bg-[#1a1a1a] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group transition-all duration-500 hover:shadow-purple-500/20">
            {currentMovie.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w780${currentMovie.poster_path}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={currentMovie.title} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 pb-32"> {/* pb-32 чтобы освободить место под кнопки */}
                <h2 className="text-4xl font-black text-white leading-[0.95] mb-3 drop-shadow-lg line-clamp-3">{currentMovie.title}</h2>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <span className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg shadow-lg">★ {currentMovie.vote_average.toFixed(1)}</span>
                    <span className="bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">{(currentMovie.release_date || '').split('-')[0]}</span>
                </div>
            </div>
        </div>

        {/* КНОПКИ (ВЫНЕСЕНЫ ИЗ КАРТОЧКИ ДЛЯ УДОБСТВА) */}
        <div className="absolute -bottom-6 w-full px-6 flex items-center justify-center gap-6 z-20">
            
            {/* DISLIKE BUTTON */}
            <button 
                onClick={() => handleSwipe('dislike')}
                className="h-20 w-20 rounded-full bg-[#1a1a1a] border-2 border-[#333] text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 transition-all duration-300 active:scale-90 shadow-2xl group"
            >
                <svg className="w-8 h-8 group-hover:rotate-[-15deg] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {/* LIKE BUTTON */}
            <button 
                onClick={() => handleSwipe('like')}
                className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center hover:scale-110 hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all duration-300 active:scale-90 shadow-2xl border-4 border-[#050505] group"
            >
                <svg className="w-10 h-10 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>

        </div>
        
    </div>
  );
}
