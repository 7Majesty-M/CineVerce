'use server';

import { db } from '../db';
import { reviews, users } from '../db/schema';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Тип входных данных для действия
interface RatingInput {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number | null; // Может быть null для фильмов
  rating: number;
}

export async function submitRating({ mediaId, mediaType, seasonNumber = null, rating }: RatingInput) {
  // 1. Проверка авторизации
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized: Вы должны войти в систему.');
  }

  // 2. Синхронизация пользователя в локальную БД
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: user.firstName || user.username || 'Пользователь',
    })
    .onConflictDoNothing({ target: users.id });

  console.log(`Saving rating: User=${user.id}, Media=${mediaType}/${mediaId}, Season=${seasonNumber}, Rating=${rating}`);

  // 3. Сохранение рейтинга (UPSERT - Вставка или Обновление)
  // Мы используем магию PostgreSQL: ON CONFLICT DO UPDATE.
  // Конфликт определяется по нашему уникальному индексу в схеме (userId + mediaId + mediaType + seasonNumber).
  await db
    .insert(reviews)
    .values({
      userId: user.id,
      mediaId: mediaId,
      mediaType: mediaType,
      seasonNumber: seasonNumber,
      rating: rating,
    })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.mediaId, reviews.mediaType, reviews.seasonNumber],
      set: {
        rating: rating, // Обновляем только рейтинг
        createdAt: new Date(), // И дату
      },
    });

  // 4. Обновление кэша страниц
  // Обновляем страницу конкретного фильма или сериала
  revalidatePath(`/${mediaType}/${mediaId}`);
  // И главную на всякий случай
  revalidatePath('/');

  return { success: true };
}
