import { getPopularMovies } from '@/lib/tmdb';
import MatchClient from '@/components/MatchClient';
import { auth } from '@/auth'; // NextAuth
import { redirect } from 'next/navigation';

// Добавляем export default перед функцией
export default async function SessionPage(props: { params: Promise<{ sessionId: string }> }) {
    const params = await props.params;
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
        // Редирект на вход, если не авторизован
        // В NextAuth это делается через signIn, но можно просто редиректнуть на главную пока
        return redirect('/');
    }

    // Загружаем фильмы
    const movies = await getPopularMovies(); 

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden">
            <MatchClient sessionId={params.sessionId} initialMovies={movies} />
        </div>
    )
}
