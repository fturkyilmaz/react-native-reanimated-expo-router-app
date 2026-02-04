// @ts-nocheck
import { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { FavoritesService, MovieService } from '@/services/local-db.service';
import { supabaseService } from '@/services/supabase-service';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import { useAuthStore } from '@/store/authStore';
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
  error: string | null;
  clearError: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSyncing } = useSyncStatus();

  // Initialize database once
  useEffect(() => {
    console.log('[DEBUG-Favorites] Initializing database...');
    const init = async () => {
      try {
        await initializeDatabase();
        setIsInitialized(true);
        console.log('[DEBUG-Favorites] Database initialized successfully');
        await loadFavorites();
      } catch (error) {
        console.error('[DEBUG-Favorites] Database initialization error:', error);
      }
    };
    init();
  }, []);

  // Monitor network status
  useEffect(() => {
    console.log('[DEBUG-Favorites] Setting up network listener...');
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      console.log('[DEBUG-Favorites] Network status changed:', online);
      setIsOnline(online);

      // Sync when coming back online
      if (online && favorites.length > 0) {
        console.log('[DEBUG-Favorites] Back online, triggering sync for', favorites.length, 'favorites');
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
    if (!isInitialized) {
      console.log('[DEBUG-Favorites] loadFavorites skipped - not initialized');
      return;
    }

    try {
      console.log('[DEBUG-Favorites] Loading favorites from database...');
      const data = await FavoritesService.getAll();
      console.log('[DEBUG-Favorites] Loaded favorites count:', data.length, 'IDs:', data.map(m => m.id));
      setFavorites(data);
    } catch (error) {
      console.error('[DEBUG-Favorites] Error loading favorites:', error);
    }
  };

  const addFavorite = async (movie: Movie) => {
    setError(null);

    console.log('[DEBUG-Favorites] addFavorite called with movie.id:', movie.id, 'title:', movie.title);

    // Wait for database initialization
    if (!isInitialized) {
      console.log('[DEBUG-Favorites] Database not initialized, retrying...');
      // Retry initialization if needed
      try {
        await initializeDatabase();
        setIsInitialized(true);
        console.log('[DEBUG-Favorites] Database initialized successfully');
      } catch (err) {
        const errorMessage = 'Veritabanı başlatılamadı';
        console.error('[DEBUG-Favorites] Database initialization failed:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    }

    try {
      console.log('[DEBUG-Favorites] Upserting movie data...');
      // Ensure movie is saved with complete data
      const upsertResult = await MovieService.upsert(movie);
      console.log('[DEBUG-Favorites] MovieService.upsert result:', upsertResult);

      console.log('[DEBUG-Favorites] Adding to favorites, isOnline:', isOnline);
      const success = await FavoritesService.add(movie.id, 'local', isOnline);
      console.log('[DEBUG-Favorites] FavoritesService.add result:', success);

      if (!success) {
        const errorMessage = 'Favori eklenemedi';
        console.error('[DEBUG-Favorites] Add failed, success was:', success);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Sync to Supabase if online
      if (isOnline) {
        console.log('[DEBUG-Favorites] Syncing to Supabase...');
        const { user } = useAuthStore.getState();
        if (user?.id) {
          const supabaseResult = await supabaseService.addFavorite(user.id, movie);
          console.log('[DEBUG-Favorites] Supabase addFavorite result:', supabaseResult);
        } else {
          console.log('[DEBUG-Favorites] No user logged in, skipping Supabase sync');
        }
      }

      console.log('[DEBUG-Favorites] Loading favorites after add...');
      await loadFavorites();

      // Verify the favorite was added
      const isNowFavorite = await FavoritesService.isFavorite(movie.id);
      console.log('[DEBUG-Favorites] After add - isFavorite check:', isNowFavorite);

      // If offline, trigger sync when online
      if (!isOnline) {
        console.log('[Favorites] Offline mode - will sync when online');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Favori eklenirken hata oluştu';
      console.error('[DEBUG-Favorites] Error adding favorite:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const removeFavorite = async (movieId: number) => {
    setError(null);
    console.log('[DEBUG-Favorites] removeFavorite called for movieId:', movieId);

    // Wait for database initialization
    if (!isInitialized) {
      console.log('[DEBUG-Favorites] Database not initialized, retrying...');
      try {
        await initializeDatabase();
        setIsInitialized(true);
        console.log('[DEBUG-Favorites] Database initialized successfully');
      } catch (err) {
        const errorMessage = 'Veritabanı başlatılamadı';
        console.error('[DEBUG-Favorites] Database initialization failed:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    }

    try {
      const success = await FavoritesService.remove(movieId, isOnline);
      console.log('[DEBUG-Favorites] FavoritesService.remove result:', success);

      if (!success) {
        const errorMessage = 'Favori kaldırılamadı';
        console.error('[DEBUG-Favorites] Remove failed, success was:', success);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Sync to Supabase if online
      if (isOnline) {
        console.log('[DEBUG-Favorites] Syncing remove to Supabase...');
        const { user } = useAuthStore.getState();
        if (user?.id) {
          const supabaseResult = await supabaseService.removeFavorite(user.id, movieId);
          console.log('[DEBUG-Favorites] Supabase removeFavorite result:', supabaseResult);
        } else {
          console.log('[DEBUG-Favorites] No user logged in, skipping Supabase sync');
        }
      }

      console.log('[DEBUG-Favorites] Loading favorites after remove...');
      await loadFavorites();

      // Verify the favorite was removed
      const isStillFavorite = await FavoritesService.isFavorite(movieId);
      console.log('[DEBUG-Favorites] After remove - isFavorite check:', isStillFavorite);

      // If offline, trigger sync when online
      if (!isOnline) {
        console.log('[Favorites] Offline mode - will sync when online');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Favori kaldırılırken hata oluştu';
      console.error('[DEBUG-Favorites] Error removing favorite:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const isFavorite = async (movieId: number): Promise<boolean> => {
    if (!isInitialized) {
      console.log('[DEBUG-Favorites] isFavorite skipped - not initialized');
      return false;
    }

    try {
      const result = await FavoritesService.isFavorite(movieId);
      console.log('[DEBUG-Favorites] isFavorite(', movieId, '):', result);
      return result;
    } catch (error) {
      console.error('[DEBUG-Favorites] Error checking favorite:', error);
      return false;
    }
  };

  const toggleFavorite = async (movie: Movie) => {
    console.log('[DEBUG-Favorites] toggleFavorite called for movie.id:', movie.id);
    // Ensure DB is initialized before toggling
    if (!isInitialized) {
      console.log('[DEBUG-Favorites] DB not initialized in toggleFavorite, initializing...');
      try {
        await initializeDatabase();
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = 'Veritabanı başlatılamadı';
        console.error('[DEBUG-Favorites] Database initialization failed:', err);
        setError(errorMessage);
        return;
      }
    }

    try {
      const alreadyFavorite = await FavoritesService.isFavorite(movie.id);
      console.log('[DEBUG-Favorites] Already favorite:', alreadyFavorite);
      if (alreadyFavorite) {
        console.log('[DEBUG-Favorites] Removing from favorites...');
        await removeFavorite(movie.id);
      } else {
        console.log('[DEBUG-Favorites] Adding to favorites...');
        await addFavorite(movie);
      }
    } catch (error) {
      console.error('[DEBUG-Favorites] Error toggling favorite:', error);
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

  const clearError = () => setError(null);

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
        error,
        clearError,
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
