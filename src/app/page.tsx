// src/app/page.tsx
import { fetchMoreMovies, fetchMoreTVShows, getMediaCollection } from '@/app/actions';
import Link from 'next/link';
import { auth } from '@/auth';
import Navbar from '@/components/Navbar';
import MediaList, { MediaItem } from '@/components/MediaList';
import CollectionList from '@/components/CollectionList'; 
import WatchlistButton from '@/components/WatchlistButton';
import AddToListDropdown from '@/components/AddToListDropdown';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  // Инициализируем данные
  let nowPlayingMovies: any[] = [];
  let upcomingMovies: any[] = [];
  let popularTV: any[] = [];
  let topRatedMovies: any[] = [];

  // Данные для нижних сеток
  let allMovies: MediaItem[] = [];
  let allTVShows: MediaItem[] = [];
  let featuredItem: MediaItem | null = null;
  
  // Объединим данные для ленты (чтобы было много картинок)
  let tapeItems: any[] = [];

  try {
    // ЗАГРУЖАЕМ ВСЕ ДАННЫЕ ПАРАЛЛЕЛЬНО
    const [
      nowPlayingData,
      upcomingData,
      popularTVData,
      topRatedData,
      moviesPage1,
      tvPage1
    ] = await Promise.all([
      getMediaCollection('movie', 'now_playing'),
      getMediaCollection('movie', 'upcoming'),
      getMediaCollection('tv', 'popular'),
      getMediaCollection('movie', 'top_rated'),
      fetchMoreMovies(1),
      fetchMoreTVShows(1)
    ]);

    // 1. Сохраняем коллекции
    nowPlayingMovies = nowPlayingData;
    upcomingMovies = upcomingData;
    popularTV = popularTVData;
    topRatedMovies = topRatedData;
    
    // Собираем микс для ленты (новинки + сериалы + топ)
    tapeItems = [...nowPlayingData.slice(0, 5), ...popularTVData.slice(0, 5), ...topRatedData.slice(0, 5)];

    // 2. Выбираем фильм для HERO (первый из новинок или топа)
    const rawHero = nowPlayingData[0] || topRatedData[0];
    
    if (rawHero) {
        featuredItem = {
            id: rawHero.id,
            title: rawHero.title || rawHero.name,
            poster_path: rawHero.poster_path,
            backdrop_path: rawHero.backdrop_path,
            overview: rawHero.overview,
            vote_average: rawHero.vote_average,
            release_date: rawHero.release_date || rawHero.first_air_date,
            mediaType: rawHero.title ? 'movie' : 'tv',
            isInWatchlist: false
        };
    }

    // 3. Форматируем данные для нижних сеток
    allMovies = moviesPage1.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      mediaType: 'movie',
      isInWatchlist: false
    }));

    allTVShows = tvPage1.map((show: any) => ({
      id: show.id,
      title: show.name,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      overview: show.overview,
      vote_average: show.vote_average,
      release_date: show.first_air_date,
      mediaType: 'tv',
      isInWatchlist: false
    }));

  } catch (e) {
    console.error(e);
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30 selection:text-pink-100 overflow-x-hidden">
      <BackgroundEffects />
      <Navbar />
    
      <main className="relative z-10">
        
        {/* === HERO SECTION === */}
        {featuredItem && <HeroSection item={featuredItem} />}

        {/* === 🔥 НОВИНКА: БЕГУЩАЯ ЛЕНТА (VISUAL STREAM) === */}
        <div className="py-12 relative overflow-hidden">
             {/* Градиенты по бокам для плавного исчезновения */}
             <div className="absolute left-0 top-0 bottom-0 w-24 z-20 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none" />
             <div className="absolute right-0 top-0 bottom-0 w-24 z-20 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
             
             <InfiniteTape items={tapeItems} speed={40} />
        </div>

        {/* === ПОДБОРКИ === */}
        
        <CollectionList
            title="🍿 Сейчас в кино"
            items={nowPlayingMovies}
            type="movie"
            gradient="from-orange-500 via-red-500 to-rose-600"
        />

        <CollectionList
            title="🔥 Сериалы в тренде"
            items={popularTV}
            type="tv"
            gradient="from-purple-400 via-fuchsia-500 to-pink-500"
        />
                
        {/* === BENTO GRID (КАТЕГОРИИ) === */}
        <GenreBento />
            
        <CollectionList
            title="📅 Скоро на экранах"
            items={upcomingMovies}
            type="movie"
            gradient="from-cyan-400 via-blue-500 to-indigo-500"
        />

        <CollectionList
            title="🏆 Зал славы"
            items={topRatedMovies}
            type="movie"
            gradient="from-yellow-300 via-amber-400 to-yellow-600"
        />

        {/* === КАТАЛОГИ === */}
        
        <MediaSection
          title="Все фильмы"
          subtitle="Каталог новинок и классики"
          gradient="from-white to-slate-500"
        >
          {/* type="movie" - грузит обычные фильмы */}
          <MediaList initialItems={allMovies} type="movie" />
        </MediaSection>

        <MediaSection
          title="Все сериалы"
          subtitle="Тысячи шоу для марафона"
          gradient="from-white to-slate-500"
        >
          {/* type="tv" - грузит обычные сериалы */}
          <MediaList initialItems={allTVShows} type="tv" />
        </MediaSection>

      </main>

      <Footer />
    </div>
  );
}

// --- КОМПОНЕНТ GENRE BENTO (ОБНОВЛЕННЫЙ) ---
function GenreBento() {
  const genres = [
    // === БОЛЬШИЕ БЛОКИ (Акценты) ===
    { id: 28, name: "Экшен", emoji: "💥", color: "from-orange-500 via-red-500 to-red-600", span: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", iconColor: "text-orange-200" },
    { id: 16, name: "Аниме", emoji: "🎌", color: "from-pink-500 via-rose-500 to-red-500", span: "col-span-2 row-span-1 md:col-span-1 md:row-span-2", iconColor: "text-pink-200" },
    { id: 18, name: "Драма", emoji: "🎭", color: "from-teal-400 via-emerald-500 to-green-600", span: "col-span-2 md:col-span-2 md:row-span-1", iconColor: "text-teal-200" },
    
    // === СТАНДАРТНЫЕ БЛОКИ ===
    { id: 878, name: "Sci-Fi", emoji: "👽", color: "from-cyan-400 via-blue-500 to-indigo-600", span: "col-span-1", iconColor: "text-cyan-200" },
    { id: 27, name: "Хоррор", emoji: "👻", color: "from-red-900 via-red-950 to-black", span: "col-span-1", iconColor: "text-red-200" },
    { id: 35, name: "Комедия", emoji: "😂", color: "from-yellow-300 via-orange-400 to-orange-500", span: "col-span-1", iconColor: "text-yellow-200" },
    { id: 10749, name: "Романтика", emoji: "💖", color: "from-rose-300 via-pink-400 to-red-400", span: "col-span-1", iconColor: "text-rose-200" },
    
    // === ДЛИННЫЕ ГОРИЗОНТАЛЬНЫЕ ===
    { id: 12, name: "Приключения", emoji: "🤠", color: "from-lime-400 via-green-500 to-emerald-600", span: "col-span-2", iconColor: "text-lime-200" },

    // === ОСТАЛЬНЫЕ ===
    { id: 14, name: "Фэнтези", emoji: "🧙‍♂️", color: "from-violet-500 via-purple-500 to-fuchsia-600", span: "col-span-1", iconColor: "text-violet-200" },
    { id: 80, name: "Криминал", emoji: "🔫", color: "from-gray-700 via-slate-800 to-slate-900", span: "col-span-1", iconColor: "text-gray-400" },
    { id: 53, name: "Триллер", emoji: "🔪", color: "from-stone-500 via-red-800 to-red-950", span: "col-span-1", iconColor: "text-stone-300" },
    { id: 10751, name: "Семейный", emoji: "👨‍👩‍👧‍👦", color: "from-sky-400 via-blue-400 to-indigo-500", span: "col-span-1", iconColor: "text-sky-200" },
    { id: 9648, name: "Детектив", emoji: "🔎", color: "from-zinc-500 via-slate-600 to-slate-800", span: "col-span-1", iconColor: "text-zinc-300" },
    { id: 36, name: "История", emoji: "📜", color: "from-amber-600 via-yellow-700 to-yellow-900", span: "col-span-1", iconColor: "text-amber-200" },
    { id: 10752, name: "Военный", emoji: "🎖️", color: "from-olive-600 via-stone-700 to-stone-800", span: "col-span-1", iconColor: "text-olive-200" },
    { id: 10402, name: "Музыка", emoji: "🎵", color: "from-fuchsia-400 via-purple-500 to-indigo-600", span: "col-span-1", iconColor: "text-fuchsia-200" },
    { id: 37, name: "Вестерн", emoji: "🌵", color: "from-orange-700 via-amber-800 to-amber-950", span: "col-span-1", iconColor: "text-orange-300" },
    { id: 99, name: "Документальный", emoji: "🎥", color: "from-blue-700 via-slate-800 to-gray-900", span: "col-span-2 md:col-span-1", iconColor: "text-blue-300" },
  ];

  return (
    <section className="py-24 px-4 md:px-8 border-t border-white/5 relative bg-[#030303] overflow-hidden selection:bg-purple-500/30">
      
      {/* --- ФОНОВЫЕ ЭФФЕКТЫ --- */}
      
      {/* 1. Техно-сетка для глубины */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />

      {/* 2. Живые цветные пятна (Orb) */}
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-600/15 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[12000ms] delay-1000" />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <SectionHeader 
            title="🎭 Настроение вечера" 
            subtitle="Кинематографичная подборка под любой вайб" 
            gradient="from-white via-slate-200 to-slate-400"
        />
        
        {/* --- СЕТКА (BENTO GRID) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 auto-rows-[160px] grid-flow-dense pb-20">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/discover?genre=${genre.id}`}
              // Используем 'group' для управления дочерними элементами
              // 'backface-hidden' и 'transform-gpu' критичны для четкости текста
              className={`
                group relative rounded-[2rem] overflow-hidden cursor-pointer
                bg-[#0a0a0a] border border-white/5
                transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 hover:border-white/20 hover:z-20
                transform-gpu backface-hidden perspective-1000
                ${genre.span}
              `}
            >
              {/* 1. Градиентный фон (по умолчанию скрыт, плавно появляется) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`} />
              
              {/* 2. Шум (Noise texture) - придает кинематографичность */}
              <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

              {/* 3. Внутреннее затемнение (Vignette) для читаемости текста */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
              
              {/* 4. Блик по контуру (Inner border shine) */}
              <div className="absolute inset-0 rounded-[2rem] border border-white/0 group-hover:border-white/10 transition-colors duration-500 pointer-events-none" />

              {/* --- КОНТЕНТ --- */}
              <div className="absolute inset-0 p-5 md:p-7 flex flex-col justify-between z-10">
                
                {/* Верхняя часть: Эмодзи и Стрелка */}
                <div className="flex justify-between items-start">
                    {/* Эмодзи с тенью */}
                    <span className="text-4xl md:text-5xl drop-shadow-2xl filter transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)">
                      {genre.emoji}
                    </span>

                    {/* Кнопка перехода (появляется с эффектом стекла) */}
                    <div className="
                        w-10 h-10 rounded-full 
                        bg-white/10 backdrop-blur-md border border-white/10 
                        flex items-center justify-center 
                        opacity-0 -translate-y-4 scale-50 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 
                        transition-all duration-300 ease-out shadow-lg
                    ">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                </div>
                
                {/* Нижняя часть: Название и CTA */}
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md group-hover:text-white transition-colors">
                    {genre.name}
                  </h3>
                  
                  {/* Анимированная полоска прогресса / CTA */}
                  <div className="h-0 overflow-hidden group-hover:h-6 transition-all duration-300 ease-out mt-0 group-hover:mt-2 opacity-0 group-hover:opacity-100">
                     <div className="flex items-center gap-2">
                        <span className="h-[2px] w-4 bg-white/50 rounded-full inline-block"></span>
                        <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                          Смотреть
                        </p>
                     </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}


// --- КОМПОНЕНТ БЕГУЩЕЙ ЛЕНТЫ ---
function InfiniteTape({ items, speed = 30 }: { items: any[], speed?: number }) {
    if (!items.length) return null;
    return (
        <div className="w-full rotate-[-2deg] scale-110 opacity-80 hover:opacity-100 transition-opacity duration-500">
             <style>
                {`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-scroll {
                        animation: scroll ${speed}s linear infinite;
                    }
                `}
            </style>
            <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
                {/* Дублируем список 2 раза для бесшовной прокрутки */}
                {[...items, ...items].map((item, idx) => (
                    <Link 
                        key={`${item.id}-${idx}`} 
                        href={`/${item.title ? 'movie' : 'tv'}/${item.id}`}
                        className="
                            relative flex-shrink-0 w-[200px] h-[120px] mx-2 
                            rounded-xl overflow-hidden border border-white/10 
                            group cursor-pointer bg-neutral-900
                        "
                    >
                        {item.backdrop_path ? (
                            <img 
                                src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`} 
                                alt="" 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-neutral-800" />
                        )}
                        
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <span className="text-white font-bold text-xs text-center px-2 line-clamp-2">
                                 {item.title || item.name}
                             </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// --- ОСТАЛЬНЫЕ КОМПОНЕНТЫ ---

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

// Единый компонент заголовка
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

            {/* В БУДУ СМОТРЕТЬ */}
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
          <span className="text-2xl font-black">CineRizon</span>
        </div>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          Ваша персональная киновселенная. Мы собираем лучшие фильмы и сериалы со всего мира, чтобы вы могли наслаждаться ими в лучшем качестве.
        </p>
        <p className="text-slate-600 text-xs">© 2026 CineRizon. Создано с ❤️ для любителей кино</p>
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
