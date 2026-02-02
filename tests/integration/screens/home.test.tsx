import HomeScreen from '@/app/(tabs)/index';
import { useMovies } from '@/hooks/use-movies';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Mock hooks
jest.mock('@/hooks/useMovies');
jest.mock('@/store/authStore');
jest.mock('@/hooks/use-theme');

describe('HomeScreen Integration', () => {
  const mockMovies = [
    { id: 1, title: 'Movie 1', poster_path: '/poster1.jpg', vote_average: 8.5, release_date: '2024-01-01' },
    { id: 2, title: 'Movie 2', poster_path: '/poster2.jpg', vote_average: 7.5, release_date: '2024-02-01' },
  ];

  const mockRefresh = jest.fn();
  const mockLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: {
        background: '#f8f9fa',
        text: '#1a1a1a',
        textSecondary: '#666666',
        card: '#ffffff',
      },
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { name: 'Test User' },
    });
  });

  it('renders loading state initially', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: [],
      loading: true,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('skeleton-grid')).toBeTruthy();
  });

  it('renders movies list when loaded', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Movie 1')).toBeTruthy();
    expect(getByText('Movie 2')).toBeTruthy();
  });

  it('displays greeting with user name', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Merhaba, Test User')).toBeTruthy();
  });

  it('displays greeting for guest when no user', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
    });
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Merhaba, Film Sever')).toBeTruthy();
  });

  it('renders error state', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: [],
      loading: false,
      error: 'Failed to load movies',
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Failed to load movies')).toBeTruthy();
  });

  it('calls refresh on pull-to-refresh', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByTestId } = render(<HomeScreen />);

    const flatList = getByTestId('movies-flatlist');
    fireEvent(flatList, 'refresh');

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('calls loadMore when reaching end of list', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByTestId } = render(<HomeScreen />);

    const flatList = getByTestId('movies-flatlist');
    fireEvent.scroll(flatList, {
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 500 },
      },
    });

    // onEndReached should be triggered
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('renders footer when hasMore is true', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('list-footer')).toBeTruthy();
  });

  it('renders end message when hasMore is false', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: false,
      page: 5,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Tüm filmler yüklendi')).toBeTruthy();
  });

  it('renders correct number of columns', () => {
    (useMovies as jest.Mock).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadMore: mockLoadMore,
      hasMore: true,
      page: 1,
    });

    const { getByTestId } = render(<HomeScreen />);

    const flatList = getByTestId('movies-flatlist');
    expect(flatList.props.numColumns).toBe(2);
  });
});
