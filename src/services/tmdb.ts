import { API_CONFIG, Movie, MovieDetails, MovieVideos, PersonResult, TVShow, TVShowDetails } from '@/config/api';
import { logApiError } from '@/otel/instrumentation/errors';
import { withTracing } from '@/otel/instrumentation/fetch';
import { addApiBreadcrumb, captureException } from '@/sentry';

// Mock data for fallback (10 movies)
const MOCK_MOVIES: Movie[] = [
    {
        id: 1,
        title: 'Inception',
        overview: 'Dom Cobb çok yetenekli bir hırsızdır. Uzmanlık alanı, zihnin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki değerli sırları çekip çıkarmak ve onları çalmaktır.',
        poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
        vote_average: 8.8,
        release_date: '2010-07-16',
        genre_ids: [28, 878, 12],
    },
    {
        id: 2,
        title: 'Interstellar',
        overview: 'Bir grup kâşif, insanlığın yeni bir yuva bulması için solucan deliklerini kullanarak uzayın derinliklerine doğru bir yolculuğa çıkar.',
        poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdrop_path: '/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
        vote_average: 8.6,
        release_date: '2014-11-05',
        genre_ids: [12, 18, 878],
    },
    {
        id: 3,
        title: 'The Dark Knight',
        overview: 'Batman, suç dünyasıyla mücadele ederken, Gotham City\'nin en tehlikeli düşmanı Joker şehrin altını oymaya çalışmaktadır.',
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop_path: '/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
        vote_average: 9.0,
        release_date: '2008-07-16',
        genre_ids: [28, 80, 18],
    },
    {
        id: 4,
        title: 'Parasite',
        overview: 'Yoksul bir aile, zengin bir ailenin tüm ev işlerini üstlenmek için dolandırıcılık yaparak eve sızmaya çalışır.',
        poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        backdrop_path: '/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg',
        vote_average: 8.5,
        release_date: '2019-05-30',
        genre_ids: [35, 53, 18],
    },
    {
        id: 5,
        title: 'Joker',
        overview: 'Arthur Fleck, kendini Gotham City\'nin sokaklarında yalnız ve terk edilmiş hisseden bir adamdır.',
        poster_path: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
        backdrop_path: '/n6bKgh55qmZq9m9ZabY2rvLRxgY.jpg',
        vote_average: 8.1,
        release_date: '2019-10-02',
        genre_ids: [80, 18, 53],
    },
    {
        id: 6,
        title: 'The Godfather',
        overview: 'Mafia ailesinin reisi öldürüldüğünde, en genç oğul ailesinin işlerini devralmaya zorlanır.',
        poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
        vote_average: 9.2,
        release_date: '1972-03-14',
        genre_ids: [80, 18],
    },
    {
        id: 7,
        title: 'Pulp Fiction',
        overview: 'Bir grup birbirine bağlı hikaye, bir suikastçı, mafya patronu ve bir restorandaki garsonların yaşamlarını anlatıyor.',
        poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
        vote_average: 8.9,
        release_date: '1994-09-10',
        genre_ids: [80, 53],
    },
    {
        id: 8,
        title: 'The Matrix',
        overview: 'Bir hacker, gerçekliğin bir simülasyon olduğunu öğrenir ve insanlığı kölelikten kurtarmak için bir isyana katılır.',
        poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        backdrop_path: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
        vote_average: 8.7,
        release_date: '1999-03-30',
        genre_ids: [28, 878],
    },
    {
        id: 9,
        title: 'Spirited Away',
        overview: 'Chihiro, ailesiyle birlikte yeni eve taşınırken gizemli bir dünyaya girer ve ebeveynleri domuza dönüşür.',
        poster_path: '/39wmItIWsg5sZMyRUKGnSxQbUgZ.jpg',
        backdrop_path: '/mH8oH2xjBuEw0t3PJo6q1K6OFmd.jpg',
        vote_average: 8.6,
        release_date: '2001-07-20',
        genre_ids: [16, 14, 12],
    },
    {
        id: 10,
        title: 'Avengers: Endgame',
        overview: 'Thanos\'un sonsuzluk taşlarını kullanarak evrenin yarısını yok etmesinin ardından, kahramanlar son bir savaşa hazırlanır.',
        poster_path: '/or06FN3Dka5tukK1e9sl16HpBom.jpg',
        backdrop_path: '/7RyHsO4yDX6MvYSqcXL0nSpkC4P.jpg',
        vote_average: 8.4,
        release_date: '2019-04-24',
        genre_ids: [28, 12, 878],
    },
];

let apiKeyWarningShown = false;

class TMDBService {
    private baseUrl = API_CONFIG.BASE_URL;
    private apiKey = API_CONFIG.API_KEY;
    private accessToken = API_CONFIG.ACCESS_TOKEN;
    private useMockData = false;

    constructor() {
        // Check if access token is valid for Bearer auth
        if (!this.accessToken || this.accessToken.length < 10) {
            console.warn('[TMDB] Access token not configured properly. Using mock data.');
            this.useMockData = true;
        }
    }

    private async fetchWithError<T>(endpoint: string, operationName: string): Promise<T> {
        // Return mock data if access token is not configured
        if (this.useMockData) {
            console.log(`[TMDB] Returning mock data for ${operationName}`);
            return this.getMockResponse(endpoint) as T;
        }

        // Remove trailing slash from baseUrl and leading slash from endpoint to avoid double slash
        const cleanBaseUrl = (this.baseUrl || '').replace(/\/$/, '');
        const cleanEndpoint = endpoint.replace(/^\//, '');
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${cleanBaseUrl}/${cleanEndpoint}${separator}language=tr-TR`;
        const startTime = Date.now();

        try {
            const response = await withTracing(
                () => fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'accept': 'application/json',
                    },
                }),
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

            // Sentry breadcrumb ekle
            const duration = Date.now() - startTime;
            addApiBreadcrumb(endpoint, 'GET', response.status, duration);

            if (!response.ok) {
                if (response.status === 401 && !apiKeyWarningShown) {
                    apiKeyWarningShown = true;
                    console.error('[TMDB] 401 Unauthorized: Invalid access token. Please check your .env file.');
                }
                throw new Error(`HTTP Error: ${JSON.stringify(response)},${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('TMDB API Error:', error);

            // OpenTelemetry'ye gönder
            logApiError(
                error as Error,
                endpoint,
                'GET',
                {
                    'api.operation': operationName,
                    'api.service': 'tmdb',
                }
            );

            // Sentry'ye gönder
            captureException(error as Error, {
                tags: {
                    'api.service': 'tmdb',
                    'api.endpoint': endpoint,
                    'api.operation': operationName,
                },
                extra: {
                    url: url.replace(this.accessToken || '', '***'),
                    duration: Date.now() - startTime,
                },
            });

            // Fallback to mock data on error
            console.log(`[TMDB] Falling back to mock data for ${operationName}`);
            return this.getMockResponse(endpoint) as T;
        }
    }

    private getMockResponse(endpoint: string): any {
        if (endpoint.includes('/movie/popular')) {
            return { results: MOCK_MOVIES, total_pages: 1 };
        }
        if (endpoint.includes('/movie/top_rated')) {
            return { results: [...MOCK_MOVIES].reverse(), total_pages: 1 };
        }
        if (endpoint.includes('/movie/upcoming')) {
            return { results: MOCK_MOVIES.slice(0, 5), total_pages: 1 };
        }
        if (endpoint.includes('/movie/') && !endpoint.includes('/search')) {
            return {
                ...MOCK_MOVIES[0],
                runtime: 148,
                genres: [{ id: 28, name: 'Aksiyon' }, { id: 878, name: 'Bilim Kurgu' }],
                homepage: 'https://www.warnerbros.com/movies/inception',
                tagline: 'Your mind is the scene of the crime',
            };
        }
        return { results: [] };
    }

    async getPopularMovies(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/popular?page=${page}`, 'getPopularMovies');
    }

    async getTopRated(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/top_rated?page=${page}`, 'getTopRated');
    }

    async getUpcoming(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/upcoming?page=${page}`, 'getUpcoming');
    }

    async getMovieDetails(id: number): Promise<MovieDetails> {
        return this.fetchWithError(`/movie/${id}`, 'getMovieDetails');
    }

    async searchMovies(query: string, page = 1): Promise<{ results: Movie[] }> {
        return this.fetchWithError(
            `/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
            'searchMovies'
        );
    }

    async getNowPlaying(page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/movie/now_playing?page=${page}`, 'getNowPlaying');
    }

    // TV Show methods
    async getPopularTVShows(page = 1): Promise<{ results: TVShow[]; total_pages: number }> {
        return this.fetchWithError(`/tv/popular?page=${page}`, 'getPopularTVShows');
    }

    async getTopRatedTVShows(page = 1): Promise<{ results: TVShow[]; total_pages: number }> {
        return this.fetchWithError(`/tv/top_rated?page=${page}`, 'getTopRatedTVShows');
    }

    async getTVShowDetails(id: number): Promise<TVShowDetails> {
        return this.fetchWithError(`/tv/${id}`, 'getTVShowDetails');
    }

    async searchTVShows(query: string, page = 1): Promise<{ results: TVShow[] }> {
        return this.fetchWithError(
            `/search/tv?query=${encodeURIComponent(query)}&page=${page}`,
            'searchTVShows'
        );
    }

    async getMovieVideos(movieId: number): Promise<MovieVideos> {
        return this.fetchWithError(`/movie/${movieId}/videos`, 'getMovieVideos');
    }

    getYouTubeUrl(videoKey: string): string {
        return `https://www.youtube.com/embed/${videoKey}`;
    }

    getYouTubeThumbnail(videoKey: string): string {
        return `https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg`;
    }

    getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
        return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }

    // Genre methods for Discover page
    async getGenreList(): Promise<{ genres: { id: number; name: string }[] }> {
        return this.fetchWithError('/genre/movie/list', 'getGenreList');
    }

    async getMoviesByGenre(genreId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> {
        return this.fetchWithError(`/discover/movie?with_genres=${genreId}&page=${page}`, 'getMoviesByGenre');
    }

    async getPopularPeople(page = 1): Promise<PersonResult> {
        return this.fetchWithError(`/person/popular?page=${page}`, 'getPopularPeople');
    }
}

export const tmdbService = new TMDBService();
