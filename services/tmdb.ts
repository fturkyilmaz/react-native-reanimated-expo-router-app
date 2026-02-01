import { API_CONFIG, Movie, MovieDetails } from '@/config/api';
import { logApiError } from '@/otel/instrumentation/errors';
import { withTracing } from '@/otel/instrumentation/fetch';

class TMDBService {
    private baseUrl = API_CONFIG.BASE_URL;
    private apiKey = API_CONFIG.API_KEY;

    private async fetchWithError<T>(endpoint: string, operationName: string): Promise<T> {
        const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&language=tr-TR`;

        try {
            const response = await withTracing(
                () => fetch(url),
                {
                    spanName: `tmdb.${operationName}`,
                    endpoint: endpoint,
                    attributes: {
                        'api.service': 'tmdb',
                        'api.endpoint': endpoint,
                        'api.operation': operationName,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('TMDB API Error:', error);
            logApiError(
                error as Error,
                endpoint,
                'GET',
                {
                    'api.operation': operationName,
                    'api.service': 'tmdb',
                }
            );
            throw error;
        }
    }

    async getPopularMovies(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/popular&page=${page}`, 'getPopularMovies');
    }

    async getTopRated(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/top_rated&page=${page}`, 'getTopRated');
    }

    async getUpcoming(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/upcoming&page=${page}`, 'getUpcoming');
    }

    async getMovieDetails(id: number): Promise<MovieDetails> {
        return this.fetchWithError(`/movie/${id}`, 'getMovieDetails');
    }

    async searchMovies(query: string, page = 1): Promise<{ results: Movie[] }> {
        return this.fetchWithError(
            `/search/movie&query=${encodeURIComponent(query)}&page=${page}`,
            'searchMovies'
        );
    }

    getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
        return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }
}

export const tmdbService = new TMDBService();
