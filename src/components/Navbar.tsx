'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButtons from '@/components/AuthButtons';
import GlobalSearch from '@/components/GlobalSearch';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  
  // Получаем статус сессии для корректной гидратации
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    // Проверка window нужна, чтобы код не упал на сервере
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* 
        ================================================================
        NAVBAR (ПК ВЕРСИЯ - ДИЗАЙН ИЗ КОДА №1) 
        ================================================================
      */}
      <nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b
          ${scrolled 
            ? 'bg-[#050505]/80 backdrop-blur-2xl border-white/5 py-3 shadow-2xl' 
            : 'bg-transparent border-transparent py-5'
          }
        `}
      >
        {/* Верхний блик */}
        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="container mx-auto px-6 flex items-center justify-between relative">
          
          {/* 1. ЛОГОТИП (Стиль №1) */}
          <Link href="/" className="flex items-center gap-3 group relative z-[60]">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 group-hover:blur-md transition-all duration-500 animate-pulse"></div>
                <img
                  src="/favicon.ico"
                  alt="Logo"
                  className="w-full h-full object-contain rounded-full relative z-10 drop-shadow-lg group-hover:rotate-12 transition-transform duration-500"
                />
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-pink-300 transition-all">
                    CineVerse
                </span>
             </div>
          </Link>

          {/* 2. ЦЕНТРАЛЬНОЕ МЕНЮ (Стиль №1 - Dock) */}
          <div className="hidden md:flex items-center p-1.5 gap-2 rounded-full bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl shadow-2xl relative">
            <NavButton 
                href="/feed" 
                active={pathname === '/feed'} 
                activeColor="shadow-[0_0_20px_rgba(34,211,238,0.5)]" 
                hoverColor="hover:text-cyan-400 hover:bg-cyan-500/10"
            >
                Лента
            </NavButton>
            
            <NavButton 
                href="/lists" 
                active={pathname === '/lists'} 
                activeColor="shadow-[0_0_20px_rgba(52,211,153,0.5)]" 
                hoverColor="hover:text-emerald-400 hover:bg-emerald-500/10"
            >
                Списки
            </NavButton>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            {/* Кнопка Time Machine (Стиль №1) */}
            <Link 
              href="/time-machine" 
              className={`relative px-5 py-2 rounded-full text-[11px] uppercase font-black tracking-widest transition-all duration-300 flex items-center gap-2 overflow-hidden group/tm
                ${pathname === '/time-machine' 
                  ? 'bg-transparent text-white shadow-[0_0_25px_rgba(236,72,153,0.4)] border border-white/20' 
                  : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5'
                }
              `}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover/tm:opacity-100 transition-opacity duration-500"></div>
                <span className={`relative z-10 transition-transform duration-500 ${pathname === '/time-machine' ? 'rotate-180' : 'group-hover/tm:rotate-180'}`}>⏳</span>
                <span className={`relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-300 group-hover/tm:from-white group-hover/tm:to-white transition-all`}>
                    Time Machine
                </span>
            </Link>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            <NavFire href="/match" active={pathname === '/match'}>Матч</NavFire>
          </div>

          {/* 3. ПРАВАЯ ЧАСТЬ (Стиль №1) */}
          <div className="hidden md:flex items-center gap-4">
            <GlobalSearch />
            <div className="h-8 w-px bg-white/10"></div>
            <AuthButtons />
          </div>

          {/* 4. МОБИЛЬНАЯ КНОПКА (Стиль №1) */}
          <div className="md:hidden flex items-center gap-4 z-[60]">
             <div className="scale-90"><GlobalSearch /></div>
             <button
                className="group p-2 text-white focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             >
                <div className="w-6 h-5 flex flex-col justify-between items-end relative">
                    <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'w-6 rotate-45 translate-y-2 bg-pink-500' : 'w-6 group-hover:w-full'}`} />
                    <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'w-0 opacity-0' : 'w-4 group-hover:w-full'}`} />
                    <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'w-6 -rotate-45 -translate-y-2.5 bg-pink-500' : 'w-5 group-hover:w-full'}`} />
                </div>
             </button>
          </div>
        </div>
      </nav>

      {/* 
        ================================================================
        МОБИЛЬНОЕ МЕНЮ (ТЕЛЕФОННАЯ ВЕРСИЯ - ДИЗАЙН ИЗ КОДА №2)
        ================================================================
      */}
      <div className={`fixed inset-0 z-40 transition-all duration-700 md:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Затемнение фона */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-700 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
          
          {/* Выезжающая панель справа */}
          <div className={`absolute inset-y-0 right-0 w-full max-w-sm bg-gradient-to-br from-black via-purple-950/20 to-black border-l border-white/10 shadow-2xl transition-transform duration-700 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              
              {/* Фоновые пятна (Декор из Кода №2) */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
              
              <div className="relative h-full overflow-y-auto pt-24 px-6 pb-8 flex flex-col gap-6">
                  
                  {/* 
                    Профиль пользователя.
                    ВАЖНО: Используем isAuthenticated, чтобы избежать Hydration Error.
                  */}
                  {isAuthenticated && session?.user ? (
                    <Link href="/profile" className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 active:scale-98 transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative">
                          {/* Suppress hydration warning на случай разницы в атрибутах */}
                          <img 
                            src={session.user.image || ''} 
                            className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg" 
                            alt="Avatar"
                            suppressHydrationWarning 
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="relative">
                            <div className="text-lg font-black text-white">{session.user.name}</div>
                            <div className="text-xs text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                              <span>Мой профиль</span>
                              <span className="text-[10px]">→</span>
                            </div>
                        </div>
                    </Link>
                  ) : (
                    <div className="p-2"><AuthButtons /></div>
                  )}

                  {/* Ссылки меню (Мобильный стиль №2) */}
                  <div className="flex flex-col gap-3">
                      <MobileLink href="/feed" icon="📰" title="Лента новостей" desc="Что нового в мире кино" delay="100ms" gradient="from-blue-500/10 to-cyan-500/10" />
                      
                      {/* Большая карточка Time Machine */}
                      <Link 
                          href="/time-machine" 
                          className="relative overflow-hidden w-full flex items-center gap-4 p-6 rounded-3xl border border-purple-500/30 active:scale-98 transition-all animate-in slide-in-from-right-8 fade-in duration-700 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]"
                          style={{ animationDelay: '200ms', background: 'linear-gradient(135deg, rgba(20,10,30,1) 0%, rgba(40,10,40,1) 100%)' }}
                      >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 opacity-70"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                            <span className="animate-pulse">⏳</span>
                          </div>
                          <div className="relative z-10 flex-1">
                              <div className="font-black text-xl bg-gradient-to-r from-purple-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">Time Machine</div>
                              <div className="text-[11px] text-purple-300/80 font-bold uppercase tracking-[0.15em] mt-0.5">Путешествие во времени</div>
                          </div>
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full"></div>
                      </Link>

                      <MobileLink href="/match" icon="🔥" title="Кино-Матч" desc="Найди фильм по вкусу" delay="300ms" isFire gradient="from-orange-500/10 to-red-500/10" />
                      <MobileLink href="/lists" icon="📚" title="Списки" desc="Ваши коллекции" delay="400ms" gradient="from-purple-500/10 to-blue-500/10" />
                  </div>
                  
                  {/* Футер меню */}
                  <div className="mt-auto pt-6 flex items-center justify-center gap-2 opacity-30">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20"></div>
                    <span className="text-xs text-white/40">CineVerse</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20"></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Стили для анимаций (ИЗ КОДА №2) */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </>
  );
}

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

// 1. Кнопка для ПК (ИЗ КОДА №1)
function NavButton({ href, active, children, activeColor, hoverColor }: { 
    href: string, active: boolean, children: React.ReactNode, activeColor: string, hoverColor: string 
}) {
    return (
        <Link 
            href={href} 
            className={`px-6 py-2 rounded-full text-[12px] uppercase font-bold tracking-wider transition-all duration-300 border
                ${active 
                    ? `bg-white text-black border-white scale-105 ${activeColor}` 
                    : `text-slate-400 border-transparent ${hoverColor}`
                }
            `}
        >
            {children}
        </Link>
    );
}

// 2. Кнопка "Матч" для ПК (ИЗ КОДА №1)
function NavFire({ href, active, children }: { href: string, active: boolean, children: React.ReactNode }) {
    return (
        <Link 
            href={href} 
            className={`px-5 py-2 rounded-full text-[12px] uppercase font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5
                ${active 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.5)] scale-105' 
                    : 'text-slate-400 hover:text-orange-200 hover:bg-orange-500/10'
                }
            `}
        >
            {children}
            <span className={`${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>🔥</span>
        </Link>
    );
}

// 3. Ссылка для Мобильного меню (ИЗ КОДА №2)
function MobileLink({ href, icon, title, desc, delay, isFire, gradient }: any) {
    return (
        <Link 
            href={href} 
            className={`group relative overflow-hidden w-full flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-br ${gradient || 'from-white/5 to-white/10'} border border-white/10 active:scale-98 transition-all duration-500 animate-in slide-in-from-right-8 fade-in hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
            style={{ animationDelay: delay }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${isFire ? 'from-orange-500/20 to-red-500/20' : 'from-purple-500/10 to-pink-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${isFire ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 text-orange-300' : 'bg-white/10 text-slate-200'}`}>
                <span className={isFire ? 'animate-pulse' : ''}>{icon}</span>
            </div>
            <div className="relative z-10 flex-1">
                <div className={`font-black text-lg transition-colors duration-300 ${isFire ? 'text-orange-400 group-hover:text-orange-300' : 'text-white'}`}>{title}</div>
                <div className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">{desc}</div>
            </div>
            <div className="relative text-white/30 group-hover:text-white/60 transition-all duration-300 group-hover:translate-x-1">
                <span className="text-xl">→</span>
            </div>
        </Link>
    );
}
