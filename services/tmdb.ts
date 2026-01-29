import { API_CONFIG, Movie, MovieDetails } from '../config/api';

class TMDBService {
    private baseUrl = API_CONFIG.BASE_URL;
    private apiKey = API_CONFIG.API_KEY;

    private async fetchWithError<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(
                `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&language=tr-TR`
            );

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    }

    async getPopularMovies(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/popular&page=${page}`);
    }

    async getTopRated(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/top_rated&page=${page}`);
    }

    async getUpcoming(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/upcoming&page=${page}`);
    }

    async getMovieDetails(id: number): Promise<MovieDetails> {
        return this.fetchWithError(`/movie/${id}`);
    }

    async searchMovies(query: string, page = 1): Promise<{ results: Movie[] }> {
        return this.fetchWithError(`/search/movie&query=${encodeURIComponent(query)}&page=${page}`);
    }

    getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
        return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }
}

export const tmdbService = new TMDBService();