// @ts-nocheck
import { createClient, isSupabaseConfigured } from '@/supabase/client';
import NetInfo from '@react-native-community/netinfo';

// Supabase Service Class
class SupabaseService {
    private client = createClient();

    // Check network status
    private async isOnline(): Promise<boolean> {
        const netInfo = await NetInfo.fetch();
        return netInfo.isConnected ?? false;
    }

    // Check if Supabase is configured
    public isConfigured(): boolean {
        return isSupabaseConfigured();
    }

    // Add movie to favorites
    async addFavorite(userId: string, movie: any): Promise<boolean> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        try {
            const { error } = await this.client
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
                });

            if (error) {
                console.error('[SupabaseService] Error adding favorite:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('[SupabaseService] Error adding favorite:', e);
            return false;
        }
    }

    // Remove movie from favorites
    async removeFavorite(userId: string, movieId: number): Promise<boolean> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        try {
            const { error } = await this.client
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('movie_id', movieId);

            if (error) {
                console.error('[SupabaseService] Error removing favorite:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('[SupabaseService] Error removing favorite:', e);
            return false;
        }
    }

    // Get all favorites for user
    async getFavorites(userId: string): Promise<any[]> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, returning empty');
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseService] Error getting favorites:', error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error('[SupabaseService] Error getting favorites:', e);
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
