// src/db/schema.ts
import { pgTable, text, integer, timestamp, uniqueIndex, serial, real, jsonb, primaryKey, boolean } from "drizzle-orm/pg-core";

// 1. Таблица Пользователей
export const users = pgTable("users", {
  id: text("id").primaryKey(), // ID от Clerk
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Таблица Отзывов/Рейтингов
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  
  // Связь с таблицей пользователей
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // ID медиа из TMDB
  mediaId: integer("media_id").notNull(),
  
  // Тип медиа: 'movie' или 'tv'
  mediaType: text("media_type").notNull(),
  
  // Номер сезона (может быть null для фильмов)
  seasonNumber: integer("season_number"),
  
  // Итоговая оценка (например, 8.5). Используем real для дробных чисел.
  rating: real("rating").notNull(), 
  
  // НОВОЕ ПОЛЕ: Детализация оценки (JSON)
  details: jsonb("details").$type<{
    plot: number;
    acting: number;
    visuals: number;
    sound: number;
    characters: number;
    atmosphere: number;
    ending: number;
    originality: number;
  }>(),

  comment: text("comment"), // Комментарий (пока можно оставить пустым)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  // Уникальный индекс, чтобы не было дублей оценок
  unq: uniqueIndex("unique_rating_idx").on(t.userId, t.mediaId, t.mediaType, t.seasonNumber),
}));

export const follows = pgTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  // Составной первичный ключ (чтобы нельзя было подписаться дважды)
  pk: primaryKey({ columns: [t.followerId, t.followingId] }),
}));

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  mediaId: integer("media_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie' или 'tv'
  
  // Статус (пока сделаем просто "добавлено", но заложим на будущее)
  status: text("status").default('planned'), // 'planned', 'watching', 'completed', 'dropped'
  
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  // Нельзя добавить один фильм дважды
  unq: uniqueIndex("unique_watchlist_item").on(t.userId, t.mediaId, t.mediaType),
}));

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Мое любимое", "На вечер"
  description: text("description"),
  
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPublic: boolean("is_public").default(false), // Можно ли кидать ссылку кому угодно
  
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. УЧАСТНИКИ СПИСКА (КТО ИМЕЕТ ДОСТУП)
export const listMembers = pgTable("list_members", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => lists.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  role: text("role").default('viewer'), // 'admin', 'editor', 'viewer'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => ({
  unq: uniqueIndex("unique_list_member").on(t.listId, t.userId),
}));

// 7. ЭЛЕМЕНТЫ СПИСКА (ФИЛЬМЫ)
export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => lists.id, { onDelete: 'cascade' }),
  
  mediaId: integer("media_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie' | 'tv'
  
  addedBy: text("added_by").notNull().references(() => users.id),
  comment: text("comment"), // "Давай это глянем!"
  
  // Голосование (простая сумма)
  votesUp: integer("votes_up").default(0),
  votesDown: integer("votes_down").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchSessions = pgTable("match_sessions", {
  id: text("id").primaryKey(), // Генерируем случайный код (напр. "xy9z")
  creatorId: text("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// 9. ЛАЙКИ В СЕССИИ
export const matchVotes = pgTable("match_votes", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => matchSessions.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id),
  
  mediaId: integer("media_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie'
  
  vote: boolean("vote").notNull(), // true = like, false = dislike
  
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  // Один юзер голосует за фильм один раз в рамках сессии
  unq: uniqueIndex("unique_session_vote").on(t.sessionId, t.userId, t.mediaId),
}));