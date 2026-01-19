'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButtons from '@/components/AuthButtons';
import GlobalSearch from '@/components/GlobalSearch';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession(); // Получаем сессию, чтобы показать профиль

  // Закрываем меню при переходе на другую страницу
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Блокируем скролл
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          
          {/* ЛОГОТИП */}
          <Link href="/" className="flex items-center gap-4 group cursor-pointer z-[60]">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 opacity-80 blur group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-300">
                <span className="text-xl">🎬</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-pink-500 transition-all">
                CineVerse
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 group-hover:text-white/50 transition-colors uppercase">Premium</span>
            </div>
          </Link>
          
          {/* ДЕСКТОПНОЕ МЕНЮ */}
          <div className="hidden md:flex items-center gap-4">
            <GlobalSearch />
            
            <Link href="/match" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-pink-400 hover:bg-white/5 transition-all group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
              Матч
            </Link>

            <Link href="/lists" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Списки
            </Link>

            <AuthButtons />
          </div>

          {/* МОБИЛЬНАЯ КНОПКА (БУРГЕР) */}
          <div className="flex items-center gap-4 md:hidden">
             <GlobalSearch />
             
             <button 
                className="p-2 text-white z-[60] relative focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                    <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                    <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
                </div>
            </button>
          </div>

        </div>
      </nav>

      {/* МОБИЛЬНОЕ МЕНЮ (OVERLAY) */}
      <div className={`fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-3xl transition-all duration-500 md:hidden flex flex-col justify-center items-center gap-8 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          
          <div className="absolute top-0 right-0 p-32 w-full h-full bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>

          <div className={`flex flex-col items-center gap-4 w-full px-6 max-w-sm transition-all duration-500 delay-100 ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              
              {/* ПРОФИЛЬ (Если залогинен) */}
              {session?.user && (
                  <Link href="/profile" className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#111] border border-white/10 p-4 rounded-2xl flex items-center gap-4 mb-4 active:scale-95 transition-all shadow-lg">
                      <img src={session.user.image || ''} className="w-14 h-14 rounded-full border-2 border-white/10" alt="Avatar" />
                      <div>
                          <h3 className="text-lg font-bold text-white">{session.user.name}</h3>
                          <p className="text-xs text-slate-400 font-medium">Перейти в профиль →</p>
                      </div>
                  </Link>
              )}

              <Link href="/match" className="w-full bg-[#151515] border border-white/5 hover:border-pink-500/30 p-5 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-xl">🔥</div>
                      <span className="text-lg font-bold text-slate-200">Кино-Матч</span>
                  </div>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>

              <Link href="/lists" className="w-full bg-[#151515] border border-white/5 hover:border-yellow-500/30 p-5 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xl">📁</div>
                      <span className="text-lg font-bold text-slate-200">Коллекции</span>
                  </div>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>

              <div className="w-full h-px bg-white/5 my-4"></div>

              {/* Кнопки входа/выхода */}
              <div className="w-full flex justify-center">
                  <AuthButtons />
              </div>
          </div>
      </div>
    </>
  )
}
