'use client';

import { useState, useTransition } from 'react';
import { toggleWatchlist } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function WatchlistButton({ 
  mediaId, 
  mediaType, 
  isInWatchlist 
}: { 
  mediaId: number; 
  mediaType: 'movie' | 'tv';
  isInWatchlist: boolean;
}) {
  const [added, setAdded] = useState(isInWatchlist);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async () => {
    setAdded(!added); // Оптимистик UI

    startTransition(async () => {
      const res = await toggleWatchlist(mediaId, mediaType);
      if (res.success) {
        router.refresh();
      } else {
        setAdded(!added); // Откат при ошибке
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-6 py-3 rounded-xl border font-bold text-sm transition-all duration-300 flex items-center gap-2 group
        ${added 
          ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
        }
      `}
    >
      <svg 
        className={`w-5 h-5 transition-transform group-active:scale-90 ${added ? 'fill-current' : 'fill-none stroke-current'}`} 
        viewBox="0 0 24 24" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {added ? 'В списке' : 'Буду смотреть'}
    </button>
  );
}
