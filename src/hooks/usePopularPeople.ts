import { useInfiniteQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

const PEOPLE_KEY = 'people';

export function usePopularPeople() {
    return useInfiniteQuery({
        queryKey: [PEOPLE_KEY, 'popular'],
        queryFn: ({ pageParam = 1 }) => tmdbService.getPopularPeople(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.total_pages > allPages.length) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });
}
