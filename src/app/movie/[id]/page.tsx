// src/app/movie/[id]/page.tsx

import { getMovieById, getVideos, getCredits, getRecommendations } from '../../../lib/tmdb';
import { getUserRatings } from '../../../lib/db-queries';
import { db } from '@/db';
import { watchlist } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';
import { auth } from '@/auth';
import MovieHero, { PlayHeroButton } from '@/components/MovieHero';
import CastList from '@/components/CastList'; // Актеры
import SimilarList from '@/components/SimilarList'; // Рекомендации
// --- ТИПИЗАЦИЯ ДЛЯ РАСШИРЕННЫХ ДАННЫХ ---
interface ExtendedMovie {
  id: number;
  original_title?: string;
  original_language?: string;
  budget?: number;
  revenue?: number;
  status?: string;
  homepage?: string;
  imdb_id?: string;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  genres?: { id: number; name: string }[];
}

// Хелпер для денег ($1,000,000)
const formatMoney = (amount: number) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const dynamic = 'force-dynamic';

export default async function MoviePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const movieId = Number(params.id);
  
  // 1. ЗАГРУЖАЕМ ВСЁ (Фильм, Рейтинг, Видео, Актеры, Похожие)
  const [movie, userRatings, videos, cast, similar] = await Promise.all([
    getMovieById(params.id),
    getUserRatings(movieId, 'movie'),
    getVideos(movieId, 'movie'),
    getCredits(movieId, 'movie'),
    getRecommendations(movieId, 'movie')
  ]);

  if (!movie) notFound();

  // Трейлер
  const trailerKey = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
  
  // Рейтинг
  const movieRating = userRatings.find(r => r.seasonNumber === null || r.seasonNumber === 0)?.rating || null;
  const isRated = movieRating !== undefined && movieRating !== null;
  
  const releaseYear = movie.release_date?.split('-')[0];
  
  // Watchlist
  const session = await auth();
  const userId = session?.user?.id;
  
  let isInWatchlist = false;
  if (userId) {
    const check = await db.select().from(watchlist).where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.mediaId, movieId),
        eq(watchlist.mediaType, 'movie')
    ));
    isInWatchlist = check.length > 0;
  } 

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30">
      
      {/* --- MOVIE HERO WRAPPER --- */}
      <MovieHero backdropPath={movie.backdrop_path} videoKey={trailerKey}>
          
          {/* Top Bar */}
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-50">
             <Link href="/" className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm font-bold text-slate-300 group-hover:text-white">Назад</span>
             </Link>
          </div>

          {/* Main Content Area */}
          <div className="container mx-auto px-6 lg:px-12 h-full flex flex-col justify-end pb-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
              
              {/* --- POSTER WITH REFLECTION --- */}
              <div className="hidden lg:block w-[320px] flex-shrink-0 relative group mb-4">
                 <div className="rounded-xl overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 aspect-[2/3] relative z-20 bg-[#121212] ring-1 ring-white/5 transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 group-hover:shadow-red-500/20">
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                 </div>
                 {/* Reflection */}
                 <div className="absolute -bottom-[102%] left-0 w-full h-full scale-y-[-1] opacity-20 blur-sm pointer-events-none mask-image-gradient">
                    {movie.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent" />
                 </div>
              </div>

              {/* --- INFO TEXT --- */}
              <div className="flex-1 pb-2">
                 
                 {/* Metadata */}
<div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">

    {/* 1. BADGE: Тип медиа */}
    <div className="px-3 py-1 rounded-full bg-white text-black text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        Movie
    </div>

    {/* Разделитель */}
    <div className="w-px h-4 bg-white/20" />

    {/* 2. BADGE: Год выхода */}
    {releaseYear && (
        <div className="flex items-center justify-center px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-xs sm:text-sm font-bold text-slate-200 shadow-black drop-shadow-sm">
                {releaseYear}
            </span>
        </div>
    )}

    {/* 3. INFO: Длительность (СДЕЛАЛ ЯРЧЕ) */}
    {movie.runtime && (
        <div className="flex items-center gap-1.5">
            {/* Иконка: стала светлее (text-slate-200) */}
            <svg className="w-4 h-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            {/* Текст: стал почти белым (text-slate-100) и жирнее (font-semibold) */}
            <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide drop-shadow-sm">
                {Math.floor(movie.runtime / 60)}ч {movie.runtime % 60}м
            </span>
        </div>
    )}

    {/* Бонус: Качество */}
    <div className="hidden sm:flex items-center justify-center px-1.5 py-0.5 rounded border border-white/20 text-[9px] font-bold text-slate-300 uppercase tracking-wider ml-auto sm:ml-0">
        4K HDR
    </div>

</div>
      
                 {/* Title */}
                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white mb-6 drop-shadow-2xl max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  {movie.title}
                 </h1>
                 
                 {/* Rating */}
                 <div className="flex items-center gap-6 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-2xl">★</span>
                        <span className="text-2xl font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                        <span className="text-sm text-slate-500 font-medium mt-1">/ 10</span>
                    </div>
                    {movie.genres && (
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 font-medium">
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span>{movie.genres.slice(0, 3).map((g: any) => g.name).join(', ')}</span>
                        </div>
                    )}
                 </div>

                 {/* ACTION BUTTONS */}
                 <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {trailerKey && <PlayHeroButton />}
                    
                    <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <Link 
                            href={`/movie/${movie.id}/rate`} 
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/10 flex items-center gap-2
                                ${isRated ? 'text-green-400' : 'text-slate-300 hover:text-white'}
                            `}
                        >
                            {isRated ? (
                                <><span>★</span> {movieRating}</>
                            ) : (
                                <><span>☆</span> Оценить</>
                            )}
                        </Link>
                        
                        <div className="w-px h-6 bg-white/10" />
                        <div className="scale-90"><WatchlistButton mediaId={movie.id} mediaType="movie" isInWatchlist={isInWatchlist} /></div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="scale-90"><AddToListDropdown mediaId={movie.id} mediaType="movie" /></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
      </MovieHero>

      {/* --- CONTENT BELOW HERO --- */}
      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-16">
            
            {/* LEFT COLUMN: Story + Cast + Similar */}
            <div className="flex-1 min-w-0">
                {/* Storyline */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-1 h-8 bg-red-500 rounded-full"></span>
                        Сюжет
                    </h3>
                    <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light">
                       {movie.overview || "Описание отсутствует."}
                    </p>
                </div>

                {/* --- АКТЕРЫ --- */}
                <CastList cast={cast} />

                {/* --- ПОХОЖИЕ --- */}
                <SimilarList items={similar} type="movie" />
            </div>

            {/* RIGHT COLUMN: Details (Compact Sticky Card) */}
            {/* RIGHT COLUMN: Details (Extended Sticky Card) */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="lg:sticky lg:top-24 space-y-6">
                    
                    {/* INFO CARD */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-3 flex justify-between items-center">
                            <span>Детали</span>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">Info</span>
                        </h4>
                        
                        {/* Приводим тип movie к расширенному интерфейсу, чтобы убрать ошибки TS */}
                        {(() => {
                            const details = movie as unknown as ExtendedMovie;
                            
                            return (
                                <div className="flex flex-col gap-5">
                                    
                                    {/* 1. Оригинальное название (если отличается) */}
                                    {details.original_title && (movie as any).title !== details.original_title && (
                                        <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Оригинальное название</span>
                                            <span className="text-sm font-bold text-white leading-tight">
                                                {details.original_title}
                                            </span>
                                        </div>
                                    )}

                                    {/* 2. Сетка: Статус и Язык */}
                                    <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                                        <div>
                                            <span className="block text-slate-500 mb-1 text-[10px] font-bold uppercase tracking-wider">Статус</span>
                                            <span className="text-white text-sm font-medium">{details.status || 'Released'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 mb-1 text-[10px] font-bold uppercase tracking-wider">Язык</span>
                                            <span className="text-white text-sm font-bold uppercase bg-white/10 px-2 py-0.5 rounded w-fit text-center">
                                                {details.original_language}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 3. Финансы (Бюджет и Сборы) */}
                                    {((details.budget && details.budget > 0) || (details.revenue && details.revenue > 0)) && (
                                        <div className="flex flex-col gap-3 border-b border-white/5 pb-3">
                                            {details.budget && details.budget > 0 ? (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Бюджет</span>
                                                    <span className="text-slate-300 text-sm font-mono">{formatMoney(details.budget)}</span>
                                                </div>
                                            ) : null}
                                            {details.revenue && details.revenue > 0 ? (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Сборы</span>
                                                    <span className="text-green-400 text-sm font-mono">{formatMoney(details.revenue)}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    {/* 4. Производство (Компании) */}
                                    {details.production_companies && details.production_companies.length > 0 && (
                                        <div className="border-b border-white/5 pb-3">
                                            <span className="block text-slate-500 mb-2 text-[10px] font-bold uppercase tracking-wider">Производство</span>
                                            <div className="flex flex-col gap-2">
                                                {details.production_companies.slice(0, 3).map((co) => (
                                                    <span key={co.id} className="text-xs text-slate-200 font-medium flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                                        {co.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Страны */}
                                    {details.production_countries && details.production_countries.length > 0 && (
                                        <div className="border-b border-white/5 pb-3">
                                            <span className="block text-slate-500 mb-2 text-[10px] font-bold uppercase tracking-wider">Страны</span>
                                            <div className="flex flex-wrap gap-2">
                                                {details.production_countries.map((c) => (
                                                    <span key={c.iso_3166_1} className="text-xs text-slate-300 bg-[#1a1a1a] px-2 py-1 rounded border border-white/5">
                                                        {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Ссылки (Homepage / IMDB) */}
                                    {(details.homepage || details.imdb_id) && (
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            {details.homepage && (
                                                <a 
                                                    href={details.homepage} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors border border-white/10"
                                                >
                                                    Website
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                                </a>
                                            )}
                                            {details.imdb_id && (
                                                <a 
                                                    href={`https://www.imdb.com/title/${details.imdb_id}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#f5c518] hover:bg-[#e2b616] text-black text-xs font-black transition-colors"
                                                >
                                                    IMDb
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* 7. Жанры (в самом низу) */}
                                    <div className="pt-2">
                                        <div className="flex flex-wrap gap-2">
                                            {details.genres?.map((g) => (
                                                <span key={g.id} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 cursor-default">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            );
                        })()}
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
