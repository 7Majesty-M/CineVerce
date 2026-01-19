'use client';

import { useState, useRef, useEffect } from 'react';
import { updateListName } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface EditableListTitleProps {
  listId: number;
  initialName: string;
  canEdit: boolean;
}

export default function EditableListTitle({ listId, initialName, canEdit }: EditableListTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!name.trim() || name === initialName) {
      setIsEditing(false);
      setName(initialName);
      return;
    }

    setIsLoading(true);
    const res = await updateListName(listId, name);
    setIsLoading(false);
    setIsEditing(false);
    
    if (res.success) {
      router.refresh();
    } else {
      setName(initialName); // Откат при ошибке
      alert('Ошибка при обновлении названия');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setName(initialName);
    }
  };

  if (isEditing) {
    return (
      <div className="relative max-w-2xl">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full bg-transparent text-4xl md:text-6xl lg:text-7xl font-black text-white outline-none border-b-2 border-pink-500 pb-2 placeholder-white/20"
        />
        <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
           Enter - сохранить, Esc - отмена
        </div>
      </div>
    );
  }

  return (
    <div className="group/title flex items-start gap-3">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white break-words">
        {name}
      </h1>
      
      {canEdit && (
        <button 
          onClick={() => setIsEditing(true)}
          className="mt-2 opacity-0 group-hover/title:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
          title="Редактировать название"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}
