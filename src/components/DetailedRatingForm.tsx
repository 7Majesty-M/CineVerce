// src/components/DetailedRatingForm.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Импортируем универсальный экшен (убедись, что в actions.ts он называется saveMediaRating)
import { saveMediaRating } from '@/app/actions'; 

interface RatingsState {
  plot: number;
  acting: number;
  visuals: number;
  sound: number;
  characters: number;
  atmosphere: number;
  ending: number;
  originality: number;
}

const defaultRatings: RatingsState = {
  plot: 5,
  acting: 5,
  visuals: 5,
  sound: 5,
  characters: 5,
  atmosphere: 5,
  ending: 5,
  originality: 5
};

export default function DetailedRatingForm({ 
  mediaId, 
  mediaType = 'tv', // Новый проп для поддержки фильмов
  seasonNumber,
  initialData 
}: { 
  mediaId: number; 
  mediaType?: 'movie' | 'tv';
  seasonNumber: number;
  initialData?: RatingsState | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Инициализация состояния
  const [ratings, setRatings] = useState<RatingsState>(initialData || defaultRatings);

  // Синхронизация: если пришли данные из БД, обновляем стейт
  useEffect(() => {
    if (initialData) {
      console.log('🔄 Form updated with DB data:', initialData);
      setRatings(initialData);
    }
  }, [initialData]);

  const calculateAverage = () => {
    const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
    return Number((sum / 8).toFixed(1));
  };
  
  const average = calculateAverage();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Используем универсальный экшен
      const result = await saveMediaRating({
        mediaId,
        mediaType, // Передаем тип медиа
        seasonNumber,
        ratings,
        average
      });

      if (result.success) {
        router.refresh();
        // Возвращаемся на правильную страницу в зависимости от типа
        const backUrl = mediaType === 'movie' ? `/movie/${mediaId}` : `/tv/${mediaId}`;
        router.push(backUrl);
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Сетка критериев */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        
        {/* Колонна 1: Сценарий */}
        <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Сценарий и Герои</h3>
            
            <RatingSlider 
                label="Сюжет" 
                description="Интрига, логика, диалоги" 
                value={ratings.plot} 
                onChange={(v) => setRatings(prev => ({...prev, plot: v}))} 
                color="text-blue-400"
                trackColor="bg-blue-500"
            />
            <RatingSlider 
                label="Персонажи" 
                description="Глубина, развитие, мотивация" 
                value={ratings.characters} 
                onChange={(v) => setRatings(prev => ({...prev, characters: v}))} 
                color="text-orange-400"
                trackColor="bg-orange-500"
            />
            <RatingSlider 
                label="Актерская игра" 
                description="Эмоции, харизма, каст" 
                value={ratings.acting} 
                onChange={(v) => setRatings(prev => ({...prev, acting: v}))} 
                color="text-purple-400"
                trackColor="bg-purple-500"
            />
             <RatingSlider 
                label="Финал" 
                description="Развязка, послевкусие" 
                value={ratings.ending} 
                onChange={(v) => setRatings(prev => ({...prev, ending: v}))} 
                color="text-red-400"
                trackColor="bg-red-500"
            />
        </div>

        {/* Колонна 2: Продакшн */}
        <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Продакшн</h3>

            <RatingSlider 
                label="Визуал" 
                description="CGI, костюмы, оператор" 
                value={ratings.visuals} 
                onChange={(v) => setRatings(prev => ({...prev, visuals: v}))} 
                color="text-pink-400"
                trackColor="bg-pink-500"
            />
            <RatingSlider 
                label="Звук и Музыка" 
                description="Саундтрек, эффекты" 
                value={ratings.sound} 
                onChange={(v) => setRatings(prev => ({...prev, sound: v}))} 
                color="text-yellow-400"
                trackColor="bg-yellow-500"
            />
            <RatingSlider 
                label="Атмосфера" 
                description="Погружение, стиль, вайб" 
                value={ratings.atmosphere} 
                onChange={(v) => setRatings(prev => ({...prev, atmosphere: v}))} 
                color="text-cyan-400"
                trackColor="bg-cyan-500"
            />
            <RatingSlider 
                label="Оригинальность" 
                description="Свежесть идей, отсутствие клише" 
                value={ratings.originality} 
                onChange={(v) => setRatings(prev => ({...prev, originality: v}))} 
                color="text-emerald-400"
                trackColor="bg-emerald-500"
            />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8"></div>

      {/* Итоговый блок */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 rounded-2xl p-6 border border-white/5">
         <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-black shadow-lg transition-colors duration-500 ${average >= 7 ? 'bg-[#46d369]' : average >= 4 ? 'bg-yellow-400' : 'bg-red-500'}`}>
                {average}
            </div>
            <div className="flex flex-col">
                <span className="text-white text-xl font-bold">Итоговая оценка</span>
                <span className="text-slate-400 text-sm">Среднее арифметическое</span>
            </div>
         </div>

         <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto relative overflow-hidden group bg-white text-black px-10 py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
         >
            <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Сохранение...
                    </>
                ) : (
                    <>
                        Подтвердить рейтинг
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </>
                )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
         </button>
      </div>

    </div>
  );
}

// --- УЛУЧШЕННЫЙ СЛАЙДЕР С DRAG & DROP ---
function RatingSlider({ 
    label, 
    description, 
    value, 
    onChange,
    color,
    trackColor
}: { 
    label: string, 
    description: string, 
    value: number, 
    onChange: (val: number) => void,
    color: string,
    trackColor: string
}) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const updateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newValue = Math.max(1, Math.min(10, Math.round(percent * 10)));
        onChange(newValue);
    }, [onChange]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        (e.target as Element).setPointerCapture(e.pointerId);
        updateValue(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updateValue(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);
    };

    return (
        <div className="group select-none touch-none"> 
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h3 className={`font-bold text-lg transition-colors duration-300 ${isDragging ? color : 'text-slate-200'}`}>{label}</h3>
                    <p className="text-xs text-slate-500 font-medium">{description}</p>
                </div>
                <div className={`font-mono font-bold text-2xl w-10 text-right transition-transform duration-200 ${isDragging ? 'scale-125' : 'scale-100'} ${color}`}>
                    {value}
                </div>
            </div>
            
            <div 
                className="relative h-6 w-full cursor-pointer flex items-center"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp} 
            >
                <div className="absolute inset-0 z-20" />
                <div ref={trackRef} className="absolute inset-x-0 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm pointer-events-none">
                     <div className="flex h-full w-full opacity-30">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-1 border-r border-black/40 last:border-0"></div>
                        ))}
                     </div>
                </div>
                <div 
                    className={`absolute left-0 h-2 rounded-full ${trackColor} shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-75 ease-linear pointer-events-none`}
                    style={{ width: `${value * 10}%` }}
                >
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${isDragging ? 'scale-125' : 'scale-100'}`}></div>
                </div>
            </div>
        </div>
    )
}
