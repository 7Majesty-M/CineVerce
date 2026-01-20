'use client';

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';

// Ссылка на TopoJSON файл карты мира (стандартный, легкий)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  iso: string; // Код страны (US, RU, FR)
  count: number; // Сколько фильмов посмотрено
  name?: string;
}

export default function MovieWorldMap({ data }: { data: CountryData[] }) {
  const [tooltipContent, setTooltipContent] = useState("");

  // 1. Создаем карту значений для быстрого доступа: { "US": 150, "RU": 40 }
  const dataMap = useMemo(() => {
    return data.reduce((acc, cur) => {
      acc[cur.iso] = cur.count;
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  // 2. Настраиваем цветовую шкалу (от темно-красного к ярко-красному)
  const maxCount = Math.max(...data.map(d => d.count), 0);
  
  const colorScale = scaleLinear<string>()
    .domain([1, maxCount]) // От 1 фильма до максимума
    .range(["#450a0a", "#ef4444"]); // Цвета Tailwind: red-950 -> red-500

  return (
    <div className="w-full h-[500px] md:h-[600px] bg-[#050505] border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
      
      {/* Заголовок внутри карты */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-2xl font-black text-white flex items-center gap-2">
          🗺️ Кино-География
        </h3>
        <p className="text-slate-400 text-sm">Чем ярче страна, тем больше фильмов оттуда</p>
      </div>

      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140 }}>
        {/* ZoomableGroup позволяет приближать/двигать карту */}
        <ZoomableGroup center={[0, 20]} zoom={1} maxZoom={4}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // В TopoJSON код страны обычно в ISO Alpha-2 или Alpha-3. 
                // TMDB отдает Alpha-2 (US, RU).
                // В стандартном world-atlas iso_a2 находится в properties.
                const countryCode = geo.properties.ISO_A2 || geo.properties.iso_a2; 
                const count = dataMap[countryCode] || 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    // События для тултипа
                    onMouseEnter={() => {
                      setTooltipContent(`${geo.properties.name}: ${count} фильмов`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    // Стилизация
                    style={{
                      default: {
                        fill: count > 0 ? colorScale(count) : "#1a1a1a", // Если смотрели - красим, нет - серый
                        stroke: "#000",
                        strokeWidth: 0.5,
                        outline: "none",
                        transition: "all 250ms"
                      },
                      hover: {
                        fill: count > 0 ? "#f87171" : "#333", // При наведении ярче
                        stroke: "#fff",
                        strokeWidth: 0.7,
                        outline: "none",
                        cursor: "pointer"
                      },
                      pressed: {
                        fill: "#fff",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Тултип (всплывашка) */}
      <Tooltip 
         id="map-tooltip"
         isOpen={!!tooltipContent}
         content={tooltipContent}
         place="top"
         className="z-50 !bg-black/80 !backdrop-blur-md !border !border-white/10 !text-white !font-bold !rounded-xl !px-4 !py-2"
      />
      
      {/* Легенда снизу */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs text-slate-300">
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1a1a1a] border border-white/20"></span>
            <span>Не исследовано</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-900 border border-white/20"></span>
            <span>Мало (1-5)</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white/20"></span>
            <span>Много ({maxCount}+)</span>
         </div>
      </div>

    </div>
  );
}
