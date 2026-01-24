import { db } from '@/db';
import { reviews, favorites } from '@/db/schema'; // <--- Добавил favorites
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/auth'; // <--- NextAuth
import { getMovieById, getTVShowById } from '@/lib/tmdb'; // <--- Импорт для подгрузки картинок

// 1. ПОЛУЧЕНИЕ РЕЙТИНГОВ ПОЛЬЗОВАТЕЛЯ ДЛЯ КОНКРЕТНОГО ФИЛЬМА
export async function getUserRatings(mediaId: number, mediaType: 'movie' | 'tv') {
  const session = await auth();
  const userId = session?.user?.id;

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

// 2. ПОЛУЧЕНИЕ ДЕТАЛЕЙ РЕЦЕНЗИИ (ДЛЯ ФОРМЫ)
export async function getUserReview(mediaId: number, mediaType: 'movie' | 'tv', seasonNumber: number) {
  const session = await auth();
  const userId = session?.user?.id;

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
        eq(reviews.mediaType, mediaType),
        eq(reviews.seasonNumber, seasonNumber)
      )
    )
    .orderBy(desc(reviews.updatedAt))
    .limit(1);

    if (result.length > 0 && result[0].details) {
      const rawDetails = result[0].details;
      
      // Парсим JSON, если это строка
      if (typeof rawDetails === 'string') {
        try {
          const parsed = JSON.parse(rawDetails);
          return parsed;
        } catch (e) {
          return null;
        }
      }
      return rawDetails;
    } 
    
    return null;
  } catch (error) {
    return null;
  }
}

// 3. ПОЛУЧЕНИЕ ОБЩЕЙ СТАТИСТИКИ (ВСЕ РЕЦЕНЗИИ)
export async function getUserStats() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return []; 

  try {
    const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));
    return userReviews;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return [];
  }
}

// 4. НОВАЯ ФУНКЦИЯ: ПОЛУЧЕНИЕ ИЗБРАННОГО (С ПОДГРУЗКОЙ КАРТИНОК)
export async function getUserFavorites(targetUserId: string) {
    try {
        const userFavoritesRaw = await db.select()
            .from(favorites)
            .where(eq(favorites.userId, targetUserId));

        // Обогащаем данными из TMDB (картинки, названия)
        const userFavorites = await Promise.all(
            userFavoritesRaw.map(async (item) => {
                let mediaData: any = null;
                try {
                    if (item.mediaType === 'movie') {
                        mediaData = await getMovieById(String(item.mediaId));
                    } else {
                        mediaData = await getTVShowById(String(item.mediaId));
                    }
                } catch (e) {
                    console.error(`Error fetching TMDB data for fav item ${item.mediaId}`, e);
                }

                const safeData = mediaData as any;

                return {
                    ...item,
                    posterPath: safeData?.poster_path,
                    title: safeData?.title || safeData?.name || 'Неизвестно',
                };
            })
        );

        return userFavorites;
    } catch (error) {
        console.error("Error fetching user favorites:", error);
        return [];
    }
}
