// src/app/movie/[id]/page.tsx
import { getMovieById } from '../../../lib/tmdb';
import { getUserRatings } from '../../../lib/db-queries';
import { db } from '@/db'; // Импортируем БД
import { watchlist } from '@/db/schema'; // Импортируем таблицу watchlist
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WatchlistButton from '@/components/WatchlistButton'; // <--- Наш новый компонент
import AddToListDropdown from '@/components/AddToListDropdown';
import { auth } from '@/auth'; // Твой файл настройки

// Отключаем кэш для актуальности данных
export const dynamic = 'force-dynamic';

export default async function MoviePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const movieId = Number(params.id);
  
  // 1. Получаем данные о фильме и оценках
  const [movie, userRatings] = await Promise.all([
    getMovieById(params.id),
    getUserRatings(movieId, 'movie'),
  ]);

  if (!movie) notFound();

  // 2. Ищем оценку (seasonNumber для фильма всегда null или 0)
  const movieRating = userRatings.find(r => 
    r.seasonNumber === null || r.seasonNumber === 0
  )?.rating || null;

  const isRated = movieRating !== undefined && movieRating !== null;
  const releaseYear = movie.release_date?.split('-')[0];

  const session = await auth();
const userId = session?.user?.id; // Получаем ID из сессии

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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-100 font-sans pb-20">
      
      {/* --- HERO HEADER --- */}
      <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          {movie.backdrop_path ? (
            <div className="relative w-full h-full">
               <img 
                 src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
                 alt={movie.title} 
                 className="w-full h-full object-cover opacity-60 scale-105 animate-pulse-slow" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>
          ) : (
            <div className="w-full h-full bg-[#121212]" />
          )}
        </div>

        {/* Back Button */}
        <div className="absolute top-8 left-6 md:left-12 z-50">
           <Link href="/" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-sm font-bold text-slate-300 hover:text-white">
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              Назад
           </Link>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10 -mt-[40vh] md:-mt-[50vh]">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* --- POSTER (Floating) --- */}
          <div className="w-[280px] md:w-[350px] flex-shrink-0 mx-auto md:mx-0 relative group perspective-1000">
             <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] border border-white/10 aspect-[2/3] relative z-20 bg-[#121212] transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 group-hover:shadow-cyan-500/20">
                {movie.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             </div>
             <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] -z-10 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
          </div>

          {/* --- INFO COLUMN --- */}
          <div className="flex-1 pt-4 md:pt-[10vh]">
             {/* Title & Badge */}
             <div className="mb-6 fade-in-card" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                   <span className="text-sm font-bold text-cyan-400 tracking-wider uppercase border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-500/10 backdrop-blur-sm">Movie</span>
                   
                   {movie.runtime && movie.runtime > 0 && (
                     <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {Math.floor(movie.runtime / 60)}ч {movie.runtime % 60}м
                     </span>
                   )}
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4 drop-shadow-xl">
                  {movie.title}
                </h1>
                
                <div className="flex items-center gap-6 text-lg font-medium text-slate-300">
                   <span>{releaseYear}</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                   <div className="flex items-center gap-2 text-yellow-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      <span className="text-white font-bold">{movie.vote_average.toFixed(1)}</span>
                   </div>
                </div>
             </div>

             {/* Actions */}
             <div className="flex flex-wrap items-center gap-6 mb-10 fade-in-card relative z-30" style={{ animationDelay: '0.2s' }}>
                
                {/* ССЫЛКА НА СТРАНИЦУ ОЦЕНКИ */}
                <Link 
                    href={`/movie/${movie.id}/rate`}
                    className={`group/btn inline-flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300
                        ${isRated 
                            ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:bg-cyan-600 hover:border-cyan-500 hover:shadow-[0_0_25px_rgba(8,145,178,0.4)]'
                        }
                    `}
                >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors font-black text-sm
                        ${isRated 
                            ? 'bg-green-500 text-black shadow-lg' 
                            : 'bg-white/10 text-slate-300 group-hover/btn:bg-white group-hover/btn:text-cyan-600'
                        }
                    `}>
                        {isRated ? movieRating : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>}
                    </div>
                    
                    <span className={`text-sm font-bold uppercase tracking-widest 
                        ${isRated 
                            ? 'text-green-400' 
                            : 'text-slate-300 group-hover/btn:text-white'
                        }
                    `}>
                        {isRated ? `Ваша оценка: ${movieRating}` : 'Оценить фильм'}
                    </span>
                </Link>

                {/* --- НОВАЯ КНОПКА "В СПИСОК" --- */}
                <WatchlistButton 
                    mediaId={movie.id} 
                    mediaType="movie" 
                    isInWatchlist={isInWatchlist} 
                />
                                <AddToListDropdown 
    mediaId={movie.id} 
    mediaType="movie" 
/>
             </div>

             {/* Overview */}
             <div className="mb-12 max-w-4xl fade-in-card relative z-20" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                  Сюжет
                </h3>
                <p className="text-lg text-slate-300 leading-relaxed font-light">
                   {movie.overview || "Описание отсутствует."}
                </p>
             </div>

             {/* Genres */}
             {movie.genres && (
               <div className="flex flex-wrap gap-2 mb-12 fade-in-card relative z-20" style={{ animationDelay: '0.4s' }}>
                 {movie.genres.map((genre: any) => (
                   <span key={genre.id} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors cursor-default">
                     {genre.name}
                   </span>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
