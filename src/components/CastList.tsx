import Link from 'next/link';
import { CastMember } from '@/lib/tmdb';

export default function CastList({ cast }: { cast: CastMember[] }) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mb-16 relative z-30">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
        В главных ролях
      </h3>
      
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
        {cast.map((actor) => (
          <Link 
            key={actor.id} 
            href={`/person/${actor.id}`}
            className="w-[140px] flex-shrink-0 snap-start group block relative cursor-pointer"
          >
            {/* Карточка (Убрали scale-105) */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-3 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {actor.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                  alt={actor.name}
                  // Убрали group-hover:scale-110
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-white/5 text-white/20">👤</div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            
            <h4 className="text-sm font-bold text-white leading-tight group-hover:text-purple-400 transition-colors">
              {actor.name}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-300">
              {actor.character}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
