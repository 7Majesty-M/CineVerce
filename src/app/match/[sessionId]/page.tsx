// src/app/match/[sessionId]/page.tsx

import { getPopularMovies } from '@/lib/tmdb';
import MatchClient from '@/components/MatchClient';
import { auth } from '@/auth'; 
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SessionPage(props: { params: Promise<{ sessionId: string }> }) {
    const params = await props.params;
    const { sessionId } = params;

    const session = await auth();
    const userId = session?.user?.id;

    // 1. Проверка авторизации
    if (!userId) {
        redirect(`/api/auth/signin?callbackUrl=/match/${sessionId}`);
    }

    // 2. Загружаем фильмы
    const rawData = await getPopularMovies(1); 

    // 3. Форматируем данные
    const movies = rawData.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        mediaType: 'movie',
    })).filter((m: any) => m.poster_path);

    // Берем фон первого фильма для старта
    const bgImage = movies[0]?.backdrop_path;

    return (
        <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans">
            
            {/* АТМОСФЕРНЫЙ ФОН */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {bgImage && (
                    <>
                        <img 
                            src={`https://image.tmdb.org/t/p/w1280${bgImage}`} 
                            alt="Background" 
                            className="w-full h-full object-cover blur-[100px] opacity-30 scale-110"
                        />
                        <div className="absolute inset-0 bg-[#050505]/60"></div>
                    </>
                )}
            </div>

            {/* HEADER */}
            <header className="relative z-20 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md">
                <Link href="/match" className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </div>
                    <span className="hidden sm:inline">Выйти</span>
                </Link>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Room ID</span>
                    <span className="font-mono font-bold text-lg tracking-wider text-white">{sessionId}</span>
                </div>

                <div className="w-16"></div> 
            </header>

            {/* CLIENT AREA */}
            <main className="flex-1 relative z-10 w-full h-full flex flex-col">
                <MatchClient 
                    sessionId={sessionId} 
                    userId={userId} // Здесь userId гарантированно string
                    initialMovies={movies} 
                />
            </main>
        </div>
    );
}
