import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Таблица уровней (XP для достижения уровня)
// Уровень 1: 0-500
// Уровень 2: 500-1200
// Уровень 3: 1200-2000
const getLevelThreshold = (level: number) => {
  return level * 500 + (level * level * 100); // Простая прогрессия
};

export async function addXpToUser(userId: string, amount: number) {
  // 1. Получаем текущего юзера
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);


  if (!user) return;

  let newXp = user.xp + amount;
  let newLevel = user.level;
  let leveledUp = false;

  // 2. Проверяем Level Up
  const nextLevelThreshold = getLevelThreshold(newLevel);
  
  if (newXp >= nextLevelThreshold) {
    newLevel += 1;
    newXp = newXp - nextLevelThreshold; // Оставляем остаток или копим дальше
    
    // НАГРАДА ЗА УРОВЕНЬ
    leveledUp = true;
  }

  // 3. Обновляем БД
  await db.update(users).set({
    xp: newXp,
    level: newLevel,
  }).where(eq(users.id, userId));

  return { leveledUp, newLevel };
}
