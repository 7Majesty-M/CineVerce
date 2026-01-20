import { getMoviesByGenre } from '@/app/actions';
import Navbar from '@/components/Navbar';
import MediaList from '@/components/MediaList';
import GenreSlider from '@/components/GenreSlider'; 

const GENRES_DATA = [
  { id: 'all', name: 'Все', emoji: '♾️', color: 'from-slate-500 to-white' },
  { id: '28', name: 'Экшен', emoji: '💥', color: 'from-orange-500 to-red-600' },
  { id: '12', name: 'Приключения', emoji: '🤠', color: 'from-green-500 to-emerald-400' },
  { id: '16', name: 'Аниме', emoji: '🎌', color: 'from-pink-500 to-rose-500' },
  { id: '35', name: 'Комедия', emoji: '😂', color: 'from-yellow-400 to-orange-400' },
  { id: '80', name: 'Криминал', emoji: '🔫', color: 'from-slate-700 to-slate-900' },
  { id: '18', name: 'Драма', emoji: '🎭', color: 'from-teal-500 to-blue-500' },
  { id: '10751', name: 'Семейный', emoji: '👨‍👩‍👧‍👦', color: 'from-indigo-400 to-purple-400' },
  { id: '14', name: 'Фэнтези', emoji: '🧙‍♂️', color: 'from-violet-600 to-fuchsia-600' },
  { id: '27', name: 'Хоррор', emoji: '👻', color: 'from-red-900 to-black' },
  { id: '10749', name: 'Романтика', emoji: '💖', color: 'from-pink-400 to-red-400' },
  { id: '878', name: 'Фантастика', emoji: '👽', color: 'from-blue-600 to-cyan-400' },
  { id: '53', name: 'Триллер', emoji: '🔪', color: 'from-stone-600 to-red-900' },
];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DiscoverPage(props: Props) {
  const searchParams = await props.searchParams;
  const currentGenreId = (searchParams.genre as string) || 'all';
  const genreInfo = GENRES_DATA.find(g => g.id === currentGenreId) || GENRES_DATA[0];
  const movies = await getMoviesByGenre(currentGenreId);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/30 overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b ${genreInfo.color} opacity-15 blur-[150px] rounded-full transition-colors duration-1000`} />
      </div>
      
      <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1920px] mx-auto">
        
        {/* === HERO ЗАГОЛОВОК КАТЕГОРИИ === */}
        <div className="relative flex flex-col items-center text-center mb-16 animate-fade-in-up">
           {/* Декоративное свечение за эмодзи */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br opacity-30 blur-3xl rounded-full pointer-events-none" 
                style={{background: `linear-gradient(to bottom right, ${genreInfo.color.replace('from-', '').replace(' to-', ', ')})`}} />
           
           {/* Декоративные элементы по бокам */}
           <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-2xl opacity-50 animate-pulse" />
           <div className="absolute top-20 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-30 animate-pulse delay-700" />
           
           <div className={`relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${genreInfo.color} p-[2px] mb-6 shadow-2xl animate-in zoom-in duration-500`}>
              <div className="w-full h-full rounded-3xl bg-[#050505] flex items-center justify-center text-5xl md:text-6xl backdrop-blur-md">
                {genreInfo.emoji}
              </div>
           </div>
           
           <h1 className={`relative text-6xl md:text-8xl font-black tracking-tighter mb-5 bg-gradient-to-br ${genreInfo.color} bg-clip-text text-transparent drop-shadow-2xl animate-in slide-in-from-left duration-700`}>
             {genreInfo.name}
           </h1>
           
           <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed animate-in slide-in-from-left duration-700 delay-100 mb-6">
             Лучшие фильмы и сериалы в категории <span className={`font-bold bg-gradient-to-r ${genreInfo.color} bg-clip-text text-transparent`}>{genreInfo.name}</span>. 
             <span className="inline-block ml-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-bold">
               {movies.length}+ тайтлов
             </span>
           </p>

           {/* Статистика и теги */}
           <div className="flex flex-wrap gap-3 items-center justify-center animate-in fade-in duration-700 delay-200">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
               <span className="text-2xl">🎬</span>
               <span className="text-sm text-slate-300">Фильмы и сериалы</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
               <span className="text-2xl">⭐</span>
               <span className="text-sm text-slate-300">Топ рейтинг</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
               <span className="text-2xl">🔥</span>
               <span className="text-sm text-slate-300">Популярное</span>
             </div>
           </div>
        </div>

        {/* === СТИЛЬНАЯ ПАНЕЛЬ ФИЛЬТРОВ (Заменено на компонент) === */}
        <GenreSlider 
            genres={GENRES_DATA} 
            currentGenreId={currentGenreId} 
        />

        {/* === СЕТКА ФИЛЬМОВ === */}
        <div key={currentGenreId} className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[500px] [&>div]:!grid-cols-2 [&>div]:sm:!grid-cols-3 [&>div]:md:!grid-cols-4 [&>div]:lg:!grid-cols-5 [&>div]:xl:!grid-cols-5 [&>div]:!gap-6 md:[&>div]:!gap-8">
            {movies.length > 0 ? (
                <MediaList initialItems={movies} type="movie" genreId={currentGenreId} />
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500 border border-dashed border-white/10 rounded-3xl bg-white/5 mt-10">
                    <span className="text-6xl mb-4 grayscale opacity-50">🦕</span>
                    <h3 className="text-2xl font-bold text-white mb-2">Здесь пусто</h3>
                    <p>К сожалению, мы не нашли фильмов в этом жанре.</p>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}