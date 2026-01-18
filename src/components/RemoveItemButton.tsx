'use client';

import { useState } from 'react';
import { removeListMedia } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function RemoveItemButton({ itemId, listId }: { itemId: number, listId: number }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await removeListMedia(itemId, listId);
        setIsDeleting(false);
        setIsOpen(false);
        router.refresh();
    };

    return (
        <>
            {/* Кнопка-триггер (Крестик) */}
            <button 
                onClick={(e) => {
                    e.preventDefault(); // Чтобы не сработала ссылка на фильм
                    setIsOpen(true);
                }}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg hover:scale-110 active:scale-90"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {/* Модальное окно подтверждения */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Фон */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Окно */}
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Удалить из списка?</h3>
                            <p className="text-slate-400 text-sm mb-6">Это действие нельзя будет отменить.</p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Удалить'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
