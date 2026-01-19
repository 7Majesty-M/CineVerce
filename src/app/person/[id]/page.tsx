import { getPersonById, getPersonCredits } from '@/lib/tmdb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PersonCreditsGrid from '@/components/PersonCreditsGrid';

export const dynamic = 'force-dynamic';

// 1. Описываем расширенный интерфейс, чтобы TS не ругался на deathday
interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string | null;
  deathday?: string | null; // Добавили поле
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department: string;
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Форматирование даты (1990-05-25 -> 25 мая 1990)
function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function calculateAge(birthday: string, deathday?: string | null) {
  const birthDate = new Date(birthday);
  const endDate = deathday ? new Date(deathday) : new Date();
  
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getAgeString(age: number) {
  let txt;
  let count = age % 100;
  if (count >= 5 && count <= 20) {
    txt = 'лет';
  } else {
    count = count % 10;
    if (count === 1) {
      txt = 'год';
    } else if (count >= 2 && count <= 4) {
      txt = 'года';
    } else {
      txt = 'лет';
    }
  }
  return `${age} ${txt}`;
}

export default async function PersonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const personId = params.id;

  const [rawPerson, credits] = await Promise.all([
    getPersonById(personId),
    getPersonCredits(personId)
  ]);

  if (!rawPerson) notFound();

  // Приводим тип, чтобы TS увидел deathday
  const person = rawPerson as unknown as PersonDetails;

  // --- ВЫЧИСЛЕНИЯ ---
  const birthdayFormatted = person.birthday ? formatDate(person.birthday) : null;
  const deathdayFormatted = person.deathday ? formatDate(person.deathday) : null;
  
  let ageBadge = null;

  if (person.birthday) {
      const age = calculateAge(person.birthday, person.deathday);
      const ageText = getAgeString(age);

      if (person.deathday) {
          // Если умер
          ageBadge = (
            <span className="inline-block px-2.5 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-wider">
                Умер в {age}
            </span>
          );
      } else {
          // Если жив
          ageBadge = (
            <span className="inline-block px-2.5 py-0.5 rounded-md border border-white/20 bg-white/10 text-slate-300 text-xs font-bold">
                {ageText}
            </span>
          );
      }
  }

  // --- ФИЛЬТРАЦИЯ ---
  const seenIds = new Set();
  const knownFor = credits.filter(item => {
    const uniqueKey = `${item.media_type}-${item.id}`;
    if (!item.poster_path || seenIds.has(uniqueKey)) return false;
    seenIds.add(uniqueKey);
    return true;
  }); 

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      <Navbar />
      <div className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            На главную
        </Link>

        <div className="flex flex-col md:flex-row gap-12">
            
            {/* --- ЛЕВАЯ КОЛОНКА --- */}
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
                    {/* Профессия */}
                    <div>
                        <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1 text-xs">Профессия</h3>
                        <p className="text-white text-lg font-medium">{person.known_for_department}</p>
                    </div>
                    
                    {/* Дата рождения + Возраст */}
                    {birthdayFormatted && (
                        <div>
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-2 text-xs">Дата рождения</h3>
                            <div className="flex flex-col gap-2 items-start">
                                <span className="text-white text-lg leading-none">{birthdayFormatted}</span>
                                {ageBadge && <div>{ageBadge}</div>}
                            </div>
                        </div>
                    )}

                    {/* Дата смерти (если есть) */}
                    {deathdayFormatted && (
                        <div>
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1 text-xs">Дата смерти</h3>
                            <p className="text-white text-lg">{deathdayFormatted}</p>
                        </div>
                    )}
                    
                    {/* Место рождения */}
                    {person.place_of_birth && (
                        <div>
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-1 text-xs">Место рождения</h3>
                            <p className="text-white text-lg leading-tight">{person.place_of_birth}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ПРАВАЯ КОЛОНКА --- */}
            <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6">{person.name}</h1>
                
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

                <div>
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                        Известные работы ({knownFor.length})
                    </h3>
                    
                    <PersonCreditsGrid items={knownFor} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
