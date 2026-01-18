'use client';

import { useState } from 'react';
import { submitRating } from '../actions/rating';
import { useUser } from '@clerk/nextjs';

interface RatingButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number | null;
  initialRating?: number | null;
  label?: string;
  // Новый проп для размера кнопки, чтобы на странице сезона она была поменьше
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
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | null>(initialRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isSignedIn } = useUser();

  const handleRate = async (rating: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCurrentRating(rating);
    setIsOpen(false);

    try {
      await submitRating({ mediaId, mediaType, seasonNumber, rating });
    } catch (error) {
      console.error(error);
      setCurrentRating(initialRating);
      alert('Ошибка при сохранении. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Стили для разных размеров и состояний
  const baseClasses = "flex items-center justify-center gap-3 font-bold rounded-xl transition-all duration-300 shadow-lg";
  
  const sizeClasses = size === 'large' 
    ? "py-4 px-8 text-lg w-full md:w-auto" 
    : "py-2.5 px-5 text-sm";

  const activeClasses = currentRating
    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02]"
    : "bg-gray-800/80 text-white hover:bg-gray-700 border border-gray-700/50 hover:border-amber-500/50 backdrop-blur-md";

  if (!isSignedIn) {
      return (
        <button className={`${baseClasses} ${sizeClasses} bg-gray-800/50 text-gray-500 cursor-not-allowed opacity-70 border border-gray-800`}>
            <span className="text-xl">⭐</span> {label}
        </button>
      )
  }

  return (
    <div className="relative inline-block text-left z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSubmitting}
        className={`${baseClasses} ${sizeClasses} ${activeClasses} ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
      >
        <span className={size === 'large' ? "text-2xl" : "text-xl"}>⭐</span>
        <span>
          {currentRating ? `Ваша оценка: ${currentRating}` : label}
        </span>
        {/* Стрелочка */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-70 ml-1`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[240px] rounded-xl shadow-2xl bg-[#121212] ring-1 ring-white/10 border border-gray-800/50 overflow-hidden z-40">
          <div className="p-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              // Цвет для разных оценок
              let colorClass = "text-white hover:bg-gray-800";
              if (num >= 8) colorClass = "text-green-400 hover:bg-green-400/10 hover:text-green-300";
              else if (num >= 5) colorClass = "text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300";
              else colorClass = "text-red-400 hover:bg-red-400/10 hover:text-red-300";

              if (currentRating === num) {
                  colorClass = "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold shadow-lg";
              }

              return (
              <button
                key={num}
                onClick={() => handleRate(num)}
                className={`
                  flex items-center justify-center py-3 text-base font-bold rounded-lg
                  ${colorClass}
                  transition-all duration-200 active:scale-95
                `}
              >
                {num}
              </button>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}
