'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { logWatched } from '@/app/actions'; // Убедись, что путь правильный

interface LogWatchedButtonProps {
  mediaId: number;
  mediaType: string;
  title: string;
}

// Тип данных, которые приходят от сервера
interface XpResult {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
}

export default function LogWatchedButton({ 
  mediaId, 
  mediaType, 
  title 
}: LogWatchedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные об опыте для Тоста
  const [xpData, setXpData] = useState<XpResult | null>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокировка скролла
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logWatched(mediaId, mediaType, date);
      
      if (result.success) {
        // Сохраняем данные об XP, чтобы показать в Тосте
        setXpData({
            xpEarned: result.xpEarned || 0,
            leveledUp: result.leveledUp || false,
            newLevel: result.newLevel || 1
        });

        setIsOpen(false);
        setShowToast(true);
        setDate(today); 
        setTimeout(() => setShowToast(false), 5000); // Чуть дольше, чтобы разглядеть Level Up
      } else {
        setError(result.message || 'Произошла ошибка при сохранении');
      }
    } catch (err) {
      setError('Не удалось сохранить. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  }, [mediaId, mediaType, date, today]);

  const setQuickDate = useCallback((daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  // --- МОДАЛЬНОЕ ОКНО ---
  const Modal = () => (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={handleClose}
      />
      
      <div className="relative bg-[#0E0E0E] rounded-3xl shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 border border-white/10 overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500/30">
                    👁️
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white leading-none">Дневник</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Добавить запись и получить XP</p>
                </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-6 border border-white/5">
                <p className="text-sm text-slate-200 font-medium line-clamp-2 leading-relaxed">
                    {title}
                </p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        <span>Дата просмотра</span>
                        <span className="text-indigo-400">{new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                    </label>
                    
                    {/* Быстрые кнопки */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                            { label: 'Сегодня', days: 0 },
                            { label: 'Вчера', days: 1 },
                            { label: 'Неделю назад', days: 7 }
                        ].map((btn) => {
                            const btnDate = new Date();
                            btnDate.setDate(btnDate.getDate() - btn.days);
                            const isSelected = date === btnDate.toISOString().split('T')[0];
                            
                            return (
                                <button 
                                    key={btn.days}
                                    onClick={() => setQuickDate(btn.days)}
                                    className={`
                                        py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border
                                        ${isSelected 
                                            ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] transform scale-[1.02]' 
                                            : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:border-white/10'
                                        }
                                    `}
                                    type="button"
                                >
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Кастомный Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <input 
                            type="date" 
                            value={date}
                            max={today}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 bg-[#151515] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm [color-scheme:dark]"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Сохранение...</span>
                        </>
                    ) : (
                        <>
                            <span>Подтвердить</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  // --- ТОСТ УСПЕХА (GAMIFIED) ---
  const SuccessToast = () => {
    // Если повысили уровень, стиль меняется на золотой/эпичный
    const isLevelUp = xpData?.leveledUp;

    return (
      <div 
        className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-10 fade-in duration-500"
        role="alert"
      >
        <div className={`relative backdrop-blur-xl border p-1 rounded-2xl shadow-2xl flex items-center pr-6 ring-1 overflow-hidden
            ${isLevelUp 
                ? 'bg-yellow-900/90 border-yellow-500/50 ring-yellow-500/30 shadow-yellow-500/20' 
                : 'bg-[#151515]/90 border-white/10 ring-white/5'
            }
        `}>
          
          {/* Иконка слева */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 border shadow-lg
             ${isLevelUp
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-yellow-500/40 text-2xl'
                : 'bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
             }
          `}>
             {isLevelUp ? '🏆' : (
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                 </svg>
             )}
          </div>

          <div className="flex flex-col py-2">
             <span className={`text-sm font-bold ${isLevelUp ? 'text-yellow-200' : 'text-white'}`}>
                 {isLevelUp ? 'LEVEL UP!' : 'Успешно!'}
             </span>
             
             {/* Анимация цифр XP */}
             <div className="flex items-center gap-2 mt-0.5">
                 <span className="text-xs text-slate-400 font-medium">
                    {mediaType === 'movie' ? 'Фильм добавлен' : 'Сериал добавлен'}
                 </span>
                 <span className={`text-xs font-black px-1.5 py-0.5 rounded
                    ${isLevelUp ? 'bg-yellow-500 text-black' : 'bg-white/10 text-slate-300'}
                 `}>
                    {isLevelUp ? `LVL ${xpData?.newLevel}` : `+${xpData?.xpEarned} XP`}
                 </span>
             </div>
          </div>

          {/* Прогресс бар (таймер) */}
          <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
             <div className={`h-full w-full animate-[shrink_5s_linear_forwards]
                ${isLevelUp ? 'bg-yellow-500' : 'bg-green-500'}
             `} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group relative px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30"
        title="Отметить как просмотренное"
        type="button"
      >
        <div className="flex items-center gap-2 relative z-10">
            <svg 
                className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300 transform group-hover:scale-110" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline text-slate-300 group-hover:text-white transition-colors">Просмотрено</span>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </button>

      {mounted && createPortal(
        <>
          {isOpen && <Modal />}
          {showToast && <SuccessToast />}
        </>, 
        document.body
      )}
    </>
  );
}
