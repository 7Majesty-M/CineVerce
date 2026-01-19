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
