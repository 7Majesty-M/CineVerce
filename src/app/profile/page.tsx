import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirector() {
  const { userId } = await auth();

  if (!userId) {
    // Если не залогинен, отправляем на страницу входа или просим войти
    // Можно использовать RedirectToSignIn от Clerk, но пока просто текст
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <p>Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  // Если залогинен — кидаем на публичный URL с ID
  redirect(`/profile/${userId}`);
}
