import { MovieCard } from '@/components/movie-card';
import React from 'react';
import renderer from 'react-test-renderer';

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

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('MovieCard Snapshot', () => {
  const mockMovie = {
    id: 1,
    title: 'Joker',
    poster_path: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    vote_average: 8.2,
    release_date: '2019-10-04',
  };

  it('renders correctly', () => {
    const tree = renderer
      .create(<MovieCard movie={mockMovie} index={0} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders with placeholder image when poster is null', () => {
    const movieWithoutPoster = {
      ...mockMovie,
      poster_path: null,
      title: 'Test Movie',
    };

    const tree = renderer
      .create(<MovieCard movie={movieWithoutPoster} index={0} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders with different index', () => {
    const tree = renderer
      .create(<MovieCard movie={mockMovie} index={5} />)
      .toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders with different movie data', () => {
    const differentMovie = {
      id: 2,
      title: 'Interstellar',
      poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      vote_average: 8.4,
      release_date: '2014-11-07',
    };

    const tree = renderer
      .create(<MovieCard movie={differentMovie} index={0} />)
      .toJSON();
    expect(tree).toBeTruthy();
  });
});
