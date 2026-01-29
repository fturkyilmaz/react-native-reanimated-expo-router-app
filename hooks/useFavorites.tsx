import { Movie } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface FavoritesContextType {
  favorites: Movie[];
  addFavorite: (movie: Movie) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
  toggleFavorite: (movie: Movie) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = 'user_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Favori yükleme hatası:', error);
      }
    })();
  }, []);

  const saveFavorites = async (newFavorites: Movie[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Favori kaydetme hatası:', error);
    }
  };

  const addFavorite = async (movie: Movie) => {
    const exists = favorites.some(f => f.id === movie.id);
    if (!exists) {
      const newFavorites = [...favorites, movie];
      await saveFavorites(newFavorites);
    }
  };

  const removeFavorite = async (movieId: number) => {
    const newFavorites = favorites.filter(f => f.id !== movieId);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (movieId: number) => {
    return favorites.some(f => f.id === movieId);
  };

  const toggleFavorite = async (movie: Movie) => {
    if (isFavorite(movie.id)) {
      await removeFavorite(movie.id);
    } else {
      await addFavorite(movie);
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
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
