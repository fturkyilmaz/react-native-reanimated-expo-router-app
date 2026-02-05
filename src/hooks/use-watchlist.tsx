// @ts-nocheck
import { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { useAuth } from '@/hooks/use-auth';
import { MovieService, WatchlistService } from '@/services/local-db.service';
import { supabaseService } from '@/services/supabase-service';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface WatchlistContextType {
    watchlist: Movie[];
    addToWatchlist: (movie: Movie) => Promise<void>;
    removeFromWatchlist: (movieId: number) => Promise<void>;
    isInWatchlist: (movieId: number) => Promise<boolean>;
    toggleWatchlist: (movie: Movie) => Promise<void>;
    clearWatchlist: () => Promise<void>;
    syncWatchlist: () => Promise<void>;
    isSyncing: boolean;
    isOnline: boolean;
    error: string | null;
    clearError: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isSyncing } = useSyncStatus();
    const { user } = useAuth();

    // Initialize database once
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                await initializeDatabase();
                if (!mounted) return;
                setIsInitialized(true);
                await loadWatchlist();
            } catch (err) {
                console.error('Database initialization error:', err);
                setError('Veritabanı başlatılamadı');
            }
        };
        init();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected ?? false;
            setIsOnline(online);

            // Sync when coming back online
            if (online && watchlist.length > 0) {
                syncManager.syncAll().catch(e => console.warn('[Watchlist] syncAll failed:', e));
            }
        });

        return () => unsubscribe();
    }, [watchlist.length]);

    // loadWatchlist as stable callback
    const loadWatchlist = useCallback(async () => {
        if (!isInitialized) return;
        try {
            const data = await WatchlistService.getAll();
            setWatchlist(data || []);
        } catch (err) {
            console.error('Error loading watchlist:', err);
            setError('İzleme listesi yüklenemedi');
            setWatchlist([]);
        }
    }, [isInitialized]);

    // Reload when screen is focused and initialized
    useFocusEffect(
        useCallback(() => {
            if (isInitialized) {
                loadWatchlist();
            }
        }, [isInitialized, loadWatchlist])
    );

    const addToWatchlist = useCallback(
        async (movie: Movie) => {
            setError(null);

            // Wait for database initialization
            if (!isInitialized) {
                try {
                    await initializeDatabase();
                    setIsInitialized(true);
                } catch (err) {
                    console.error('Database initialization failed:', err);
                    setError('Veritabanı başlatılamadı');
                    return;
                }
            }

            if (!movie || !movie.id) {
                setError('Geçersiz film verisi');
                return;
            }

            try {
                // Ensure movie is saved with complete data
                await MovieService.upsert(movie);

                const success = await WatchlistService.add(movie.id, 'local', isOnline);
                if (!success) {
                    console.warn('[Watchlist] Local add failed for movie:', movie.id);
                    setError('İzleme listesine eklenemedi');
                    return;
                }

                await loadWatchlist();

                // Sync to Supabase if online and user is logged in
                if (isOnline && user?.id) {
                    try {
                        console.log('[DEBUG-Watchlist] Syncing to Supabase...');
                        const supabaseResult = await supabaseService.addToWatchlist(user.id, movie);
                        console.log('[DEBUG-Watchlist] Supabase addToWatchlist result:', supabaseResult);
                        if (!supabaseResult) {
                            // service returned false — log and keep local state
                            console.warn('[Watchlist] Supabase addToWatchlist returned false (not synced).');
                        }
                    } catch (e) {
                        console.error('[Watchlist] Supabase sync error:', e);
                        // Do not throw — keep local state and schedule sync
                    }
                } else if (!isOnline) {
                    console.log('[Watchlist] Offline mode - will sync when online');
                }
            } catch (err) {
                console.error('Error adding to watchlist:', err);
                setError('İzleme listesine eklenirken hata oluştu');
            }
        },
        [isInitialized, isOnline, loadWatchlist, user]
    );

    const removeFromWatchlist = useCallback(
        async (movieId: number) => {
            setError(null);

            // Wait for database initialization
            if (!isInitialized) {
                try {
                    await initializeDatabase();
                    setIsInitialized(true);
                } catch (err) {
                    console.error('Database initialization failed:', err);
                    setError('Veritabanı başlatılamadı');
                    return;
                }
            }

            try {
                const success = await WatchlistService.remove(movieId, isOnline);
                if (!success) {
                    console.warn('[Watchlist] Local remove failed for movieId:', movieId);
                    setError('İzleme listesinden kaldırılamadı');
                    return;
                }

                await loadWatchlist();

                // Sync to Supabase if online and user is logged in
                if (isOnline && user?.id) {
                    try {
                        console.log('[DEBUG-Watchlist] Syncing remove to Supabase...');
                        const supabaseResult = await supabaseService.removeFromWatchlist(user.id, movieId);
                        console.log('[DEBUG-Watchlist] Supabase removeFromWatchlist result:', supabaseResult);
                        if (!supabaseResult) {
                            console.warn('[Watchlist] Supabase removeFromWatchlist returned false (not synced).');
                        }
                    } catch (e) {
                        console.error('[Watchlist] Supabase remove sync error:', e);
                        // Keep local state; sync manager will retry later
                    }
                } else if (!isOnline) {
                    console.log('[Watchlist] Offline mode - will sync when online');
                }
            } catch (err) {
                console.error('Error removing from watchlist:', err);
                setError('İzleme listesinden kaldırılırken hata oluştu');
            }
        },
        [isInitialized, isOnline, loadWatchlist, user]
    );

    const isInWatchlist = useCallback(
        async (movieId: number): Promise<boolean> => {
            if (!isInitialized) return false;
            try {
                return await WatchlistService.isInWatchlist(movieId);
            } catch (err) {
                console.error('Error checking watchlist:', err);
                return false;
            }
        },
        [isInitialized]
    );

    const toggleWatchlist = useCallback(
        async (movie: Movie) => {
            // Ensure DB is initialized before toggling
            if (!isInitialized) {
                try {
                    await initializeDatabase();
                    setIsInitialized(true);
                } catch (err) {
                    console.error('Database initialization failed:', err);
                    setError('Veritabanı başlatılamadı');
                    return;
                }
            }

            try {
                const alreadyInWatchlist = await WatchlistService.isInWatchlist(movie.id);
                if (alreadyInWatchlist) {
                    await removeFromWatchlist(movie.id);
                } else {
                    await addToWatchlist(movie);
                }
            } catch (err) {
                console.error('Error toggling watchlist:', err);
                setError('İzleme listesi güncellenemedi');
            }
        },
        [isInitialized, addToWatchlist, removeFromWatchlist]
    );

    const clearWatchlist = useCallback(async () => {
        if (!isInitialized) return;
        try {
            const items = await WatchlistService.getAll();
            for (const item of items) {
                await WatchlistService.remove(item.id);
            }
            await loadWatchlist();
        } catch (err) {
            console.error('Error clearing watchlist:', err);
            setError('İzleme listesi temizlenemedi');
        }
    }, [isInitialized, loadWatchlist]);

    const syncWatchlist = useCallback(async () => {
        if (!isOnline) {
            console.log('Offline - sync skipped');
            return;
        }

        try {
            await syncManager.syncWatchlist();
            await loadWatchlist();
        } catch (err) {
            console.error('Error syncing watchlist:', err);
            setError('İzleme listesi senkronizasyonu başarısız');
        }
    }, [isOnline, loadWatchlist]);

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
                syncWatchlist,
                isSyncing,
                isOnline,
                error,
                clearError,
            }}
        >
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (!context) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
}
