// src/app/actions.ts
'use server';
import { count } from 'drizzle-orm'; 
import { db } from '@/db';
import { reviews, follows, users, lists, listMembers, listItems  } from '@/db/schema';
import { auth, clerkClient } from '@clerk/nextjs/server'; // Добавили clerkClient
import { revalidatePath } from 'next/cache';
import { eq, and, desc } from 'drizzle-orm'; // <-- Добавил desc
import { searchMulti } from '@/lib/tmdb';
import { watchlist } from '@/db/schema';
import { matchSessions, matchVotes } from '@/db/schema';
import { nanoid } from 'nanoid'; // Или просто Math.random
import { getMovieById } from '@/lib/tmdb';
import { having, gt } from 'drizzle-orm'; // Добавь эти импорты!
// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: СИНХРОНИЗАЦИЯ ---
// Проверяет, есть ли юзер в базе Neon. Если нет — создает копию из Clerk.
async function syncUser(userId: string) {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    const email = clerkUser.emailAddresses[0]?.emailAddress || "no-email";
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "User";

    await db.insert(users).values({
      id: userId,
      email: email,
      name: name,
      imageUrl: clerkUser.imageUrl,
    })
    .onConflictDoUpdate({ 
      target: users.id,
      set: { name, email, imageUrl: clerkUser.imageUrl }
    });
  } catch (e) {
    console.error(`Error syncing user ${userId}:`, e);
  }
}

// --- 1. СОХРАНЕНИЕ РЕЙТИНГА ---
export async function saveMediaRating(data: {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber: number;
  ratings: {
    plot: number;
    acting: number;
    visuals: number;
    sound: number;
    characters: number;
    atmosphere: number;
    ending: number;
    originality: number;
  };
  average: number;
}) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Вы не авторизованы' };
  }

  try {
    // ВАЖНО: Сначала синхронизируем пользователя, чтобы не было ошибки FK
    await syncUser(userId);

    console.log(`💾 Сохраняем в БД: User ${userId}, Show ${data.mediaId}, Season ${data.seasonNumber}, Avg ${data.average}`);

    const existingRecords = await db.select()
      .from(reviews)
      .where(and(
        eq(reviews.userId, userId),
        eq(reviews.mediaId, data.mediaId),
        eq(reviews.mediaType, data.mediaType),
        eq(reviews.seasonNumber, data.seasonNumber)
      ))
      .limit(1);

    const existing = existingRecords[0];

    if (existing) {
      // ОБНОВЛЕНИЕ
      await db.update(reviews)
        .set({
          rating: data.average,
          details: data.ratings,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existing.id));
    } else {
      // СОЗДАНИЕ
      await db.insert(reviews).values({
        userId: userId,
        mediaId: data.mediaId,
        mediaType: data.mediaType,
        seasonNumber: data.seasonNumber,
        rating: data.average,
        details: data.ratings,
      });
    }

    // Сброс кэша
    const path = data.mediaType === 'movie' ? `/movie/${data.mediaId}` : `/tv/${data.mediaId}`;
    revalidatePath(path);
    
    return { success: true };

  } catch (error) {
    console.error('🔥 Ошибка базы данных:', error);
    return { success: false, error: 'Ошибка сохранения в базу данных' };
  }
}

// --- 2. ПОИСК (Proxy для Client Components) ---
export async function searchMultiAction(query: string) {
  return await searchMulti(query);
}

// --- 3. ПОДПИСКИ ---
export async function toggleFollow(targetUserId: string) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) return { success: false, error: "Unauthorized" };
  if (currentUserId === targetUserId) return { success: false, error: "Cannot follow yourself" };

  try {
    // ВАЖНО: Синхронизируем обоих пользователей перед созданием связи
    await Promise.all([
      syncUser(currentUserId),
      syncUser(targetUserId)
    ]);

    // Проверяем, подписаны ли мы уже
    const existingFollow = await db.select()
      .from(follows)
      .where(and(
        eq(follows.followerId, currentUserId),
        eq(follows.followingId, targetUserId)
      ))
      .limit(1);

    if (existingFollow.length > 0) {
      // УЖЕ ПОДПИСАН -> ОТПИСЫВАЕМСЯ
      await db.delete(follows)
        .where(and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, targetUserId)
        ));
      
      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, isFollowing: false };
    } else {
      // НЕ ПОДПИСАН -> ПОДПИСЫВАЕМСЯ
      await db.insert(follows).values({
        followerId: currentUserId,
        followingId: targetUserId,
      });

      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error("Follow error:", error);
    return { success: false, error: "Database error" };
  }
}
export async function getProfileStats(userId: string) {
  try {
    const followers = await db.select({ count: count() }).from(follows).where(eq(follows.followingId, userId));
    const following = await db.select({ count: count() }).from(follows).where(eq(follows.followerId, userId));
    
    return { 
      followers: followers[0].count,
      following: following[0].count
    };
  } catch (e) {
    return null;
  }
}

export async function toggleWatchlist(mediaId: number, mediaType: 'movie' | 'tv') {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await syncUser(userId); // На всякий случай

    // Проверяем, есть ли уже в списке
    const existing = await db.select()
      .from(watchlist)
      .where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.mediaId, mediaId),
        eq(watchlist.mediaType, mediaType)
      ))
      .limit(1);

    if (existing.length > 0) {
      // УДАЛЯЕМ
      await db.delete(watchlist)
        .where(eq(watchlist.id, existing[0].id));
      
      revalidatePath(`/${mediaType}/${mediaId}`);
      revalidatePath(`/profile/${userId}`); // Обновляем профиль тоже
      return { success: true, added: false };
    } else {
      // ДОБАВЛЯЕМ
      await db.insert(watchlist).values({
        userId,
        mediaId,
        mediaType,
        status: 'planned'
      });

      revalidatePath(`/${mediaType}/${mediaId}`);
      revalidatePath(`/profile/${userId}`);
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Watchlist error:", error);
    return { success: false, error: "DB Error" };
  }
}

export async function createList(name: string, description: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await syncUser(userId); // Страхуемся, что юзер есть

    // 1. Создаем список
    const newList = await db.insert(lists).values({
      name,
      description,
      ownerId: userId,
      isPublic: false
    }).returning({ id: lists.id });

    const listId = newList[0].id;

    // 2. Добавляем владельца как участника (чтобы он видел этот список в "Мои списки")
    await db.insert(listMembers).values({
      listId,
      userId,
      role: 'admin'
    });

    revalidatePath('/lists');
    return { success: true, listId };

  } catch (error) {
    console.error("Create List Error:", error);
    return { success: false, error: "DB Error" };
  }
}

export async function addMemberToList(listId: number, email: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        // 1. Ищем юзера по email (ИСПРАВЛЕНО: db.select вместо db.query)
        const userResult = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        const targetUser = userResult[0];

        if (!targetUser) return { success: false, error: "Пользователь с таким email не найден" };

        // 2. Добавляем в список
        await db.insert(listMembers).values({
            listId,
            userId: targetUser.id,
            role: 'editor'
        });

        revalidatePath(`/lists/${listId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        // Скорее всего ошибка уникальности (уже добавлен)
        return { success: false, error: "Пользователь уже в списке" };
    }
}
// --- УДАЛИТЬ ФИЛЬМ ИЗ СПИСКА ---
export async function removeListMedia(itemId: number, listId: number) {
    // В реальном проекте тут нужна проверка прав (является ли юзер участником списка)
    await db.delete(listItems).where(eq(listItems.id, itemId));
    revalidatePath(`/lists/${listId}`);
}

export async function toggleListItem(listId: number, mediaId: number, mediaType: 'movie' | 'tv') {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    // Проверяем, есть ли фильм в списке
    const existing = await db.select()
      .from(listItems)
      .where(and(
        eq(listItems.listId, listId),
        eq(listItems.mediaId, mediaId),
        eq(listItems.mediaType, mediaType)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Удаляем
      await db.delete(listItems).where(eq(listItems.id, existing[0].id));
      revalidatePath(`/lists/${listId}`);
      return { success: true, added: false };
    } else {
      // Добавляем
      await db.insert(listItems).values({
        listId,
        mediaId,
        mediaType,
        addedBy: userId
      });
      revalidatePath(`/lists/${listId}`);
      return { success: true, added: true };
    }
  } catch (e) {
    return { success: false, error: "Error" };
  }
}

// --- ПОЛУЧИТЬ МОИ СПИСКИ (ДЛЯ DROPDOWN) ---
// Это можно вызывать прямо из Server Component, но для клиентского удобнее так
export async function getMyListsForDropdown(mediaId: number, mediaType: 'movie' | 'tv') {
    const { userId } = await auth();
    if (!userId) return [];

    // 1. Получаем все списки юзера
    const myLists = await db.select({
        id: lists.id,
        name: lists.name,
    })
    .from(listMembers)
    .innerJoin(lists, eq(listMembers.listId, lists.id))
    .where(eq(listMembers.userId, userId))
    .orderBy(desc(lists.createdAt));

    // 2. Проверяем, в каких списках УЖЕ есть этот фильм
    // Это нужно, чтобы поставить галочки
    const containedIn = await db.select({ listId: listItems.listId })
        .from(listItems)
        .where(and(
            eq(listItems.mediaId, mediaId),
            eq(listItems.mediaType, mediaType),
            // Опционально: можно добавить проверку, что это именно мои списки,
            // но в целом listItems хранит просто связь
        ));
    
    const containedIds = new Set(containedIn.map(i => i.listId));

    return myLists.map(list => ({
        ...list,
        hasMedia: containedIds.has(list.id)
    }));
}

export async function createMatchSession() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  // Генерируем короткий ID (можно использовать crypto.randomUUID().slice(0,6))
  const sessionId = Math.random().toString(36).substring(2, 8);

  try {
    await db.insert(matchSessions).values({
      id: sessionId,
      creatorId: userId,
    });
    return { success: true, sessionId };
  } catch (e) {
    return { success: false };
  }
}

// Проверка совпадения (вызывается после каждого лайка)
export async function checkMatch(sessionId: string, mediaId: number) {
    // Считаем сколько лайков у этого фильма в этой сессии
    const likes = await db.select({ count: count() })
        .from(matchVotes)
        .where(and(
            eq(matchVotes.sessionId, sessionId),
            eq(matchVotes.mediaId, mediaId),
            eq(matchVotes.vote, true)
        ));
    
    // Если лайков >= 2, значит это МАТЧ!
    return likes[0].count >= 2;
}

export async function submitMatchVote(sessionId: string, mediaId: number, vote: boolean) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    await syncUser(userId);

    // 1. Сохраняем голос
    await db.insert(matchVotes).values({
      sessionId,
      userId,
      mediaId,
      mediaType: 'movie', // Пока только фильмы
      vote
    })
    .onConflictDoNothing(); // Игнорируем, если уже голосовал

    // 2. Если это ЛАЙК, проверяем совпадение
    if (vote) {
        const likes = await db.select({ count: count() })
            .from(matchVotes)
            .where(and(
                eq(matchVotes.sessionId, sessionId),
                eq(matchVotes.mediaId, mediaId),
                eq(matchVotes.vote, true)
            ));
        
        // Если 2 или более лайков — это МАТЧ!
        if (likes[0].count >= 2) {
            return { success: true, isMatch: true };
        }
    }

    return { success: true, isMatch: false };

  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function checkSessionMatches(sessionId: string) {
  try {
    // Ищем фильмы, где vote=true И количество >= 2
    // В Drizzle groupBy/having выглядит так:
    const matches = await db.select({
        mediaId: matchVotes.mediaId,
        count: count()
    })
    .from(matchVotes)
    .where(and(
        eq(matchVotes.sessionId, sessionId),
        eq(matchVotes.vote, true)
    ))
    .groupBy(matchVotes.mediaId)
    .having(gt(count(), 1)); // Больше 1 (то есть 2 и больше)

    if (matches.length > 0) {
        // Если нашли совпадение — берем последнее (или любое)
        const mediaId = matches[0].mediaId;
        
        // Получаем инфо о фильме для красивой карточки
        const movie = await getMovieById(String(mediaId));
        return { success: true, match: movie };
    }

    return { success: false, match: null };
  } catch (e) {
    return { success: false, match: null };
  }
}