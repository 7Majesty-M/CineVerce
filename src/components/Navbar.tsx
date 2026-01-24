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
  const { data: session } = useSession();

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  return (
    <>
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
          
          {/* 1. ЛОГОТИП */}
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

          {/* 2. ЦЕНТРАЛЬНОЕ МЕНЮ (DOCK) */}
          <div className="hidden md:flex items-center p-1.5 gap-2 rounded-full bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl shadow-2xl relative">
            
            {/* Кнопка: Лента */}
            <NavButton 
                href="/feed" 
                active={pathname === '/feed'} 
                activeColor="shadow-[0_0_20px_rgba(34,211,238,0.5)]" // Cyan Glow
                hoverColor="hover:text-cyan-400 hover:bg-cyan-500/10"
            >
                Лента
            </NavButton>
            
            {/* Кнопка: Списки */}
            <NavButton 
                href="/lists" 
                active={pathname === '/lists'} 
                activeColor="shadow-[0_0_20px_rgba(52,211,153,0.5)]" // Emerald Glow
                hoverColor="hover:text-emerald-400 hover:bg-emerald-500/10"
            >
                Списки
            </NavButton>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            {/* Кнопка: Time Machine */}
            <Link 
              href="/time-machine" 
              className={`relative px-5 py-2 rounded-full text-[11px] uppercase font-black tracking-widest transition-all duration-300 flex items-center gap-2 overflow-hidden group/tm
                ${pathname === '/time-machine' 
                  ? 'bg-transparent text-white shadow-[0_0_25px_rgba(236,72,153,0.4)] border border-white/20' 
                  : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5'
                }
              `}
            >
                {/* Анимированный градиент при ховере */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover/tm:opacity-100 transition-opacity duration-500"></div>

                <span className={`relative z-10 transition-transform duration-500 ${pathname === '/time-machine' ? 'rotate-180' : 'group-hover/tm:rotate-180'}`}>⏳</span>
                <span className={`relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-300 group-hover/tm:from-white group-hover/tm:to-white transition-all`}>
                    Time Machine
                </span>
            </Link>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            {/* Кнопка: Матч */}
            <NavFire href="/match" active={pathname === '/match'}>Матч</NavFire>
          </div>

          {/* 3. ПРАВАЯ ЧАСТЬ (ПОИСК + ПРОФИЛЬ) - ВЕРНУЛ КАК БЫЛО */}
          <div className="hidden md:flex items-center gap-4">
            <GlobalSearch />
            <div className="h-8 w-px bg-white/10"></div>
            <AuthButtons />
          </div>

          {/* 4. МОБИЛЬНАЯ КНОПКА */}
          <div className="md:hidden flex items-center gap-4 z-[60]">
             {/* Для мобилки поиск можно чуть уменьшить, чтобы влезло */}
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

      {/* --- МОБИЛЬНОЕ МЕНЮ --- */}
      <div className={`fixed inset-0 z-50 bg-[#050505] transition-all duration-500 md:hidden flex flex-col pt-28 px-6 gap-6 ${isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
          <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none"></div>

          {session?.user ? (
            <Link href="/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 transition-transform relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img src={session.user.image || ''} className="w-14 h-14 rounded-full border border-white/20" alt="Avatar" />
                <div>
                    <div className="text-xl font-bold text-white">{session.user.name}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider group-hover:text-pink-400 transition-colors">Перейти в профиль →</div>
                </div>
            </Link>
          ) : (
            <div className="p-2 w-full"><AuthButtons /></div>
          )}

          <div className="grid gap-3">
              <MobileLink href="/feed" icon="📰" title="Лента новостей" desc="Ваша персональная подборка" delay="100ms" />
              
              <Link 
                  href="/time-machine" 
                  className="relative overflow-hidden w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 active:scale-95 transition-all animate-in slide-in-from-right-8 fade-in duration-500"
                  style={{ animationDelay: '200ms', background: 'linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(30,10,30,1) 100%)' }}
              >
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-lg relative z-10">⏳</div>
                  <div className="relative z-10">
                      <div className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">Time Machine</div>
                      <div className="text-[10px] text-purple-300/70 font-bold uppercase tracking-widest">Путешествие в прошлое</div>
                  </div>
              </Link>

              <MobileLink href="/match" icon="🔥" title="Кино-Матч" desc="Найди фильм по вкусу" delay="300ms" isFire />
              <MobileLink href="/lists" icon="📑" title="Списки" desc="Ваши коллекции и закладки" delay="400ms" />
          </div>
      </div>
    </>
  );
}

// --- СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ---

// 1. Улучшенная кнопка (Лента / Списки)
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

// 2. Кнопка Матч (Огонь)
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

// 3. Мобильная ссылка
function MobileLink({ href, icon, title, desc, delay, isFire }: any) {
    return (
        <Link 
            href={href} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-[#111] border border-white/5 active:scale-95 transition-all animate-in slide-in-from-right-8 fade-in duration-500 group ${isFire ? 'hover:border-orange-500/30' : 'hover:border-white/20'}`}
            style={{ animationDelay: delay }}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isFire ? 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20' : 'bg-white/5 text-slate-300 group-hover:bg-white/10'}`}>
                {icon}
            </div>
            <div>
                <div className={`font-bold text-lg ${isFire ? 'text-orange-400' : 'text-white'}`}>{title}</div>
                <div className="text-xs text-slate-500 font-medium group-hover:text-slate-300 transition-colors">{desc}</div>
            </div>
        </Link>
    );
}
