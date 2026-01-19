import { getMovieById, getVideos } from '../../../lib/tmdb';
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

export const dynamic = 'force-dynamic';

export default async function MoviePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const movieId = Number(params.id);
  
  const [movie, userRatings, videos] = await Promise.all([
    getMovieById(params.id),
    getUserRatings(movieId, 'movie'),
    getVideos(movieId, 'movie'),
  ]);

  if (!movie) notFound();

  const trailerKey = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
  const movieRating = userRatings.find(r => r.seasonNumber === null || r.seasonNumber === 0)?.rating || null;
  const isRated = movieRating !== undefined && movieRating !== null;
  const releaseYear = movie.release_date?.split('-')[0];
  
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
      
      {/* 
          MOVIE HERO WRAPPER
          Занимает 85vh экрана
      */}
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
                 {/* Основной постер */}
                 <div className="rounded-xl overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 aspect-[2/3] relative z-20 bg-[#121212] ring-1 ring-white/5">
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                    )}
                    {/* Блик на постере */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                 </div>

                 {/* Отражение (Reflection) */}
                 <div className="absolute -bottom-[102%] left-0 w-full h-full scale-y-[-1] opacity-20 blur-sm pointer-events-none mask-image-gradient">
                    {movie.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent" />
                 </div>
              </div>

              {/* --- INFO TEXT --- */}
              <div className="flex-1 pb-2">
                 
                 {/* Metadata Tags */}
                 <div className="flex flex-wrap items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/80">
                        Movie
                    </div>
                    {releaseYear && (
                        <div className="px-3 py-1 rounded-md bg-transparent border border-white/20 text-[10px] font-bold tracking-widest text-slate-300">
                            {releaseYear}
                        </div>
                    )}
                    {movie.runtime && (
                        <div className="text-xs font-medium text-slate-400">
                            {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                        </div>
                    )}
                 </div>
                 
                 {/* Title */}
                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white mb-6 drop-shadow-2xl max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  {movie.title}
                 </h1>
                 
                 {/* Rating & Short Info */}
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

                 {/* ACTION BUTTONS ROW */}
                 <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    
                    {/* КНОПКА PLAY (Главная) */}
                    {trailerKey && <PlayHeroButton />}

                    {/* Вторичные кнопки (Glass Style) */}
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

                        <div className="scale-90">
                           <WatchlistButton mediaId={movie.id} mediaType="movie" isInWatchlist={isInWatchlist} />
                        </div>
                        
                        <div className="w-px h-6 bg-white/10" />
                        
                        <div className="scale-90">
                           <AddToListDropdown mediaId={movie.id} mediaType="movie" />
                        </div>
                    </div>

                 </div>
              </div>
            </div>
          </div>
      </MovieHero>

      {/* --- STORYLINE & DETAILS --- */}
      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Левая колонка: Описание */}
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-6">Сюжет</h3>
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-10 max-w-3xl">
                   {movie.overview || "Описание этого фильма отсутствует на данном языке, но мы уверены, что он стоит вашего внимания."}
                </p>
                
                {/* Теги */}
                <div className="flex flex-wrap gap-2">
                    {movie.genres?.map((g: any) => (
                        <span key={g.id} className="px-4 py-2 rounded-lg bg-[#121212] border border-white/5 text-sm font-medium text-slate-400 hover:text-white hover:border-white/20 transition-colors cursor-default">
                            {g.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Правая колонка: Детали (можно расширить) */}
            <div className="w-full lg:w-[350px] space-y-8 text-sm">
                <div>
                    <span className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-xs">Статус</span>
                    <span className="text-white text-lg font-medium">Выпущен</span>
                </div>
                <div>
                    <span className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-xs">Язык оригинала</span>
                    <span className="text-white text-lg font-medium uppercase">{movie.original_language}</span>
                </div>
                {/* Сюда можно добавить бюджет, сборы и т.д. */}
            </div>

        </div>
      </div>
    </div>
  );
}
