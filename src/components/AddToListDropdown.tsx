'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getMyListsForDropdown, toggleListItem, createList } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function AddToListDropdown({ 
    mediaId, 
    mediaType,
    compact = false,
    modal = false,
    position = 'right'
}: { 
    mediaId: number, 
    mediaType: 'movie' | 'tv',
    compact?: boolean,
    modal?: boolean,
    position?: 'left' | 'right'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    
    // Координаты для портала
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            updatePosition(); // Пересчет позиции при открытии
            
            getMyListsForDropdown(mediaId, mediaType).then(data => {
                setLists(data);
                setLoading(false);
            });
        }
    }, [isOpen, mediaId, mediaType]);

    // Обработка клика вне и скролла
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setCreating(false);
            }
        };

        const handleScroll = () => {
            if (isOpen && !modal) updatePosition();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen, modal]);

    // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    const updatePosition = () => {
        if (triggerRef.current && !modal) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            
            setCoords({
                // Берем ВЕРХ кнопки (rect.top) и отнимаем немного (8px) для отступа
                top: rect.top + scrollY - 8,
                // Горизонталь как раньше
                left: position === 'left' ? rect.right : rect.left
            });
        }
    };

    const handleToggleList = async (listId: number, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setLists(prev => prev.map(l => l.id === listId ? { ...l, hasMedia: !l.hasMedia } : l));
        await toggleListItem(listId, mediaId, mediaType);
        router.refresh();
    };

    const handleCreate = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
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

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    const menuContent = (
        <>
            {modal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] animate-fadeIn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                />
            )}

            <div 
                ref={menuRef}
                style={!modal ? {
                    position: 'absolute',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    // ИСПРАВЛЕНИЕ: translateY(-100%) поднимает меню вверх над кнопкой
                    transform: position === 'left' 
                        ? 'translate(-100%, -100%)' // Влево и Вверх
                        : 'translate(0, -100%)'     // Только Вверх
                } : undefined}
                className={`
                    ${modal 
                        ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90vw] max-w-md animate-scaleIn' 
                        : 'z-[9999] w-64'
                    }
                    bg-gradient-to-br from-slate-900 to-slate-800 
                    border border-white/20 
                    rounded-2xl 
                    shadow-2xl 
                    ${modal ? 'p-6' : 'p-2'}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className={`flex items-center justify-between ${modal ? 'mb-4' : 'px-3 py-2'}`}>
                    <h3 className={`${modal ? 'text-lg' : 'text-xs'} font-bold ${modal ? 'text-white' : 'text-slate-500 uppercase tracking-widest'} flex items-center gap-2`}>
                        {modal && (
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        )}
                        Ваши списки
                    </h3>
                    {modal && (
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Список */}
                {loading ? (
                    <div className={`flex items-center justify-center ${modal ? 'py-8' : 'py-4'} text-slate-400`}>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <div className={`space-y-1 ${modal ? 'max-h-[50vh] overflow-y-auto scrollbar-thin' : 'max-h-48 overflow-y-auto'}`}>
                        {lists.map(list => (
                            <button
                                key={list.id}
                                onClick={(e) => handleToggleList(list.id, e)}
                                className={`w-full flex items-center justify-between ${modal ? 'px-4 py-3' : 'px-3 py-2'} rounded-xl hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10`}
                            >
                                <span className={`${modal ? 'font-medium' : 'text-sm font-medium'} text-white truncate`}>{list.name}</span>
                                {list.hasMedia && (
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                        {lists.length === 0 && (
                            <div className={`text-center ${modal ? 'py-8' : 'py-2 px-3'} text-slate-500 text-xs`}>
                                Нет списков
                            </div>
                        )}
                    </div>
                )}

                <div className={`border-t border-white/10 ${modal ? 'my-4' : 'my-2'}`}></div>

                {creating ? (
                    <div className={`space-y-3 ${modal ? '' : 'px-2 pb-1'}`}>
                        <input 
                            autoFocus
                            type="text" 
                            className={`w-full bg-black/50 border border-white/20 rounded-xl ${modal ? 'px-4 py-3' : 'px-2 py-1.5'} text-sm text-white outline-none focus:border-purple-500 transition-colors`}
                            placeholder="Название списка..."
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => handleCreate(e)}
                                className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white ${modal ? 'px-4 py-2.5' : 'py-1.5'} rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm`}
                            >
                                Создать
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCreating(false);
                                }}
                                className={`${modal ? 'px-4 py-2.5' : 'px-3 py-1.5'} bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all text-sm`}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreating(true);
                        }}
                        className={`w-full flex items-center ${modal ? 'justify-center' : ''} gap-2 ${modal ? 'px-4 py-3' : 'px-3 py-2'} rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-purple-400 hover:text-purple-300 transition-all border border-white/10 hover:border-purple-500/50`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Создать новый список
                    </button>
                )}
            </div>
        </>
    );

    return (
        <div ref={triggerRef as any} className="inline-block"> 
            <button 
                onClick={toggleOpen}
                className={`
                    border border-white/10 font-bold text-sm transition-all flex items-center justify-center
                    ${compact ? 'p-3 rounded-full' : 'px-6 py-3 rounded-xl gap-2'}
                    ${isOpen ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white'}
                `}
                title="Добавить в коллекцию"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                {!compact && <span>В коллекцию</span>}
            </button>
            {isOpen && mounted && createPortal(menuContent, document.body)}
        </div>
    )
}
