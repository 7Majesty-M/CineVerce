// src/app/tv/[id]/season/[seasonNumber]/rate/page.tsx
import { getTVShowById } from '@/lib/tmdb';
import { getUserReview } from '@/lib/db-queries'; // <--- Импорт функции загрузки отзыва
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DetailedRatingForm from '@/components/DetailedRatingForm';

// Отключаем кэширование, чтобы всегда получать свежие данные при заходе на страницу
export const dynamic = 'force-dynamic';

export default async function SeasonRatePage(props: { params: Promise<{ id: string; seasonNumber: string }> }) {
  const params = await props.params;
  const show = await getTVShowById(params.id);
  const seasonNumber = Number(params.seasonNumber);

  if (!show) notFound();

  // Находим нужный сезон
  const season = show.seasons.find((s) => s.season_number === seasonNumber);
  if (!season) notFound();

  // --- ЗАГРУЖАЕМ СУЩЕСТВУЮЩИЙ ОТЗЫВ ---
  // Явно указываем 'tv', так как это страница сериала
  const existingReview = await getUserReview(show.id, 'tv', seasonNumber);

  // Формируем URL фона
  const backdropUrl = season.poster_path 
    ? `https://image.tmdb.org/t/p/original${season.poster_path}` 
    : show.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` 
      : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center relative py-12 px-4 lg:py-20">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {backdropUrl && (
            <>
                <img src={backdropUrl} className="w-full h-full object-cover opacity-20 blur-[80px] scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/40" />
            </>
        )}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* --- ЛЕВАЯ КОЛОНКА (Инфо) --- */}
        <div className="lg:col-span-5 lg:sticky lg:top-10 space-y-8">
            
            {/* Кнопка назад */}
            <Link href={`/tv/${show.id}`} className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-slate-300 hover:text-white mb-2">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Назад к сериалу
            </Link>
            
            {/* Мобильный заголовок */}
            <div className="lg:hidden flex items-center gap-6 mb-6">
                 <div className="w-24 rounded-lg overflow-hidden shadow-lg border border-white/10">
                    {season.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w342${season.poster_path}`} alt={season.name} className="w-full object-cover" />
                    ) : <div className="h-32 bg-slate-800" />}
                 </div>
                 <div>
                    <h1 className="text-2xl font-black leading-tight">{season.name}</h1>
                    <p className="text-pink-500 font-bold text-sm uppercase tracking-wider">{show.name}</p>
                 </div>
            </div>

            {/* Десктопный постер */}
            <div className="hidden lg:block relative group perspective-1000 w-[90%] mx-auto lg:mx-0">
                <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 bg-[#121212] transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 z-20">
                    {season.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w780${season.poster_path}`} alt={season.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">Нет постера</div>
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                     
                     <div className="absolute bottom-8 left-8">
                        <h1 className="text-4xl font-black leading-tight mb-2 drop-shadow-lg">{season.name}</h1>
                        <div className="inline-block px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-lg backdrop-blur-md">
                            <p className="text-pink-400 font-bold tracking-widest text-xs uppercase">{show.name}</p>
                        </div>
                     </div>

                     {/* Shine Effect */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                
                {/* Glow under poster */}
                <div className="absolute inset-0 bg-pink-500/20 blur-[80px] -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
            
            <div className="hidden lg:block bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🗳️</span>
                    Как оценивать?
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Мы используем систему 8 критериев для максимальной объективности. 
                    Оцените каждый аспект от 1 до 10. Итоговый рейтинг будет рассчитан автоматически.
                </p>
            </div>
        </div>

        {/* --- ПРАВАЯ КОЛОНКА (Форма) --- */}
        <div className="lg:col-span-7">
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                
                {/* Декоративные пятна */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-1 text-white">
                                {existingReview ? 'Изменить рецензию' : 'Ваша рецензия'}
                            </h2>
                            <p className="text-slate-500 text-sm">Выставьте оценки по шкале от 1 до 10</p>
                        </div>
                        <div className="hidden sm:block w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    </div>
                    
                    {/* 
                       ПЕРЕДАЕМ ДАННЫЕ В ФОРМУ 
                       key нужен, чтобы React пересоздал компонент, если данные загрузились
                    */}
                    <DetailedRatingForm 
                        key={existingReview ? JSON.stringify(existingReview) : 'empty'}
                        mediaId={show.id} 
                        seasonNumber={seasonNumber} 
                        initialData={existingReview as any}
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
