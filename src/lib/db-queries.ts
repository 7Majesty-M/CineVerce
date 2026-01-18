import { db } from '@/db';
import { reviews } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc } from 'drizzle-orm';

export async function getUserRatings(mediaId: number, mediaType: 'movie' | 'tv') {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const userReviews = await db.select({
      seasonNumber: reviews.seasonNumber,
      rating: reviews.rating,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.mediaId, mediaId),
        eq(reviews.mediaType, mediaType)
      )
    );

    return userReviews;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
}

// ФУНКЦИЯ ПОЛУЧЕНИЯ ДЕТАЛЕЙ ДЛЯ ФОРМЫ
export async function getUserReview(mediaId: number, mediaType: 'movie' | 'tv', seasonNumber: number) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const result = await db.select({
      details: reviews.details,
      rating: reviews.rating,
      updatedAt: reviews.updatedAt
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.mediaId, mediaId),
        eq(reviews.mediaType, mediaType), // Убедились, что фильтруем по типу
        eq(reviews.seasonNumber, seasonNumber)
      )
    )
    .orderBy(desc(reviews.updatedAt))
    .limit(1);

    if (result.length > 0 && result[0].details) {
      const rawDetails = result[0].details;

      // ❗ ФИКС ПРОБЛЕМЫ №2: Проверяем, не вернулась ли строка вместо объекта
      if (typeof rawDetails === 'string') {
        try {
          const parsed = JSON.parse(rawDetails);
          return parsed;
        } catch (e) {
          return null;
        }
      }
      
      // Если это уже объект
      return rawDetails;
    } 
    
    return null;

  } catch (error) {
    return null;
  }
}
export async function getUserStats() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Достаем все оценки пользователя
    const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));
    
    return userReviews;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return [];
  }
}