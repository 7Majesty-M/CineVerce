const KP_API_KEY = process.env.KINOPOISK_API_KEY; 
// Используем v2.1 для поиска по ключевым словам (он иногда лучше ищет по названиям)
// Но для ID лучше v2.2. Комбинируем подходы через универсальный fetch.
const KP_API_URL_SEARCH = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword';
const KP_API_URL_V22 = 'https://kinopoiskapiunofficial.tech/api/v2.2/films';

interface KpFilm {
  filmId: number;      // v2.1
  kinopoiskId: number; // v2.2
  nameRu?: string;
  nameEn?: string;
  year?: string | number;
}

// Универсальная функция запроса
async function fetchKp(url: string, params: string) {
  if (!KP_API_KEY) return null;
  try {
    const res = await fetch(`${url}?${params}`, {
      headers: { 'X-API-KEY': KP_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 86400 } // Кэш на сутки
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('KP API Error:', e);
    return null;
  }
}

interface SearchParams {
    imdbId?: string | null;
    originalTitle?: string;
    ruTitle?: string;
    year?: number;
}

export async function findKinopoiskId({ imdbId, originalTitle, ruTitle, year }: SearchParams): Promise<number | null> {
  
  // --- ЭТАП 1: Поиск по IMDb ID (v2.2) ---
  // Это самый надежный метод.
  if (imdbId) {
    const data = await fetchKp(KP_API_URL_V22, `keyword=${imdbId}`);
    if (data && data.items && data.items.length > 0) {
        // Проверяем строгое совпадение
        const match = data.items.find((i: any) => i.imdbId === imdbId);
        if (match) {
            console.log(`🎯 KP: Нашли точно по IMDb: ${match.kinopoiskId}`);
            return match.kinopoiskId;
        }
    }
  }

  // Если года нет, дальше искать по названиям опасно (будут ремейки)
  if (!year) return null;

  // Функция для проверки года (допускаем погрешность ±1 год)
  const isYearValid = (itemYear: any) => {
      if (!itemYear) return false;
      const y = typeof itemYear === 'string' ? parseInt(itemYear) : itemYear;
      return Math.abs(y - year) <= 1;
  };

  // --- ЭТАП 2: Поиск по Оригинальному названию (v2.1) ---
  // v2.1 лучше ищет по тексту
  if (originalTitle) {
    const data = await fetchKp(KP_API_URL_SEARCH, `keyword=${encodeURIComponent(originalTitle)}`);
    if (data && data.films && data.films.length > 0) {
        const match = data.films.find((f: KpFilm) => isYearValid(f.year));
        if (match) {
            console.log(`🎯 KP: Нашли по OrigTitle + Year: ${match.filmId}`);
            return match.filmId;
        }
    }
  }

  // --- ЭТАП 3: Поиск по Русскому названию (v2.1) ---
  // Если фильм французский/испанский, original_title может не сработать, пробуем русский
  if (ruTitle && ruTitle !== originalTitle) {
    const data = await fetchKp(KP_API_URL_SEARCH, `keyword=${encodeURIComponent(ruTitle)}`);
    if (data && data.films && data.films.length > 0) {
        const match = data.films.find((f: KpFilm) => isYearValid(f.year));
        if (match) {
            console.log(`🎯 KP: Нашли по RuTitle + Year: ${match.filmId}`);
            return match.filmId;
        }
    }
  }

  console.log(`⛔ KP: Фильм не найден (IMDb: ${imdbId}, "${originalTitle}" / "${ruTitle}", ${year})`);
  return null;
}
