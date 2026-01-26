import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Расширяем глобальную область видимости
declare global {
  // var позволяет добавить свойство в globalThis
  var _db: ReturnType<typeof drizzle> | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  const sql = neon(connectionString);
  db = drizzle(sql, { schema });
} else {
  // Используем globalThis вместо global
  if (!globalThis._db) {
    const sql = neon(connectionString);
    globalThis._db = drizzle(sql, { schema });
  }
  db = globalThis._db;
}

export { db };
