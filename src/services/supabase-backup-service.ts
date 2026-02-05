/**
 * Supabase Backup Service - Data backup to Supabase
 *
 * Handles manual backup of favorites and watchlist to Supabase.
 * Provides data recovery and backup metadata tracking.
 *
 * Features:
 * - Full backup of favorites and watchlist
 * - Restore from backup
 * - Backup metadata tracking
 */

// @ts-nocheck
import type { Movie } from '@/config/api';
import { FavoritesService } from './favorites-service';
import { supabaseService } from './supabase-service';
import { WatchlistService } from './watchlist-service';

// ============================================================================
// TYPES
// ============================================================================

interface BackupMetadata {
    id: string;
    backup_at: string;
    favorites_count: number;
    watchlist_count: number;
    device_id: string;
    app_version: string;
}

interface BackupResult {
    success: boolean;
    favorites_count: number;
    watchlist_count: number;
    backup_at: string;
    error?: string;
}

interface RestoreResult {
    success: boolean;
    favorites_restored: number;
    watchlist_restored: number;
    error?: string;
}

export class BackupServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'BackupServiceError';
    }
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

const getDeviceId = (): string => {
    return 'device_' + Date.now().toString(36);
};

const getAppVersion = (): string => {
    return '1.0.0';
};

const normalizeForBackup = (movie: Movie) => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview || '',
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average || 0,
    release_date: movie.release_date || '',
    genre_ids: movie.genre_ids || [],
});

// ============================================================================
// PUBLIC API
// ============================================================================

export const supabaseBackupService = {
    /**
     * Perform full backup of favorites and watchlist
     */
    backup: async (): Promise<BackupResult> => {
        console.log('[BackupService] Starting backup...');

        try {
            if (!supabaseService.isConfigured()) {
                throw new BackupServiceError('Supabase not configured', 'NOT_CONFIGURED');
            }

            const [favorites, watchlist] = await Promise.all([
                FavoritesService.getAll(),
                WatchlistService.getAll(),
            ]);

            console.log('[BackupService] Backing up:', {
                favorites: favorites.length,
                watchlist: watchlist.length,
            });

            // Backup favorites
            for (const movie of favorites) {
                try {
                    await supabaseService.backupFavorites([normalizeForBackup(movie)]);
                } catch (err) {
                    console.warn('[BackupService] Backup favorite failed:', movie.id, err);
                }
            }

            // Backup watchlist
            for (const movie of watchlist) {
                try {
                    await supabaseService.backupWatchlist([normalizeForBackup(movie)]);
                } catch (err) {
                    console.warn('[BackupService] Backup watchlist failed:', movie.id, err);
                }
            }

            const metadata: BackupMetadata = {
                id: `backup_${Date.now()}`,
                backup_at: new Date().toISOString(),
                favorites_count: favorites.length,
                watchlist_count: watchlist.length,
                device_id: getDeviceId(),
                app_version: getAppVersion(),
            };

            console.log('[BackupService] Backup complete:', metadata);

            return {
                success: true,
                favorites_count: favorites.length,
                watchlist_count: watchlist.length,
                backup_at: metadata.backup_at,
            };
        } catch (error) {
            console.error('[BackupService] Backup error:', error);
            return {
                success: false,
                favorites_count: 0,
                watchlist_count: 0,
                backup_at: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Backup failed',
            };
        }
    },

    /**
     * Restore from backup
     */
    restore: async (): Promise<RestoreResult> => {
        console.log('[BackupService] Starting restore...');

        try {
            if (!supabaseService.isConfigured()) {
                throw new BackupServiceError('Supabase not configured', 'NOT_CONFIGURED');
            }

            // Get favorites and watchlist from Supabase
            const favoritesData = await supabaseService.restoreFavorites();
            const watchlistData = await supabaseService.restoreWatchlist();

            console.log('[BackupService] Restoring:', {
                favorites: favoritesData.length,
                watchlist: watchlistData.length,
            });

            let favoritesRestored = 0;
            for (const movie of favoritesData) {
                try {
                    await FavoritesService.add(movie, true);
                    favoritesRestored++;
                } catch (err) {
                    console.warn('[BackupService] Restore favorite failed:', movie.id, err);
                }
            }

            let watchlistRestored = 0;
            for (const movie of watchlistData) {
                try {
                    await WatchlistService.add(movie, true);
                    watchlistRestored++;
                } catch (err) {
                    console.warn('[BackupService] Restore watchlist failed:', movie.id, err);
                }
            }

            console.log('[BackupService] Restore complete:', {
                favoritesRestored,
                watchlistRestored,
            });

            return {
                success: true,
                favorites_restored: favoritesRestored,
                watchlist_restored: watchlistRestored,
            };
        } catch (error) {
            console.error('[BackupService] Restore error:', error);
            return {
                success: false,
                favorites_restored: 0,
                watchlist_restored: 0,
                error: error instanceof Error ? error.message : 'Restore failed',
            };
        }
    },

    /**
     * Auto backup if needed
     */
    autoBackup: async (): Promise<BackupResult | null> => {
        console.log('[BackupService] Auto backup triggered');
        return supabaseBackupService.backup();
    },

    /**
     * Check if Supabase is configured
     */
    isConfigured: (): boolean => {
        return supabaseService.isConfigured();
    },
};

export type { BackupMetadata, BackupResult, RestoreResult };
