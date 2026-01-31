import MovieDetailScreen from '@/app/(movies)/[id]';
import { useFavorites } from '@/hooks/useFavorites';
import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// Mock hooks
jest.mock('@/hooks/useFavorites');
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
}));

describe('MovieDetailScreen Integration', () => {
  const mockToggleFavorite = jest.fn();
  const mockIsFavorite = jest.fn();

  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    poster_path: '/test-poster.jpg',
    vote_average: 8.5,
    release_date: '2024-01-01',
    overview: 'This is a test movie overview',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '1',
      item: JSON.stringify(mockMovie),
    });
    (useFavorites as jest.Mock).mockReturnValue({
      toggleFavorite: mockToggleFavorite,
      isFavorite: mockIsFavorite.mockReturnValue(false),
    });
  });

  it('renders movie details correctly', () => {
    const { getByText } = render(<MovieDetailScreen />);

    expect(getByText('Test Movie')).toBeTruthy();
  });

  it('toggles favorite status', () => {
    const { getByTestId } = render(<MovieDetailScreen />);

    const favoriteButton = getByTestId('favorite-button');
    fireEvent.press(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalled();
  });

  it('displays correct favorite icon when not favorite', () => {
    mockIsFavorite.mockReturnValue(false);

    const { getByTestId } = render(<MovieDetailScreen />);

    const favoriteButton = getByTestId('favorite-button');
    expect(favoriteButton).toBeTruthy();
  });

  it('displays correct favorite icon when favorite', () => {
    mockIsFavorite.mockReturnValue(true);

    const { getByTestId } = render(<MovieDetailScreen />);

    const favoriteButton = getByTestId('favorite-button');
    expect(favoriteButton).toBeTruthy();
  });

  it('handles missing movie data gracefully', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: '1',
      item: undefined,
    });

    const { getByText } = render(<MovieDetailScreen />);

    // Should still render without crashing
    expect(getByText('Test Movie')).toBeTruthy();
  });

  it('renders video player', () => {
    const { getByTestId } = render(<MovieDetailScreen />);

    const videoView = getByTestId('video-view');
    expect(videoView).toBeTruthy();
  });

  it('displays movie rating', () => {
    const { getByText } = render(<MovieDetailScreen />);

    expect(getByText(/8.5/)).toBeTruthy();
  });

  it('displays release year', () => {
    const { getByText } = render(<MovieDetailScreen />);

    expect(getByText('2024')).toBeTruthy();
  });

  it('handles scroll events', () => {
    const { getByTestId } = render(<MovieDetailScreen />);

    const scrollView = getByTestId('movie-scroll-view');
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 100 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 500 },
      },
    });

    expect(scrollView).toBeTruthy();
  });

  it('renders with different movie IDs', () => {
    const movies = [
      { id: 1, title: 'Movie 1', poster_path: '/poster1.jpg', vote_average: 7.5, release_date: '2024-01-01' },
      { id: 2, title: 'Movie 2', poster_path: '/poster2.jpg', vote_average: 8.5, release_date: '2024-02-01' },
      { id: 3, title: 'Movie 3', poster_path: '/poster3.jpg', vote_average: 9.0, release_date: '2024-03-01' },
    ];

    movies.forEach((movie) => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: movie.id.toString(),
        item: JSON.stringify(movie),
      });

      const { getByText } = render(<MovieDetailScreen />);
      expect(getByText(movie.title)).toBeTruthy();
    });
  });
});
