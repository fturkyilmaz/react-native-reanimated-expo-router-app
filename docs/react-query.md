# Data Fetching & React Query

## Overview

CineSearch uses TanStack Query (React Query) for data fetching, caching, and synchronization.

## Query Keys

```typescript
import { queryKeys } from '@/core/types/query-keys';

const movies = queryKeys.movies.list('popular', 1);
const movieDetail = queryKeys.movies.detail(123);
const favorites = queryKeys.favorites.all;
```

## Query Hooks

```typescript
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdb';

export function useMovies(category: 'popular' | 'top_rated' | 'upcoming', page = 1) {
  return useQuery({
    queryKey: queryKeys.movies.list(category, page),
    queryFn: () => tmdbService.getMovies(category, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => tmdbService.getMovieDetails(id),
    enabled: !!id,
  });
}
```

## Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movie: Movie) => 
      isFavorite(movie.id) 
        ? removeFavorite(movie.id) 
        : addFavorite(movie),
    onMutate: async (movie) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData(queryKeys.favorites.all);

      queryClient.setQueryData(queryKeys.favorites.all, (old: Movie[] = []) => {
        const isFav = old.some(f => f.id === movie.id);
        return isFav
          ? old.filter(f => f.id !== movie.id)
          : [...old, movie];
      });

      return { previousFavorites };
    },
    onError: (err, movie, context) => {
      queryClient.setQueryData(queryKeys.favorites.all, context?.previousFavorites);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}
```

## Related Files

- [`src/core/types/query-keys.ts`](../src/core/types/query-keys.ts)
- [`src/hooks/useMoviesQuery.ts`](../src/hooks/useMoviesQuery.ts)
- [`src/features/movies/hooks/use-movies.ts`](../src/features/movies/hooks/use-movies.ts)
