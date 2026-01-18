'use client';

import { useState, useTransition } from 'react';
import { toggleFollow } from '@/app/actions';
import { useRouter } from 'next/navigation'; // Импортируем роутер

export default function FollowButton({ 
  targetUserId, 
  initialIsFollowing 
}: { 
  targetUserId: string; 
  initialIsFollowing: boolean; 
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition(); // Используем useTransition для плавности
  const router = useRouter();

  const handleToggle = async () => {
    // 1. Оптимистичное обновление (Мгновенно меняем визуально)
    const newState = !isFollowing;
    setIsFollowing(newState);

    // 2. Запускаем серверный экшен
    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      
      if (res.success) {
        // 3. САМОЕ ВАЖНОЕ: Обновляем данные страницы (цифры подписчиков)
        router.refresh(); 
      } else {
        // Если ошибка — откатываем состояние назад
        setIsFollowing(!newState);
        alert("Не удалось подписаться");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg active:scale-95
        ${isFollowing 
          ? 'bg-[#1a1a1a] text-slate-300 border border-white/10 hover:border-red-500/50 hover:text-red-400' 
          : 'bg-white text-black hover:scale-105 hover:shadow-white/20'
        }
      `}
    >
      {isFollowing ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Вы подписаны
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Подписаться
        </>
      )}
    </button>
  );
}
