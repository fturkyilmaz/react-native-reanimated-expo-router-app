// @ts-nocheck
import { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { MovieService, WatchlistService } from '@/services/local-db.service';
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
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const [watchlist, setWatchlist] = useState<Movie[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { isSyncing } = useSyncStatus();

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
        if (!isInitialized) return;

        try {
            // Ensure movie is saved
            await MovieService.upsert(movie);
            await WatchlistService.add(movie.id);
            await loadWatchlist();
        } catch (error) {
            console.error('Error adding to watchlist:', error);
        }
    };

    const removeFromWatchlist = async (movieId: number) => {
        if (!isInitialized) return;

        try {
            await WatchlistService.remove(movieId);
            await loadWatchlist();
        } catch (error) {
            console.error('Error removing from watchlist:', error);
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
        if (!isInitialized) return;

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
