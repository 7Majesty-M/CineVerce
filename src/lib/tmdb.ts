// ФАЙЛ: src/lib/tmdb.ts

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
}

// Получить популярные фильмы (для главной)
export async function getPopularMovies(): Promise<Movie[]> {
  if (!API_KEY) throw new Error('TMDB_API_KEY is missing');
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&language=${LANG}&page=1`,
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


// --- СЕРИАЛЫ (НОВОЕ) ---

// Краткая информация о сезоне (внутри объекта сериала)
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
  name: string; // У сериалов 'name', а не 'title'
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  // Массив сезонов
  seasons: SeasonSummary[];
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

// --- Добавьте это в конец src/lib/tmdb.ts ---

// Интерфейс для сериала в списке (краткий)
export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
}

// Получить популярные сериалы (для главной)
export async function getPopularTVShows(): Promise<TVShow[]> {
  if (!API_KEY) throw new Error('TMDB_API_KEY is missing');
  const res = await fetch(
    `${TMDB_BASE_URL}/tv/popular?api_key=${API_KEY}&language=${LANG}&page=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error('Failed to fetch tv shows');
  const data = await res.json();
  return data.results;
}

export async function searchMulti(query: string) {
  if (!query) return [];
  
  // Явно задаем URL и ключ (или берем из env)
  const apiKey = process.env.TMDB_API_KEY || 'ТВОЙ_КЛЮЧ_ЕСЛИ_ОН_ЗАХАРДКОЖЕН_ВЫШЕ'; 
  const baseUrl = 'https://api.themoviedb.org/3'; // Хардкодим базовый URL TMDB, так надежнее
  
  try {
    const res = await fetch(
      `${baseUrl}/search/multi?api_key=${apiKey}&language=ru-RU&query=${encodeURIComponent(query)}&page=1&include_adult=false`,
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