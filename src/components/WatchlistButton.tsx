'use client';

import { useState, useTransition } from 'react';
import { toggleWatchlist } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function WatchlistButton({ 
  mediaId, 
  mediaType, 
  isInWatchlist,
  compact = false // <--- 1. Добавили проп со значением по умолчанию
}: { 
  mediaId: number; 
  mediaType: 'movie' | 'tv';
  isInWatchlist: boolean;
  compact?: boolean;
}) {
  const [added, setAdded] = useState(isInWatchlist);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async () => {
    setAdded(!added); 
    startTransition(async () => {
      const res = await toggleWatchlist(mediaId, mediaType);
      if (res.success) {
        router.refresh();
      } else {
        setAdded(!added); 
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      // 2. Условные классы: если compact, то кнопка круглая и маленькая (p-3), иначе большая (px-6 py-3)
      className={`
        font-bold text-sm transition-all duration-300 flex items-center justify-center group border
        ${compact ? 'p-3 rounded-full' : 'px-6 py-3 rounded-xl gap-2'}
        ${added 
          ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
        }
      `}
      // Добавляем title, чтобы при наведении на иконку было понятно, что это
      title={added ? 'Убрать из списка' : 'Буду смотреть'}
    >
      <svg 
        className={`transition-transform group-active:scale-90 ${compact ? 'w-5 h-5' : 'w-5 h-5'} ${added ? 'fill-current' : 'fill-none stroke-current'}`} 
        viewBox="0 0 24 24" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>

      {/* 3. Показываем текст ТОЛЬКО если НЕ compact */}
      {!compact && (
        <span>{added ? 'В списке' : 'Буду смотреть'}</span>
      )}
    </button>
  );
}
