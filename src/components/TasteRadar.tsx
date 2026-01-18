'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts';

export default function TasteRadar({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    // ДОБАВЛЕНО: min-w-0 и flex-1, чтобы контейнер не схлопывался
    <div className="w-full h-[300px] md:h-[350px] relative min-w-0 flex-1">
      
      {/* ИСПРАВЛЕНО: Добавлен minWidth={0}, чтобы избежать ошибки "width(-1)" */}
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          {/* Сетка */}
          <PolarGrid stroke="#ffffff" strokeOpacity={0.1} />
          
          {/* Подписи осей */}
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }} 
          />
          
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          
          <Radar
            name="My Taste"
            dataKey="A"
            stroke="#f472b6"
            strokeWidth={3}
            fill="url(#radarGradient)"
            fillOpacity={0.6}
          />
          
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Декор */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] border border-white/5 rounded-full pointer-events-none"></div>
    </div>
  );
}
