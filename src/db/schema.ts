// src/db/schema.ts
import { pgTable, text, integer, timestamp, uniqueIndex, serial, real, jsonb, primaryKey, boolean, date } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import { relations } from 'drizzle-orm';

// 1. Таблица Пользователей
export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  xp: integer("xp").default(0).notNull(),           // Опыт
  level: integer("level").default(1).notNull(),     // Уровень (1, 2, 3...)
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  
  // 🔥 НОВЫЕ ПОЛЯ (Добавь их):
  ip: text("ip"),               // IP адрес
  userAgent: text("user_agent"), // Браузер и ОС (строка)
  lastActive: timestamp("last_active", { mode: "date" }).defaultNow(), // Время последнего входа
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

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

export const watchedHistory = pgTable('watched_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaId: integer('media_id').notNull(),   // ID фильма из TMDB
  mediaType: text('media_type').notNull(),  // 'movie' или 'tv'
  watchedAt: date('watched_at').notNull(),  // Дата просмотра (именно день)
  createdAt: timestamp('created_at').defaultNow(),
});

// Связи (если нужно)
export const watchedHistoryRelations = relations(watchedHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchedHistory.userId],
    references: [users.id],
  }),
}));

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(), // 'movie' | 'tv'
  
  slotIndex: integer('slot_index').notNull(), // 0, 1, 2, 3 (позиция)
}, (t) => ({
  // Один слот - один фильм для юзера
  unq: uniqueIndex('unique_user_slot').on(t.userId, t.slotIndex),
}));
