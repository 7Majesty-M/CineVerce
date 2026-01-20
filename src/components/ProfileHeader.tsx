'use client';

import { useState, useTransition, useEffect } from 'react';
import { toggleFollow, getProfileStats } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  user: any;
  stats: {
    followers: number;
    following: number;
    reviews: number;
  };
  level: any;
  isOwnProfile: boolean;
  isFollowing: boolean;
  targetUserId: string;
}

export default function ProfileHeader({ 
  user, 
  stats, 
  level, 
  isOwnProfile, 
  isFollowing: initialIsFollowing, 
  targetUserId 
}: ProfileHeaderProps) {
  
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(stats.followers);
  const [followingCount, setFollowingCount] = useState(stats.following);
  
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // --- ПОЛЛИНГ (ОПРОС СЕРВЕРА) ---
  useEffect(() => {
    const refreshStats = async () => {
      // Если вкладка не активна (юзер ушел на другую), не долбим сервер
      if (document.hidden) return;

      const newStats = await getProfileStats(targetUserId);
      if (newStats) {
        // Обновляем только если цифры изменились, чтобы React не делал лишних рендеров
        setFollowersCount(prev => (prev !== newStats.followers ? newStats.followers : prev));
        setFollowingCount(prev => (prev !== newStats.following ? newStats.following : prev));
      }
    };

    // Опрашиваем каждые 2 секунды (это быстро и почти не нагружает базу)
    const interval = setInterval(refreshStats, 2000);

    return () => clearInterval(interval);
  }, [targetUserId]);


  const handleFollow = async () => {
    // 1. Оптимистичное обновление (Мгновенно для меня)
    const newState = !isFollowing;
    setIsFollowing(newState);
    setFollowersCount(prev => newState ? prev + 1 : prev - 1);

    // 2. Отправляем на сервер
    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if (res.success) {
        router.refresh();
      } else {
        setIsFollowing(!newState);
        setFollowersCount(prev => newState ? prev - 1 : prev + 1);
        alert("Ошибка при подписке");
      }
    });
  };

  return (
    <div className="relative h-96 w-full overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#050505]/90 to-[#050505] z-0"></div>
         <div className="absolute top-0 inset-x-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay z-0"></div>
         <div className="absolute top-[-50%] left-[20%] w-[60%] h-[150%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>

         <div className="container mx-auto px-6 relative z-10 h-full flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
                
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#050505] shadow-2xl overflow-hidden relative group">
                    <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                
                <div className="flex-1 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest ${level.color}`}>
                            {level.name}
                        </span>
                        {isOwnProfile && <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-slate-300">Это Вы</span>}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2">
                        {user.firstName} {user.lastName}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 mb-4">
                        <div className="flex items-center gap-2">
                            {/* Анимация цифры */}
                            <span className="text-white text-lg transition-all duration-300">
                                {followersCount}
                            </span> 
                            Подписчиков
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-lg transition-all duration-300">
                                {followingCount}
                            </span> 
                            Подписок
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-lg">{stats.reviews}</span> Оценок
                        </div>
                    </div>

                    <div className="w-full max-w-md">
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${level.bg} shadow-[0_0_15px_currentColor] transition-all duration-1000`} style={{ width: `${level.progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {!isOwnProfile && targetUserId && (
                        <button
                            onClick={handleFollow}
                            disabled={isPending}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg active:scale-95
                                ${isFollowing 
                                ? 'bg-[#1a1a1a] text-slate-300 border border-white/10 hover:border-red-500/50 hover:text-red-400' 
                                : 'bg-white text-black hover:scale-105 hover:shadow-white/20'
                                }
                            `}
                        >
                            {isFollowing ? 'Вы подписаны' : 'Подписаться'}
                        </button>
                    )}
                    
                    {isOwnProfile && (
                        <div className="text-center mb-4">
  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
    Добро пожаловать в Вашу вселенную! ✨
  </span>
</div>

                    )}
                </div>
            </div>
         </div>
      </div>
  );
}
