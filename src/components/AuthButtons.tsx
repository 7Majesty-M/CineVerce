'use client'; // <-- Делаем его клиентским!

import { auth, signIn, signOut } from "@/auth"; // Импорт из настройки NextAuth
import Link from "next/link";

export default async function AuthButtons() {
  const session = await auth();

  // 1. ЕСЛИ НЕ ЗАЛОГИНЕН -> ПОКАЗЫВАЕМ КНОПКУ ВХОДА
  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button className="relative group overflow-hidden px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-black hover:scale-105 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]">
          <span className="relative z-10">Войти</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </form>
    );
  }

  // 2. ЕСЛИ ЗАЛОГИНЕН -> ПОКАЗЫВАЕМ ПРОФИЛЬ И АВАТАРКУ
  return (
    <div className="flex items-center gap-4">
      {/* ССЫЛКА НА ПРОФИЛЬ */}
      <Link 
        href="/profile" 
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
      >
        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Мой профиль</span>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
      </Link>

      {/* АВАТАРКА + ВЫХОД */}
      <div className="flex items-center gap-3 pl-2 border-l border-white/10">
        {session.user.image ? (
            <img 
                src={session.user.image} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg"
            />
        ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs">?</div>
        )}
        
        {/* Кнопка выхода (иконка) */}
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button title="Выйти" className="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
