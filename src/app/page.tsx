// src/app/page.tsx
import { getPopularMovies, getPopularTVShows } from '../lib/tmdb';
import Link from 'next/link';
import { auth } from '@/auth';
import TopRatedSlider from '../components/TopRatedSlider'; 
import GlobalSearch from '@/components/GlobalSearch';
import AuthButtons from '@/components/AuthButtons';

export const dynamic = 'force-dynamic';

// --- Types ---
interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  mediaType: 'movie' | 'tv';
}

// --- Main Page Component ---
export default async function Home() {
  // ✅ Вызов auth() внутри компонента
  const session = await auth();
  const userId = session?.user?.id;

  let combinedMedia: MediaItem[] = [];

  try {
    const [moviesData, tvShowsData] = await Promise.all([
      getPopularMovies(),
      getPopularTVShows()
    ]);

    const formattedMovies: MediaItem[] = moviesData.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      mediaType: 'movie',
    }));

    const formattedTVShows: MediaItem[] = tvShowsData.map((show: any) => ({
      id: show.id,
      title: show.name,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      overview: show.overview,
      vote_average: show.vote_average,
      release_date: show.first_air_date,
      mediaType: 'tv',
    }));

    combinedMedia = [...formattedMovies, ...formattedTVShows];
  } catch (e) {
    console.error(e);
    return <ErrorState />;
  }

  // Логика сортировки
  const movies = combinedMedia.filter(item => item.mediaType === 'movie').slice(0, 12);
  const tvShows = combinedMedia.filter(item => item.mediaType === 'tv').slice(0, 12);
  const topRated = [...combinedMedia].sort((a, b) => b.vote_average - a.vote_average).slice(0, 10);
  
  // Берем самый топовый фильм для Hero секции
  const featuredItem = topRated[0];

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
          
          {/* Просто вставляем компонент, без лишних div-оберток */}
          <TopRatedSlider items={topRated} />
        </section>

        {/* Movies Grid */}
        <MediaSection 
          title="🎬 Популярные фильмы" 
          subtitle="Свежие премьеры и хиты проката"
          gradient="from-cyan-400 via-blue-500 to-indigo-500"
          items={movies}
          type="movie"
        />

        {/* TV Shows Grid */}
        <MediaSection 
          title="📺 Популярные сериалы" 
          subtitle="Истории, от которых невозможно оторваться"
          gradient="from-purple-400 via-pink-500 to-rose-500"
          items={tvShows}
          type="tv"
        />
      </main>

      <Footer />
    </div>
  );
}

// --- Components ---

function HeroSection({ item }: { item: MediaItem }) {
  if (!item) return null;

  // Форматирование даты
  const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
  const score = item.vote_average ? Math.round(item.vote_average * 10) : 0;

  // Цвет рейтинга
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    if (score >= 50) return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]';
    return 'text-red-400';
  };

  return (
    <section className="relative w-full h-[85vh] md:h-svh min-h-[600px] flex items-end pb-20 md:pb-0 md:items-center overflow-hidden bg-black">
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 select-none">
        {item.backdrop_path ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
              alt={item.title}
              className="w-full h-full object-cover opacity-80 animate-slow-zoom" 
              // Примечание: animate-slow-zoom нужно добавить в tailwind.config или использовать scale-105 duration-[20s]
              style={{ objectPosition: 'center 20%' }}
            />
            
            {/* Сложный градиент для идеальной читаемости */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent opacity-90" />
            
            {/* Радиальный градиент ("прожектор" на текст) */}
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black to-transparent opacity-90" />
            
            {/* Текстура шума (Film Grain) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
          </>
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <span className="text-neutral-700 font-bold text-4xl">No Image</span>
          </div>
        )}
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 w-full">
        <div className="max-w-3xl space-y-6 md:space-y-8 animate-fade-in-up">
          
          {/* Badge: Лидер рейтинга (Показываем только если рейтинг высокий) */}
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

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight text-white drop-shadow-2xl text-balance">
            {item.title}
          </h1>

          {/* Metadata Row */}
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

          {/* Overview */}
          <p className="text-base md:text-lg lg:text-xl text-slate-300/80 line-clamp-3 leading-relaxed max-w-2xl text-pretty">
            {item.overview || "Описание пока не добавлено, но этот проект определенно заслуживает вашего внимания."}
          </p>

          {/* Buttons Group */}
          <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
            
            <Link href={`/${item.mediaType}/${item.id}`} className="w-full sm:w-auto">
              <button className="group relative w-full sm:w-auto bg-white hover:bg-slate-200 text-black px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                {/* Glow effect behind button */}
                <div className="absolute inset-0 bg-white/40 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-xl" />
                
                <svg className="w-6 h-6 fill-current relative z-10 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span className="relative z-10 text-lg">Смотреть</span>
              </button>
            </Link>

            <button className="group w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/30 text-white flex items-center justify-center gap-3">
               <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span>Подробнее</span>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}

function MediaSection({ title, subtitle, gradient, items, type }: { title: string, subtitle: string, gradient: string, items: MediaItem[], type: 'movie' | 'tv' }) {
  return (
    <section className="py-20 px-6 lg:px-12 border-t border-white/5 relative">
      {/* Decorative gradient blob behind section */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r ${gradient} opacity-[0.03] blur-[120px] pointer-events-none rounded-full`}></div>
      
      <div className="max-w-[1920px] mx-auto relative z-10">
        <SectionHeader title={title} subtitle={subtitle} gradient={gradient} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
          {items.map((item, index) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} index={index} type={type} />
          ))}
        </div>
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

function TopRatedCard({ item, index }: { item: MediaItem; index: number }) {
  const linkHref = `/${item.mediaType}/${item.id}`;
  return (
    <Link href={linkHref} className="group relative block w-64 md:w-80 perspective-1000">
      
      {/* 3D Number Effect */}
      <div className="absolute -left-6 -top-10 z-20 text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-600 via-slate-800 to-transparent opacity-80 select-none pointer-events-none drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-4" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>
        {index + 1}
      </div>
      
      <div className="relative rounded-3xl overflow-hidden aspect-[2/3] shadow-2xl border border-white/5 bg-[#0a0a0a] group-hover:border-yellow-500/50 transition-all duration-500 group-hover:shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)] group-hover:-translate-y-3 group-hover:rotate-1">
        {item.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center"><span className="text-4xl">🎬</span></div>
        )}
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
        
        <div className="absolute bottom-5 left-5 right-5 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h4 className="font-bold text-xl leading-tight mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2 drop-shadow-lg">{item.title}</h4>
          <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-slate-300">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 backdrop-blur-md">
               <span>⭐</span>
               <span>{item.vote_average.toFixed(1)}</span>
             </div>
             <span className="text-white/60">{item.release_date?.split('-')[0]}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function MediaCard({ item, index, type }: { item: MediaItem; index: number; type: 'movie' | 'tv' }) {
  const linkHref = `/${item.mediaType}/${item.id}`;
  const glowColor = type === 'movie' ? 'group-hover:shadow-cyan-500/30' : 'group-hover:shadow-pink-500/30';
  const borderColor = type === 'movie' ? 'group-hover:border-cyan-500/50' : 'group-hover:border-pink-500/50';
  const textColor = type === 'movie' ? 'group-hover:text-cyan-400' : 'group-hover:text-pink-400';
  const badgeColor = type === 'movie' ? 'bg-cyan-500' : 'bg-pink-500';

  return (
    <Link 
      href={linkHref} 
      className="group block relative fade-in-card h-full perspective-1000"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-white/5 transition-all duration-500 ${glowColor} ${borderColor} group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:z-10`}>
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/40 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
          <div className={`absolute inset-0 ${badgeColor} opacity-20 rounded-md`}></div>
          <span className="relative z-10">{type === 'movie' ? 'Movie' : 'TV'}</span>
        </div>

        {item.poster_path ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <div className={`w-14 h-14 rounded-full ${badgeColor} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-50 group-hover:scale-100 transition-all duration-300 group-hover:rotate-0 rotate-45`}>
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </>
        ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-800">No Image</div>
        )}
      </div>

      <div className="mt-4 px-1">
        <h4 className={`font-bold text-base text-white/90 ${textColor} transition-colors line-clamp-1 leading-snug`}>
          {item.title}
        </h4>
        <div className="flex items-center justify-between mt-2 text-sm text-slate-500 font-medium">
          <span>{item.release_date?.split('-')[0] || 'N/A'}</span>
          <div className="flex items-center gap-1 text-slate-400">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span>{item.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        
        {/* ЛОГОТИП */}
        <Link href="/" className="flex items-center gap-4 group cursor-pointer">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 opacity-80 blur group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <span className="text-xl">🎬</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-pink-500 transition-all">
              CineVerse
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 group-hover:text-white/50 transition-colors uppercase">Premium</span>
          </div>
        </Link>
        
        {/* ПРАВАЯ ЧАСТЬ */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* 1. ПОИСК */}
          <GlobalSearch />

          {/* 2. МАТЧ (Кино-рулетка) */}
          <Link 
            href="/match" 
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-pink-400 hover:bg-white/5 transition-all group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
            Матч
          </Link>

          {/* 3. КОЛЛЕКЦИИ (Списки) */}
          <Link 
            href="/lists" 
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Списки
          </Link>

          {/* 4. ПРОФИЛЬ (AuthButtons) */}
          <AuthButtons />

        </div>

      </div>
    </nav>
  )
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