'use client';

import { useState } from 'react';
import Player from './Player';

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
}

interface TVPlayerSectionProps {
  tmdbId: string;
  kpId: number | null;
  imdbId: string | null;
  showName: string;
  seasons: Season[];
}

export default function TVPlayerSection({ 
  tmdbId, 
  kpId, 
  imdbId, 
  showName, 
  seasons 
}: TVPlayerSectionProps) {
  
  // Исключаем "Спецматериалы" (Сезон 0), если они не нужны. Обычно начинают с 1.
  const validSeasons = seasons.filter(s => s.season_number > 0);
  
  // Состояние: Какой сезон и серия выбраны сейчас
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  // Находим данные о текущем сезоне, чтобы знать сколько в нем серий
  const activeSeasonData = validSeasons.find(s => s.season_number === currentSeason) || validSeasons[0];
  const totalEpisodes = activeSeasonData?.episode_count || 1;

  // Генерируем массив номеров серий [1, 2, 3, ... N]
  const episodesList = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

  return (
    <div className="mb-16">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-pink-500 rounded-full"></span>
            Смотреть онлайн
        </h3>
        
        {/* --- ПЛЕЕР --- */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#000] mb-6 relative z-20">
            <Player 
                tmdbId={tmdbId}
                kpId={kpId}
                imdbId={imdbId}
                title={`${showName} - S${currentSeason} E${currentEpisode}`}
                mediaType="tv"
                season={currentSeason}
                episode={currentEpisode}
            />
        </div>

        {/* --- ПАНЕЛЬ ВЫБОРА (СЕЗОНЫ И СЕРИИ) --- */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col gap-6">
                
                {/* 1. Выбор сезона */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Выберите сезон
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {validSeasons.map(season => (
                            <button
                                key={season.id}
                                onClick={() => {
                                    setCurrentSeason(season.season_number);
                                    setCurrentEpisode(1); // Сбрасываем на 1 серию при смене сезона
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                                    currentSeason === season.season_number 
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                }`}
                            >
                                {season.season_number} сезон
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Выбор серии */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Серия (Сезон {currentSeason})
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {episodesList.map(ep => (
                            <button
                                key={ep}
                                onClick={() => setCurrentEpisode(ep)}
                                className={`h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center border ${
                                    currentEpisode === ep 
                                    ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-105' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                }`}
                            >
                                {ep}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
        
        {/* Инфо (для отладки можно удалить) */}
        <div className="mt-3 flex gap-4 text-[10px] text-slate-600 font-mono pl-2">
            <span>S{currentSeason} E{currentEpisode}</span>
            <span>TMDB: {tmdbId}</span>
            <span className={kpId ? "text-green-600" : "text-red-900"}>KP: {kpId || '—'}</span>
        </div>
    </div>
  );
}
