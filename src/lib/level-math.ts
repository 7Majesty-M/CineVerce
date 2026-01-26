// src/lib/level-math.ts

// Единая формула для всего приложения
export const getLevelThreshold = (level: number) => {
  return level * 500 + (level * level * 100);
};

// Хелпер для расчета процента (чтобы не писать Math.max/min везде)
export const calculateProgress = (currentXp: number, level: number) => {
  const nextLevelXp = getLevelThreshold(level);
  if (nextLevelXp === 0) return 100;
  return Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));
};
