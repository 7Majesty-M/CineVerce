'use client';
import { removeListMedia } from '@/app/actions'; // Сделаем позже
import { useRouter } from 'next/navigation';

export default function RemoveItemButton({ itemId, listId }: { itemId: number, listId: number }) {
    const router = useRouter();
    
    const handleRemove = async () => {
        if(!confirm('Удалить из списка?')) return;
        await removeListMedia(itemId, listId);
        router.refresh();
    }

    return (
        <button onClick={handleRemove} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400 shadow-lg">
            ✕
        </button>
    )
}
