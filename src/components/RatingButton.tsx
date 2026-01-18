'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Хук для проверки сессии на клиенте

interface RatingButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number | null;
  initialRating?: number | null;
  label?: string;
  size?: 'default' | 'large';
}

export default function RatingButton({
  mediaId,
  mediaType,
  seasonNumber = null,
  initialRating = null,
  label = 'Оценить',
  size = 'default',
}: RatingButtonProps) {
  
  // 1. Проверяем сессию на клиенте (чтобы показать кнопку "Войти", если не залогинен)
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

  // Формируем ссылку на страницу оценки
  const href = mediaType === 'movie' 
    ? `/movie/${mediaId}/rate`
    : `/tv/${mediaId}/season/${seasonNumber || 1}/rate`; // Если сезон не передан, считаем что 1 (или обработать иначе)

  // Стили
  const baseClasses = "flex items-center justify-center gap-3 font-bold rounded-xl transition-all duration-300 shadow-lg";
  const sizeClasses = size === 'large' ? "py-4 px-8 text-lg w-full md:w-auto" : "py-2.5 px-5 text-sm";
  
  const activeClasses = initialRating
    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-black shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]"
    : "bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md";

  if (!isSignedIn) {
      // Если не залогинен, можно показать кнопку, которая редиректит на вход, или просто disabled
      return (
        <button disabled className={`${baseClasses} ${sizeClasses} bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-800`}>
            <span className="text-xl">🔒</span> Войдите, чтобы оценить
        </button>
      )
  }

  return (
    <Link href={href} className={`${baseClasses} ${sizeClasses} ${activeClasses}`}>
        <span className={size === 'large' ? "text-2xl" : "text-xl"}>
            {initialRating ? '✅' : '⭐'}
        </span>
        <span>
            {initialRating ? `Ваша оценка: ${initialRating}` : label}
        </span>
    </Link>
  );
}
