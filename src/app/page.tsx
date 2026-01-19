// src/app/page.tsx

import { fetchMoreMovies, fetchMoreTVShows } from '@/app/actions';
import Link from 'next/link';
import { auth } from '@/auth';
import TopRatedSlider from '@/components/TopRatedSlider'; 
import Navbar from '@/components/Navbar';
import MediaList, { MediaItem } from '@/components/MediaList';

// ИМПОРТИРУЕМ КНОПКИ
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();
  
  // Инициализируем массивы
  let movies: MediaItem[] = [];
  let tvShows: MediaItem[] = [];
  let topRated: MediaItem[] = [];
  let featuredItem: MediaItem | null = null;

  try {
    const [moviesData, tvShowsData] = await Promise.all([
      fetchMoreMovies(1),
      fetchMoreTVShows(1)
    ]);

    // Форматируем Фильмы
    const rawMovies: MediaItem[] = moviesData.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      mediaType: 'movie',
      isInWatchlist: false // Добавляем дефолтное значение
    }));

    // Форматируем Сериалы
    const rawTVShows: MediaItem[] = tvShowsData.map((show: any) => ({
      id: show.id,
      title: show.name,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      overview: show.overview,
      vote_average: show.vote_average,
      release_date: show.first_air_date,
      mediaType: 'tv',
      isInWatchlist: false // Добавляем дефолтное значение
    }));

    // --- ФИЛЬТРАЦИЯ ДУБЛИКАТОВ ---
    const uniqueMoviesMap = new Map();
    rawMovies.forEach(item => uniqueMoviesMap.set(item.id, item));
    movies = Array.from(uniqueMoviesMap.values());

    const uniqueTVShowsMap = new Map();
    rawTVShows.forEach(item => uniqueTVShowsMap.set(item.id, item));
    tvShows = Array.from(uniqueTVShowsMap.values());

    // Объединяем для Top Rated
    const combinedMedia = [...movies, ...tvShows];
    
    // Сортируем для слайдера (лучшие 10)
    topRated = [...combinedMedia]
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 10);
    
    featuredItem = topRated[0];

  } catch (e) {
    console.error(e);
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30 selection:text-pink-100 overflow-x-hidden">
      <BackgroundEffects />
      <Navbar />
    
      <main className="relative z-10">
        
        {/* Dynamic Hero Section */}
        {featuredItem && <HeroSection item={featuredItem} />}

        {/* Top Rated Slider */}
        <section className="py-16 px-6 lg:px-12 border-t border-white/5 relative bg-gradient-to-b from-transparent to-black/40">
          <SectionHeader 
            title="🏆 Топ рейтинг" 
            subtitle="Выбор зрителей со всего мира" 
            gradient="from-yellow-400 via-orange-500 to-red-500" 
          />
          <TopRatedSlider items={topRated} />
        </section>

        {/* Movies Grid (С подгрузкой) */}
        <MediaSection 
          title="🎬 Популярные фильмы" 
          subtitle="Свежие премьеры и хиты проката"
          gradient="from-cyan-400 via-blue-500 to-indigo-500"
        >
          {/* Передаем очищенный список movies */}
          <MediaList initialItems={movies} type="movie" />
        </MediaSection>

        {/* TV Shows Grid (С подгрузкой) */}
        <MediaSection 
          title="📺 Популярные сериалы" 
          subtitle="Истории, от которых невозможно оторваться"
          gradient="from-purple-400 via-pink-500 to-rose-500"
        >
          {/* Передаем очищенный список tvShows. Кнопки внутри MediaList применятся автоматически */}
          <MediaList initialItems={tvShows} type="tv" />
        </MediaSection>

      </main>

      <Footer />
    </div>
  );
}

// --- Components ---

function MediaSection({ title, subtitle, gradient, children }: { title: string, subtitle: string, gradient: string, children: React.ReactNode }) {
  return (
    <section className="py-20 px-6 lg:px-12 border-t border-white/5 relative">
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r ${gradient} opacity-[0.03] blur-[120px] pointer-events-none rounded-full`}></div>
      
      <div className="max-w-[1920px] mx-auto relative z-10">
        <SectionHeader title={title} subtitle={subtitle} gradient={gradient} />
        {children}
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle, gradient }: { title: string, subtitle: string, gradient: string }) {
  return (
    <div className="mb-12 relative">
      <h3 className={`text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent inline-block tracking-tight drop-shadow-sm`}>
        {title}
      </h3>
      <p className="text-slate-400 font-medium text-lg flex items-center gap-2">
        <span className="w-8 h-[2px] bg-white/20 rounded-full"></span>
        {subtitle}
      </p>
    </div>
  )
}

function HeroSection({ item }: { item: MediaItem }) {
  if (!item) return null;
  const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
  const score = item.vote_average ? Math.round(item.vote_average * 10) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    if (score >= 50) return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]';
    return 'text-red-400';
  };

  return (
    <section className="relative w-full h-[85vh] md:h-svh min-h-[600px] flex items-end pb-20 md:pb-0 md:items-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0 select-none">
        {item.backdrop_path ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
              alt={item.title}
              className="w-full h-full object-cover opacity-80 animate-slow-zoom" 
              style={{ objectPosition: 'center 20%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent opacity-90" />
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black to-transparent opacity-90" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
          </>
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <span className="text-neutral-700 font-bold text-4xl">No Image</span>
          </div>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 w-full">
        <div className="max-w-3xl space-y-6 md:space-y-8 animate-fade-in-up">
          
          {score > 80 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              <span className="text-yellow-200 text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-sm">
                Топ рейтинга
              </span>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight text-white drop-shadow-2xl text-balance">
            {item.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-slate-300">
            <span className={`font-bold ${getScoreColor(score)}`}>
              {score}% Рейтинг
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span>{year}</span>
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="px-2 py-0.5 border border-white/10 roundedmd bg-white/5 uppercase text-xs tracking-wider text-slate-200">
              {item.mediaType === 'movie' ? 'Фильм' : 'Сериал'}
            </span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-slate-500" />
            <span className="hidden md:block px-2 py-0.5 border border-white/10 rounded-md bg-white/5 uppercase text-xs tracking-wider text-slate-200">
              4K HDR
            </span>
          </div>

          <p className="text-base md:text-lg lg:text-xl text-slate-300/80 line-clamp-3 leading-relaxed max-w-2xl text-pretty">
            {item.overview || "Описание пока не добавлено, но этот проект определенно заслуживает вашего внимания."}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            
            {/* Кнопка СМОТРЕТЬ */}
            <Link href={`/${item.mediaType}/${item.id}`} className="w-full sm:w-auto">
              <button className="group relative w-full sm:w-auto bg-white hover:bg-slate-200 text-black px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <div className="absolute inset-0 bg-white/40 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-xl" />
                <svg className="w-6 h-6 fill-current relative z-10 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span className="relative z-10 text-lg">Смотреть</span>
              </button>
            </Link>

            {/* В БУДУ СМОТРЕТЬ (Используем полноразмерный компонент, не компактный) */}
            <WatchlistButton 
               mediaId={item.id}
               mediaType={item.mediaType}
               isInWatchlist={item.isInWatchlist || false}
               compact={false}
            />

            {/* В СПИСОК */}
            <AddToListDropdown 
                mediaId={item.id}
                mediaType={item.mediaType}
                compact={false}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#050505] py-16 mt-20">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="text-3xl">🎬</span>
          <span className="text-2xl font-black">CineVerse</span>
        </div>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          Ваша персональная киновселенная. Мы собираем лучшие фильмы и сериалы со всего мира, чтобы вы могли наслаждаться ими в лучшем качестве.
        </p>
        <p className="text-slate-600 text-xs">© 2026 CineVerse. Создано с ❤️ для любителей кино</p>
      </div>
    </footer>
  )
}

function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="text-7xl mb-6 animate-bounce">👾</div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-3">Сбой связи</h2>
        <p className="text-slate-400 font-medium">Не удалось загрузить данные из вселенной.</p>
      </div>
    </div>
  )
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-pink-900/10 blur-[150px] rounded-full animate-pulse animation-delay-4000"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
  )
}
