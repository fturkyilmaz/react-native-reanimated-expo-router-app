import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

const MOVIES_KEY = 'movies';

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

export function useMovieDetails(id: number) {
    return useQuery({
        queryKey: [MOVIES_KEY, 'detail', id],
        queryFn: () => tmdbService.getMovieDetails(id),
        enabled: !!id,
    });
}

export function useSearchMovies(query: string) {
    return useQuery({
        queryKey: [MOVIES_KEY, 'search', query],
        queryFn: () => tmdbService.searchMovies(query),
        enabled: query.length > 2, // 2 karakterden fazlaysa ara
        staleTime: 1000 * 60 * 2, // 2 dakika cache
    });
}