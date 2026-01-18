// src/app/match/page.tsx
import StartMatchButton from '@/components/StartMatchButton';

export default function MatchLobby() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🔥</div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Кино-Матч</h1>
        <p className="text-slate-400 max-w-md mb-10 text-lg">
            Не можете договориться, что посмотреть? <br/>
            Создайте комнату, скиньте ссылку другу и свайпайте фильмы. Мы покажем, когда вкусы совпадут.
        </p>
        
        <StartMatchButton />
    </div>
  )
}
