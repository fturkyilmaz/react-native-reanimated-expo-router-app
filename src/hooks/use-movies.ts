import { Movie } from '@/config/api';
import { tmdbService } from '@/services/tmdb';
import { useCallback, useEffect, useState } from 'react';

interface UseMoviesReturn {
    movies: Movie[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    loadMore: () => void;
    hasMore: boolean;
    page: number;
}

export function useMovies(category: 'popular' | 'top_rated' | 'upcoming' = 'popular'): UseMoviesReturn {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchMovies = useCallback(async (pageNum: number, shouldReset = false) => {
        try {
            setLoading(true);
            setError(null);

            // Real TMDB API call
            let response;
            switch (category) {
                case 'popular':
                    response = await tmdbService.getPopularMovies(pageNum);
                    break;
                case 'top_rated':
                    response = await tmdbService.getTopRated(pageNum);
                    break;
                case 'upcoming':
                    response = await tmdbService.getUpcoming(pageNum);
                    break;
            }

            const newMovies = response.results;
            setMovies(prev => (shouldReset ? newMovies : [...prev, ...newMovies]));
            setHasMore(page < response.total_pages);
        } catch (err) {
            console.error('Movie fetch failed:', err);
            setError('Filmler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [category]);

    const refresh = useCallback(() => {
        setPage(1);
        fetchMovies(1, true);
    }, [fetchMovies]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMovies(nextPage);
        }
    }, [page, loading, hasMore, fetchMovies]);

    useEffect(() => {
        fetchMovies(1, true);
    }, [fetchMovies]);

    return { movies, loading, error, refresh, loadMore, hasMore, page };
}
