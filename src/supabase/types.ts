// Supabase Database Types
// Auto-generated from Supabase schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            movies: {
                Row: {
                    id: number;
                    title: string;
                    original_title: string | null;
                    overview: string | null;
                    poster_path: string | null;
                    backdrop_path: string | null;
                    release_date: string | null;
                    vote_average: number | null;
                    vote_count: number | null;
                    popularity: number | null;
                    adult: boolean | null;
                    genre_ids: number[] | null;
                    original_language: string | null;
                    runtime: number | null;
                    tagline: string | null;
                    status: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: number;
                    title: string;
                    original_title?: string | null;
                    overview?: string | null;
                    poster_path?: string | null;
                    backdrop_path?: string | null;
                    release_date?: string | null;
                    vote_average?: number | null;
                    vote_count?: number | null;
                    popularity?: number | null;
                    adult?: boolean | null;
                    genre_ids?: number[] | null;
                    original_language?: string | null;
                    runtime?: number | null;
                    tagline?: string | null;
                    status?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    title?: string;
                    original_title?: string | null;
                    overview?: string | null;
                    poster_path?: string | null;
                    backdrop_path?: string | null;
                    release_date?: string | null;
                    vote_average?: number | null;
                    vote_count?: number | null;
                    popularity?: number | null;
                    adult?: boolean | null;
                    genre_ids?: number[] | null;
                    original_language?: string | null;
                    runtime?: number | null;
                    tagline?: string | null;
                    status?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            favorites: {
                Row: {
                    id: string;
                    user_id: string;
                    movie_id: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    movie_id: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    movie_id?: number;
                    created_at?: string;
                };
            };
            watchlist: {
                Row: {
                    id: string;
                    user_id: string;
                    movie_id: number;
                    added_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    movie_id: number;
                    added_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    movie_id?: number;
                    added_at?: string;
                };
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
    };
}

// Type aliases for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Movie = Database['public']['Tables']['movies']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type WatchlistItem = Database['public']['Tables']['watchlist']['Row'];
