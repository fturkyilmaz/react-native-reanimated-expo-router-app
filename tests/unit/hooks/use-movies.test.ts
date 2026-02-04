/**
 * Unit Tests for useMovies Hook
 */

import React from 'react';

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

import { useMovieDetails, useMovies, useSearchMovies } from '@/features/movies/hooks/use-movies';
import { tmdbService } from '@/services/tmdb';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

// Mock the tmdb service
jest.mock('@/services/tmdb', () => ({
    tmdbService: {
        getPopularMovies: jest.fn(),
        getTopRated: jest.fn(),
        getUpcoming: jest.fn(),
        getMovieDetails: jest.fn(),
        searchMovies: jest.fn(),
    },
}));

// Create a new QueryClient for each test
const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                retryDelay: 0,
                gcTime: 0,
            },
        },
    });

const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: createQueryClient() }, children)
);

describe('useMovies', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch popular movies successfully', async () => {
        const mockMovies = [
            { id: 1, title: 'Movie 1', poster_path: '/path1.jpg', vote_average: 8, release_date: '2024-01-01', overview: 'Overview 1', backdrop_path: '/back1.jpg', genre_ids: [1, 2] },
            { id: 2, title: 'Movie 2', poster_path: '/path2.jpg', vote_average: 7.5, release_date: '2024-02-01', overview: 'Overview 2', backdrop_path: '/back2.jpg', genre_ids: [3, 4] },
        ];

        (tmdbService.getPopularMovies as jest.Mock).mockResolvedValue({
            results: mockMovies,
            total_pages: 1,
        });

        const { result } = renderHook(() => useMovies('popular'), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
            expect(result.current.data).toEqual(mockMovies);
        });

        expect(tmdbService.getPopularMovies).toHaveBeenCalledWith(1);
    });

    it('should handle fetch error gracefully', async () => {
        (tmdbService.getPopularMovies as jest.Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useMovies('popular'), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
            expect(result.current.error).toBeDefined();
        });
    });

    it('should fetch different categories', async () => {
        (tmdbService.getTopRated as jest.Mock).mockResolvedValue({
            results: [{ id: 3, title: 'Top Rated', poster_path: '/path3.jpg', vote_average: 9, release_date: '2024-03-01', overview: 'Overview 3', backdrop_path: '/back3.jpg', genre_ids: [5, 6] }],
            total_pages: 1,
        });

        const { result } = renderHook(() => useMovies('top_rated'), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(tmdbService.getTopRated).toHaveBeenCalledWith(1);
    });
});

describe('useMovieDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch movie details successfully', async () => {
        const mockDetails = {
            id: 1,
            title: 'Movie 1',
            overview: 'Detailed overview',
            poster_path: '/path1.jpg',
            backdrop_path: '/back1.jpg',
            vote_average: 8,
            release_date: '2024-01-01',
            genre_ids: [1, 2],
            runtime: 120,
            genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Drama' }],
            homepage: 'https://example.com',
            tagline: 'A great tagline',
        };

        (tmdbService.getMovieDetails as jest.Mock).mockResolvedValue(mockDetails);

        const { result } = renderHook(() => useMovieDetails(1), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
            expect(result.current.data).toEqual(mockDetails);
        });
    });

    it('should not fetch when id is not provided', async () => {
        const { result } = renderHook(() => useMovieDetails(''), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(tmdbService.getMovieDetails).not.toHaveBeenCalled();
    });
});

describe('useSearchMovies', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should search movies with query', async () => {
        const mockSearchResults = [
            { id: 10, title: 'Search Result', poster_path: '/search.jpg', vote_average: 7, release_date: '2024-04-01', overview: 'Search overview', backdrop_path: '/search-back.jpg', genre_ids: [7] },
        ];

        (tmdbService.searchMovies as jest.Mock).mockResolvedValue({
            results: mockSearchResults,
        });

        const { result } = renderHook(() => useSearchMovies('joker'), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
            expect(result.current.data).toEqual(mockSearchResults);
        });

        expect(tmdbService.searchMovies).toHaveBeenCalledWith('joker', 1);
    });

    it('should not search when query is empty', async () => {
        const { result } = renderHook(() => useSearchMovies(''), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(tmdbService.searchMovies).not.toHaveBeenCalled();
    });
});
