// src/app/movie/[id]/rate/page.tsx
import { getMovieById } from '@/lib/tmdb'; // Не забудь проверить путь импорта
import { getUserReview } from '@/lib/db-queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DetailedRatingForm from '@/components/DetailedRatingForm';

export const dynamic = 'force-dynamic';

export default async function MovieRatePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const movie = await getMovieById(params.id);

  if (!movie) notFound();

  // Для фильмов передаем seasonNumber = 0 и mediaType = 'movie'
  const existingReview = await getUserReview(movie.id, 'movie', 0);

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` 
    : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center relative py-12 px-4 lg:py-20">
      
      {/* Background FX (Cyan Tint for Movies) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {backdropUrl && (
            <>
                <img src={backdropUrl} className="w-full h-full object-cover opacity-20 blur-[80px] scale-110" alt="" />
                {/* Градиент с оттенком Cyan */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-cyan-950/20" />
            </>
        )}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 lg:sticky lg:top-10 space-y-8">
            <Link href={`/movie/${movie.id}`} className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-slate-300 hover:text-white mb-2">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Назад к фильму
            </Link>
            
            {/* Постер */}
            <div className="hidden lg:block relative group perspective-1000 w-[90%] mx-auto lg:mx-0">
                <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(8,145,178,0.3)] border border-white/10 bg-[#121212] z-20">
                    {movie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">Нет постера</div>
                    )}
                     <div className="absolute bottom-8 left-8 right-8">
                        <h1 className="text-4xl font-black leading-tight mb-2 drop-shadow-lg line-clamp-2">{movie.title}</h1>
                        <div className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg backdrop-blur-md">
                            <p className="text-cyan-400 font-bold tracking-widest text-xs uppercase">MOVIE</p>
                        </div>
                     </div>
                </div>
                {/* Glow */}
                <div className="absolute inset-0 bg-cyan-500/20 blur-[80px] -z-10 rounded-full opacity-60"></div>
            </div>
            
            <div className="hidden lg:block bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">🗳️ Оценка фильма</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Оцените фильм по 8 критериям. Это поможет сформировать ваш личный профиль вкусов.
                </p>
            </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (Форма) */}
        <div className="lg:col-span-7">
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-1 text-white">
                                {existingReview ? 'Изменить оценку' : 'Ваша рецензия'}
                            </h2>
                            <p className="text-slate-500 text-sm">Ваши впечатления от просмотра</p>
                        </div>
                    </div>
                    
                    <DetailedRatingForm 
                        key={existingReview ? JSON.stringify(existingReview) : 'new'}
                        mediaId={movie.id} 
                        mediaType="movie" // <--- ВАЖНО: Указываем тип MOVIE
                        seasonNumber={0}  // Для фильмов сезон = 0
                        initialData={existingReview as any} 
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
