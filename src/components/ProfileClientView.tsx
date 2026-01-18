'use client';

import { useState } from 'react';
import TasteRadar from './TasteRadar';
import Link from 'next/link';

export default function ProfileClientView({ 
  radarData, 
  history, 
  watchlist, // <--- НОВЫЙ ПРОП
  totalReviews, 
  averageScore 
}: any) {
  
  // Добавил 'watchlist' в типы состояния
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'watchlist'>('overview');

  return (
    <div className="container mx-auto px-6 relative z-20 -mt-4">
        
        {/* TABS (Переключатели) */}
        <div className="flex items-center gap-2 mb-8 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                Обзор
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                История оценок
            </button>
            {/* НОВАЯ КНОПКА: БУДУ СМОТРЕТЬ */}
            <button 
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center ${activeTab === 'watchlist' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                Буду смотреть 
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'watchlist' ? 'bg-black/10' : 'bg-white/10'}`}>
                    {watchlist?.length || 0}
                </span>
            </button>
        </div>

        {/* CONTENT */}
        <div className="animate-fade-in min-h-[400px]">
            
            {/* 1. ОБЗОР (Графики) */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* RADAR */}
                    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="text-2xl font-bold flex items-center gap-2">🧬 ДНК Вкуса</h2>
                        </div>
                        {totalReviews > 0 ? (
                            <TasteRadar data={radarData} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                Нет данных
                            </div>
                        )}
                    </div>

                    {/* QUICK STATS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#151515] rounded-3xl border border-white/5 p-6 flex flex-col justify-between group hover:border-pink-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-xl">🎭</div>
                            <div>
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Любимый жанр</div>
                                <div className="text-xl font-bold text-white">Драма</div>
                                <div className="text-xs text-slate-600 mt-1">Основано на оценках</div>
                            </div>
                        </div>
                        <div className="bg-[#151515] rounded-3xl border border-white/5 p-6 flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl">🎬</div>
                            <div>
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Активность</div>
                                <div className="text-xl font-bold text-white">Высокая</div>
                                <div className="text-xs text-slate-600 mt-1">Топ 10% зрителей</div>
                            </div>
                        </div>
                        <div className="col-span-2 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl border border-white/5 p-6 flex items-center justify-between">
                            <div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Ваша суперсила</div>
                                <div className="text-2xl font-black text-white">Визионер</div>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Вы уделяете особое внимание визуальному стилю и атмосфере.</p>
                            </div>
                            <div className="text-6xl opacity-20">👁️</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. ИСТОРИЯ (Список) */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item: any) => (
                        <Link 
                            key={item.id} 
                            href={`/${item.mediaType}/${item.mediaId}`}
                            className="flex items-start gap-4 p-4 bg-[#0f0f0f]/60 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all group"
                        >
                            <div className="w-16 h-24 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 shadow-lg relative">
                                {item.poster_path && (
                                    <img src={`https://image.tmdb.org/t/p/w154${item.poster_path}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                                <h4 className="font-bold text-base truncate text-slate-200 group-hover:text-pink-400 transition-colors">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1.5 mb-3">
                                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                        {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                                    </span>
                                    {item.seasonNumber && (
                                        <span className="text-[10px] text-slate-500 font-medium bg-white/5 px-1.5 py-0.5 rounded">S{item.seasonNumber}</span>
                                    )}
                                    <span className="text-[10px] text-slate-600">{new Date(item.updatedAt).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded text-xs font-black ${item.rating >= 8 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {item.rating}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {history.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                            История оценок пуста
                        </div>
                    )}
                </div>
            )}

            {/* 3. WATCHLIST (СЕТКА ПОСТЕРОВ) */}
            {activeTab === 'watchlist' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {watchlist?.map((item: any) => (
                        <Link 
                            key={`watch-${item.id}`} 
                            href={`/${item.mediaType}/${item.mediaId}`}
                            className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-800 border border-white/5 hover:border-amber-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl"
                        >
                            {item.poster_path ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt={item.title} 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Poster</div>
                            )}
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <h4 className="text-white font-bold text-sm line-clamp-2 leading-tight">{item.title}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                        {item.mediaType === 'movie' ? 'Фильм' : 'Сериал'}
                                    </span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-sm font-bold text-white border border-white/10 shadow-lg">
                                🔖
                            </div>
                        </Link>
                    ))}
                    {(!watchlist || watchlist.length === 0) && (
                        <div className="col-span-full h-[300px] flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <div className="text-4xl mb-3 opacity-50">📂</div>
                            <p>Ваш список пуст. Добавьте фильмы, чтобы не забыть!</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    </div>
  )
}
