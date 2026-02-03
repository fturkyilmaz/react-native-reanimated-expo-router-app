import { Movie } from '@/config/api';
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

const posterPaths = [
    "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", // Joker (2019)
    "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", // Interstellar
    "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", // The Godfather
    "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", // Avatar: The Way of Water
    "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", // John Wick: Chapter 4
    "/yF1eOkaYvwiORauRCPWznV9xVvi.jpg", // Dune: Part Two
    "/6KErczPBROQty7QoIsaa6wJYXZi.jpg", // Parasite
    "/q719jXXEzOoYaps6babgKnONONX.jpg", // Spirited Away
    "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Pulp Fiction
    "/abc123WickedPoster.jpg", // Wicked (2024 musical adaptation) – corrected
];

const MAX_PAGE = 5;

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

            // Mock Data
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockMovies: Movie[] = new Array(10).fill(null).map((_, i) => ({
                id: i + 1,
                title: `Film ${i + 1}`,
                overview: 'Movie description goes here...', // move to i18n in real app
                poster_path: posterPaths[i],
                backdrop_path: `https://picsum.photos/seed/backdrop${i}/500/280.jpg`,
                vote_average: 7.5 + Math.random() * 2,
                release_date: '2024-01-15',
                genre_ids: [1, 2, 3],
            }));

            setMovies(prev => (shouldReset ? mockMovies : [...prev, ...mockMovies]));
            setHasMore(pageNum < MAX_PAGE);
        } catch (error) {
            console.error('Movie fetch failed', error);
            setError('An error occurred while loading movies');
        } finally {
            setLoading(false);
        }
    }, []);

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
