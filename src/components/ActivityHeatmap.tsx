'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ChartData = {
  date: string;
  dayOfWeek: number;
  count: number;
  fullDate: string;
};

export default function ActivityHeatmap({ data }: { data: ChartData[] }) {
  const [hoveredData, setHoveredData] = useState<{
    count: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // АВТО-СКРОЛЛ В КОНЕЦ (К последним дням)
    if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        scrollContainerRef.current.scrollLeft = scrollWidth - clientWidth;
    }
  }, [data]);

  if (!data || data.length === 0) return null;

  const startDay = data[0].dayOfWeek;

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.03] border border-white/[0.05]'; 
    if (count === 1) return 'bg-emerald-900/60 border border-emerald-800/50'; 
    if (count === 2) return 'bg-emerald-700/80 border border-emerald-600/50'; 
    if (count <= 4) return 'bg-emerald-500 border border-emerald-400/50'; 
    return 'bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10'; 
  };

  const handleMouseEnter = (e: React.MouseEvent, item: ChartData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredData({
      count: item.count,
      date: item.fullDate,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  return (
    <div className="w-full relative group">
      
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden pb-6 pt-3 px-1 relative scrollbar-custom"
        style={{
            maskImage: 'linear-gradient(to right, transparent, black 20px)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px)'
        }}
      >
        <style jsx>{`
          .scrollbar-custom::-webkit-scrollbar {
            height: 8px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            margin: 0 20px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: linear-gradient(to right, rgba(52, 211, 153, 0.3), rgba(16, 185, 129, 0.5));
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to right, rgba(52, 211, 153, 0.5), rgba(16, 185, 129, 0.7));
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:active {
            background: linear-gradient(to right, rgba(52, 211, 153, 0.7), rgba(16, 185, 129, 0.9));
          }
          /* Firefox */
          .scrollbar-custom {
            scrollbar-width: thin;
            scrollbar-color: rgba(52, 211, 153, 0.4) rgba(255, 255, 255, 0.03);
          }
        `}</style>
        {/* Увеличенные размеры: w-6 h-6, gap-2 */}
        <div className="grid grid-rows-7 grid-flow-col gap-2 w-max pl-4 pr-1">
            
            {startDay > 0 && Array.from({ length: startDay }, (_, i) => (
                <div key={`placeholder-${i}`} className="w-6 h-6 opacity-0" />
            ))}

            {data.map((day) => (
                <div 
                    key={day.date}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={() => setHoveredData(null)}
                    className={`
                        w-6 h-6 rounded-[4px] transition-all duration-300 cursor-pointer
                        hover:scale-125 hover:border-white hover:z-20 hover:shadow-xl
                        ${getColor(day.count)}
                    `}
                />
            ))}
        </div>
      </div>

      {/* Индикаторы скролла */}
      <div className="absolute left-0 top-0 bottom-20 w-8 bg-gradient-to-r from-[#0E0E0E] to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-20 w-8 bg-gradient-to-l from-[#0E0E0E] to-transparent pointer-events-none md:hidden" />

      {/* Легенда */}
      <div className="flex flex-wrap items-center justify-between mt-3 border-t border-white/5 pt-5 gap-4 px-1">
          <div className="flex flex-col">
             <span className="text-xs text-white font-bold tracking-wide">
                Годовая активность
             </span>
             <span className="text-[10px] text-slate-500">
                Скролльте, чтобы увидеть прошлое
             </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium bg-[#0A0A0A] px-3 py-1.5 rounded-full border border-white/5 shadow-lg">
              <span>Меньше</span>
              <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-white/[0.03] border border-white/[0.05]" />
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-900/60 border border-emerald-800/50" />
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-700/80 border border-emerald-600/50" />
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-500 border border-emerald-400/50" />
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-400 border border-emerald-300 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
              </div>
              <span>Больше</span>
          </div>
      </div>

      {/* Тултип */}
      {hoveredData && mounted && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full pb-3"
            style={{ left: hoveredData.x, top: hoveredData.y }}
        >
            <div className="bg-[#1a1d21] text-white px-4 py-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-white/5 pb-1 mb-1">
                        {hoveredData.date}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl font-black ${hoveredData.count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {hoveredData.count}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                            {hoveredData.count === 1 ? 'просмотр' : 'просмотров'}
                        </span>
                    </div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1d21] border-r border-b border-white/10 rotate-45 transform translate-y-1/2"></div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
}