import Image from 'next/link'; // Ошибка импорта, поправим ниже на <img> или next/image
import { CastMember } from '@/lib/tmdb';

export default function CastList({ cast }: { cast: CastMember[] }) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mb-16">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
        В главных ролях
      </h3>
      
      {/* Горизонтальный скролл без скроллбара */}
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
        {cast.map((actor) => (
          <div key={actor.id} className="w-[140px] flex-shrink-0 snap-start group">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-3">
              {actor.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                  alt={actor.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-white/5 text-white/20">👤</div>
              )}
              {/* Градиент снизу */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <h4 className="text-sm font-bold text-white leading-tight group-hover:text-purple-400 transition-colors">
              {actor.name}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {actor.character}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
