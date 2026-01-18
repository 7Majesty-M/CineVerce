import { getPopularMovies } from '@/lib/tmdb';
import MatchClient from '@/components/MatchClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SessionPage(props: { params: Promise<{ sessionId: string }> }) {
    const params = await props.params;
    const { userId } = await auth();
    
    if (!userId) {
        // Редирект на вход, потом обратно сюда
        return redirect(`/sign-in?redirect_url=/match/${params.sessionId}`);
    }

    // Загружаем фильмы (можно рандомизировать страницу)
    const movies = await getPopularMovies(); 

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden">
            <MatchClient sessionId={params.sessionId} initialMovies={movies} />
        </div>
    )
}
