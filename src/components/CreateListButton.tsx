'use client';

import { useState } from 'react';
import { createList } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function CreateListButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    
    const res = await createList(name, '');
    
    if (res.success) {
      setIsCreating(false);
      setName('');
      router.refresh();
      // Можно сразу перекинуть внутрь списка: router.push(`/lists/${res.listId}`);
    } else {
      alert("Ошибка при создании");
    }
    setLoading(false);
  };

  if (isCreating) {
    return (
      <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 animate-in fade-in slide-in-from-right-4">
        <input 
          autoFocus
          type="text" 
          placeholder="Название списка..." 
          className="bg-transparent text-white px-3 py-2 outline-none text-sm w-48 placeholder-slate-600"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="bg-white text-black p-2 rounded-lg hover:bg-slate-200 transition-colors"
        >
          {loading ? (
             <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <button 
          onClick={() => setIsCreating(false)}
          className="text-slate-500 p-2 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsCreating(true)}
      className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-pink-500/20 hover:scale-105 transition-all"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      Создать коллекцию
    </button>
  );
}
