'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addMemberToList } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function AddMemberButton({ listId }: { listId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    setMessage('');
    
    const res = await addMemberToList(listId, email);
    
    if (res.success) {
      setMessage('✅ Участник успешно добавлен!');
      setEmail('');
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
        router.refresh();
      }, 1500);
    } else {
      setMessage(`❌ ${res.error}`);
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEmail('');
    setMessage('');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Декоративный градиент */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
          title="Закрыть"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Иконка */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-5 shadow-xl relative z-10">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        {/* Заголовок */}
        <div className="mb-6 relative z-10">
          <h3 className="text-3xl font-black text-white mb-2">Пригласить друга</h3>
          <p className="text-slate-400 text-sm">Введите email пользователя для добавления в коллекцию</p>
        </div>

        {/* Поле ввода */}
        <div className="mb-4 relative z-10">
          <label className="block text-sm font-bold text-slate-300 mb-2">Email адрес</label>
          <input 
            type="email" 
            placeholder="user@example.com" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && !loading && email && handleAdd()}
            autoFocus
          />
        </div>

        {/* Сообщение */}
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium relative z-10 ${
            message.includes('✅') 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 relative z-10">
          <button 
            onClick={handleAdd}
            disabled={loading || !email.trim()}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Добавляем...
              </span>
            ) : (
              'Добавить участника'
            )}
          </button>
          
          <button 
            onClick={handleClose}
            className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold transition-all"
          >
            Отмена
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        body {
          overflow: ${isOpen ? 'hidden' : 'auto'};
        }
      `}</style>
    </div>
  ) : null;

  return (
    <>
      {/* Кнопка открытия */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-pink-500/50"
        title="Добавить участника"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Рендерим модалку через Portal */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}