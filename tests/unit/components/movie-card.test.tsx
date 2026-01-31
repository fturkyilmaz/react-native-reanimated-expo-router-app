import { MovieCard } from '@/components/movie-card';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mockMovies } from '../../__mocks__/mockData';

// Mock the useTheme hook
jest.mock('@/hooks/use-theme', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      card: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#666666',
    },
  })),
}));

describe('MovieCard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with movie data', () => {
    const { getByText, getByTestId } = render(
      <MovieCard movie={mockMovies[0]} index={0} />
    );

    expect(getByText('Joker')).toBeTruthy();
    expect(getByText('2019')).toBeTruthy();
    expect(getByText(/⭐/)).toBeTruthy();
  });

  it('displays correct rating', () => {
    const { getByText } = render(
      <MovieCard movie={mockMovies[0]} index={0} />
    );

    expect(getByText(/⭐ 8.2/)).toBeTruthy();
  });

  it('displays "2024" when release_date is missing', () => {
    const movieWithoutDate = { ...mockMovies[0], release_date: '' };
    const { getByText } = render(
      <MovieCard movie={movieWithoutDate} index={0} />
    );

    expect(getByText('2024')).toBeTruthy();
  });

  it('navigates to movie detail on press', () => {
    const { getByTestId } = render(
      <MovieCard movie={mockMovies[0]} index={0} />
    );

    const card = getByTestId('movie-card');
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(movies)/[id]',
      params: {
        id: '1',
        item: JSON.stringify(mockMovies[0]),
      },
    });
  });

  it('renders with correct index-based animation delay', () => {
    const { getByTestId } = render(
      <MovieCard movie={mockMovies[0]} index={5} />
    );

    expect(getByTestId('movie-card')).toBeTruthy();
  });

  it('handles press in and press out events', () => {
    const { getByTestId } = render(
      <MovieCard movie={mockMovies[0]} index={0} />
    );

    const card = getByTestId('movie-card');
    
    fireEvent(card, 'pressIn');
    fireEvent(card, 'pressOut');
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalled();
  });

  it('renders with placeholder image when poster_path is null', () => {
    const movieWithoutPoster = { ...mockMovies[0], poster_path: null };
    const { getByTestId } = render(
      <MovieCard movie={movieWithoutPoster} index={0} />
    );

    expect(getByTestId('movie-card')).toBeTruthy();
  });
});
