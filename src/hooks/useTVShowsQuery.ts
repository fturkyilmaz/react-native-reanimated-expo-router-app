import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

const TV_SHOWS_KEY = 'tvshows';

export function usePopularTVShows() {
    return useInfiniteQuery({
        queryKey: [TV_SHOWS_KEY, 'popular'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getPopularTVShows(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}

export function useTVShowDetails(id: number) {
    return useQuery({
        queryKey: [TV_SHOWS_KEY, 'detail', id],
        queryFn: () => tmdbService.getTVShowDetails(id),
        enabled: !!id,
    });
}

export function useSearchTVShows(query: string) {
    return useQuery({
        queryKey: [TV_SHOWS_KEY, 'search', query],
        queryFn: () => tmdbService.searchTVShows(query),
        enabled: query.length > 2,
        staleTime: 1000 * 60 * 2,
    });
}
