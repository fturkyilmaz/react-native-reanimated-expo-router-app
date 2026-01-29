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

// Örnek poster_path array (TMDB’den bilinen filmler)
const posterPaths = [
    "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", // Joker (2019)
    "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", // Interstellar
    "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", // The Godfather
    "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", // Avatar: The Way of Water
    "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", // John Wick: Chapter 4
    "/yF1eOkaYvwiORauRCPWznV9xVvi.jpg", // Dune: Part Two
    "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg", // Fight Club
    "/6KErczPBROQty7QoIsaa6wJYXZi.jpg", // Parasite
    "/q719jXXEzOoYaps6babgKnONONX.jpg", // Spirited Away (Studio Ghibli)
    "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Pulp Fiction
];


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
            const mockMovies: Movie[] = Array(10).fill(null).map((_, i) => {

                return {
                    id: i + 1,
                    title: `Film ${i + 1}`,
                    overview: 'Film açıklaması burada yer alacak...',
                    poster_path: posterPaths[i],
                    backdrop_path: `https://picsum.photos/seed/backdrop${i}/500/280.jpg`,
                    vote_average: 7.5 + Math.random() * 2,
                    release_date: '2024-01-15',
                    genre_ids: [1, 2, 3],
                };
            });

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
