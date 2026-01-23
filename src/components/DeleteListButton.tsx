'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { deleteList } from '@/app/actions'; 
import { useRouter } from 'next/navigation';

export default function DeleteListButton({ listId }: { listId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteList(listId);
    if (result.success) {
      setIsOpen(false);
      // Опционально: можно сделать рефреш, если нужно
      // router.refresh(); 
    } else {
      alert(result.message);
    }
    setIsDeleting(false);
  };

  const Modal = () => (
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
        }}
    >
      {/* Фон с размытием */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />

      {/* Контент модалки */}
      <div className="relative bg-[#121212] border border-white/10 rounded-2xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.7)] p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 overflow-hidden mx-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
        
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Удалить коллекцию?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Вы собираетесь удалить этот список безвозвратно.
            </p>

            <div className="flex gap-3 w-full">
                <button
                    onClick={() => setIsOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors border border-white/5"
                >
                    Отмена
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isDeleting ? "Удаление..." : "Да, удалить"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault(); 
          e.stopPropagation();
          setIsOpen(true);
        }}
        // ИЗМЕНЕНИЯ ЗДЕСЬ:
        // 1. p-2 вместо w-9 h-9 (чтобы размер зависел от иконки и паддинга)
        // 2. rounded-full (круг вместо квадрата)
        // 3. Убраны лишние бордеры в спокойном состоянии
        className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
        title="Удалить список"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          // Уменьшил иконку до w-5 h-5, чтобы соответствовать кнопке экспорта
          className="w-5 h-5"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      </button>

      {/* Рендерим модалку через портал */}
      {isOpen && mounted && createPortal(<Modal />, document.body)}
    </>
  );
}
