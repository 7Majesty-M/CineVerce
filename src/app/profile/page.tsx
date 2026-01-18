import { auth } from "@/auth"; // Наш конфиг NextAuth
import { redirect } from "next/navigation";

export default async function ProfileRedirector() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <p>Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  // Редирект на личный профиль
  redirect(`/profile/${userId}`);
}
