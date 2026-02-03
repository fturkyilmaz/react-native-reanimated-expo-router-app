import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

const MOVIES_KEY = 'movies';

// Popular Movies
export function usePopularMovies() {
    return useInfiniteQuery({
        queryKey: [MOVIES_KEY, 'popular'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getPopularMovies(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}

// Top Rated Movies (IMDB Top 100 benzeri)
export function useTopRatedMovies() {
    return useInfiniteQuery({
        queryKey: [MOVIES_KEY, 'top_rated'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getTopRated(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}

// Now Playing Movies
export function useNowPlayingMovies() {
    return useInfiniteQuery({
        queryKey: [MOVIES_KEY, 'now_playing'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getNowPlaying(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}

// Upcoming Movies
export function useUpcomingMovies() {
    return useInfiniteQuery({
        queryKey: [MOVIES_KEY, 'upcoming'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getUpcoming(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}

// Movie Details
export function useMovieDetails(id: number) {
    return useQuery({
        queryKey: [MOVIES_KEY, 'detail', id],
        queryFn: () => tmdbService.getMovieDetails(id),
        enabled: !!id,
    });
}

// Search Movies
export function useSearchMovies(query: string) {
    return useQuery({
        queryKey: [MOVIES_KEY, 'search', query],
        queryFn: () => tmdbService.searchMovies(query),
        enabled: query.length > 2,
        staleTime: 1000 * 60 * 2,
    });
}

// Genre List
export function useGenreList() {
    return useQuery({
        queryKey: [MOVIES_KEY, 'genres'],
        queryFn: () => tmdbService.getGenreList(),
        staleTime: 1000 * 60 * 60 * 24, // 24 saat cache
    });
}

// Movies by Genre
export function useMoviesByGenre(genreId: number) {
    return useInfiniteQuery({
        queryKey: [MOVIES_KEY, 'genre', genreId],
        queryFn: ({ pageParam = 1 }) => tmdbService.getMoviesByGenre(genreId, pageParam as number),
        initialPageParam: 1,
        enabled: !!genreId,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}
