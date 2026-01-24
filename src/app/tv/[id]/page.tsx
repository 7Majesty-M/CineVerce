// src/app/tv/[id]/page.tsx

import TVPlayerSection from '@/components/TVPlayerSection'; // <-- Убедитесь, что импорт есть
import LogWatchedButton from '@/components/LogWatchedButton';
import { getTVShowById, getVideos, getCredits, getRecommendations, getExternalIds } from '../../../lib/tmdb';
import { findKinopoiskId } from '../../../lib/kinopoisk';
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
import CastList from '@/components/CastList'; 
import SimilarList from '@/components/SimilarList'; 
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

// --- ТИПИЗАЦИЯ ДЛЯ РАСШИРЕННЫХ ДАННЫХ СЕРИАЛА ---
interface ExtendedTVShow {
  id: number;
  original_name?: string;
  original_language?: string;
  in_production?: boolean;
  status?: string;
  homepage?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  networks?: { id: number; name: string; logo_path: string | null }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  genres?: { id: number; name: string }[];
  first_air_date?: string;
  last_air_date?: string;
  // Добавляем типизацию сезонов, чтобы не было ошибок при передаче в TVPlayerSection
  seasons: { 
      id: number; 
      name: string; 
      season_number: number; 
      episode_count: number; 
      poster_path?: string;
      air_date?: string;
      overview?: string;
  }[];
}

export default async function TVShowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const showId = Number(params.id);
  
  // 1. ЗАПРАШИВАЕМ ДАННЫЕ ОТ TMDB (Добавили getExternalIds)
  const [show, userRatings, videos, cast, similar, externalIds] = await Promise.all([
    getTVShowById(params.id),
    getUserRatings(showId, 'tv'),
    getVideos(showId, 'tv'),
    getCredits(showId, 'tv'),        
    getRecommendations(showId, 'tv'),
    getExternalIds(showId, 'tv') // Получаем внешние ID (IMDb и т.д.)
  ]);

  if (!show) notFound();

  // Приводим к расширенному типу для удобства
  const details = show as unknown as ExtendedTVShow;
  const trailerKey = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;

  // 2. ПОИСК KINOPOISK ID (Для возможных русских плееров)
  const finalImdbId = externalIds?.imdb_id;
  const releaseYear = show.first_air_date ? Number(show.first_air_date.split('-')[0]) : undefined;

  let kinopoiskId: number | null = null;
  try {
      kinopoiskId = await findKinopoiskId({ 
          imdbId: finalImdbId, 
          originalTitle: details.original_name, 
          ruTitle: show.name,
          year: releaseYear,
      });
  } catch (e) {
      console.error('Kinopoisk ID search failed:', e);
  }

  // Расчет рейтинга
  const ratedSeasons = userRatings.filter(r => r.seasonNumber !== null && r.seasonNumber > 0);
  let averageUserRating: string | null = null;
  const hasUserRated = ratedSeasons.length > 0;

  if (hasUserRated) {
    const sum = ratedSeasons.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / ratedSeasons.length;
    averageUserRating = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);
  }

  const seasonRatingsMap = new Map<number, number>();
  userRatings.forEach(r => { 
      if (r.seasonNumber !== null) seasonRatingsMap.set(r.seasonNumber, r.rating); 
  });

  // Watchlist
   const session = await auth(); 
   const userId = session?.user?.id; 
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-pink-500/30">
      
      {/* --- HERO SECTION --- */}
      <MovieHero backdropPath={show.backdrop_path} videoKey={trailerKey}>
          
          {/* 1. NAVBAR (Сверху) */}
          <div className="absolute top-0 left-0 w-full z-50">
             <Navbar />
          </div>

          {/* 2. КНОПКА НАЗАД (Чуть ниже навбара) */}
          <div className="absolute top-24 left-0 w-full px-6 lg:px-12 z-40">
             <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-x-1 group"
             >
                <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm font-bold text-slate-300 group-hover:text-white">Назад</span>
             </Link>
          </div>

          <div className="container mx-auto px-6 lg:px-12 h-full flex flex-col justify-end pb-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
              
              {/* Poster */}
              <div className="hidden lg:block w-[320px] flex-shrink-0 relative group mb-4">
                 <div className="rounded-xl overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 aspect-[2/3] relative z-20 bg-[#121212] ring-1 ring-white/5 transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 group-hover:shadow-pink-500/20">
                    {show.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w780${show.poster_path}`} alt={show.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                 </div>
                 <div className="absolute -bottom-[102%] left-0 w-full h-full scale-y-[-1] opacity-20 blur-sm pointer-events-none mask-image-gradient">
                    {show.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w300${show.poster_path}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent" />
                 </div>
              </div>

              {/* Info */}
              <div className="flex-1 pb-2">
                 
                 {/* METADATA BAR */}
                 <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
                    
                    {/* NETWORK LOGO */}
                    {details.networks && details.networks[0] && (
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center justify-center h-6 sm:h-7 opacity-90 hover:opacity-100 transition-opacity">
                                <img 
                                    src={`https://image.tmdb.org/t/p/w200${details.networks[0].logo_path}`} 
                                    alt={details.networks[0].name} 
                                    className="h-full w-auto object-contain filter brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                                />
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                        </div>
                    )}

                    {/* BADGE */}
                    <div className="px-3 py-1 rounded-full bg-white text-black text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        TV Series
                    </div>
                    <div className="w-px h-4 bg-white/20" />

                    {/* YEAR */}
                    {releaseYear && (
                        <div className="flex items-center justify-center px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="text-xs sm:text-sm font-bold text-slate-200 shadow-black drop-shadow-sm">
                                {releaseYear}
                            </span>
                        </div>
                    )}

                    {/* SEASONS */}
                    {show.number_of_seasons && (
                        <div className="flex items-center gap-1.5 ml-1">
                            <svg className="w-4 h-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide drop-shadow-sm">
                                {show.number_of_seasons} {show.number_of_seasons === 1 ? 'Сезон' : 'Сезонов'}
                            </span>
                        </div>
                    )}
                    
                    {/* EPISODES */}
                    {details.number_of_episodes && (
                        <>
                             <div className="w-1 h-1 rounded-full bg-slate-500" />
                             <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide">
                                    {details.number_of_episodes} Серий
                                </span>
                             </div>
                        </>
                    )}
                 </div>
                 
                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white mb-6 drop-shadow-2xl max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">{show.name}</h1>
                 
                 <div className="flex items-center gap-6 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-2xl">★</span>
                        <span className="text-2xl font-bold text-white">{show.vote_average.toFixed(1)}</span>
                        <span className="text-sm text-slate-500 font-medium mt-1">/ 10</span>
                    </div>
                    {show.genres && (
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 font-medium">
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span>{show.genres.slice(0, 3).map((g: any) => g.name).join(', ')}</span>
                        </div>
                    )}
                 </div>

                 {/* Actions */}
<div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
    
    {/* Кнопка Трейлера */}
    {trailerKey && <div className="z-0"><PlayHeroButton /></div>}
    
    {/* Панель действий */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md w-full sm:w-auto relative z-10">
        
        {/* Блок рейтинга (Специфичный для TV) */}
        <div className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-default select-none transition-colors ${hasUserRated ? 'text-green-400 bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 'text-slate-400 border border-transparent'}`}>
            {hasUserRated ? <><span className="text-lg">★</span><span>Ваш ср. рейтинг: {averageUserRating}</span></> : <span className="opacity-70 text-xs uppercase tracking-wide">Оцените сезоны ниже ↓</span>}
        </div>
        
        {/* Разделитель 1 */}
        <div className="hidden sm:block w-px h-6 bg-white/10" />
        
        {/* Кнопка Watchlist */}
        <div className="sm:scale-90">
            <WatchlistButton mediaId={show.id} mediaType="tv" isInWatchlist={isInWatchlist} compact={false} />
        </div>
        
        {/* Разделитель 2 */}
        <div className="hidden sm:block w-px h-6 bg-white/10" />
        
        {/* Дропдаун списков */}
        <div className="sm:scale-90">
            <AddToListDropdown mediaId={show.id} mediaType="tv" compact={false} />
        </div>
        
        {/* Разделитель 3 */}
        <div className="hidden sm:block w-px h-6 bg-white/10" />
        
        {/* Кнопка LogWatched */}
        <div className="sm:scale-90">
            <LogWatchedButton 
                mediaId={show.id} 
                mediaType="tv" 
                title={show.name} 
            />
        </div>

    </div>
</div>

              </div>
            </div>
          </div>
      </MovieHero>

      {/* --- CONTENT & SEASONS --- */}
      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-20">
        
        {/* TOP: Story, Cast, Similar vs Details */}
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-20 mb-24">
            
            {/* Left Content */}
            <div className="flex-1 min-w-0">
                
                {/* --- ОНЛАЙН ПЛЕЕР С ВЫБОРОМ СЕРИЙ --- */}
                <TVPlayerSection 
                    tmdbId={String(showId)}
                    kpId={kinopoiskId}
                    imdbId={finalImdbId ?? null} // <-- ИСПРАВЛЕНО: добавляем ?? null
                    showName={show.name}
                    seasons={details.seasons} // Передаем данные о сезонах
                />

                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><span className="w-1 h-8 bg-pink-500 rounded-full"></span>Сюжет</h3>
                    <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light whitespace-pre-line">{show.overview || "Описание отсутствует."}</p>
                </div>

                {/* --- АКТЕРЫ --- */}
                <CastList cast={cast} />

                {/* --- РЕКОМЕНДАЦИИ --- */}
                <SimilarList items={similar} type="tv" />
            </div>

            {/* Right Details */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="lg:sticky lg:top-24 space-y-6">
                    
                    {/* INFO CARD */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-3 flex justify-between items-center">
                            <span>Детали</span>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">Info</span>
                        </h4>
                        
                        <div className="flex flex-col gap-5">
                            {/* 1. Оригинал */}
                            {details.original_name && show.name !== details.original_name && (
                                <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Оригинальное название</span>
                                    <span className="text-sm font-bold text-white leading-tight">
                                        {details.original_name}
                                    </span>
                                </div>
                            )}

                            {/* 2. Статус и Язык */}
                            <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                                <div>
                                    <span className="block text-slate-500 mb-1 text-[10px] font-bold uppercase tracking-wider">Статус</span>
                                    <span className="text-white text-sm font-medium">{details.in_production ? 'Выходит' : 'Завершен'}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 mb-1 text-[10px] font-bold uppercase tracking-wider">Язык</span>
                                    <span className="text-white text-sm font-bold uppercase bg-white/10 px-2 py-0.5 rounded w-fit text-center">
                                        {details.original_language}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Канал */}
                            {details.networks && details.networks.length > 0 && (
                                <div className="border-b border-white/5 pb-3">
                                    <span className="block text-slate-500 mb-2 text-[10px] font-bold uppercase tracking-wider">Канал</span>
                                    <div className="flex flex-wrap gap-3">
                                        {details.networks.map((net) => (
                                            <div key={net.id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                                                {net.logo_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w200${net.logo_path}`} alt={net.name} className="h-4 object-contain filter brightness-0 invert opacity-80" />
                                                ) : (
                                                    <span className="text-xs font-bold text-white">{net.name}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Производство */}
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

                            {/* 5. Ссылки */}
                            {details.homepage && (
                                <div className="pt-1">
                                    <a 
                                        href={details.homepage} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors border border-white/10 w-full"
                                    >
                                        Официальный сайт
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    </a>
                                </div>
                            )}

                            {/* 6. Жанры */}
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
                    </div>
                </div>
            </div>
        </div>

        {/* --- SEASONS GRID (WIDE FULL WIDTH) --- */}
        <div className="fade-in-card relative z-10 border-t border-white/10 pt-16">
           <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Сезоны</h2>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-bold text-sm">
                 {show.number_of_seasons} Всего
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {show.seasons.map((season) => {
                 const seasonRating = seasonRatingsMap.get(season.season_number);
                 const isRatedSeason = seasonRating !== undefined && seasonRating !== null;
                 
                 if (season.season_number === 0 && season.episode_count === 0) return null;
                 const airYear = season.air_date?.split('-')[0];
                 
                 return (
                    <div key={season.id} className="group relative bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)] hover:-translate-y-1 flex h-[220px] hover:z-50">
                        
                        {/* Poster */}
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

                        {/* Info */}
                        <div className="flex-1 p-5 flex flex-col justify-between bg-gradient-to-r from-[#0a0a0a] to-[#111] relative rounded-r-2xl">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>
                           
                           <div>
                              <h3 className="font-bold text-xl text-white group-hover:text-pink-400 transition-colors line-clamp-1 mb-1">{season.name}</h3>
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider relative z-10">
                                 <span>{airYear || 'TBA'}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                 <span>{season.episode_count} Эп.</span>
                              </div>
                              {season.overview && (
                                 <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed opacity-80 mb-4 relative z-10">{season.overview}</p>
                              )}
                           </div>
                           
                           <div className="relative z-50">
                             <Link 
                                 href={`/tv/${show.id}/season/${season.season_number}/rate`}
                                 className={`group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 w-fit
                                     ${isRatedSeason 
                                       ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20' 
                                       : 'bg-white/5 border-white/10 hover:bg-pink-600 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                                     }
                                 `}
                             >
                                 <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors font-bold text-xs ${isRatedSeason ? 'bg-green-500 text-black' : 'bg-white/10 text-slate-300 group-hover/btn:bg-white group-hover/btn:text-pink-600'}`}>
                                     {isRatedSeason ? seasonRating : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>}
                                 </div>
                                 <span className={`text-xs font-bold uppercase tracking-wider ${isRatedSeason ? 'text-green-400' : 'text-slate-300 group-hover/btn:text-white'}`}>
                                     {isRatedSeason ? `Ваша оценка: ${seasonRating}` : 'Оценить сезон'}
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