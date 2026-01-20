import Link from 'next/link';
import { getTrendingMovies, getVideos } from '@/lib/tmdb';
import TrailerFeed from '@/components/TrailerFeed';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const movies = await getTrendingMovies();
  
  // Получаем трейлеры для фильмов
  const moviesWithTrailers = await Promise.all(
    movies.slice(0, 20).map(async (movie: any) => {
      const videos = await getVideos(movie.id, 'movie');
      const trailer = videos.find((v: any) => 
        (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      );
      return { ...movie, trailerKey: trailer?.key || null };
    })
  );

  // Фильтруем только фильмы с трейлерами
  const validItems = moviesWithTrailers.filter((m: any) => m.trailerKey !== null);

  // Если нет трейлеров, показываем заглушку
  if (validItems.length === 0) {
    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Нет доступных трейлеров</h2>
          <p className="text-slate-400 mb-8">К сожалению, сейчас нет трейлеров для показа</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      
      {/* Кнопка НАЗАД */}
      <div className="absolute top-4 md:top-6 left-4 md:left-6 z-50">
        <Link 
          href="/" 
          className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-black/60 hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl group"
          aria-label="Вернуться на главную"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>

      {/* Лого/название (опционально) */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full shadow-2xl">
          <h1 className="text-white font-bold text-sm md:text-base tracking-wider">
            🎬 Трейлеры
          </h1>
        </div>
      </div>

      {/* Фид с трейлерами */}
      <TrailerFeed items={validItems} />
    </div>
  );
}