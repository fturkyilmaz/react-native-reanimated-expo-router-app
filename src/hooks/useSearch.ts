import { Movie } from '@/config/api';
import { tmdbService } from '@/services/tmdb';
import { useEffect, useState } from 'react';

export function useSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce: 500ms bekle
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Debounced query değişince API çağır
    useEffect(() => {
        const searchMovies = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const data = await tmdbService.searchMovies(debouncedQuery);
                setResults(data.results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        searchMovies();
    }, [debouncedQuery]);

    return { query, setQuery, results, loading, debouncedQuery };
}