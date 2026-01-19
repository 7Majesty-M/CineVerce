'use client';

import Link from 'next/link';

export default function CastList({ cast }: { cast: any[] }) {
  // Берем топ-20 актеров (вместо 10 или 15)
  const topCast = cast.slice(0, 20);

  if (topCast.length === 0) return null;

  return (
    <div className="mb-16">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
        В главных ролях
      </h3>

      <div className="flex overflow-x-auto gap-5 pb-8 pt-2 scrollbar-hide snap-x px-1">
        {topCast.map((person) => (
          <Link 
            key={person.id} 
            href={`/person/${person.id}`}
            // УВЕЛИЧИЛИ РАЗМЕР КАРТОЧКИ (было меньше)
            className="w-[160px] md:w-[200px] flex-shrink-0 snap-start group"
          >
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#121212] border border-white/10 shadow-lg mb-3 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:border-purple-500/50">
              {person.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} // w500 для качества
                  alt={person.name} 
                  className="w-full h-full object-cover transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
              )}
            </div>
            
            <h4 className="font-bold text-base text-slate-200 group-hover:text-white truncate transition-colors">
              {person.name}
            </h4>
            <p className="text-sm text-slate-500 truncate">
              {person.character}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
