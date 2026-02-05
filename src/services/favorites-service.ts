/**
 * FavoritesService - Favorite movies database operations
 *
 * Handles all CRUD operations for favorites table.
 * Supports offline-first pattern with sync queue integration.
 *
 * Features:
 * - Add/remove favorites with optimistic UI support
 * - Transaction-safe operations
 * - Queue deduplication for offline operations
 * - Batch operations
 * - Type-safe movie data
 */

import type { Movie } from '@/config/api';
import { logger } from '@/utils/logger';
import { execute, getDatabase, query, queryOne, transaction } from '../db/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw favorite record from database
 */
interface RawFavorite {
    id: number;
    movie_id: number;
    user_id: string;
    synced: number;
    created_at: number;
    updated_at: number;
}

/**
 * Favorite with movie data
 */
interface FavoriteWithMovie extends RawFavorite {
    movie_title: string;
    movie_poster_path: string | null;
    movie_backdrop_path: string | null;
    movie_vote_average: number;
    movie_overview: string;
    movie_genre_ids: string;
    movie_release_date: string;
}

/**
 * Service errors
 */
export class FavoritesServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'FavoritesServiceError';
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_NAME = 'favorites';
const SYNC_TABLE = 'sync_queue';

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Parse genre_ids JSON string to array
 */
const parseGenreIds = (genreIdsJson: string): number[] => {
    try {
        const parsed = JSON.parse(genreIdsJson || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * Map raw favorite with movie to Movie type
 */
const mapToMovie = (row: FavoriteWithMovie): Movie => ({
    id: row.movie_id,
    title: row.movie_title,
    overview: row.movie_overview,
    poster_path: row.movie_poster_path,
    backdrop_path: row.movie_backdrop_path,
    vote_average: row.movie_vote_average,
    release_date: row.movie_release_date,
    genre_ids: parseGenreIds(row.movie_genre_ids),
});

/**
 * Validate movie before adding
 */
const validateMovie = (movie: Partial<Movie>): movie is Movie => {
    if (!movie || typeof movie.id !== 'number') {
        throw new FavoritesServiceError('Invalid movie: missing id', 'INVALID_MOVIE');
    }
    return true;
};

// ============================================================================
// PUBLIC API
// ============================================================================

export const FavoritesService = {
    /**
     * Add a movie to favorites
     * Transaction-safe: inserts both movie and favorite in one transaction
     */
    add: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new FavoritesServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            validateMovie(movie);

            logger.movies.info('Adding to favorites', { movieId: movie.id, isOnline });

            await transaction(async (tx) => {
                // Step 1: Ensure movie exists in movies table
                await new Promise<void>((resolve, reject) => {
                    tx.executeSql(
                        `INSERT OR REPLACE INTO movies
             (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
                        [
                            movie.id,
                            movie.title,
                            movie.overview || '',
                            movie.poster_path,
                            movie.backdrop_path,
                            movie.release_date || '',
                            movie.vote_average || 0,
                            JSON.stringify(movie.genre_ids || []),
                        ],
                        () => resolve(),
                        (_, error) => {
                            reject(new FavoritesServiceError(
                                'Failed to insert movie',
                                'MOVIE_INSERT_ERROR',
                                error as Error
                            ));
                            return true;
                        }
                    );
                });

                // Step 2: Check if already favorite
                const existing = await new Promise<RawFavorite | null>((resolve) => {
                    tx.executeSql(
                        `SELECT * FROM ${TABLE_NAME} WHERE movie_id = ? AND user_id = 'local'`,
                        [movie.id],
                        (_, result) => {
                            if (result.rows.length > 0) {
                                resolve(result.rows.item(0) as RawFavorite);
                            } else {
                                resolve(null);
                            }
                        },
                        () => {
                            resolve(null);
                            return true;
                        }
                    );
                });

                if (existing) {
                    logger.movies.debug('Already favorite', { movieId: movie.id });
                    return; // Already exists
                }

                // Step 3: Insert favorite
                await new Promise<void>((resolve, reject) => {
                    tx.executeSql(
                        `INSERT INTO ${TABLE_NAME} (movie_id, user_id, synced, created_at, updated_at)
             VALUES (?, 'local', ?, strftime('%s', 'now'), strftime('%s', 'now'))`,
                        [movie.id, isOnline ? 1 : 0],
                        () => resolve(),
                        (_, error) => {
                            reject(new FavoritesServiceError(
                                'Failed to insert favorite',
                                'FAVORITE_INSERT_ERROR',
                                error as Error
                            ));
                            return true;
                        }
                    );
                });

                // Step 4: Add to sync queue if offline
                if (!isOnline) {
                    await new Promise<void>((resolve) => {
                        tx.executeSql(
                            `INSERT OR IGNORE INTO ${SYNC_TABLE}
               (type, movie_id, operation, status, created_at, updated_at)
               VALUES ('favorite', ?, 'add', 'pending', strftime('%s', 'now'), strftime('%s', 'now'))`,
                            [movie.id],
                            () => resolve(),
                            () => {
                                // Ignore duplicate key errors
                                resolve();
                                return true;
                            }
                        );
                    });
                }
            });

            logger.movies.info('Added to favorites', { movieId: movie.id });
            return true;
        } catch (error) {
            if (error instanceof FavoritesServiceError) {
                throw error;
            }
            logger.movies.error('Add failed', { movieId: movie.id, error: error instanceof Error ? error.message : error });
            throw new FavoritesServiceError(
                `Failed to add movie ${movie.id} to favorites`,
                'ADD_ERROR',
                error as Error
            );
        }
    },

    /**
     * Remove a movie from favorites
     * Transaction-safe: removes favorite and handles sync queue deduplication
     */
    remove: async (movieId: number, isOnline: boolean): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new FavoritesServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            logger.movies.info('Removing from favorites', { movieId });

            const result = await transaction<boolean>(async (tx) => {
                // Step 1: Remove any pending "add" operations for this movie (deduplication)
                await new Promise<void>((resolve) => {
                    tx.executeSql(
                        `DELETE FROM ${SYNC_TABLE}
             WHERE type = 'favorite' AND movie_id = ? AND operation = 'add' AND status = 'pending'`,
                        [movieId],
                        () => resolve(),
                        () => {
                            resolve();
                            return true;
                        }
                    );
                });

                // Step 2: Remove the favorite
                const removeResult = await new Promise<number>((resolve) => {
                    tx.executeSql(
                        `DELETE FROM ${TABLE_NAME} WHERE movie_id = ? AND user_id = 'local'`,
                        [movieId],
                        (_, result) => resolve(result.rowsAffected),
                        () => {
                            resolve(0);
                            return true;
                        }
                    );
                });

                if (removeResult === 0) {
                    logger.movies.debug('Not found in favorites', { movieId });
                    return false;
                }

                // Step 3: Add to sync queue if offline
                if (!isOnline) {
                    await new Promise<void>((resolve) => {
                        tx.executeSql(
                            `INSERT OR IGNORE INTO ${SYNC_TABLE}
               (type, movie_id, operation, status, created_at, updated_at)
               VALUES ('favorite', ?, 'remove', 'pending', strftime('%s', 'now'), strftime('%s', 'now'))`,
                            [movieId],
                            () => resolve(),
                            () => {
                                resolve();
                                return true;
                            }
                        );
                    });
                }

                return true;
            });

            logger.movies.info('Removed from favorites', { movieId, result });
            return result;
        } catch (error) {
            logger.movies.error('Remove failed', { movieId, error: error instanceof Error ? error.message : error });
            throw new FavoritesServiceError(
                `Failed to remove movie ${movieId} from favorites`,
                'REMOVE_ERROR',
                error as Error
            );
        }
    },

    /**
     * Toggle favorite status
     */
    toggle: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
        const isFav = await FavoritesService.isFavorite(movie.id);
        if (isFav) {
            await FavoritesService.remove(movie.id, isOnline);
            return false;
        }
        await FavoritesService.add(movie, isOnline);
        return true;
    },

    /**
     * Check if a movie is in favorites
     */
    isFavorite: async (movieId: number): Promise<boolean> => {
        try {
            const sql = `SELECT id FROM ${TABLE_NAME} WHERE movie_id = ? AND user_id = 'local'`;
            const row = await queryOne<{ id: number }>(sql, [movieId]);
            return row !== null;
        } catch (error) {
            logger.movies.error('isFavorite check failed', { error: error instanceof Error ? error.message : error });
            return false;
        }
    },

    /**
     * Get all favorites with movie data
     */
    getAll: async (): Promise<Movie[]> => {
        try {
            const sql = `
        SELECT
          m.*,
          f.id as favorite_id,
          f.created_at as added_at,
          f.synced as synced
        FROM movies m
        INNER JOIN ${TABLE_NAME} f ON m.id = f.movie_id
        WHERE f.user_id = 'local'
        ORDER BY f.created_at DESC
      `;
            const rows = await query<FavoriteWithMovie>(sql, []);

            logger.movies.debug('getAll favorites', { count: rows.length });
            return rows.map(mapToMovie);
        } catch (error) {
            logger.movies.error('getAll failed', { error: error instanceof Error ? error.message : error });
            throw new FavoritesServiceError(
                'Failed to get favorites',
                'GET_ALL_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get favorite IDs only (for quick lookups)
     */
    getIds: async (): Promise<number[]> => {
        try {
            const sql = `SELECT movie_id FROM ${TABLE_NAME} WHERE user_id = 'local'`;
            const rows = await query<{ movie_id: number }>(sql, []);
            return rows.map((r) => r.movie_id);
        } catch (error) {
            logger.movies.error('getIds failed', { error: error instanceof Error ? error.message : error });
            return [];
        }
    },

    /**
     * Get count of favorites
     */
    count: async (): Promise<number> => {
        try {
            const sql = `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE user_id = 'local'`;
            const row = await queryOne<{ count: number }>(sql, []);
            return row?.count || 0;
        } catch (error) {
            logger.movies.error('count failed', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Get unsynced favorites (for background sync)
     */
    getUnsynced: async (): Promise<RawFavorite[]> => {
        try {
            const sql = `SELECT * FROM ${TABLE_NAME} WHERE synced = 0 AND user_id = 'local'`;
            return await query<RawFavorite>(sql, []);
        } catch (error) {
            logger.movies.error('getUnsynced failed', { error: error instanceof Error ? error.message : error });
            return [];
        }
    },

    /**
     * Mark a favorite as synced
     */
    markAsSynced: async (movieId: number): Promise<boolean> => {
        try {
            const sql = `UPDATE ${TABLE_NAME} SET synced = 1 WHERE movie_id = ?`;
            return await execute(sql, [movieId]);
        } catch (error) {
            logger.movies.error('markAsSynced failed', { error: error instanceof Error ? error.message : error });
            return false;
        }
    },

    /**
     * Clear all favorites
     */
    clear: async (): Promise<number> => {
        try {
            const result = await execute(
                `DELETE FROM ${TABLE_NAME} WHERE user_id = 'local'`,
                []
            );
            logger.movies.info('Cleared favorites', { count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.movies.error('clear failed', { error: error instanceof Error ? error.message : error });
            throw new FavoritesServiceError(
                'Failed to clear favorites',
                'CLEAR_ERROR',
                error as Error
            );
        }
    },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { FavoriteWithMovie, RawFavorite };

