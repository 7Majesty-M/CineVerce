'use client';
import { createMatchSession } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function StartMatchButton() {
    const router = useRouter();
    
    const handleStart = async () => {
        const res = await createMatchSession();
        if (res.success) {
            router.push(`/match/${res.sessionId}`);
        }
    }

    return (
        <button 
            onClick={handleStart}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-transform active:scale-95"
        >
            Создать комнату
        </button>
    )
}
