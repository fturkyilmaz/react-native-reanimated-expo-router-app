/**
 * useWatchlist - Watchlist management hook
 *
 * Provides comprehensive watchlist management with:
 * - Optimistic UI updates
 * - Automatic sync to Supabase when online
 * - Error handling with rollback
 * - Loading and error states
 */

import type { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import { WatchlistService } from '@/services/watchlist-service';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Watchlist context type
 */
export interface WatchlistContextType {
    /** All watchlist movies */
    watchlist: Movie[];
    /** Add movie to watchlist */
    addToWatchlist: (movie: Movie) => Promise<void>;
    /** Remove movie from watchlist */
    removeFromWatchlist: (movieId: number) => Promise<void>;
    /** Check if movie is in watchlist */
    isInWatchlist: (movieId: number) => Promise<boolean>;
    /** Toggle watchlist status */
    toggleWatchlist: (movie: Movie) => Promise<void>;
    /** Clear all watchlist items */
    clearWatchlist: () => Promise<void>;
    /** Refresh watchlist */
    refresh: () => Promise<void>;
    /** Force sync to Supabase */
    sync: () => Promise<void>;
    /** Sync status */
    isSyncing: boolean;
    /** Network status */
    isOnline: boolean;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Clear error */
    clearError: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const WatchlistContext = createContext<WatchlistContextType | null>(null);

/**
 * Watchlist Provider Component
 */
export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isSyncing, isOnline } = useSyncStatus();
    const isInitialized = useRef(false);

    /**
     * Initialize database and load watchlist
     */
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (isInitialized.current) return;

            try {
                console.log('[WatchlistProvider] Initializing...');
                await initializeDatabase();
                if (!mounted) return;
                isInitialized.current = true;
                await loadWatchlist();
            } catch (err) {
                console.error('[WatchlistProvider] Init error:', err);
                if (mounted) {
                    setError('Veritabanı başlatılamadı');
                }
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    /**
     * Load watchlist from database
     */
    const loadWatchlist = useCallback(async () => {
        if (!isInitialized.current) return;

        try {
            setIsLoading(true);
            const data = await WatchlistService.getAll();
            setWatchlist(data);
            setError(null);
        } catch (err) {
            console.error('[WatchlistProvider] Load error:', err);
            setError('İzleme listesi yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reload when screen is focused
     */
    useFocusEffect(
        useCallback(() => {
            if (isInitialized.current) {
                loadWatchlist();
            }
        }, [loadWatchlist])
    );

    /**
     * Add movie to watchlist (optimistic)
     */
    const addToWatchlist = useCallback(async (movie: Movie) => {
        setError(null);

        try {
            // Optimistic update
            setWatchlist((prev) => {
                if (prev.some((w) => w.id === movie.id)) return prev;
                return [movie, ...prev];
            });

            // Add to local database
            await WatchlistService.add(movie, isOnline);

            // If online, sync to Supabase
            if (isOnline) {
                try {
                    await syncManager.syncAll();
                } catch (syncErr) {
                    console.warn('[WatchlistProvider] Sync error:', syncErr);
                }
            }

            console.log('[WatchlistProvider] Added to watchlist:', movie.id);
        } catch (err) {
            // Rollback optimistic update
            setWatchlist((prev) => prev.filter((w) => w.id !== movie.id));
            const message = err instanceof Error ? err.message : 'İzleme listesine eklenemedi';
            setError(message);
            console.error('[WatchlistProvider] Add error:', err);
            throw err;
        }
    }, [isOnline]);

    /**
     * Remove movie from watchlist (optimistic)
     */
    const removeFromWatchlist = useCallback(async (movieId: number) => {
        setError(null);

        try {
            // Optimistic update
            setWatchlist((prev) => prev.filter((w) => w.id !== movieId));

            // Remove from local database
            await WatchlistService.remove(movieId, isOnline);

            // If online, sync to Supabase
            if (isOnline) {
                try {
                    await syncManager.syncAll();
                } catch (syncErr) {
                    console.warn('[WatchlistProvider] Sync error:', syncErr);
                }
            }

            console.log('[WatchlistProvider] Removed from watchlist:', movieId);
        } catch (err) {
            // Rollback - reload
            await loadWatchlist();
            const message = err instanceof Error ? err.message : 'İzleme listesinden kaldırılamadı';
            setError(message);
            console.error('[WatchlistProvider] Remove error:', err);
            throw err;
        }
    }, [isOnline, loadWatchlist]);

    /**
     * Check if movie is in watchlist
     */
    const isInWatchlist = useCallback(async (movieId: number): Promise<boolean> => {
        if (!isInitialized.current) return false;

        try {
            return await WatchlistService.isInWatchlist(movieId);
        } catch (err) {
            console.error('[WatchlistProvider] isInWatchlist error:', err);
            return false;
        }
    }, []);

    /**
     * Toggle watchlist status
     */
    const toggleWatchlist = useCallback(async (movie: Movie) => {
        const isIn = await WatchlistService.isInWatchlist(movie.id);
        if (isIn) {
            await removeFromWatchlist(movie.id);
        } else {
            await addToWatchlist(movie);
        }
    }, [addToWatchlist, removeFromWatchlist]);

    /**
     * Clear all watchlist items
     */
    const clearWatchlist = useCallback(async () => {
        setError(null);

        try {
            // Optimistic update
            setWatchlist([]);

            // Clear from local database
            await WatchlistService.clear();

            console.log('[WatchlistProvider] Cleared watchlist');
        } catch (err) {
            // Rollback - reload
            await loadWatchlist();
            const message = err instanceof Error ? err.message : 'İzleme listesi temizlenemedi';
            setError(message);
            console.error('[WatchlistProvider] Clear error:', err);
            throw err;
        }
    }, [loadWatchlist]);

    /**
     * Refresh watchlist
     */
    const refresh = useCallback(async () => {
        await loadWatchlist();
    }, [loadWatchlist]);

    /**
     * Force sync to Supabase
     */
    const sync = useCallback(async () => {
        if (!isOnline) {
            setError('Çevrimdışı modda senkronizasyon yapılamaz');
            return;
        }

        try {
            await syncManager.syncAll();
            await loadWatchlist();
        } catch (err) {
            console.error('[WatchlistProvider] Sync error:', err);
            setError('Senkronizasyon başarısız');
            throw err;
        }
    }, [isOnline, loadWatchlist]);

    /**
     * Clear error
     */
    const clearError = useCallback(() => setError(null), []);

    return (
        <WatchlistContext.Provider
            value={{
                watchlist,
                addToWatchlist,
                removeFromWatchlist,
                isInWatchlist,
                toggleWatchlist,
                clearWatchlist,
                refresh,
                sync,
                isSyncing,
                isOnline,
                isLoading,
                error,
                clearError,
            }}
        >
            {children}
        </WatchlistContext.Provider>
    );
}

/**
 * useWatchlist hook
 *
 * @throws Error if used outside WatchlistProvider
 */
export function useWatchlist(): WatchlistContextType {
    const context = useContext(WatchlistContext);

    if (!context) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }

    return context;
}

// ============================================================================
// INLINE IMPORTS
// ============================================================================

import { createContext, useContext } from 'react';
