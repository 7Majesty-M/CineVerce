// src/app/actions.ts
'use server';
import { addXpToUser } from '@/lib/gamification';
import { db } from '@/db';
import { watchedHistory } from '@/db/schema';
import { reviews, follows, users, lists, listMembers, listItems, watchlist, matchSessions, matchVotes } from '@/db/schema';
import { auth } from '@/auth'; // NextAuth
import { revalidatePath } from 'next/cache';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getMovieById, searchMulti, getPopularMovies, getPopularTVShows } from '@/lib/tmdb';
import { favorites } from '@/db/schema';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
export async function updateListName(listId: number, newName: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || !newName.trim()) {
    return { success: false, error: 'Invalid data' };
  }

  // Проверяем, админ ли пользователь
  const membership = await db.select()
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
    .limit(1);

  const isMemberAdmin = membership[0]?.role === 'admin';
  
  // Дополнительная проверка: владелец списка (если вы храните ownerId в lists)
  // Но обычно проверки role === 'admin' достаточно, если создатель получает админку сразу.

  if (!isMemberAdmin) {
    return { success: false, error: 'Forbidden' };
  }

  await db.update(lists)
    .set({ name: newName.trim() })
    .where(eq(lists.id, listId));

  revalidatePath(`/lists/${listId}`);
  return { success: true };
}

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

const ITEMS_PER_PAGE = 24; // <-- ТВОЕ ЧИСЛО

// Вспомогательная функция для "умной" нарезки
async function getPaginatedBatch(page: number, fetchFn: (p: number) => Promise<any[]>) {
  // 1. Считаем глобальные индексы, которые нам нужны
  // Например, для 1-й страницы: нужны элементы 0...24
  // Для 2-й страницы: нужны элементы 24...48
  const startGlobalIndex = (page - 1) * ITEMS_PER_PAGE;
  const endGlobalIndex = startGlobalIndex + ITEMS_PER_PAGE;

  // 2. Считаем, на каких страницах TMDB (по 20 шт) лежат эти данные
  const startTmdbPage = Math.floor(startGlobalIndex / 20) + 1;
  const endTmdbPage = Math.floor((endGlobalIndex - 1) / 20) + 1;

  // 3. Загружаем все нужные страницы TMDB параллельно
  const promises = [];
  for (let i = startTmdbPage; i <= endTmdbPage; i++) {
    promises.push(fetchFn(i));
  }
  
  const results = await Promise.all(promises);
  
  // 4. Склеиваем всё в один массив
  const flattenedItems = results.flat();

  // 5. Вырезаем только нужные 24 штуки
  // Нам нужно понять смещение относительно первой загруженной страницы TMDB
  const globalStartIndexOwLoadedChunk = (startTmdbPage - 1) * 20;
  const localStartIndex = startGlobalIndex - globalStartIndexOwLoadedChunk;
  
  return flattenedItems.slice(localStartIndex, localStartIndex + ITEMS_PER_PAGE);
}

// --- 7. ОБНОВЛЕННЫЕ ACTIONS ---

export async function fetchMoreMovies(page: number) {
  return await getPaginatedBatch(page, getPopularMovies);
}

export async function fetchMoreTVShows(page: number) {
  return await getPaginatedBatch(page, getPopularTVShows);
}
// Типы категорий для TMDB
type MovieCategory = 'popular' | 'top_rated' | 'upcoming' | 'now_playing';
type TVCategory = 'popular' | 'top_rated' | 'on_the_air' | 'airing_today';

export async function getMediaCollection(type: 'movie' | 'tv', category: MovieCategory | TVCategory) {
  const endpoint = `/${type}/${category}`;
  
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    language: 'ru-RU',
    page: '1',
    region: 'RU' // Опционально: чтобы получать даты выхода для региона (актуально для Now Playing)
  });

  try {
    const res = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`, { next: { revalidate: 3600 * 4 } }); // Кэш на 4 часа
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching ${type} collection ${category}:`, error);
    return [];
  }
}
// Карта перевода жанров: Movie ID -> TV ID
const MOVIE_TO_TV_GENRE_MAP: Record<string, string> = {
  '28': '10759',    // Action -> Action & Adventure
  '12': '10759',    // Adventure -> Action & Adventure
  '16': '16',       // Animation (совпадает)
  '35': '35',       // Comedy (совпадает)
  '80': '80',       // Crime (совпадает)
  '99': '99',       // Documentary (совпадает)
  '18': '18',       // Drama (совпадает)
  '10751': '10751', // Family (совпадает)
  '14': '10765',    // Fantasy -> Sci-Fi & Fantasy
  '36': '9648',     // History -> Mystery (ближайшее, или пропускаем)
  '27': '9648',     // Horror -> Mystery (в TV нет чистого Horror, часто это Mystery)
  '10402': '10402', // Music
  '9648': '9648',   // Mystery
  '10749': '10766', // Romance -> Soap (или Drama 18)
  '878': '10765',   // Sci-Fi -> Sci-Fi & Fantasy
  '10770': '10770', // TV Movie
  '53': '10759',    // Thriller -> Action & Adventure (или Crime 80)
  '10752': '10768', // War -> War & Politics
  '37': '37',       // Western
};

export async function getMoviesByGenre(genreId: string, page: number = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  const isAll = !genreId || genreId === 'all';

  const baseParams = {
    api_key: apiKey!,
    language: 'ru-RU',
    page: page.toString(),
    include_adult: 'false',
  };

  try {
    let results: any[] = [];

    if (isAll) {
      // 1. СЦЕНАРИЙ "ВСЕ": Грузим тренды
      const res = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?${new URLSearchParams(baseParams)}`, 
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error('Failed to fetch trending');
      const data = await res.json();
      results = data.results;

    } else {
      // 2. СЦЕНАРИЙ "ЖАНР": Конвертируем ID и грузим параллельно
      
      // Определяем ID жанра для сериалов
      // Если точного соответствия нет, используем тот же ID (на удачу)
      const tvGenreId = MOVIE_TO_TV_GENRE_MAP[genreId] || genreId;

      const movieParams = new URLSearchParams({
        ...baseParams,
        sort_by: 'popularity.desc',
        with_genres: genreId,
      });

      const tvParams = new URLSearchParams({
        ...baseParams,
        sort_by: 'popularity.desc',
        with_genres: tvGenreId, // ИСПОЛЬЗУЕМ КОНВЕРТИРОВАННЫЙ ID
      });

      // Запрашиваем фильмы и сериалы параллельно
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?${movieParams}`, { next: { revalidate: 3600 } }),
        fetch(`https://api.themoviedb.org/3/discover/tv?${tvParams}`, { next: { revalidate: 3600 } })
      ]);

      const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
      const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

      // Добавляем метку типа
      const movies = moviesData.results.map((m: any) => ({ ...m, media_type: 'movie' }));
      const tvs = tvData.results.map((t: any) => ({ ...t, media_type: 'tv' }));

      // Объединяем и сортируем по популярности
      results = [...movies, ...tvs].sort((a, b) => b.popularity - a.popularity);
    }

    // 3. НОРМАЛИЗАЦИЯ
    return results.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      overview: item.overview,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
    }));

  } catch (error) {
    console.error('Genre Fetch Error:', error);
    return [];
  }
}

// Удаление списка
export async function deleteList(listId: number) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, message: 'Вы не авторизованы' };
  }

  try {
    // 1. Проверяем, что список принадлежит пользователю
    // Мы ищем список с таким ID и таким ownerId
    const listToDelete = await db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.ownerId, userId)))
      .limit(1);

    if (listToDelete.length === 0) {
      return { success: false, message: 'Список не найден или у вас нет прав на его удаление' };
    }

    // 2. Удаляем список
    // Благодаря onDelete: 'cascade' в schema.ts, 
    // все элементы списка (listItems) и участники (listMembers) удалятся АВТОМАТИЧЕСКИ.
    await db.delete(lists).where(eq(lists.id, listId));

    // 3. Обновляем кэш страницы со списками
    revalidatePath('/lists'); // Замените на путь, где у вас выводятся списки
    revalidatePath('/profile'); 

    return { success: true, message: 'Список удален' };
  } catch (error) {
    console.error('Ошибка при удалении списка:', error);
    return { success: false, message: 'Ошибка сервера' };
  }
}


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Функция получения данных
async function fetchMediaDetails(type: string, id: number) {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=ru-RU`,
      // Важно: отключаем кэширование, чтобы не получить старые ошибки,
      // или настраиваем revalidate, если нужно
      { next: { revalidate: 3600 } } 
    );
    
    if (!response.ok) {
        // Логируем ошибку, чтобы видеть в консоли сервера, почему не скачалось (например, 429)
        console.warn(`Failed to fetch ${type}/${id}: Status ${response.status}`);
        return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`Error fetching ${type}/${id}:`, e);
    return null;
  }
}

export async function exportList(listId: number) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, message: 'Вы не авторизованы' };
  }

  try {
    // 1. Получаем информацию о списке
    const listsData = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);

    const list = listsData[0];
    if (!list) return { success: false, message: 'Список не найден' };

    // 2. Получаем элементы из БД
    const dbItems = await db
      .select({
        mediaId: listItems.mediaId,
        mediaType: listItems.mediaType,
        comment: listItems.comment,
      })
      .from(listItems)
      .where(eq(listItems.listId, listId));

    // 3. ОБОГАЩАЕМ ДАННЫЕ (С БАТЧИНГОМ)
    
    const BATCH_SIZE = 10; // Сколько запросов отправлять одновременно
    const DELAY_MS = 200;  // Пауза между пачками (в мс)
    const enrichedItems = [];

    // Разбиваем массив на кусочки по 10 штук
    for (let i = 0; i < dbItems.length; i += BATCH_SIZE) {
        const chunk = dbItems.slice(i, i + BATCH_SIZE);
        
        // Обрабатываем пачку параллельно
        const chunkResults = await Promise.all(
            chunk.map(async (item) => {
                const details = await fetchMediaDetails(item.mediaType, item.mediaId);

                if (!details) {
                    return { ...item, error: 'Data not found (Check TMDB ID)' };
                }

                const title = details.title || details.name;
                const originalTitle = details.original_title || details.original_name;
                const releaseDate = details.release_date || details.first_air_date;
                
                return {
                    userComment: item.comment,
                    mediaType: item.mediaType,
                    mediaId: item.mediaId,
                    title: title,
                    originalTitle: originalTitle,
                    year: releaseDate ? releaseDate.split('-')[0] : 'N/A',
                    rating: details.vote_average ? Number(details.vote_average.toFixed(1)) : 0,
                    posterPath: details.poster_path,
                    overview: details.overview,
                };
            })
        );

        enrichedItems.push(...chunkResults);

        // Делаем паузу перед следующей пачкой, чтобы не злить API
        if (i + BATCH_SIZE < dbItems.length) {
            await delay(DELAY_MS);
        }
    }

    // 4. Формируем итог
    const exportData = {
      meta: {
        listName: list.name,
        description: list.description,
        totalItems: enrichedItems.length,
        exportedAt: new Date().toISOString(),
      },
      items: enrichedItems,
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Ошибка при формировании файла' };
  }
}

export async function logMovie(mediaId: number, mediaType: string, dateStr: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Нужна авторизация' };

  try {
    await db.insert(watchedHistory).values({
      userId: session.user.id,
      mediaId,
      mediaType,
      watchedAt: dateStr, // Ожидаем строку вида '2023-10-25'
    });
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Ошибка сохранения' };
  }
}
export async function logWatched(mediaId: number, mediaType: string, dateStr: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Нужна авторизация' };
  }

  try {
    // 1. ПРОВЕРКА НА ДУБЛИКАТЫ
    const existingEntry = await db.select()
      .from(watchedHistory)
      .where(and(
        eq(watchedHistory.userId, session.user.id),
        eq(watchedHistory.mediaId, mediaId),
        eq(watchedHistory.watchedAt, dateStr)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      return { 
        success: false, 
        message: 'Вы уже отметили этот фильм в эту дату.' 
      };
    }

    // 2. СОХРАНЯЕМ В ИСТОРИЮ
    await db.insert(watchedHistory).values({
      userId: session.user.id,
      mediaId,
      mediaType,
      watchedAt: dateStr,
    });

    // 3. 🔥 ГЕЙМИФИКАЦИЯ: Начисляем 50 XP
    // (Делаем это после сохранения, чтобы не начислить опыт, если база упадет)
    const xpResult = await addXpToUser(session.user.id, 50);

    // 4. ОБНОВЛЕНИЕ КЭША
    revalidatePath('/profile'); 
    revalidatePath(`/movie/${mediaId}`);
    revalidatePath(`/tv/${mediaId}`);

    // 5. ВОЗВРАЩАЕМ РЕЗУЛЬТАТ С ДАННЫМИ ОБ ОПЫТЕ
    return { 
      success: true,
      xpEarned: 50, // Сколько дали
      leveledUp: xpResult?.leveledUp || false, // Повысился ли уровень?
      newLevel: xpResult?.newLevel || 1,       // Какой теперь уровень?
    };

  } catch (error) {
    console.error('Log watched error:', error);
    return { success: false, message: 'Ошибка сохранения' };
  }
}
export async function searchForFavorites(query: string) {
  if (!query) return [];
  const apiKey = process.env.TMDB_API_KEY;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=ru-RU&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    // Фильтруем только фильмы и сериалы с картинками
    return data.results
      .filter((i: any) => (i.media_type === 'movie' || i.media_type === 'tv') && i.poster_path)
      .slice(0, 5); // Возвращаем топ-5
  } catch (e) {
    return [];
  }
}

// Сохранить фаворит
export async function setFavorite(mediaId: number, mediaType: string, slotIndex: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await db.insert(favorites).values({
      userId: session.user.id,
      mediaId,
      mediaType,
      slotIndex
    }).onConflictDoUpdate({
      target: [favorites.userId, favorites.slotIndex],
      set: { mediaId, mediaType }
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

// Удалить фаворит
export async function removeFavorite(slotIndex: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await db.delete(favorites).where(and(
      eq(favorites.userId, session.user.id),
      eq(favorites.slotIndex, slotIndex)
    ));
    revalidatePath('/profile');
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
export async function updateProfile(formData: FormData) {
  // 1. Проверяем, залогинен ли пользователь
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Вы не авторизованы' };
  }

  const userId = session.user.id;
  const name = formData.get('name') as string;
  const imageUrl = formData.get('imageUrl') as string;

  try {
    // 2. Обновляем данные в таблице users
    await db.update(users)
      .set({
        name: name || undefined, // Если пустая строка, не меняем
        image: imageUrl || undefined,
      })
      .where(eq(users.id, userId));

    // 3. Обновляем кэш, чтобы изменения отобразились мгновенно
    revalidatePath(`/profile/${userId}`); // Обновляем страницу профиля
    revalidatePath('/'); // Обновляем хедер на главной
    
    return { success: true };
  } catch (e) {
    console.error('Failed to update profile', e);
    return { error: 'Не удалось обновить профиль' };
  }
}