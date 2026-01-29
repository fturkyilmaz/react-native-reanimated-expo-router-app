export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    API_KEY: process.env.EXPO_PUBLIC_TMDB_API_KEY,
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