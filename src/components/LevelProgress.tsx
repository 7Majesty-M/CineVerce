'use client';

// 👇 Импортируем общую математику
import { getLevelThreshold, calculateProgress } from "@/lib/level-math"; 

interface Props {
  currentXp: number;
  level: number;
}

export default function LevelProgress({ currentXp, level }: Props) {
  
  // Используем общую формулу
  const nextLevelXp = getLevelThreshold(level);
  const progressPercent = calculateProgress(currentXp, level);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Текущий прогресс</span>
            <span className="text-sm font-bold text-white">
                <span className="text-indigo-400">{currentXp}</span> 
                <span className="text-slate-600"> / </span> 
                {nextLevelXp} XP
            </span>
        </div>
        
        <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">До уровня {level + 1}</span>
            <div className="text-xs font-bold text-slate-400">
                Осталось {nextLevelXp - currentXp} XP
            </div>
        </div>
      </div>

      {/* Сама полоска */}
      <div className="relative h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
        
        {/* Задний фон (мерцание) */}
        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>

        {/* Заполнение */}
        <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            style={{ width: `${progressPercent}%` }}
        >
            {/* Блик на полоске */}
            <div className="absolute top-0 right-0 bottom-0 w-px bg-white/50 shadow-[0_0_10px_white]"></div>
            
            {/* Текстура полосок */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
        </div>
      </div>
    </div>
  );
}
