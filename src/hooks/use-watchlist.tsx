import { Movie } from '@/config/api';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface WatchlistContextType {
    watchlist: Movie[];
    addToWatchlist: (movie: Movie) => Promise<void>;
    removeFromWatchlist: (movieId: number) => Promise<void>;
    isInWatchlist: (movieId: number) => boolean;
    toggleWatchlist: (movie: Movie) => Promise<void>;
    clearWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

const WATCHLIST_STORAGE_KEY = 'user_watchlist';

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const [watchlist, setWatchlist] = useState<Movie[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const stored = await SecureStore.getItemAsync(WATCHLIST_STORAGE_KEY);
                if (stored) {
                    setWatchlist(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Watchlist yükleme hatası:', error);
            }
        })();
    }, []);

    const saveWatchlist = async (newWatchlist: Movie[]) => {
        try {
            await SecureStore.setItemAsync(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist), {
                keychainService: 'com.cinesearch.watchlist',
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
            setWatchlist(newWatchlist);
        } catch (error) {
            console.error('Watchlist kaydetme hatası:', error);
        }
    };

    const addToWatchlist = async (movie: Movie) => {
        const exists = watchlist.some(w => w.id === movie.id);
        if (!exists) {
            const newWatchlist = [...watchlist, movie];
            await saveWatchlist(newWatchlist);
        }
    };

    const removeFromWatchlist = async (movieId: number) => {
        const newWatchlist = watchlist.filter(w => w.id !== movieId);
        await saveWatchlist(newWatchlist);
    };

    const isInWatchlist = (movieId: number) => {
        return watchlist.some(w => w.id === movieId);
    };

    const toggleWatchlist = async (movie: Movie) => {
        if (isInWatchlist(movie.id)) {
            await removeFromWatchlist(movie.id);
        } else {
            await addToWatchlist(movie);
        }
    };

    const clearWatchlist = async () => {
        await saveWatchlist([]);
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
            }}
        >
            {children}
        </WatchlistContext.Provider>
    );
}

export const useWatchlist = () => {
    const context = useContext(WatchlistContext);
    if (!context) {
        throw new Error('useWatchlist must be used within WatchlistProvider');
    }
    return context;
};
