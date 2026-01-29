import { useCallback, useEffect, useState } from 'react';
import { Movie } from '../config/api';

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

            // Gerçek API yerine mock data kullanıyoruz (TMDB API key olmadan çalışsın diye)
            // const response = await fetch(
            //   `${API_CONFIG.BASE_URL}/movie/${category}?api_key=${API_CONFIG.API_KEY}&page=${pageNum}`
            // );

            // Mock Data
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockMovies: Movie[] = Array(10).fill(null).map((_, i) => ({
                id: pageNum * 10 + i,
                title: `Film ${pageNum * 10 + i}`,
                overview: 'Film açıklaması burada yer alacak...',
                poster_path: `/poster${i}.jpg`,
                backdrop_path: null,
                vote_average: 7.5 + Math.random() * 2,
                release_date: '2024-01-15',
                genre_ids: [1, 2, 3],
            }));

            if (shouldReset) {
                setMovies(mockMovies);
            } else {
                setMovies(prev => [...prev, ...mockMovies]);
            }

            setHasMore(pageNum < 5); // 5 sayfa limit
        } catch (err) {
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