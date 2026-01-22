const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const LANG = 'ru-RU';

// --- ОБЩИЕ ТИПЫ ---

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

export interface Video {
  id: string;
  key: string; // YouTube ID
  name: string;
  site: string;
  type: string; // "Trailer", "Teaser", "Behind the Scenes"
}

// --- ФИЛЬМЫ ---

// Полные детали фильма
export interface MovieDetails {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number | null;
  original_language: string;
}

// Получить популярные фильмы (для главной)
export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  if (!API_KEY) throw new Error('TMDB_API_KEY is missing');
  
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&language=${LANG}&page=${page}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) throw new Error('Failed to fetch movies');
  
  const data = await res.json();
  return data.results;
}

// Получить один фильм по ID
export async function getMovieById(id: string): Promise<MovieDetails | null> {
  if (!API_KEY) return null;
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?api_key=${API_KEY}&language=${LANG}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// --- СЕРИАЛЫ ---

// Краткая информация о сезоне
export interface SeasonSummary {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  vote_average: number;
}

// Полная информация о сериале
export interface TVShowDetails {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  seasons: SeasonSummary[];
  // Добавлены поля для нового дизайна
  networks: { name: string; logo_path: string | null }[]; 
  original_language: string;
  in_production: boolean;
}

// Получить один сериал по ID
export async function getTVShowById(id: string): Promise<TVShowDetails | null> {
  if (!API_KEY) return null;
  const res = await fetch(
    `${TMDB_BASE_URL}/tv/${id}?api_key=${API_KEY}&language=${LANG}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// Интерфейс для сериала в списке (краткий)
export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
}

// Получить популярные сериалы
export async function getPopularTVShows(page: number = 1): Promise<TVShow[]> {
  if (!API_KEY) throw new Error('TMDB_API_KEY is missing');
  
  const res = await fetch(
    `${TMDB_BASE_URL}/tv/popular?api_key=${API_KEY}&language=${LANG}&page=${page}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) throw new Error('Failed to fetch tv shows');
  
  const data = await res.json();
  return data.results;
}

// --- ПОИСК ---

export async function searchMulti(query: string) {
  if (!query) return [];
  
  const apiKey = process.env.TMDB_API_KEY || API_KEY; 
  
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&language=${LANG}&query=${encodeURIComponent(query)}&page=1&include_adult=false`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) throw new Error('Search failed');
    
    const data = await res.json();
    
    const results = data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 5);
    return results;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// --- ВИДЕО (ТРЕЙЛЕРЫ) ---
// В начале файла src/lib/tmdb.ts
// const LANG = 'ru-RU'; // Оставь как есть

// ...

export async function getVideos(id: number, type: 'movie' | 'tv'): Promise<Video[]> {
  if (!API_KEY) return [];
  
  try {
    // 1. Пробуем найти на Русском
    let res = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=${LANG}`,
      { next: { revalidate: 3600 } }
    );
    
    let data = await res.json();
    let results = data.results || [];

    // ИСПРАВЛЕНИЕ: Приводим LANG к string, чтобы TS не ругался
    // Или просто убираем проверку, если LANG всегда 'ru-RU'
    if (results.length === 0 && (LANG as string) !== 'en-US') {
       res = await fetch(
        `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=en-US`,
        { next: { revalidate: 3600 } }
      );
      data = await res.json();
      results = data.results || [];
    }

    return results;
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return [];
  }
}
// ... (твой существующий код)

// --- НОВЫЕ ТИПЫ ---

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Recommendation {
  id: number;
  title?: string; // У фильмов title
  name?: string;  // У сериалов name
  poster_path: string | null;
  vote_average: number;
  media_type?: 'movie' | 'tv'; // API рекомендаций иногда не возвращает тип явно, будем передавать
}

// --- НОВЫЕ ФУНКЦИИ ---

// 1. Актеры (Cast)
export async function getCredits(id: number, type: 'movie' | 'tv'): Promise<CastMember[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=${LANG}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    // Берем только первых 15 актеров
    return (data.cast || []).slice(0, 15);
  } catch (error) {
    return [];
  }
}

// 2. Рекомендации (Similar)
export async function getRecommendations(id: number, type: 'movie' | 'tv'): Promise<Recommendation[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}/recommendations?api_key=${API_KEY}&language=${LANG}&page=1`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.results || []).slice(0, 10);
  } catch (error) {
    return [];
  }
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
}

export interface PersonCredit {
  id: number;
  title?: string; // Movie
  name?: string;  // TV
  poster_path: string | null;
  vote_average: number;
  media_type: 'movie' | 'tv';
  character?: string;
  release_date?: string;
  first_air_date?: string;
  vote_count: number; // Для сортировки по популярности
}

// 1. Детали персоны
export async function getPersonById(id: string): Promise<PersonDetails | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/person/${id}?api_key=${API_KEY}&language=${LANG}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

// 2. Фильмография (Комбинированная: и фильмы, и сериалы)
export async function getPersonCredits(id: string): Promise<PersonCredit[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=${LANG}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      console.error('TMDB API error:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    
    // Проверяем что данные пришли
    if (!data.cast || !Array.isArray(data.cast)) {
      console.error('Invalid cast data:', data);
      return [];
    }
    
    console.log(`Total credits found: ${data.cast.length}`); // Для отладки
    
    // Сортируем: сначала самые популярные (где больше всего голосов)
    const sorted = data.cast.sort((a: any, b: any) => {
      // Дополнительная сортировка: сначала по голосам, потом по популярности
      const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
      if (voteDiff !== 0) return voteDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });
    
    // Возвращаем все результаты (можно ограничить если нужно)
    return sorted;
    
  } catch (error) {
    console.error('Error fetching person credits:', error);
    return [];
  }
}

export async function getTrendingMovies() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`, {
      next: { revalidate: 3600 }, // Кэш на 1 час
    });

    if (!res.ok) throw new Error('Failed to fetch trending movies');

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export interface ExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
}

// Функция получения внешних ID (IMDb и др.)
export async function getExternalIds(id: number, type: 'movie' | 'tv'): Promise<ExternalIds | null> {
  if (!API_KEY) return null;
  
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}/external_ids?api_key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching external IDs:', error);
    return null;
  }
}