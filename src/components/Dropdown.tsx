'use client';

import { useState, useEffect, useRef } from 'react';
import { getMyListsForDropdown, toggleListItem, createList } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function AddToListDropdown({ 
    mediaId, 
    mediaType,
    compact = false // <--- 1. Добавили проп
}: { 
    mediaId: number, 
    mediaType: 'movie' | 'tv',
    compact?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        getMyListsForDropdown(mediaId, mediaType).then(data => {
            setLists(data);
            setLoading(false);
        });
    }
  }, [isOpen, mediaId, mediaType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleList = async (listId: number) => {
      setLists(prev => prev.map(l => l.id === listId ? { ...l, hasMedia: !l.hasMedia } : l));
      await toggleListItem(listId, mediaId, mediaType);
      router.refresh();
  };

  const handleCreate = async () => {
      if(!newListName.trim()) return;
      const res = await createList(newListName, '');
      if(res.success && res.listId) {
          await toggleListItem(res.listId, mediaId, mediaType);
          setNewListName('');
          setCreating(false);
          const updatedLists = await getMyListsForDropdown(mediaId, mediaType);
          setLists(updatedLists);
          router.refresh();
      }
  }

  return (
    <div className="relative" ref={menuRef}>
        
        {/* КНОПКА ТРИГГЕР */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            // 2. Условные классы: p-3 rounded-full для компактного вида
            className={`
                border border-white/10 font-bold text-sm transition-all flex items-center justify-center
                ${compact ? 'p-3 rounded-full' : 'px-6 py-3 rounded-xl gap-2'}
                ${isOpen ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white'}
            `}
            title="Добавить в коллекцию"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            
            {/* 3. Скрываем текст */}
            {!compact && (
                <span>В коллекцию</span>
            )}
        </button>

        {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
        {isOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 py-2">Ваши списки</div>
                
                {loading ? (
                    <div className="py-4 flex justify-center"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
                ) : (
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                        {lists.map(list => (
                            <button
                                key={list.id}
                                onClick={() => handleToggleList(list.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                            >
                                <span className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{list.name}</span>
                                {list.hasMedia && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                            </button>
                        ))}
                        {lists.length === 0 && <div className="text-xs text-slate-600 px-3 py-2 text-center">Нет списков</div>}
                    </div>
                )}

                <div className="h-px bg-white/10 my-2"></div>

                {/* СОЗДАНИЕ СПИСКА */}
                {creating ? (
                    <div className="px-2 pb-1">
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none mb-2"
                            placeholder="Название..."
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <button onClick={handleCreate} className="w-full bg-white text-black text-xs font-bold py-1.5 rounded-lg">Создать</button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setCreating(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        Создать новый список
                    </button>
                )}
            </div>
        )}
    </div>
  )
}
