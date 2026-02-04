// @ts-nocheck
import { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { MovieService, WatchlistService } from '@/services/local-db.service';
import { supabaseService } from '@/services/supabase-service';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import { useAuthStore } from '@/store/authStore';
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
    const { user } = useAuthStore();

    // Initialize database once
    useEffect(() => {
        const init = async () => {
            try {
                await initializeDatabase();
                setIsInitialized(true);
                await loadWatchlist();
            } catch (error) {
                console.error('Database initialization error:', error);
            }
        };
        init();
    }, []);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected ?? false;
            setIsOnline(online);

            // Sync when coming back online
            if (online && watchlist.length > 0) {
                syncManager.syncAll();
            }
        });

        return () => unsubscribe();
    }, [watchlist.length]);

    // Reload when screen is focused and initialized
    useFocusEffect(
        useCallback(() => {
            if (isInitialized) {
                loadWatchlist();
            }
        }, [isInitialized])
    );

    const loadWatchlist = async () => {
        if (!isInitialized) return;

        try {
            const data = await WatchlistService.getAll();
            setWatchlist(data);
        } catch (error) {
            console.error('Error loading watchlist:', error);
        }
    };

    const addToWatchlist = async (movie: Movie) => {
        setError(null);

        // Wait for database initialization
        if (!isInitialized) {
            try {
                await initializeDatabase();
                setIsInitialized(true);
            } catch (err) {
                const errorMessage = 'Veritabanı başlatılamadı';
                console.error('Database initialization failed:', err);
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        }

        try {
            // Ensure movie is saved with complete data
            await MovieService.upsert(movie);
            const success = await WatchlistService.add(movie.id, 'local', isOnline);

            if (!success) {
                const errorMessage = 'İzleme listesine eklenemedi';
                setError(errorMessage);
                throw new Error(errorMessage);
            }

            await loadWatchlist();

            // Sync to Supabase if online and user is logged in
            if (isOnline && user?.id) {
                console.log('[DEBUG-Watchlist] Syncing to Supabase...');
                const supabaseResult = await supabaseService.addToWatchlist(user.id, movie);
                console.log('[DEBUG-Watchlist] Supabase addToWatchlist result:', supabaseResult);
            } else if (!isOnline) {
                console.log('[Watchlist] Offline mode - will sync when online');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'İzleme listesine eklenirken hata oluştu';
            console.error('Error adding to watchlist:', err);
            setError(errorMessage);
            throw err;
        }
    };

    const removeFromWatchlist = async (movieId: number) => {
        setError(null);

        // Wait for database initialization
        if (!isInitialized) {
            try {
                await initializeDatabase();
                setIsInitialized(true);
            } catch (err) {
                const errorMessage = 'Veritabanı başlatılamadı';
                console.error('Database initialization failed:', err);
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        }

        try {
            const success = await WatchlistService.remove(movieId, isOnline);

            if (!success) {
                const errorMessage = 'İzleme listesinden kaldırılamadı';
                setError(errorMessage);
                throw new Error(errorMessage);
            }

            await loadWatchlist();

            // Sync to Supabase if online and user is logged in
            if (isOnline && user?.id) {
                console.log('[DEBUG-Watchlist] Syncing remove to Supabase...');
                const supabaseResult = await supabaseService.removeFromWatchlist(user.id, movieId);
                console.log('[DEBUG-Watchlist] Supabase removeFromWatchlist result:', supabaseResult);
            } else if (!isOnline) {
                console.log('[Watchlist] Offline mode - will sync when online');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'İzleme listesinden kaldırılırken hata oluştu';
            console.error('Error removing from watchlist:', err);
            setError(errorMessage);
            throw err;
        }
    };

    const isInWatchlist = async (movieId: number): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            return await WatchlistService.isInWatchlist(movieId);
        } catch (error) {
            console.error('Error checking watchlist:', error);
            return false;
        }
    };

    const toggleWatchlist = async (movie: Movie) => {
        // Ensure DB is initialized before toggling
        if (!isInitialized) {
            try {
                await initializeDatabase();
                setIsInitialized(true);
            } catch (err) {
                const errorMessage = 'Veritabanı başlatılamadı';
                console.error('Database initialization failed:', err);
                setError(errorMessage);
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
        } catch (error) {
            console.error('Error toggling watchlist:', error);
        }
    };

    const clearWatchlist = async () => {
        if (!isInitialized) return;

        try {
            const items = await WatchlistService.getAll();
            for (const item of items) {
                await WatchlistService.remove(item.id);
            }
            await loadWatchlist();
        } catch (error) {
            console.error('Error clearing watchlist:', error);
        }
    };

    const syncWatchlist = async () => {
        if (!isOnline) {
            console.log('Offline - sync skipped');
            return;
        }

        try {
            await syncManager.syncWatchlist();
            await loadWatchlist();
        } catch (error) {
            console.error('Error syncing watchlist:', error);
        }
    };

    const clearError = () => setError(null);

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
