import Link from 'next/link';
import { Recommendation } from '@/lib/tmdb';

export default function SimilarList({ items, type }: { items: Recommendation[], type: 'movie' | 'tv' }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-16 fade-in-card" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
        Вам может понравиться
      </h3>

      <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x">
        {items.map((item) => (
          <Link 
            key={item.id} 
            href={`/${type}/${item.id}`}
            className="w-[160px] md:w-[180px] flex-shrink-0 snap-start group relative"
          >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#121212] border border-white/10 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50 group-hover:shadow-blue-500/20">
              {item.poster_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                  alt={item.title || item.name || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
              )}
              
              {/* Рейтинг оверлей */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-yellow-400 border border-white/10">
                ★ {item.vote_average.toFixed(1)}
              </div>
            </div>
            
            <h4 className="mt-3 text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">
              {item.title || item.name}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
