// @ts-nocheck
import { createClient, isSupabaseConfigured } from '@/supabase/client';

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

    public isConfigured(): boolean {
        const configured = isSupabaseConfigured();
        console.log('[SupabaseService] isConfigured called:', configured);
        return configured;
    }

    // Try to get authenticated user id from client (supports v1/v2 clients)
    private async getAuthenticatedUserId(): Promise<string | null> {
        try {
            if (!this.client) return null;

            // Supabase v2
            if (typeof this.client.auth?.getUser === 'function') {
                const res = await this.client.auth.getUser();
                const user = res?.data?.user ?? null;
                return user?.id ?? null;
            }

            // Supabase v1
            if (typeof this.client.auth?.user === 'function') {
                const user = this.client.auth.user();
                return user?.id ?? null;
            }

            return null;
        } catch (e) {
            console.warn('[SupabaseService] getAuthenticatedUserId error:', e);
            return null;
        }
    }

    /**
     * Normalize a value that may be:
     * - epoch seconds (number or numeric string)
     * - ISO/date string
     * Returns ISO 8601 string (suitable for Postgres timestamp/timestamptz) or null.
     */
    private normalizeToIso(d: any): string | null {
        if (d == null) return null;

        // If it's already a Date object
        if (d instanceof Date && !isNaN(d.getTime())) {
            return d.toISOString();
        }

        // If it's a finite number (epoch seconds)
        if (typeof d === 'number' && Number.isFinite(d)) {
            return new Date(Math.floor(d) * 1000).toISOString();
        }

        // If it's a numeric string like "1770275475"
        if (typeof d === 'string' && /^\d+$/.test(d)) {
            const n = Number(d);
            if (!Number.isNaN(n)) {
                return new Date(Math.floor(n) * 1000).toISOString();
            }
        }

        // If it's a date-like string, try to parse
        if (typeof d === 'string') {
            const parsed = Date.parse(d);
            if (!isNaN(parsed)) return new Date(parsed).toISOString();
        }

        // Fallback: null (avoid sending invalid value to Postgres)
        return null;
    }

    private buildMoviePayload(movie: any) {
        // Normalize release_date and updated_at to ISO strings to match timestamp columns
        const releaseDateIso = this.normalizeToIso(movie?.release_date);
        const updatedAtIso = this.normalizeToIso(movie?.updated_at ?? movie?.updatedAt ?? null);

        return {
            id: movie.id,
            title: movie.title ?? null,
            overview: movie.overview ?? null,
            poster_path: movie.poster_path ?? null,
            backdrop_path: movie.backdrop_path ?? null,
            // send ISO strings for timestamp columns
            release_date: releaseDateIso,
            // If your DB expects integer epoch for updated_at, change this to Math.floor(...) accordingly.
            updated_at: updatedAtIso,
            vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : null,
            // Ensure genre_ids is an array (Postgres JSONB/array friendly)
            genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
        };
    }

    // Add movie to favorites (robust, RLS-aware)
    async addFavorite(userId: string | null, movie: any): Promise<boolean> {
        console.log('[SupabaseService] addFavorite called:');
        console.log('  - userId:', userId);
        console.log('  - movie.id:', movie?.id);
        console.log('  - movie.title:', movie?.title);

        if (!this.isConfigured()) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }
        if (!this.client) {
            console.error('[SupabaseService] Client is null');
            return false;
        }
        if (!movie?.id) {
            console.error('[SupabaseService] Invalid movie payload, missing id');
            return false;
        }

        // Resolve userId: if caller passed null or placeholder, try to get authenticated user
        let resolvedUserId = userId;
        if (!resolvedUserId || resolvedUserId === 'local') {
            const authId = await this.getAuthenticatedUserId();
            if (!authId) {
                console.error('[SupabaseService] No authenticated user id available; cannot add favorite due to RLS.');
                return false;
            }
            resolvedUserId = authId;
            console.log('[SupabaseService] Resolved userId from auth:', resolvedUserId);
        }

        const moviePayload = this.buildMoviePayload(movie);
        console.log('[SupabaseService] moviePayload (to upsert):', moviePayload);

        try {
            // 1) Upsert movie (ensure movie exists)
            console.log('[SupabaseService] Upserting movie...');
            const upsertResp = await this.client
                .from('movies')
                .upsert(moviePayload, { onConflict: 'id' })
                .select('id');

            const upsertError = (upsertResp as any).error ?? null;
            const upsertData = (upsertResp as any).data ?? null;

            if (upsertError) {
                console.error('[SupabaseService] Error upserting movie:', upsertError);
                // continue cautiously; we'll verify existence below
            } else {
                console.log('[SupabaseService] Upsert response data:', upsertData);
            }

            // 2) Verify movie exists in movies table (defensive)
            const movieId = movie.id;
            const movieCheckResp = await this.client
                .from('movies')
                .select('id')
                .eq('id', movieId)
                .limit(1);

            const movieCheckError = (movieCheckResp as any).error ?? null;
            const movieCheckData = (movieCheckResp as any).data ?? null;

            if (movieCheckError) {
                console.warn('[SupabaseService] Movie check error:', movieCheckError);
                return false;
            }

            if (!movieCheckData || (Array.isArray(movieCheckData) && movieCheckData.length === 0)) {
                console.warn('[SupabaseService] Movie not found after upsert, aborting favorite insert', {
                    movieId,
                    movieCheckData,
                });
                return false;
            }

            // 3) Insert favorite
            console.log('[SupabaseService] Inserting favorite for user:', resolvedUserId, 'movie:', movieId);
            const favInsert = await this.client
                .from('favorites')
                .insert({
                    user_id: resolvedUserId,
                    movie_id: movieId,
                    title: moviePayload.title,
                    overview: moviePayload.overview,
                    poster_path: moviePayload.poster_path,
                    backdrop_path: moviePayload.backdrop_path,
                    release_date: moviePayload.release_date,
                    vote_average: moviePayload.vote_average,
                    genre_ids: moviePayload.genre_ids,
                }, { onConflict: ['user_id', 'movie_id'] })
                .select();

            const favError = (favInsert as any).error ?? null;
            const favData = (favInsert as any).data ?? null;

            console.log('[SupabaseService] Favorite insert result:', { favData, favError });

            if (favError) {
                console.error('[SupabaseService] Error adding favorite:', favError);

                // If FK error, try a final upsert then retry once
                if ((favError.code === '23503' || (favError.message && favError.message.toLowerCase().includes('foreign key'))) && !upsertError) {
                    console.log('[SupabaseService] FK error detected. Retrying movie upsert and favorite insert once more...');
                    await this.client.from('movies').upsert(moviePayload, { onConflict: 'id' });
                    const retryResp = await this.client.from('favorites').insert({
                        user_id: resolvedUserId,
                        movie_id: movieId,
                    }).select();
                    const retryError = (retryResp as any).error ?? null;
                    if (retryError) {
                        console.error('[SupabaseService] Retry failed:', retryError);
                        return false;
                    }
                    console.log('[SupabaseService] Favorite added on retry');
                    return true;
                }

                // If RLS error, log guidance
                if (favError.code === '42501' || (favError.message && favError.message.toLowerCase().includes('row-level security'))) {
                    console.error('[SupabaseService] RLS violation. Ensure the favorites table has an insert policy like: with check (user_id = auth.uid()) and that the client is authenticated with the same user id.');
                }

                return false;
            }

            console.log('[SupabaseService] Favorite added successfully!');
            return true;
        } catch (e: any) {
            console.error('[SupabaseService] Exception adding favorite:', {
                message: e?.message ?? e,
                stack: e?.stack,
            });
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
            const resolvedUserId = userId === 'local' || !userId ? await this.getAuthenticatedUserId() : userId;
            if (!resolvedUserId) {
                console.error('[SupabaseService] No authenticated user id available; cannot remove favorite due to RLS.');
                return false;
            }

            console.log('[SupabaseService] Attempting delete from Supabase...');
            const resp = await this.client
                .from('favorites')
                .delete()
                .eq('user_id', resolvedUserId)
                .eq('movie_id', movieId)
                .select();

            const error = (resp as any).error ?? null;
            const data = (resp as any).data ?? null;

            console.log('[SupabaseService] Delete result:', { data, error });

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
            const resolvedUserId = userId === 'local' || !userId ? await this.getAuthenticatedUserId() : userId;
            if (!resolvedUserId) {
                console.warn('[SupabaseService] No authenticated user id available; returning empty favorites.');
                return [];
            }

            console.log('[SupabaseService] Fetching favorites from Supabase...');
            const resp = await this.client
                .from('favorites')
                .select('*')
                .eq('user_id', resolvedUserId)
                .order('created_at', { ascending: false });

            const error = (resp as any).error ?? null;
            const data = (resp as any).data ?? null;

            console.log('[SupabaseService] Get favorites result:', { count: data?.length ?? 0, error });

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

    // Add movie to watchlist (same pattern as favorites)
    async addToWatchlist(userId: string, movie: any): Promise<boolean> {
        if (!this.isConfigured() || !this.client) {
            console.log('[SupabaseService] Not configured, skipping');
            return false;
        }

        if (!movie?.id) {
            console.error('[SupabaseService] Invalid movie payload, missing id');
            return false;
        }

        const resolvedUserId = userId === 'local' || !userId ? await this.getAuthenticatedUserId() : userId;
        if (!resolvedUserId) {
            console.error('[SupabaseService] No authenticated user id available; cannot add to watchlist due to RLS.');
            return false;
        }

        try {
            console.log('[SupabaseService] addToWatchlist: Upserting movie...');
            const moviePayload = this.buildMoviePayload(movie);
            console.log('[SupabaseService] moviePayload (watchlist upsert):', moviePayload);

            const upsertResp = await this.client.from('movies').upsert(moviePayload, { onConflict: 'id' }).select('id');
            const upsertError = (upsertResp as any).error ?? null;
            if (upsertError) {
                console.error('[SupabaseService] Error inserting movie to watchlist:', upsertError);
            }

            const resp = await this.client
                .from('watchlist')
                .insert({
                    user_id: resolvedUserId,
                    movie_id: movie.id,
                    title: moviePayload.title,
                    overview: moviePayload.overview,
                    poster_path: moviePayload.poster_path,
                    backdrop_path: moviePayload.backdrop_path,
                    release_date: moviePayload.release_date,
                    vote_average: moviePayload.vote_average,
                    genre_ids: moviePayload.genre_ids,
                })
                .select();

            const error = (resp as any).error ?? null;
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
            const resolvedUserId = userId === 'local' || !userId ? await this.getAuthenticatedUserId() : userId;
            if (!resolvedUserId) {
                console.error('[SupabaseService] No authenticated user id available; cannot remove from watchlist due to RLS.');
                return false;
            }

            const resp = await this.client
                .from('watchlist')
                .delete()
                .eq('user_id', resolvedUserId)
                .eq('movie_id', movieId)
                .select();

            const error = (resp as any).error ?? null;
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
            const resolvedUserId = userId === 'local' || !userId ? await this.getAuthenticatedUserId() : userId;
            if (!resolvedUserId) {
                console.warn('[SupabaseService] No authenticated user id available; returning empty watchlist.');
                return [];
            }

            const resp = await this.client
                .from('watchlist')
                .select('*')
                .eq('user_id', resolvedUserId)
                .order('added_at', { ascending: false });

            const error = (resp as any).error ?? null;
            const data = (resp as any).data ?? null;

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

export const supabaseService = new SupabaseService();
