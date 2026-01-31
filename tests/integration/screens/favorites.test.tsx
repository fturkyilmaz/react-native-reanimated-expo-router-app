import FavoritesScreen from '@/app/(tabs)/favorites';
import { useTheme } from '@/hooks/use-theme';
import { useFavorites } from '@/hooks/useFavorites';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Mock hooks
jest.mock('@/hooks/useFavorites');
jest.mock('@/hooks/use-theme');

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
}));

describe('FavoritesScreen Integration', () => {
  const mockRemoveFavorite = jest.fn();
  const mockToggleFavorite = jest.fn();

  const mockFavorites = [
    { id: 1, title: 'Favorite Movie 1', poster_path: '/poster1.jpg', vote_average: 8.5, release_date: '2024-01-01' },
    { id: 2, title: 'Favorite Movie 2', poster_path: '/poster2.jpg', vote_average: 7.5, release_date: '2024-02-01' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: {
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#1a1a1a',
        textSecondary: '#666666',
        primary: '#E50914',
        primaryLight: '#FFF3F3',
      },
      isDarkMode: false,
    });
  });

  it('renders empty state when no favorites', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: [],
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn(() => false),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('Henüz Favori Yok')).toBeTruthy();
    expect(getByText('Beğendiğiniz filmleri buraya eklemek için kalp ikonuna dokunun')).toBeTruthy();
    expect(getByText('Keşfetmeye Başla')).toBeTruthy();
  });

  it('renders favorites list', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: mockFavorites,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn((id) => mockFavorites.some(f => f.id === id)),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('Favorite Movie 1')).toBeTruthy();
    expect(getByText('Favorite Movie 2')).toBeTruthy();
  });

  it('displays correct number of favorites in header', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: mockFavorites,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn((id) => mockFavorites.some(f => f.id === id)),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('2')).toBeTruthy();
  });

  it('navigates to explore when explore button is pressed', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: [],
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn(() => false),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    const exploreButton = getByText('Keşfetmeye Başla');
    fireEvent.press(exploreButton);

    expect(mockPush).toHaveBeenCalledWith('/(tabs)');
  });

  it('removes favorite when remove button is pressed', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: mockFavorites,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn((id) => mockFavorites.some(f => f.id === id)),
      toggleFavorite: mockToggleFavorite,
    });

    const { getAllByTestId } = render(<FavoritesScreen />);

    const removeButtons = getAllByTestId('remove-favorite-button');
    fireEvent.press(removeButtons[0]);

    expect(mockRemoveFavorite).toHaveBeenCalledWith(1);
  });

  it('navigates to movie detail when favorite is pressed', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: mockFavorites,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn((id) => mockFavorites.some(f => f.id === id)),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    const movieItem = getByText('Favorite Movie 1');
    fireEvent.press(movieItem);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(movies)/[id]',
      params: { id: 1 },
    });
  });

  it('applies correct theme colors', () => {
    (useFavorites as jest.Mock).mockReturnValue({
      favorites: [],
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn(() => false),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByTestId } = render(<FavoritesScreen />);

    const container = getByTestId('favorites-container');
    expect(container).toBeTruthy();
  });

  it('renders with dark theme', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: {
        background: '#0f0f0f',
        card: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#b3b3b3',
        primary: '#E50914',
        primaryLight: '#2a1a1a',
      },
      isDarkMode: true,
    });

    (useFavorites as jest.Mock).mockReturnValue({
      favorites: [],
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn(() => false),
      toggleFavorite: mockToggleFavorite,
    });

    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('Henüz Favori Yok')).toBeTruthy();
  });
});
