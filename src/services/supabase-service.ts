// @ts-nocheck
import { createClient, isSupabaseConfigured } from '@/supabase/client';

// Supabase Service Class
class SupabaseService {
    private client: any = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        try {
            this.client = createClient();
            console.log('[SupabaseService] Client initialized:', !!this.client);
            console.log('[SupabaseService] isConfigured:', isSupabaseConfigured());
        } catch (e) {
            console.error('[SupabaseService] Init error:', e);
        }
    }

    // Check if Supabase is configured
    public isConfigured(): boolean {
        const configured = isSupabaseConfigured();
        console.log('[SupabaseService] isConfigured called:', configured);
        return configured;
    }

    // Add movie to favorites
    async addFavorite(userId: string, movie: any): Promise<boolean> {
        console.log('[SupabaseService] addFavorite called:');
        console.log('  - userId:', userId);
        console.log('  - movie.id:', movie.id);
        console.log('  - movie.title:', movie.title);

        if (!this.isConfigured()) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        if (!this.client) {
            console.error('[SupabaseService] Client is null');
            return false;
        }

        try {
            // First, insert/update movie in movies table
            console.log('[SupabaseService] Inserting movie into movies table...');
            const { error: movieError } = await this.client
                .from('movies')
                .upsert({
                    id: movie.id,
                    title: movie.title,
                    overview: movie.overview,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    genre_ids: JSON.stringify(movie.genre_ids || []),
                    updated_at: Math.floor(Date.now() / 1000),
                }, { onConflict: 'id' });

            if (movieError) {
                console.error('[SupabaseService] Error inserting movie:', movieError);
                // Continue anyway - movie might already exist
            } else {
                console.log('[SupabaseService] Movie inserted/updated successfully');
            }

            console.log('[SupabaseService] Attempting insert to Supabase favorites...');
            const { data, error } = await this.client
                .from('favorites')
                .insert({
                    user_id: userId,
                    movie_id: movie.id,
                    title: movie.title,
                    overview: movie.overview,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    genre_ids: JSON.stringify(movie.genre_ids || []),
                })
                .select();

            console.log('[SupabaseService] Insert result:');
            console.log('  - data:', data);
            console.log('  - error:', error);

            if (error) {
                console.error('[SupabaseService] Error adding favorite:', error);
                return false;
            }
            console.log('[SupabaseService] Favorite added successfully!');
            return true;
        } catch (e) {
            console.error('[SupabaseService] Exception adding favorite:', e);
            return false;
        }
    }

    // Remove movie from favorites
    async removeFavorite(userId: string, movieId: number): Promise<boolean> {
        console.log('[SupabaseService] removeFavorite called:');
        console.log('  - userId:', userId);
        console.log('  - movieId:', movieId);

        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        try {
            console.log('[SupabaseService] Attempting delete from Supabase...');
            const { data, error } = await this.client
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('movie_id', movieId);

            console.log('[SupabaseService] Delete result:');
            console.log('  - data:', data);
            console.log('  - error:', error);

            if (error) {
                console.error('[SupabaseService] Error removing favorite:', error);
                return false;
            }
            console.log('[SupabaseService] Favorite removed successfully!');
            return true;
        } catch (e) {
            console.error('[SupabaseService] Exception removing favorite:', e);
            return false;
        }
    }

    // Get all favorites for user
    async getFavorites(userId: string): Promise<any[]> {
        console.log('[SupabaseService] getFavorites called:');
        console.log('  - userId:', userId);

        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, returning empty');
            return [];
        }

        try {
            console.log('[SupabaseService] Fetching favorites from Supabase...');
            const { data, error } = await this.client
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            console.log('[SupabaseService] Get favorites result:');
            console.log('  - count:', data?.length);
            console.log('  - error:', error);

            if (error) {
                console.error('[SupabaseService] Error getting favorites:', error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error('[SupabaseService] Exception getting favorites:', e);
            return [];
        }
    }

    // Add movie to watchlist
    async addToWatchlist(userId: string, movie: any): Promise<boolean> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        try {
            // First, insert/update movie in movies table
            console.log('[SupabaseService] addToWatchlist: Inserting movie into movies table...');
            const { error: movieError } = await this.client
                .from('movies')
                .upsert({
                    id: movie.id,
                    title: movie.title,
                    overview: movie.overview,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    genre_ids: JSON.stringify(movie.genre_ids || []),
                    updated_at: Math.floor(Date.now() / 1000),
                }, { onConflict: 'id' });

            if (movieError) {
                console.error('[SupabaseService] Error inserting movie to watchlist:', movieError);
            }

            const { error } = await this.client
                .from('watchlist')
                .insert({
                    user_id: userId,
                    movie_id: movie.id,
                    title: movie.title,
                    overview: movie.overview,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    genre_ids: JSON.stringify(movie.genre_ids || []),
                });

            if (error) {
                console.error('[SupabaseService] Error adding to watchlist:', error);
                return false;
            }
            console.log('[SupabaseService] Watchlist added successfully!');
            return true;
        } catch (e) {
            console.error('[SupabaseService] Error adding to watchlist:', e);
            return false;
        }
    }

    // Remove movie from watchlist
    async removeFromWatchlist(userId: string, movieId: number): Promise<boolean> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        try {
            const { error } = await this.client
                .from('watchlist')
                .delete()
                .eq('user_id', userId)
                .eq('movie_id', movieId);

            if (error) {
                console.error('[SupabaseService] Error removing from watchlist:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('[SupabaseService] Error removing from watchlist:', e);
            return false;
        }
    }

    // Get all watchlist items for user
    async getWatchlist(userId: string): Promise<any[]> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, returning empty');
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('watchlist')
                .select('*')
                .eq('user_id', userId)
                .order('added_at', { ascending: false });

            if (error) {
                console.error('[SupabaseService] Error getting watchlist:', error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error('[SupabaseService] Error getting watchlist:', e);
            return [];
        }
    }
}

// Singleton instance
export const supabaseService = new SupabaseService();
