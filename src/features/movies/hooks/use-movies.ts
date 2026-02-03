/**
 * Movies Query Hooks
 * React Query hooks for fetching movie data with caching, retry, and error handling
 */

import type { Movie } from '@/config/api';
import { queryKeys } from '@/core/types';
import { tmdbService } from '@/services/tmdb';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type MovieCategory = 'popular' | 'top_rated' | 'upcoming';

/**
 * Hook to fetch movies by category
 */
export function useMovies(category: MovieCategory = 'popular', page = 1) {
    return useQuery({
        queryKey: queryKeys.movies.list(category, page),
        queryFn: async () => {
            let response: { results: Movie[]; total_pages: number };
            switch (category) {
                case 'popular':
                    response = await tmdbService.getPopularMovies(page);
                    break;
                case 'top_rated':
                    response = await tmdbService.getTopRated(page);
                    break;
                case 'upcoming':
                    response = await tmdbService.getUpcoming(page);
                    break;
            }
            return response.results;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook to fetch movie details
 */
export function useMovieDetails(id: number | string) {
    return useQuery({
        queryKey: queryKeys.movies.detail(id),
        queryFn: async () => {
            const movieId = typeof id === 'string' ? parseInt(id, 10) : id;
            return tmdbService.getMovieDetails(movieId);
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Hook to search movies
 */
export function useSearchMovies(query: string, page = 1) {
    return useQuery({
        queryKey: queryKeys.movies.search(query, page),
        queryFn: async () => {
            const response = await tmdbService.searchMovies(query, page);
            return response.results;
        },
        enabled: query.length > 0,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        retry: 1,
    });
}

/**
 * Hook to toggle favorite status with optimistic update
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (movie: Movie) => {
            // Favorites are handled locally, this is a placeholder for API sync
            return movie;
        },
        onMutate: async (movie) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });

            // Snapshot previous favorites
            const previousFavorites = queryClient.getQueryData<Movie[]>(queryKeys.favorites.all) ?? [];

            // Optimistically update
            const isFavorite = previousFavorites.some(f => f.id === movie.id);
            const newFavorites = isFavorite
                ? previousFavorites.filter(f => f.id !== movie.id)
                : [...previousFavorites, movie];

            queryClient.setQueryData(queryKeys.favorites.all, newFavorites);

            return { previousFavorites };
        },
        onError: (_error, _movie, context) => {
            // Rollback on error
            if (context?.previousFavorites) {
                queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
            }
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
        },
    });
}

/**
 * Hook to get all favorites
 */
export function useFavorites() {
    return useQuery({
        queryKey: queryKeys.favorites.all,
        queryFn: async () => {
            // This would fetch from local storage or API
            return [] as Movie[];
        },
        staleTime: 0,
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Hook to prefetch movie details
 */
export function usePrefetchMovieDetails() {
    const queryClient = useQueryClient();

    return (id: number | string) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.movies.detail(id),
            queryFn: async () => {
                const movieId = typeof id === 'string' ? parseInt(id, 10) : id;
                return tmdbService.getMovieDetails(movieId);
            },
            staleTime: 10 * 60 * 1000,
        });
    };
}
