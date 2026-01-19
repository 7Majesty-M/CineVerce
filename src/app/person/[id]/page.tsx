import { getPersonById, getPersonCredits } from '@/lib/tmdb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function PersonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const personId = params.id;

  const [person, credits] = await Promise.all([
    getPersonById(personId),
    getPersonCredits(personId)
  ]);

  if (!person) notFound();

  // --- ФИЛЬТРАЦИЯ ДУБЛИКАТОВ ---
  // Создаем Set, чтобы запоминать уже добавленные ID
  const seenIds = new Set();
  
  const knownFor = credits.filter(item => {
    // Уникальный ключ для проверки
    const uniqueKey = `${item.media_type}-${item.id}`;
    
    // Если нет постера ИЛИ мы уже видели этот фильм -> пропускаем
    if (!item.poster_path || seenIds.has(uniqueKey)) {
        return false;
    }
    
    // Запоминаем и оставляем в списке
    seenIds.add(uniqueKey);
    return true;
  }).slice(0, 24); // Берем топ-24 уникальных

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      <Navbar />

      <div className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            На главную
        </Link>

        <div className="flex flex-col md:flex-row gap-12">
            
            {/* --- ЛЕВАЯ КОЛОНКА (Фото + Инфо) --- */}
            <div className="w-full md:w-[300px] flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8 group">
                    {person.profile_path ? (
                        <img 
                            src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} 
                            alt={person.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#121212] flex items-center justify-center text-6xl">👤</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                <div className="space-y-6 text-sm">
                    <div>
                        <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1">Профессия</h3>
                        <p className="text-white text-lg">{person.known_for_department}</p>
                    </div>
                    {person.birthday && (
                        <div>
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1">Дата рождения</h3>
                            <p className="text-white text-lg">{person.birthday}</p>
                        </div>
                    )}
                    {person.place_of_birth && (
                        <div>
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1">Место рождения</h3>
                            <p className="text-white text-lg">{person.place_of_birth}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ПРАВАЯ КОЛОНКА (Биография + Фильмы) --- */}
            <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6">{person.name}</h1>
                
                {/* Биография */}
                {person.biography && (
                    <div className="mb-16">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                            Биография
                        </h3>
                        <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-line font-light max-w-4xl">
                            {person.biography}
                        </p>
                    </div>
                )}

                {/* Известные работы */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                        Известные работы
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {knownFor.map((item) => (
                            <Link 
                                key={`${item.media_type}-${item.id}`} 
                                href={`/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
                                className="group block"
                            >
                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#121212] border border-white/10 mb-3 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-yellow-400 border border-white/10">
                                        ★ {item.vote_average.toFixed(1)}
                                    </div>
                                </div>
                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                                    {item.title || item.name}
                                </h4>
                                <p className="text-xs text-slate-500 truncate">
                                    {item.character ? `как ${item.character}` : (item.release_date || item.first_air_date)?.split('-')[0]}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
