/**
 * Supabase Sync Service - Realtime sync with Supabase
 *
 * Wrapper around existing SupabaseService for sync operations.
 * Handles realtime synchronization of favorites and watchlist.
 */

import { supabaseService } from './supabase-service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Service errors
 */
export class SupabaseSyncError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'SupabaseSyncError';
    }
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Handle Supabase errors
 */
const handleError = (error: any, operation: string): void => {
    console.error(`[SupabaseSync] ${operation} error:`, error);

    if (error?.message?.includes('duplicate key') || error?.code === '23505') {
        console.warn(`[SupabaseSync] Duplicate ignored for ${operation}`);
        return;
    }

    if (error?.message?.includes('not found') || error?.code === 'PGRST116') {
        console.warn(`[SupabaseSync] Record not found for ${operation}`);
        return;
    }

    throw new SupabaseSyncError(
        `Failed to ${operation}`,
        error?.code || 'UNKNOWN_ERROR',
        error
    );
};

// ============================================================================
// FAVORITES SYNC
// ============================================================================

export const supabaseSyncService = {
    /**
     * Add movie to favorites in Supabase
     */
    addFavorite: async (movieId: number): Promise<void> => {
        try {
            console.log('[SupabaseSync] Adding favorite:', movieId);

            // Use existing supabaseService
            await supabaseService.addFavorite('', { id: movieId });

            console.log('[SupabaseSync] Added favorite:', movieId);
        } catch (error) {
            if (error instanceof SupabaseSyncError) {
                throw error;
            }
            console.warn('[SupabaseSync] Add favorite warning:', error);
            // Don't throw for sync failures - they'll be retried
        }
    },

    /**
     * Remove movie from favorites in Supabase
     */
    removeFavorite: async (movieId: number): Promise<void> => {
        try {
            console.log('[SupabaseSync] Removing favorite:', movieId);

            await supabaseService.removeFavorite('', movieId);

            console.log('[SupabaseSync] Removed favorite:', movieId);
        } catch (error) {
            if (error instanceof SupabaseSyncError) {
                throw error;
            }
            console.warn('[SupabaseSync] Remove favorite warning:', error);
        }
    },

    /**
     * Add movie to watchlist in Supabase
     */
    addToWatchlist: async (movieId: number): Promise<void> => {
        try {
            console.log('[SupabaseSync] Adding to watchlist:', movieId);

            await supabaseService.addToWatchlist('', { id: movieId });

            console.log('[SupabaseSync] Added to watchlist:', movieId);
        } catch (error) {
            if (error instanceof SupabaseSyncError) {
                throw error;
            }
            console.warn('[SupabaseSync] Add to watchlist warning:', error);
        }
    },

    /**
     * Remove movie from watchlist in Supabase
     */
    removeFromWatchlist: async (movieId: number): Promise<void> => {
        try {
            console.log('[SupabaseSync] Removing from watchlist:', movieId);

            await supabaseService.removeFromWatchlist('', movieId);

            console.log('[SupabaseSync] Removed from watchlist:', movieId);
        } catch (error) {
            if (error instanceof SupabaseSyncError) {
                throw error;
            }
            console.warn('[SupabaseSync] Remove from watchlist warning:', error);
        }
    },

    /**
     * Check if Supabase is configured
     */
    isConfigured: (): boolean => {
        return supabaseService.isConfigured();
    },
};
