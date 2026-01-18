// src/app/tv/[id]/page.tsx
import { getTVShowById } from '../../../lib/tmdb';
import { getUserRatings } from '../../../lib/db-queries';
import { db } from '@/db'; // Импортируем БД
import { watchlist } from '@/db/schema'; // Импортируем таблицу watchlist
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RatingButton from '../../../components/RatingButton';
import WatchlistButton from '@/components/WatchlistButton'; // <--- Импортируем компонент
import AddToListDropdown from '@/components/AddToListDropdown';
import { auth } from '@/auth'; // Твой файл настройки

// !!! ВАЖНО: Отключаем кэширование страницы, чтобы рейтинг обновлялся сразу !!!
export const dynamic = 'force-dynamic';

export default async function TVShowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const showId = Number(params.id);

  const [show, userRatings] = await Promise.all([
    getTVShowById(params.id),
    getUserRatings(showId, 'tv'),
  ]);

  if (!show) notFound();

  // Общий рейтинг сериала
  const mainShowRating = userRatings.find(r => r.seasonNumber === null)?.rating || null;
  
  // Карта оценок по сезонам (преобразуем в Map для быстрого поиска)
  const seasonRatingsMap = new Map<number, number>();
  userRatings.forEach(r => { 
      if (r.seasonNumber !== null) seasonRatingsMap.set(r.seasonNumber, r.rating); 
  });

  const releaseYear = show.first_air_date?.split('-')[0];

  // 3. Проверяем Watchlist (Буду смотреть) для сериала
// 3. Проверяем Watchlist (Буду смотреть)
   const session = await auth(); // <-- Получаем сессию
   const userId = session?.user?.id; // <-- Достаем ID

   let isInWatchlist = false;

   if (userId) {
    const check = await db.select().from(watchlist).where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.mediaId, showId),
        eq(watchlist.mediaType, 'tv')
    ));
    isInWatchlist = check.length > 0;
   }


  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30 selection:text-pink-100 font-sans pb-20">
      
      {/* --- HERO HEADER --- */}
      <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          {show.backdrop_path ? (
            <div className="relative w-full h-full">
               <img 
                 src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`} 
                 alt={show.name} 
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
             <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] border border-white/10 aspect-[2/3] relative z-20 bg-[#121212] transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 group-hover:shadow-pink-500/20">
                {show.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w780${show.poster_path}`} alt={show.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             </div>
             <div className="absolute inset-0 bg-pink-500/30 blur-[60px] -z-10 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
          </div>

          {/* --- INFO COLUMN --- */}
          <div className="flex-1 pt-4 md:pt-[10vh]">
             {/* Title & Badge */}
             <div className="mb-6 fade-in-card" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                   {(show as any).networks && (show as any).networks[0] && (
  <div className="px-3 py-1 rounded-md bg-white/10 backdrop-blur border border-white/5">
     <img src={`https://image.tmdb.org/t/p/w200${(show as any).networks[0].logo_path}`} alt={(show as any).networks[0].name} className="h-6 object-contain filter brightness-0 invert" />
  </div>
)}
                   <span className="text-sm font-bold text-pink-400 tracking-wider uppercase border border-pink-500/30 px-3 py-1 rounded-full bg-pink-500/10 backdrop-blur-sm">TV Series</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4 drop-shadow-xl">
                  {show.name}
                </h1>
                
                <div className="flex items-center gap-6 text-lg font-medium text-slate-300">
                   <span>{releaseYear}</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                   <span>{show.number_of_seasons} Сезонов</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                   <div className="flex items-center gap-2 text-yellow-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      <span className="text-white font-bold">{show.vote_average.toFixed(1)}</span>
                   </div>
                </div>
             </div>

             {/* Actions (Главная кнопка) */}
             <div className="flex flex-wrap items-center gap-6 mb-10 fade-in-card relative z-30" style={{ animationDelay: '0.2s' }}>
                <RatingButton
                   mediaId={show.id}
                   mediaType="tv"
                   initialRating={mainShowRating}
                   label="Оценить сериал"
                   size="large"
                />
                
                {/* --- НОВАЯ КНОПКА "В СПИСОК" --- */}
                <WatchlistButton 
                    mediaId={show.id} 
                    mediaType="tv" 
                    isInWatchlist={isInWatchlist} 
                />
                     <AddToListDropdown 
        mediaId={show.id} 
        mediaType="tv" 
    />
             </div>

             {/* Overview */}
             <div className="mb-12 max-w-4xl fade-in-card relative z-20" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                  Сюжет
                </h3>
                <p className="text-lg text-slate-300 leading-relaxed font-light">
                   {show.overview || "Описание отсутствует."}
                </p>
             </div>

             {/* Genres */}
             {show.genres && (
               <div className="flex flex-wrap gap-2 mb-12 fade-in-card relative z-20" style={{ animationDelay: '0.4s' }}>
                 {show.genres.map((genre: any) => (
                   <span key={genre.id} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-pink-500/50 transition-colors cursor-default">
                     {genre.name}
                   </span>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* --- SEASONS SECTION --- */}
        <div className="mt-20 fade-in-card relative z-10" style={{ animationDelay: '0.5s' }}>
           <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                Сезоны
              </h2>
              <span className="text-slate-500 font-bold">{show.number_of_seasons} Всего</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {show.seasons.map((season) => {
                 // Получаем рейтинг из карты
                 const seasonRating = seasonRatingsMap.get(season.season_number);
                 const isRated = seasonRating !== undefined && seasonRating !== null;
                 
                 if (season.season_number === 0 && season.episode_count === 0) return null;
                 const airYear = season.air_date?.split('-')[0];

                 return (
                    <div key={season.id} className="group relative bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)] hover:-translate-y-1 flex h-[220px] hover:z-50">
                       
                       {/* Season Poster */}
                       <div className="w-[140px] flex-shrink-0 relative overflow-hidden rounded-l-2xl">
                          {season.poster_path ? (
                             <img src={`https://image.tmdb.org/t/p/w342${season.poster_path}`} alt={season.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : show.poster_path ? (
                             <img src={`https://image.tmdb.org/t/p/w342${show.poster_path}`} alt={show.name} className="w-full h-full object-cover opacity-50 grayscale" />
                          ) : (
                             <div className="w-full h-full bg-[#151515] flex items-center justify-center text-xs text-slate-700">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                       </div>

                       {/* Season Info */}
                       <div className="flex-1 p-5 flex flex-col justify-between bg-gradient-to-r from-[#0a0a0a] to-[#111] relative rounded-r-2xl">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>

                          <div>
                             <div className="flex items-start justify-between mb-1 relative z-10">
                                <h3 className="font-bold text-xl text-white group-hover:text-pink-400 transition-colors line-clamp-1">{season.name}</h3>
                             </div>
                             
                             <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider relative z-10">
                                <span>{airYear || 'TBA'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span>{season.episode_count} Эп.</span>
                             </div>

                             {season.overview && (
                                <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed opacity-80 mb-4 relative z-10">{season.overview}</p>
                             )}
                          </div>

                          {/* КНОПКА ОЦЕНКИ СЕЗОНА */}
                          <div className="relative z-50">
                             <Link 
                                href={`/tv/${show.id}/season/${season.season_number}/rate`}
                                className={`group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 w-fit
                                    ${isRated 
                                        ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20' 
                                        : 'bg-white/5 border-white/10 hover:bg-pink-600 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                                    }
                                `}
                             >
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors font-bold text-xs
                                    ${isRated 
                                        ? 'bg-green-500 text-black' 
                                        : 'bg-white/10 text-slate-300 group-hover/btn:bg-white group-hover/btn:text-pink-600'
                                    }
                                `}>
                                   {isRated ? seasonRating : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>}
                                </div>
                                
                                <span className={`text-xs font-bold uppercase tracking-wider 
                                    ${isRated 
                                        ? 'text-green-400' 
                                        : 'text-slate-300 group-hover/btn:text-white'
                                    }
                                `}>
                                   {isRated ? `Ваша оценка: ${seasonRating}` : 'Оценить сезон'}
                                </span>
                             </Link>
                          </div>

                       </div>
                    </div>
                 )
              })}
           </div>
        </div>
      </div>
    </div>
  );
}