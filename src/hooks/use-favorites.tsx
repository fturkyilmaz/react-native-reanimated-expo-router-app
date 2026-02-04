// @ts-nocheck
import { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { FavoritesService, MovieService } from '@/services/local-db.service';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface FavoritesContextType {
  favorites: Movie[];
  addFavorite: (movie: Movie) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
  isFavorite: (movieId: number) => Promise<boolean>;
  toggleFavorite: (movie: Movie) => Promise<void>;
  syncFavorites: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isSyncing } = useSyncStatus();

  // Initialize database once
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        setIsInitialized(true);
        await loadFavorites();
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
      if (online && favorites.length > 0) {
        syncManager.syncAll();
      }
    });

    return () => unsubscribe();
  }, [favorites.length]);

  // Reload when screen is focused and initialized
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        loadFavorites();
      }
    }, [isInitialized])
  );

  const loadFavorites = async () => {
    if (!isInitialized) return;

    try {
      const data = await FavoritesService.getAll();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const addFavorite = async (movie: Movie) => {
    if (!isInitialized) return;

    try {
      // Ensure movie is saved
      await MovieService.upsert(movie);
      await FavoritesService.add(movie.id);
      await loadFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const removeFavorite = async (movieId: number) => {
    if (!isInitialized) return;

    try {
      await FavoritesService.remove(movieId);
      await loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const isFavorite = async (movieId: number): Promise<boolean> => {
    if (!isInitialized) return false;

    try {
      return await FavoritesService.isFavorite(movieId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  };

  const toggleFavorite = async (movie: Movie) => {
    if (!isInitialized) return;

    try {
      const alreadyFavorite = await FavoritesService.isFavorite(movie.id);
      if (alreadyFavorite) {
        await removeFavorite(movie.id);
      } else {
        await addFavorite(movie);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const syncFavorites = async () => {
    if (!isOnline) {
      console.log('Offline - sync skipped');
      return;
    }

    try {
      await syncManager.syncFavorites();
      await loadFavorites();
    } catch (error) {
      console.error('Error syncing favorites:', error);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        syncFavorites,
        isSyncing,
        isOnline,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
