export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    API_KEY: process.env.EXPO_PUBLIC_TMDB_API_KEY,
    ACCESS_TOKEN: process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN,
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
};

// TMDB API tipleri
export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date: string;
    genre_ids: number[];
}

export interface MovieDetails extends Movie {
    runtime: number;
    genres: { id: number; name: string }[];
    homepage: string;
    tagline: string;
}

export interface TVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    first_air_date: string;
    genre_ids: number[];
}

export interface TVShowDetails extends TVShow {
    runtime: number;
    genres: { id: number; name: string }[];
    homepage: string;
    tagline: string;
    number_of_seasons: number;
    number_of_episodes: number;
    last_air_date: string;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface MovieVideos {
    id: number;
    results: Video[];
}

export interface Person {
    adult: boolean;
    gender: number;
    id: number;
    known_for: (Movie | TVShow)[];
    name: string;
    popularity: number;
    profile_path: string | null;
}

export interface PersonResult {
    page: number;
    results: Person[];
    total_pages: number;
    total_results: number;
}