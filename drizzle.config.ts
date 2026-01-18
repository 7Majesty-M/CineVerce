import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' }); // или .env

export default defineConfig({
  schema: "./src/db/schema.ts", // Тут будем писать таблицы
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
