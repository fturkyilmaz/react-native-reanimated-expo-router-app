import { FavoritesProvider, useFavorites } from '@/hooks/useFavorites';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { mockMovies } from '../../__mocks__/mockData';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
);

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => {
      renderHook(() => useFavorites());
    }).toThrow('useFavorites must be used within FavoritesProvider');

    consoleSpy.mockRestore();
  });

  it('initializes with empty favorites', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => {
      expect(result.current.favorites).toEqual([]);
    });
  });

  it('loads favorites from storage on mount', async () => {
    const storedFavorites = [mockMovies[0], mockMovies[1]];
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(storedFavorites)
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(2);
      expect(result.current.favorites[0].id).toBe(mockMovies[0].id);
    });
  });

  it('adds a favorite', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe(mockMovies[0].id);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it('does not add duplicate favorites', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
      await result.current.addFavorite(mockMovies[0]);
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('removes a favorite', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
      await result.current.addFavorite(mockMovies[1]);
    });

    expect(result.current.favorites).toHaveLength(2);

    await act(async () => {
      await result.current.removeFavorite(mockMovies[0].id);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe(mockMovies[1].id);
  });

  it('checks if a movie is favorite', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
    });

    expect(result.current.isFavorite(mockMovies[0].id)).toBe(true);
    expect(result.current.isFavorite(mockMovies[1].id)).toBe(false);
  });

  it('toggles favorite - adds when not favorite', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite(mockMovies[0]);
    });

    expect(result.current.isFavorite(mockMovies[0].id)).toBe(true);
  });

  it('toggles favorite - removes when already favorite', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
    });

    await act(async () => {
      await result.current.toggleFavorite(mockMovies[0]);
    });

    expect(result.current.isFavorite(mockMovies[0].id)).toBe(false);
  });

  it('handles storage error on load gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => {
      expect(result.current.favorites).toEqual([]);
    });

    consoleSpy.mockRestore();
  });

  it('handles storage error on save gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.addFavorite(mockMovies[0]);
    });

    // Should not throw, just log error
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
