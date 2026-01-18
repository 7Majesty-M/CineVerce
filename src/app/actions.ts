// src/app/actions.ts
'use server';

import { db } from '@/db';
// Импортируем все таблицы
import { reviews, follows, users, lists, listMembers, listItems, watchlist, matchSessions, matchVotes } from '@/db/schema';
import { auth } from '@/auth'; // NextAuth
import { revalidatePath } from 'next/cache';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getMovieById, searchMulti } from '@/lib/tmdb';

// --- 1. РЕЙТИНГИ (Оценки) ---

export async function saveMediaRating(data: {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber: number;
  ratings: any; // JSON
  average: number;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
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
      await db.update(reviews)
        .set({
          rating: data.average,
          details: data.ratings,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values({
        userId: userId,
        mediaId: data.mediaId,
        mediaType: data.mediaType,
        seasonNumber: data.seasonNumber,
        rating: data.average,
        details: data.ratings,
      });
    }

    const path = data.mediaType === 'movie' ? `/movie/${data.mediaId}` : `/tv/${data.mediaId}`;
    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'DB Error' };
  }
}

// --- 2. ПОИСК ---

export async function searchMultiAction(query: string) {
  return await searchMulti(query);
}

// --- 3. СОЦИАЛЬНОЕ (Подписки) ---

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) return { success: false, error: "Unauthorized" };
  if (currentUserId === targetUserId) return { success: false, error: "Self follow" };

  try {
    const existingFollow = await db.select()
      .from(follows)
      .where(and(
        eq(follows.followerId, currentUserId),
        eq(follows.followingId, targetUserId)
      ))
      .limit(1);

    if (existingFollow.length > 0) {
      await db.delete(follows)
        .where(and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, targetUserId)
        ));
      
      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, isFollowing: false };
    } else {
      await db.insert(follows).values({
        followerId: currentUserId,
        followingId: targetUserId,
      });

      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, isFollowing: true };
    }
  } catch (error) {
    return { success: false, error: "DB Error" };
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

// --- 4. WATCHLIST (Буду смотреть) ---

export async function toggleWatchlist(mediaId: number, mediaType: 'movie' | 'tv') {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  try {
    const existing = await db.select()
      .from(watchlist)
      .where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.mediaId, mediaId),
        eq(watchlist.mediaType, mediaType)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(watchlist).where(eq(watchlist.id, existing[0].id));
      revalidatePath(`/${mediaType}/${mediaId}`);
      revalidatePath(`/profile/${userId}`);
      return { success: true, added: false };
    } else {
      await db.insert(watchlist).values({ userId, mediaId, mediaType, status: 'planned' });
      revalidatePath(`/${mediaType}/${mediaId}`);
      revalidatePath(`/profile/${userId}`);
      return { success: true, added: true };
    }
  } catch (error) {
    return { success: false };
  }
}

// --- 5. КОЛЛЕКЦИИ (Lists) ---

export async function createList(name: string, description: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  try {
    const newList = await db.insert(lists).values({
      name,
      description,
      ownerId: userId,
      isPublic: false
    }).returning({ id: lists.id });

    const listId = newList[0].id;

    // Автор = Админ
    await db.insert(listMembers).values({ listId, userId, role: 'admin' });

    revalidatePath('/lists');
    return { success: true, listId };
  } catch (e) {
    return { success: false };
  }
}

export async function getMyListsForDropdown(mediaId: number, mediaType: 'movie' | 'tv') {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    const myLists = await db.select({
        id: lists.id,
        name: lists.name,
    })
    .from(listMembers)
    .innerJoin(lists, eq(listMembers.listId, lists.id))
    .where(eq(listMembers.userId, userId))
    .orderBy(desc(lists.createdAt));

    const containedIn = await db.select({ listId: listItems.listId })
        .from(listItems)
        .where(and(
            eq(listItems.mediaId, mediaId),
            eq(listItems.mediaType, mediaType),
        ));
    
    const containedIds = new Set(containedIn.map(i => i.listId));

    return myLists.map(list => ({
        ...list,
        hasMedia: containedIds.has(list.id)
    }));
}

export async function toggleListItem(listId: number, mediaId: number, mediaType: 'movie' | 'tv') {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  try {
    const existing = await db.select()
      .from(listItems)
      .where(and(
        eq(listItems.listId, listId),
        eq(listItems.mediaId, mediaId),
        eq(listItems.mediaType, mediaType)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(listItems).where(eq(listItems.id, existing[0].id));
      revalidatePath(`/lists/${listId}`);
      return { success: true, added: false };
    } else {
      await db.insert(listItems).values({ listId, mediaId, mediaType, addedBy: userId });
      revalidatePath(`/lists/${listId}`);
      return { success: true, added: true };
    }
  } catch (e) {
    return { success: false };
  }
}

export async function addMemberToList(listId: number, email: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        // Ищем юзера в НАШЕЙ базе (NextAuth)
        const userResult = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        const targetUser = userResult[0];
        if (!targetUser) return { success: false, error: "Пользователь не найден (он должен войти на сайт хотя бы раз)" };

        await db.insert(listMembers).values({
            listId,
            userId: targetUser.id,
            role: 'editor'
        });
        revalidatePath(`/lists/${listId}`);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Уже в списке" };
    }
}

export async function removeListMedia(itemId: number, listId: number) {
    await db.delete(listItems).where(eq(listItems.id, itemId));
    revalidatePath(`/lists/${listId}`);
}

// --- 6. КИНО-МАТЧ (Tinder Style) ---

export async function createMatchSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  const sessionId = Math.random().toString(36).substring(2, 8); // Короткий ID

  try {
    await db.insert(matchSessions).values({ id: sessionId, creatorId: userId });
    return { success: true, sessionId };
  } catch (e) { return { success: false }; }
}

export async function submitMatchVote(sessionId: string, mediaId: number, vote: boolean) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false };

  try {
    await db.insert(matchVotes).values({
      sessionId, userId, mediaId, mediaType: 'movie', vote
    }).onConflictDoNothing();

    // Если лайк — проверяем совпадение
    if (vote) {
        const likes = await db.select({ count: count() })
            .from(matchVotes)
            .where(and(
                eq(matchVotes.sessionId, sessionId),
                eq(matchVotes.mediaId, mediaId),
                eq(matchVotes.vote, true)
            ));
        
        if (likes[0].count >= 2) return { success: true, isMatch: true };
    }
    return { success: true, isMatch: false };
  } catch (e) { return { success: false }; }
}

export async function checkSessionMatches(sessionId: string) {
  try {
    // Ищем фильм с >= 2 лайками
    const matches = await db.select({ mediaId: matchVotes.mediaId, count: count() })
        .from(matchVotes)
        .where(and(eq(matchVotes.sessionId, sessionId), eq(matchVotes.vote, true)))
        .groupBy(matchVotes.mediaId)
        .having(sql`count(*) >= 2`);

    if (matches.length > 0) {
        const movie = await getMovieById(String(matches[0].mediaId));
        return { success: true, match: movie };
    }
    return { success: false, match: null };
  } catch (e) { return { success: false }; }
}
