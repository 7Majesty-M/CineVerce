import { getContentByYear } from '@/lib/tmdb';
import TimeMachineControls from '@/components/TimeMachineControls';
import Navbar from '@/components/Navbar';
import TimeMachineVisuals from '@/components/TimeMachineVisuals'; // <-- Импорт
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TimeMachinePage(props: { searchParams: Promise<{ year?: string }> }) {
  const searchParams = await props.searchParams;
  const year = Number(searchParams.year) || 2000;

  const [movies, shows] = await Promise.all([
    getContentByYear(year, 'movie'),
    getContentByYear(year, 'tv')
  ]);

  return (
    // Оборачиваем всё в Визуализатор
    <TimeMachineVisuals>
      
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <main className="pt-32 container mx-auto px-6 pb-20">
        
        {/* Заголовок теперь будет реагировать на стили (font-serif в нуаре и т.д.) */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase">
            Time <span className="opacity-80">Machine</span>
          </h1>
          <p className="opacity-60 text-lg max-w-xl mx-auto">
            Путешествие в {year} год
          </p>
        </div>

        <TimeMachineControls />

        <div className="space-y-20 mt-20 animate-in fade-in duration-700 slide-in-from-bottom-10">
            {/* ... Код вывода фильмов и сериалов остается тем же ... */}
            {/* Вставь сюда тот же блок с movies.map и shows.map из предыдущего шага */}
            
            {/* ФИЛЬМЫ (Пример кратко) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold border-b border-white/20 pb-2">Фильмы</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {movies.map((movie: any) => (
                        <Link href={`/movie/${movie.id}`} key={movie.id} className="group block">
                           <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5 transition-transform group-hover:scale-105">
                              {movie.poster_path ? (
                                  <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-full object-cover" />
                              ) : <div className="p-4 text-xs">No Image</div>}
                           </div>
                           <div className="mt-3">
                              <h3 className="font-bold text-sm leading-tight group-hover:text-pink-500 transition-colors">{movie.title}</h3>
                           </div>
                        </Link>
                    ))}
                </div>
            </section>
            
            {/* СЕРИАЛЫ (Аналогично) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold border-b border-white/20 pb-2">Сериалы</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {shows.map((show: any) => (
                        <Link href={`/tv/${show.id}`} key={show.id} className="group block">
                           <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5 transition-transform group-hover:scale-105">
                              {show.poster_path ? (
                                  <img src={`https://image.tmdb.org/t/p/w500${show.poster_path}`} className="w-full h-full object-cover" />
                              ) : <div className="p-4 text-xs">No Image</div>}
                           </div>
                           <div className="mt-3">
                              <h3 className="font-bold text-sm leading-tight group-hover:text-pink-500 transition-colors">{show.name}</h3>
                           </div>
                        </Link>
                    ))}
                </div>
            </section>

        </div>
      </main>
    </TimeMachineVisuals>
  );
}
