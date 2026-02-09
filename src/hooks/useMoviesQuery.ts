/**
 * Movie Query Hooks
 * 
 * React Query hooks for fetching movie data from TMDB.
 * Provides optimized data fetching with caching and infinite scrolling support.
 */

import type { Movie, MovieDetails, TVShow, TVShowDetails } from '@/config/api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

const MOVIES_KEY = 'movies';
const TV_KEY = 'tv';

// ============================================================================
// Types
// ============================================================================

type MovieCategory = 'popular' | 'top_rated' | 'now_playing' | 'upcoming';

interface PaginatedResponse {
    results: Movie[] | TVShow[];
    total_pages: number;
    page?: number;
}

// ============================================================================
// Private Helpers
// ============================================================================

/**
 * Shared pagination logic for infinite queries
 */
function getNextPageParam<T extends { total_pages: number }>(
    lastPage: T,
    allPages: ReadonlyArray<unknown>
): number | undefined {
    if (lastPage.total_pages > allPages.length) {
        return allPages.length + 1;
    }
    return undefined;
}

/**
 * Creates an infinite query hook for movie categories
 * 
 * @param category - Movie category type
 * @returns Configured useInfiniteQuery hook
 */
function createMovieCategoryHook(category: MovieCategory) {
    return function useMovies() {
        return useInfiniteQuery<PaginatedResponse>({
            queryKey: [MOVIES_KEY, category] as const,
            queryFn: async ({ pageParam = 1 }) => {
                const methods: Record<MovieCategory, (page: number) => Promise<PaginatedResponse>> = {
                    popular: (page) => tmdbService.getPopularMovies(page) as Promise<PaginatedResponse>,
                    top_rated: (page) => tmdbService.getTopRated(page) as Promise<PaginatedResponse>,
                    now_playing: (page) => tmdbService.getNowPlaying(page) as Promise<PaginatedResponse>,
                    upcoming: (page) => tmdbService.getUpcoming(page) as Promise<PaginatedResponse>,
                };
                return methods[category](pageParam as number);
            },
            initialPageParam: 1,
            getNextPageParam,
        });
    };
}

// ============================================================================
// Public Hooks - Movie Categories (DRY Pattern)
// ============================================================================

/**
 * Fetches popular movies with infinite scrolling pagination
 */
export const usePopularMovies = createMovieCategoryHook('popular');

/**
 * Fetches top rated movies (IMDB Top 100 style)
 */
export const useTopRatedMovies = createMovieCategoryHook('top_rated');

/**
 * Fetches now playing movies
 */
export const useNowPlayingMovies = createMovieCategoryHook('now_playing');

/**
 * Fetches upcoming movies
 */
export const useUpcomingMovies = createMovieCategoryHook('upcoming');

// ============================================================================
// Public Hooks - Single Item Queries
// ============================================================================

/**
 * Fetches detailed information for a specific movie
 * 
 * @param id - Movie ID to fetch details for
 * @returns Query result with movie details
 */
export function useMovieDetails(id: number) {
    return useQuery<MovieDetails>({
        queryKey: [MOVIES_KEY, 'detail', id] as const,
        queryFn: () => tmdbService.getMovieDetails(id),
        enabled: !!id,
    });
}

/**
 * Searches movies by query string
 * 
 * @param query - Search query string (min 3 characters)
 * @returns Query result with search results
 */
export function useSearchMovies(query: string) {
    return useQuery<PaginatedResponse>({
        queryKey: [MOVIES_KEY, 'search', query] as const,
        queryFn: () => tmdbService.searchMovies(query) as Promise<PaginatedResponse>,
        enabled: query.length > 2,
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Fetches list of all movie genres
 * 
 * @returns Query result with genre list (cached for 24 hours)
 */
export function useGenreList() {
    return useQuery({
        queryKey: [MOVIES_KEY, 'genres'] as const,
        queryFn: () => tmdbService.getGenreList(),
        staleTime: 1000 * 60 * 60 * 24,
    });
}

/**
 * Fetches movies filtered by genre
 * 
 * @param genreId - Genre ID to filter by
 * @returns Infinite query result with movies in genre
 */
export function useMoviesByGenre(genreId: number) {
    return useInfiniteQuery<PaginatedResponse>({
        queryKey: [MOVIES_KEY, 'genre', genreId] as const,
        queryFn: ({ pageParam = 1 }) => tmdbService.getMoviesByGenre(genreId, pageParam as number) as Promise<PaginatedResponse>,
        initialPageParam: 1,
        getNextPageParam,
        enabled: !!genreId,
    });
}

// ============================================================================
// TV Show Hooks
// ============================================================================

/**
 * Fetches popular TV shows
 */
export function usePopularTVShows() {
    return useInfiniteQuery<PaginatedResponse>({
        queryKey: [TV_KEY, 'popular'] as const,
        queryFn: ({ pageParam = 1 }) => tmdbService.getPopularTVShows(pageParam as number) as Promise<PaginatedResponse>,
        initialPageParam: 1,
        getNextPageParam,
    });
}

/**
 * Fetches top rated TV shows
 */
export function useTopRatedTVShows() {
    return useInfiniteQuery<PaginatedResponse>({
        queryKey: [TV_KEY, 'top_rated'] as const,
        queryFn: ({ pageParam = 1 }) => tmdbService.getTopRatedTVShows(pageParam as number) as Promise<PaginatedResponse>,
        initialPageParam: 1,
        getNextPageParam,
    });
}

/**
 * Fetches TV show details
 * 
 * @param id - TV Show ID
 * @returns Query result with TV show details
 */
export function useTVShowDetails(id: number) {
    return useQuery<TVShowDetails>({
        queryKey: [TV_KEY, 'detail', id] as const,
        queryFn: () => tmdbService.getTVShowDetails(id),
        enabled: !!id,
    });
}

/**
 * Searches TV shows
 * 
 * @param query - Search query string
 * @returns Query result with search results
 */
export function useSearchTVShows(query: string) {
    return useQuery<PaginatedResponse>({
        queryKey: [TV_KEY, 'search', query] as const,
        queryFn: () => tmdbService.searchTVShows(query) as Promise<PaginatedResponse>,
        enabled: query.length > 2,
        staleTime: 1000 * 60 * 2,
    });
}
