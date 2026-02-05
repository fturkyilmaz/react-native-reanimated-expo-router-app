/**
 * WatchlistService - Watchlist database operations
 *
 * Handles all CRUD operations for watchlist table.
 * Supports offline-first pattern with sync queue integration.
 *
 * Features:
 * - Add/remove movies from watchlist with optimistic UI support
 * - Transaction-safe operations
 * - Queue deduplication for offline operations
 * - Batch operations
 * - Type-safe movie data
 */

import type { Movie } from '@/config/api';
import { execute, getDatabase, query, queryOne, transaction } from '../db/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw watchlist record from database
 */
interface RawWatchlist {
    id: number;
    movie_id: number;
    user_id: string;
    synced: number;
    created_at: number;
    updated_at: number;
}

/**
 * Watchlist with movie data
 */
interface WatchlistWithMovie extends RawWatchlist {
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
export class WatchlistServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'WatchlistServiceError';
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_NAME = 'watchlist';
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
 * Map raw watchlist with movie to Movie type
 */
const mapToMovie = (row: WatchlistWithMovie): Movie => ({
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
        throw new WatchlistServiceError('Invalid movie: missing id', 'INVALID_MOVIE');
    }
    return true;
};

// ============================================================================
// PUBLIC API
// ============================================================================

export const WatchlistService = {
    /**
     * Add a movie to watchlist
     * Transaction-safe: inserts both movie and watchlist item in one transaction
     */
    add: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new WatchlistServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            validateMovie(movie);

            console.log('[WatchlistService] Adding to watchlist:', movie.id, 'online:', isOnline);

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
                            reject(new WatchlistServiceError(
                                'Failed to insert movie',
                                'MOVIE_INSERT_ERROR',
                                error as Error
                            ));
                            return true;
                        }
                    );
                });

                // Step 2: Check if already in watchlist
                const existing = await new Promise<RawWatchlist | null>((resolve) => {
                    tx.executeSql(
                        `SELECT * FROM ${TABLE_NAME} WHERE movie_id = ? AND user_id = 'local'`,
                        [movie.id],
                        (_, result) => {
                            if (result.rows.length > 0) {
                                resolve(result.rows.item(0) as RawWatchlist);
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
                    console.log('[WatchlistService] Already in watchlist:', movie.id);
                    return; // Already exists
                }

                // Step 3: Insert into watchlist
                await new Promise<void>((resolve, reject) => {
                    tx.executeSql(
                        `INSERT INTO ${TABLE_NAME} (movie_id, user_id, synced, created_at, updated_at)
             VALUES (?, 'local', ?, strftime('%s', 'now'), strftime('%s', 'now'))`,
                        [movie.id, isOnline ? 1 : 0],
                        () => resolve(),
                        (_, error) => {
                            reject(new WatchlistServiceError(
                                'Failed to insert watchlist',
                                'WATCHLIST_INSERT_ERROR',
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
               VALUES ('watchlist', ?, 'add', 'pending', strftime('%s', 'now'), strftime('%s', 'now'))`,
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

            console.log('[WatchlistService] Added to watchlist:', movie.id);
            return true;
        } catch (error) {
            if (error instanceof WatchlistServiceError) {
                throw error;
            }
            console.error('[WatchlistService] Add error:', error);
            throw new WatchlistServiceError(
                `Failed to add movie ${movie.id} to watchlist`,
                'ADD_ERROR',
                error as Error
            );
        }
    },

    /**
     * Remove a movie from watchlist
     * Transaction-safe: removes watchlist item and handles sync queue deduplication
     */
    remove: async (movieId: number, isOnline: boolean): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new WatchlistServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            console.log('[WatchlistService] Removing from watchlist:', movieId);

            const result = await transaction<boolean>(async (tx) => {
                // Step 1: Remove any pending "add" operations for this movie (deduplication)
                await new Promise<void>((resolve) => {
                    tx.executeSql(
                        `DELETE FROM ${SYNC_TABLE}
             WHERE type = 'watchlist' AND movie_id = ? AND operation = 'add' AND status = 'pending'`,
                        [movieId],
                        () => resolve(),
                        () => {
                            resolve();
                            return true;
                        }
                    );
                });

                // Step 2: Remove from watchlist
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
                    console.log('[WatchlistService] Not found in watchlist:', movieId);
                    return false;
                }

                // Step 3: Add to sync queue if offline
                if (!isOnline) {
                    await new Promise<void>((resolve) => {
                        tx.executeSql(
                            `INSERT OR IGNORE INTO ${SYNC_TABLE}
               (type, movie_id, operation, status, created_at, updated_at)
               VALUES ('watchlist', ?, 'remove', 'pending', strftime('%s', 'now'), strftime('%s', 'now'))`,
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

            console.log('[WatchlistService] Removed from watchlist:', movieId, result);
            return result;
        } catch (error) {
            console.error('[WatchlistService] Remove error:', error);
            throw new WatchlistServiceError(
                `Failed to remove movie ${movieId} from watchlist`,
                'REMOVE_ERROR',
                error as Error
            );
        }
    },

    /**
     * Toggle watchlist status
     */
    toggle: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
        const isInList = await WatchlistService.isInWatchlist(movie.id);
        if (isInList) {
            await WatchlistService.remove(movie.id, isOnline);
            return false;
        }
        await WatchlistService.add(movie, isOnline);
        return true;
    },

    /**
     * Check if a movie is in watchlist
     */
    isInWatchlist: async (movieId: number): Promise<boolean> => {
        try {
            const sql = `SELECT id FROM ${TABLE_NAME} WHERE movie_id = ? AND user_id = 'local'`;
            const row = await queryOne<{ id: number }>(sql, [movieId]);
            return row !== null;
        } catch (error) {
            console.error('[WatchlistService] isInWatchlist error:', error);
            return false;
        }
    },

    /**
     * Get all watchlist items with movie data
     */
    getAll: async (): Promise<Movie[]> => {
        try {
            const sql = `
        SELECT
          m.*,
          w.id as watchlist_id,
          w.created_at as added_at,
          w.synced as synced
        FROM movies m
        INNER JOIN ${TABLE_NAME} w ON m.id = w.movie_id
        WHERE w.user_id = 'local'
        ORDER BY w.created_at DESC
      `;
            const rows = await query<WatchlistWithMovie>(sql, []);

            console.log('[WatchlistService] getAll:', rows.length, 'items');
            return rows.map(mapToMovie);
        } catch (error) {
            console.error('[WatchlistService] getAll error:', error);
            throw new WatchlistServiceError(
                'Failed to get watchlist',
                'GET_ALL_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get watchlist IDs only (for quick lookups)
     */
    getIds: async (): Promise<number[]> => {
        try {
            const sql = `SELECT movie_id FROM ${TABLE_NAME} WHERE user_id = 'local'`;
            const rows = await query<{ movie_id: number }>(sql, []);
            return rows.map((r) => r.movie_id);
        } catch (error) {
            console.error('[WatchlistService] getIds error:', error);
            return [];
        }
    },

    /**
     * Get count of watchlist items
     */
    count: async (): Promise<number> => {
        try {
            const sql = `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE user_id = 'local'`;
            const row = await queryOne<{ count: number }>(sql, []);
            return row?.count || 0;
        } catch (error) {
            console.error('[WatchlistService] count error:', error);
            return 0;
        }
    },

    /**
     * Get unsynced watchlist items (for background sync)
     */
    getUnsynced: async (): Promise<RawWatchlist[]> => {
        try {
            const sql = `SELECT * FROM ${TABLE_NAME} WHERE synced = 0 AND user_id = 'local'`;
            return await query<RawWatchlist>(sql, []);
        } catch (error) {
            console.error('[WatchlistService] getUnsynced error:', error);
            return [];
        }
    },

    /**
     * Mark a watchlist item as synced
     */
    markAsSynced: async (movieId: number): Promise<boolean> => {
        try {
            const sql = `UPDATE ${TABLE_NAME} SET synced = 1 WHERE movie_id = ?`;
            return await execute(sql, [movieId]);
        } catch (error) {
            console.error('[WatchlistService] markAsSynced error:', error);
            return false;
        }
    },

    /**
     * Clear all watchlist items
     */
    clear: async (): Promise<number> => {
        try {
            const result = await execute(
                `DELETE FROM ${TABLE_NAME} WHERE user_id = 'local'`,
                []
            );
            console.log('[WatchlistService] Cleared watchlist:', result);
            return result ? 1 : 0;
        } catch (error) {
            console.error('[WatchlistService] clear error:', error);
            throw new WatchlistServiceError(
                'Failed to clear watchlist',
                'CLEAR_ERROR',
                error as Error
            );
        }
    },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { RawWatchlist, WatchlistWithMovie };
