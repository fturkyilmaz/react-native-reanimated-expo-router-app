/**
 * useFavorites - Favorites management hook
 *
 * Provides comprehensive favorites management with:
 * - Optimistic UI updates
 * - Automatic sync to Supabase when online
 * - Error handling with rollback
 * - Loading and error states
 */

import type { Movie } from '@/config/api';
import { initializeDatabase } from '@/db/database';
import { FavoritesService } from '@/services/favorites-service';
import { syncManager, useSyncStatus } from '@/services/sync-manager';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Favorites context type
 */
export interface FavoritesContextType {
  /** All favorite movies */
  favorites: Movie[];
  /** Add movie to favorites */
  addFavorite: (movie: Movie) => Promise<void>;
  /** Remove movie from favorites */
  removeFavorite: (movieId: number) => Promise<void>;
  /** Check if movie is in favorites */
  isFavorite: (movieId: number) => Promise<boolean>;
  /** Toggle favorite status */
  toggleFavorite: (movie: Movie) => Promise<void>;
  /** Refresh favorites list */
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

const FavoritesContext = createContext<FavoritesContextType | null>(null);

/**
 * Favorites Provider Component
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isSyncing, isOnline, pendingCount } = useSyncStatus();
  const isInitialized = useRef(false);

  /**
   * Initialize database and load favorites
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (isInitialized.current) return;

      try {
        console.log('[FavoritesProvider] Initializing...');
        await initializeDatabase();
        if (!mounted) return;
        isInitialized.current = true;
        await loadFavorites();
      } catch (err) {
        console.error('[FavoritesProvider] Init error:', err);
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
   * Load favorites from database
   */
  const loadFavorites = useCallback(async () => {
    if (!isInitialized.current) return;

    try {
      setIsLoading(true);
      const data = await FavoritesService.getAll();
      setFavorites(data);
      setError(null);
    } catch (err) {
      console.error('[FavoritesProvider] Load error:', err);
      setError('Favoriler yüklenemedi');
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
        loadFavorites();
      }
    }, [loadFavorites])
  );

  /**
   * Add movie to favorites (optimistic)
   */
  const addFavorite = useCallback(async (movie: Movie) => {
    setError(null);

    try {
      // Optimistic update
      setFavorites((prev) => {
        if (prev.some((f) => f.id === movie.id)) return prev;
        return [movie, ...prev];
      });

      // Add to local database
      await FavoritesService.add(movie, isOnline);

      // If online, sync to Supabase
      if (isOnline) {
        try {
          await syncManager.syncAll();
        } catch (syncErr) {
          console.warn('[FavoritesProvider] Sync error:', syncErr);
          // Don't fail the operation if sync fails
        }
      }

      console.log('[FavoritesProvider] Added favorite:', movie.id);
    } catch (err) {
      // Rollback optimistic update
      setFavorites((prev) => prev.filter((f) => f.id !== movie.id));
      const message = err instanceof Error ? err.message : 'Favori eklenemedi';
      setError(message);
      console.error('[FavoritesProvider] Add error:', err);
      throw err;
    }
  }, [isOnline]);

  /**
   * Remove movie from favorites (optimistic)
   */
  const removeFavorite = useCallback(async (movieId: number) => {
    setError(null);

    try {
      // Optimistic update
      setFavorites((prev) => prev.filter((f) => f.id !== movieId));

      // Remove from local database
      await FavoritesService.remove(movieId, isOnline);

      // If online, sync to Supabase
      if (isOnline) {
        try {
          await syncManager.syncAll();
        } catch (syncErr) {
          console.warn('[FavoritesProvider] Sync error:', syncErr);
        }
      }

      console.log('[FavoritesProvider] Removed favorite:', movieId);
    } catch (err) {
      // Rollback - reload
      await loadFavorites();
      const message = err instanceof Error ? err.message : 'Favori kaldırılamadı';
      setError(message);
      console.error('[FavoritesProvider] Remove error:', err);
      throw err;
    }
  }, [isOnline, loadFavorites]);

  /**
   * Check if movie is in favorites
   */
  const isFavorite = useCallback(async (movieId: number): Promise<boolean> => {
    if (!isInitialized.current) return false;

    try {
      return await FavoritesService.isFavorite(movieId);
    } catch (err) {
      console.error('[FavoritesProvider] isFavorite error:', err);
      return false;
    }
  }, []);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (movie: Movie) => {
    const already = await FavoritesService.isFavorite(movie.id);
    if (already) {
      await removeFavorite(movie.id);
    } else {
      await addFavorite(movie);
    }
  }, [addFavorite, removeFavorite]);

  /**
   * Refresh favorites
   */
  const refresh = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

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
      await loadFavorites();
    } catch (err) {
      console.error('[FavoritesProvider] Sync error:', err);
      setError('Senkronizasyon başarısız');
      throw err;
    }
  }, [isOnline, loadFavorites]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => setError(null), []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
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
    </FavoritesContext.Provider>
  );
}

/**
 * useFavorites hook
 *
 * @throws Error if used outside FavoritesProvider
 */
export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }

  return context;
}

// ============================================================================
// INLINE IMPORTS
// ============================================================================

import { createContext, useContext } from 'react';
