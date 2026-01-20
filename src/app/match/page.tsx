import StartMatchButton from '@/components/StartMatchButton';
import Navbar from '@/components/Navbar'; // Предполагаю, что у вас есть Navbar
import Link from 'next/link';

export default function MatchLobby() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-500/30 font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Фоновые пятна */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-rose-400 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Beta
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 delay-100">
            Найдите идеальный фильм <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500">
              без споров
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 delay-200">
            Потратили час на выбор фильма и ничего не посмотрели? <br className="hidden md:block"/>
            Кино-Матч решит эту проблему за 2 минуты. Свайпайте, совпадайте, смотрите.
          </p>

          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 delay-300">
            <div className="scale-110">
                <StartMatchButton />
            </div>
            <p className="text-xs text-slate-600">Регистрация не обязательна для гостей</p>
          </div>

        </div>
      </section>

      {/* --- DEMO VISUAL (Декоративный элемент) --- */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden mb-24 pointer-events-none select-none">
         <div className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center gap-8 opacity-50">
            {/* Карточка слева (Dislike) */}
            <div className="w-48 h-72 bg-slate-800 rounded-2xl border border-white/5 transform -rotate-12 translate-y-10 opacity-60 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-red-500/50 flex items-center justify-center text-red-500/50 text-4xl">✕</div>
            </div>
            {/* Карточка центр (Active) */}
            <div className="w-56 h-80 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl shadow-rose-500/20 transform rotate-0 z-10 flex flex-col overflow-hidden">
                <div className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900"></div>
                <div className="h-20 bg-black/60 backdrop-blur p-4">
                    <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                </div>
            </div>
            {/* Карточка справа (Like) */}
            <div className="w-48 h-72 bg-slate-800 rounded-2xl border border-white/5 transform rotate-12 translate-y-10 opacity-60 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-green-500/50 flex items-center justify-center text-green-500/50 text-4xl">♥</div>
            </div>
         </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <section className="container mx-auto px-6 lg:px-12 pb-32">
        <h2 className="text-2xl font-bold text-white mb-12 text-center flex items-center justify-center gap-3">
            <span className="w-12 h-1 bg-gradient-to-r from-transparent to-rose-500 rounded-full"></span>
            Как это работает
            <span className="w-12 h-1 bg-gradient-to-l from-transparent to-rose-500 rounded-full"></span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative group hover:border-rose-500/30 transition-colors">
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 font-black text-xl mb-6 group-hover:scale-110 transition-transform">1</div>
                <h3 className="text-xl font-bold text-white mb-3">Создайте комнату</h3>
                <p className="text-slate-400 leading-relaxed">
                    Настройте фильтры: жанры, год, рейтинг. Получите уникальную ссылку на сессию.
                </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative group hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 font-black text-xl mb-6 group-hover:scale-110 transition-transform">2</div>
                <h3 className="text-xl font-bold text-white mb-3">Пригласите друзей</h3>
                <p className="text-slate-400 leading-relaxed">
                    Отправьте ссылку партнеру или друзьям. Можно подключить сколько угодно человек.
                </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative group hover:border-green-500/30 transition-colors">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 font-black text-xl mb-6 group-hover:scale-110 transition-transform">3</div>
                <h3 className="text-xl font-bold text-white mb-3">It's a Match!</h3>
                <p className="text-slate-400 leading-relaxed">
                    Свайпайте фильмы. Как только фильм понравится всем участникам — мы сразу сообщим.
                </p>
            </div>

        </div>
      </section>

      {/* --- FEATURES --- */}
      <section className="border-t border-white/5 bg-[#0a0a0a] py-24">
        <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-6">Только то, что <br/>вам нравится</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">🚀</div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Быстро и просто</h4>
                                <p className="text-slate-400 text-sm">Никаких лишних регистраций. Нажали кнопку — начали выбирать.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">🎭</div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Гибкие фильтры</h4>
                                <p className="text-slate-400 text-sm">Хотите "Ужасы 80-х" или "Комедии 2024"? Настройте под настроение.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">📱</div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Мобильная версия</h4>
                                <p className="text-slate-400 text-sm">Идеально работает на телефонах. Свайпайте одним пальцем.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Декоративная сетка постеров */}
                <div className="relative h-[400px] rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-gray-900 to-black p-8 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 opacity-20"></div>
                    <div className="text-center relative z-10">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">🍿</div>
                        <h3 className="text-2xl font-bold text-white">Готовы начать?</h3>
                        <p className="text-slate-400 mb-6">Создайте комнату прямо сейчас</p>
                        <StartMatchButton />
                    </div>
                </div>
            </div>
        </div>
      </section>

    </div>
  )
}
