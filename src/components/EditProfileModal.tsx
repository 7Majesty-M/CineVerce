'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateProfile } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentImage: string;
}

export default function EditProfileModal({ isOpen, onClose, currentName, currentImage }: EditProfileModalProps) {
  const [name, setName] = useState(currentName || '');
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('imageUrl', imageUrl);

    await updateProfile(formData);
    
    setIsLoading(false);
    onClose();
    router.refresh(); // Принудительно обновляем данные на клиенте
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Затемненный фон */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Окно */}
      <div className="relative bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 animate-in zoom-in-95 slide-in-from-bottom-5 duration-200">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Настройки профиля</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Ввод имени */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
              Имя пользователя
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all font-medium"
              placeholder="Как вас называть?"
            />
          </div>

          {/* Ввод ссылки на фото */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
              Ссылка на аватарку
            </label>
            <input 
              type="text" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all text-sm font-mono text-slate-300"
              placeholder="https://..."
            />
          </div>

          {/* Превью */}
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-white/10 relative flex-shrink-0">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">?</div>
                )}
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{name || 'Без имени'}</span>
                <span className="text-xs text-slate-500">Предпросмотр профиля</span>
             </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Сохранение...
                  </>
              ) : 'Сохранить изменения'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
