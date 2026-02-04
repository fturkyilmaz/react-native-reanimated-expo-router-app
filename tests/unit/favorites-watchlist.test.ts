// @ts-nocheck - Test file
import { Movie } from '@/config/api';

// Mock dependencies
jest.mock('@/db/database', () => ({
    getDatabase: jest.fn(),
    initializeDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/services/supabase-service', () => ({
    supabaseService: {
        addFavorite: jest.fn().mockResolvedValue(true),
        removeFavorite: jest.fn().mockResolvedValue(true),
        addToWatchlist: jest.fn().mockResolvedValue(true),
        removeFromWatchlist: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('@/services/sync-manager', () => ({
    syncManager: {
        syncAll: jest.fn().mockResolvedValue(undefined),
    },
    useSyncStatus: jest.fn().mockReturnValue({ isSyncing: false }),
}));

jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn().mockReturnValue(() => { }),
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('expo-sqlite', () => ({
    openDatabaseSync: jest.fn(),
    openDatabase: jest.fn(),
}));

// Import after mocking
import { getDatabase } from '@/db/database';
import {
    FavoritesService,
    MovieService,
    SyncQueueService,
    WatchlistService,
} from '@/services/local-db.service';

describe('FavoritesService', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            execSync: jest.fn().mockReturnValue([]),
            transaction: jest.fn((callback) => {
                const tx = {
                    executeSql: jest.fn((sql, params, onSuccess, onError) => {
                        onSuccess(tx, { insertId: 1, rowsAffected: 1 });
                    }),
                };
                callback(tx);
            }),
        };

        (getDatabase as jest.Mock).mockResolvedValue(mockDb);
        jest.spyOn(MovieService, 'upsert').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('add', () => {
        it('should add a movie to favorites', async () => {
            const movieId = 123;
            const result = await FavoritesService.add(movieId);

            expect(result).toBe(true);
        });

        it('should return false if database is not available', async () => {
            (getDatabase as jest.Mock).mockResolvedValue(null);

            const result = await FavoritesService.add(123);

            expect(result).toBe(false);
        });

        it('should insert movie into favorites table', async () => {
            await FavoritesService.add(123, 'user1');

            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO favorites')
            );
        });
    });

    describe('remove', () => {
        it('should remove a movie from favorites', async () => {
            const result = await FavoritesService.remove(123);

            expect(result).toBe(true);
        });

        it('should execute DELETE SQL query', async () => {
            await FavoritesService.remove(123);

            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM favorites')
            );
        });
    });

    describe('getAll', () => {
        it('should return all favorites for a user', async () => {
            const mockMovies = [
                { id: 1, title: 'Movie 1' },
                { id: 2, title: 'Movie 2' },
            ];

            mockDb.execSync = jest.fn().mockReturnValue([{ rows: mockMovies }]);

            const result = await FavoritesService.getAll('user1');

            expect(result).toEqual(mockMovies);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('FROM movies')
            );
        });

        it('should return empty array if database is not available', async () => {
            (getDatabase as jest.Mock).mockResolvedValue(null);

            const result = await FavoritesService.getAll('user1');

            expect(result).toEqual([]);
        });
    });

    describe('isFavorite', () => {
        it('should return true if movie is favorite', async () => {
            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [{ id: 1 }] }]);

            const result = await FavoritesService.isFavorite(123, 'user1');

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id FROM favorites')
            );
        });

        it('should return false if movie is not favorite', async () => {
            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [] }]);

            const result = await FavoritesService.isFavorite(123, 'user1');

            expect(result).toBe(false);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id FROM favorites')
            );
        });
    });
});

describe('WatchlistService', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            execSync: jest.fn().mockReturnValue([]),
            transaction: jest.fn((callback) => {
                const tx = {
                    executeSql: jest.fn((sql, params, onSuccess, onError) => {
                        onSuccess(tx, { insertId: 1, rowsAffected: 1 });
                    }),
                };
                callback(tx);
            }),
        };

        (getDatabase as jest.Mock).mockResolvedValue(mockDb);
        jest.spyOn(MovieService, 'upsert').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('add', () => {
        it('should add a movie to watchlist', async () => {
            const movieId = 456;
            const result = await WatchlistService.add(movieId);

            expect(result).toBe(true);
        });

        it('should return false if database is not available', async () => {
            (getDatabase as jest.Mock).mockResolvedValue(null);

            const result = await WatchlistService.add(456);

            expect(result).toBe(false);
        });

        it('should insert movie into watchlist table', async () => {
            await WatchlistService.add(456, 'user1');

            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO watchlist')
            );
        });
    });

    describe('remove', () => {
        it('should remove a movie from watchlist', async () => {
            const result = await WatchlistService.remove(456);

            expect(result).toBe(true);
        });

        it('should execute DELETE SQL query', async () => {
            await WatchlistService.remove(456);

            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM watchlist')
            );
        });
    });

    describe('getAll', () => {
        it('should return all watchlist items for a user', async () => {
            const mockMovies = [
                { id: 3, title: 'Movie 3' },
                { id: 4, title: 'Movie 4' },
            ];

            mockDb.execSync = jest.fn().mockReturnValue([{ rows: mockMovies }]);

            const result = await WatchlistService.getAll('user1');

            expect(result).toEqual(mockMovies);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('FROM movies')
            );
        });
    });

    describe('isInWatchlist', () => {
        it('should return true if movie is in watchlist', async () => {
            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [{ id: 1 }] }]);

            const result = await WatchlistService.isInWatchlist(456, 'user1');

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id FROM watchlist')
            );
        });

        it('should return false if movie is not in watchlist', async () => {
            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [] }]);

            const result = await WatchlistService.isInWatchlist(456, 'user1');

            expect(result).toBe(false);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id FROM watchlist')
            );
        });
    });
});

describe('MovieService', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();

        mockDb = {
            execSync: jest.fn().mockReturnValue([]),
            transaction: jest.fn((callback) => {
                const tx = {
                    executeSql: jest.fn((sql, params, onSuccess, onError) => {
                        onSuccess(tx, { insertId: 1 });
                    }),
                };
                callback(tx);
            }),
        };

        (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    });

    describe('upsert', () => {
        it('should upsert a movie', async () => {
            const movie: Partial<Movie> = {
                id: 123,
                title: 'Test Movie',
                overview: 'Test Overview',
                poster_path: '/test.jpg',
                backdrop_path: '/backdrop.jpg',
                release_date: '2024-01-01',
                vote_average: 8.5,
                genre_ids: [28, 12],
            };

            const result = await MovieService.upsert(movie);

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR REPLACE INTO movies')
            );
        });
    });

    describe('getById', () => {
        it('should return movie by id', async () => {
            const mockMovie = {
                id: 123,
                title: 'Test Movie',
                overview: 'Test Overview',
                poster_path: '/test.jpg',
                backdrop_path: '/backdrop.jpg',
                release_date: '2024-01-01',
                vote_average: 8.5,
                genre_ids: '[28, 12]',
            };

            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [mockMovie] }]);

            const result = await MovieService.getById(123);

            expect(result).toBeDefined();
            expect(result?.id).toBe(123);
        });

        it('should return null if movie not found', async () => {
            mockDb.execSync = jest.fn().mockReturnValue([{ rows: [] }]);

            const result = await MovieService.getById(999);

            expect(result).toBeNull();
        });
    });

    describe('search', () => {
        it('should search movies by title', async () => {
            const mockMovies = [
                { id: 1, title: 'Movie 1', genre_ids: '[]' },
                { id: 2, title: 'Movie 2', genre_ids: '[]' },
            ];

            mockDb.execSync = jest.fn().mockReturnValue([{ rows: mockMovies }]);

            const result = await MovieService.search('Movie');

            expect(result).toHaveLength(2);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('LIKE')
            );
        });
    });
});

describe('SyncQueueService', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            execSync: jest.fn().mockReturnValue([]),
            transaction: jest.fn((callback) => {
                const tx = {
                    executeSql: jest.fn((sql, params, onSuccess, onError) => {
                        onSuccess(tx, { insertId: 1 });
                    }),
                };
                callback(tx);
            }),
        };

        (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    });

    describe('add', () => {
        it('should add item to sync queue', async () => {
            const result = await SyncQueueService.add('favorites', 123, 'INSERT');

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sync_queue')
            );
        });

        it('should return false if database is not available', async () => {
            (getDatabase as jest.Mock).mockResolvedValue(null);

            const result = await SyncQueueService.add('favorites', 123, 'INSERT');

            expect(result).toBe(false);
        });
    });

    describe('getAll', () => {
        it('should return all pending sync items', async () => {
            const mockItems = [
                { id: 1, table_name: 'favorites', record_id: 123, action: 'INSERT' },
                { id: 2, table_name: 'watchlist', record_id: 456, action: 'DELETE' },
            ];

            mockDb.execSync = jest.fn().mockReturnValue([{ rows: mockItems }]);

            const result = await SyncQueueService.getAll();

            expect(result).toEqual(mockItems);
        });
    });

    describe('remove', () => {
        it('should remove item from sync queue', async () => {
            const result = await SyncQueueService.remove(1);

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM sync_queue')
            );
        });
    });

    describe('incrementRetry', () => {
        it('should increment retry count', async () => {
            const result = await SyncQueueService.incrementRetry(1);

            expect(result).toBe(true);
            expect(mockDb.execSync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE sync_queue SET retry_count')
            );
        });
    });
});
