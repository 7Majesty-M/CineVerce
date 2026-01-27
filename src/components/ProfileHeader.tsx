'use client';

import { useState, useTransition, useEffect } from 'react';
import { toggleFollow, getProfileStats } from '@/app/actions';
import { useRouter } from 'next/navigation';
import EditProfileModal from './EditProfileModal'; 

interface ProfileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    xp: number;
  };
  stats: {
    followers: number;
    following: number;
    reviews: number;
    watched: number;
  };
  level: {
    current: number;
    name: string;
    currentXp?: number;
    next: number;
    progress: number;
    color: string;
    bg: string;
  };
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
  const [watchedCount, setWatchedCount] = useState(stats.watched);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const refreshStats = async () => {
      if (document.hidden) return;
      const newStats = await getProfileStats(targetUserId);
      if (newStats) {
        setFollowersCount(prev => (prev !== newStats.followers ? newStats.followers : prev));
        setFollowingCount(prev => (prev !== newStats.following ? newStats.following : prev));
      }
    };
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  const handleFollow = async () => {
    const newState = !isFollowing;
    setIsFollowing(newState);
    setFollowersCount(prev => newState ? prev + 1 : prev - 1);
    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if (res.success) router.refresh();
      else {
        setIsFollowing(!newState);
        setFollowersCount(prev => newState ? prev - 1 : prev + 1);
      }
    });
  };

  const displayXp = level.currentXp !== undefined ? level.currentXp : user.xp;

  return (
    <div className="relative w-full overflow-hidden">
      {/* ФОНЫ */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#050505]/90 to-[#050505] z-0"></div>
      <div className="absolute top-0 inset-x-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay z-0"></div>
      <div className="absolute top-[-50%] left-[20%] w-[60%] h-[150%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* 🔥 МОБИЛЬНАЯ ВЕРСИЯ (улучшенная) */}
        <div className="md:hidden pt-20 pb-6">
          {/* Верхняя часть: Аватарка по центру */}
          <div className="flex flex-col items-center text-center mb-5">
            {/* Аватар - БОЛЬШЕ на мобильных */}
            <div className="relative mb-3">
              <div className="w-28 h-28 rounded-3xl border-4 border-[#050505] shadow-2xl overflow-hidden relative group">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-4xl font-bold text-white">
                    {user.firstName[0]}
                  </div>
                )}
                {isOwnProfile && (
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Бейдж уровня */}
            <div className="mb-2">
              <span className={`inline-block px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest ${level.color}`}>
                {level.name}
              </span>
            </div>

            {/* Имя - меньший размер на мобильных */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-white">
                {user.firstName} {user.lastName}
              </h1>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10 border border-white/5 active:border-white/20 text-slate-400 active:text-white transition-all backdrop-blur-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>

            {isOwnProfile && (
              <span className="text-xs text-slate-500 mb-3">Это ваш профиль ✨</span>
            )}

            {/* Кнопка подписки */}
            {!isOwnProfile && targetUserId && (
              <button
                onClick={handleFollow}
                disabled={isPending}
                className={`w-full max-w-xs px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-95 mb-4
                  ${isFollowing 
                    ? 'bg-[#1a1a1a] text-slate-300 border border-white/10 active:border-red-500/50 active:text-red-400' 
                    : 'bg-white text-black active:scale-105 active:shadow-white/20'
                  }
                `}
              >
                {isFollowing ? 'Вы подписаны' : 'Подписаться'}
              </button>
            )}
          </div>

          {/* Статистика в 2 ряда для мобильных */}
          <div className="grid grid-cols-2 gap-3 mb-5 px-2">
            <div className="flex flex-col items-center py-3 px-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="text-2xl font-black text-white">{followersCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Подписчиков</span>
            </div>
            <div className="flex flex-col items-center py-3 px-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="text-2xl font-black text-white">{followingCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Подписок</span>
            </div>
            <div className="flex flex-col items-center py-3 px-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="text-2xl font-black text-white">{stats.reviews}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Оценок</span>
            </div>
            <div className="flex flex-col items-center py-3 px-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="text-2xl font-black text-white">{watchedCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Просмотрено</span>
            </div>
          </div>

          {/* Шкала уровня */}
          <div className="w-full px-2">
            {/* Текст: Уровень и Цифры XP */}
            <div className="flex justify-between items-end mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black uppercase tracking-widest ${level.color} drop-shadow-lg`}>
                  LVL {level.current}
                </span>
                <div className={`h-1 w-1 rounded-full ${level.bg} animate-pulse`}></div>
              </div>
              <span className="text-[11px] font-bold font-mono tracking-wide text-slate-400">
                <span className={`${level.color} font-extrabold`}>{Math.floor(displayXp)}</span>
                <span className="text-slate-600 mx-0.5">/</span>
                <span className="text-slate-500">{level.next}</span>
              </span>
            </div>

            {/* Сама полоска */}
            <div className="relative">
              <div className="h-3 w-full bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-full overflow-hidden border border-white/10 shadow-lg relative backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                
                <div 
                  className={`h-full ${level.bg} relative transition-all duration-1000 ease-out`} 
                  style={{ 
                    width: `${level.progress}%`,
                    boxShadow: `0 0 20px ${level.color.includes('blue') ? '#3b82f6' : level.color.includes('purple') ? '#a855f7' : level.color.includes('amber') ? '#f59e0b' : level.color.includes('emerald') ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full"></div>
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/50 to-transparent"></div>
                </div>
                
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
              </div>
              
              <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 ${level.bg} rounded-full blur-sm opacity-60`}></div>
              <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 ${level.bg} rounded-full blur-sm opacity-60`}></div>
            </div>
            
            {/* Подсказка снизу */}
            <div className="mt-2 flex justify-between items-center px-1">
              <span className="text-[9px] text-slate-600 font-medium italic">
                ⚡ Продолжай в том же духе
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                <span className={`${level.color} font-bold`}>
                  {Math.max(0, level.next - Math.floor(displayXp))}
                </span>
                <span className="text-slate-600"> XP до LVL {level.current + 1}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 🖥️ ДЕСКТОПНАЯ ВЕРСИЯ (оригинальная) */}
        <div className="hidden md:flex h-96 flex-col justify-end pb-8">
          <div className="flex items-end gap-8">
            
            {/* АВАТАР */}
            <div className="w-40 h-40 rounded-[2rem] border-4 border-[#050505] shadow-2xl overflow-hidden relative group shrink-0">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-3xl font-bold text-white">
                  {user.firstName[0]}
                </div>
              )}
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* ИНФОРМАЦИЯ О ЮЗЕРЕ */}
            <div className="flex-1 mb-2 w-full">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest ${level.color}`}>
                  {level.name}
                </span>
                {isOwnProfile && <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-slate-300">Это Вы</span>}
              </div>
              
              <div className="flex items-center gap-4 mb-2 group/name">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                  {user.firstName} {user.lastName}
                </h1>
                {isOwnProfile && (
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-all opacity-0 group-hover/name:opacity-100 backdrop-blur-md"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 mb-4">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <span className="text-white text-lg">{followersCount}</span> Подписчиков
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <span className="text-white text-lg">{followingCount}</span> Подписок
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <span className="text-white text-lg">{stats.reviews}</span> Оценок
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <span className="text-white text-lg">{watchedCount}</span> Просмотрено
                </div>
              </div>

              {/* Шкала уровня для десктопа */}
              <div className="w-full max-w-md mt-4">
                <div className="flex justify-between items-end mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black uppercase tracking-widest ${level.color} drop-shadow-lg`}>
                      LVL {level.current}
                    </span>
                    <div className={`h-1 w-1 rounded-full ${level.bg} animate-pulse`}></div>
                  </div>
                  <span className="text-[11px] font-bold font-mono tracking-wide text-slate-400">
                    <span className={`${level.color} font-extrabold`}>{Math.floor(displayXp)}</span>
                    <span className="text-slate-600 mx-0.5">/</span>
                    <span className="text-slate-500">{level.next}</span>
                  </span>
                </div>

                <div className="relative">
                  <div className="h-3 w-full bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-full overflow-hidden border border-white/10 shadow-lg relative backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                    
                    <div 
                      className={`h-full ${level.bg} relative transition-all duration-1000 ease-out`} 
                      style={{ 
                        width: `${level.progress}%`,
                        boxShadow: `0 0 20px ${level.color.includes('blue') ? '#3b82f6' : level.color.includes('purple') ? '#a855f7' : level.color.includes('amber') ? '#f59e0b' : level.color.includes('emerald') ? '#10b981' : '#ef4444'}`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full"></div>
                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/50 to-transparent"></div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                  </div>
                  
                  <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 ${level.bg} rounded-full blur-sm opacity-60`}></div>
                  <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 ${level.bg} rounded-full blur-sm opacity-60`}></div>
                </div>
                
                <div className="mt-2 flex justify-between items-center px-1">
                  <span className="text-[9px] text-slate-600 font-medium italic">
                    ⚡ Продолжай в том же духе
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    <span className={`${level.color} font-bold`}>
                      {Math.max(0, level.next - Math.floor(displayXp))}
                    </span>
                    <span className="text-slate-600"> XP до LVL {level.current + 1}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* КНОПКИ ДЕЙСТВИЙ */}
            <div className="flex flex-col gap-3 shrink-0">
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
                <div className="text-right mb-4">
                  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm animate-pulse">
                    Добро пожаловать! ✨
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal 
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          currentName={user.firstName + (user.lastName ? ' ' + user.lastName : '')}
          currentImage={user.imageUrl}
        />
      )}
    </div>
  );
}