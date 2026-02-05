/**
 * MovieService - Movie database operations
 *
 * Handles all CRUD operations for movies table.
 * Provides type-safe movie data management with proper error handling.
 *
 * Features:
 * - Upsert movie with full metadata
 * - Get movie by ID
 * - Batch get movies by IDs
 * - Search movies by title
 * - Genre IDs JSON parsing
 */

import type { Movie } from '@/config/api';
import { execute, getDatabase, query, queryOne, transaction } from '../db/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw movie data from database (genre_ids stored as JSON string)
 */
interface RawMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    genre_ids: string;
    updated_at: number;
}

/**
 * Movie with parsed genre IDs
 */
interface MovieWithGenres extends Omit<RawMovie, 'genre_ids'> {
    genre_ids: number[];
}

/**
 * Service errors
 */
export class MovieServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'MovieServiceError';
    }
}

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
        console.warn('[MovieService] Failed to parse genre_ids:', genreIdsJson);
        return [];
    }
};

/**
 * Validate movie object
 */
const validateMovie = (movie: Partial<Movie>): movie is Movie => {
    if (!movie || typeof movie.id !== 'number') {
        throw new MovieServiceError('Invalid movie: missing or invalid id', 'INVALID_ID');
    }
    if (typeof movie.title !== 'string' || !movie.title.trim()) {
        throw new MovieServiceError('Invalid movie: missing title', 'INVALID_TITLE');
    }
    return true;
};

/**
 * Map raw movie to typed movie
 */
const mapToMovie = (raw: RawMovie): MovieWithGenres => ({
    id: raw.id,
    title: raw.title,
    overview: raw.overview || '',
    poster_path: raw.poster_path,
    backdrop_path: raw.backdrop_path,
    release_date: raw.release_date || '',
    vote_average: raw.vote_average || 0,
    genre_ids: parseGenreIds(raw.genre_ids),
    updated_at: raw.updated_at,
});

// ============================================================================
// PUBLIC API
// ============================================================================

export const MovieService = {
    /**
     * Upsert a movie with complete metadata
     */
    upsert: async (movie: Movie): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new MovieServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            validateMovie(movie);

            const sql = `
        INSERT OR REPLACE INTO movies
        (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `;

            const params = [
                movie.id,
                movie.title,
                movie.overview || '',
                movie.poster_path,
                movie.backdrop_path,
                movie.release_date || '',
                movie.vote_average || 0,
                JSON.stringify(movie.genre_ids || []),
            ];

            const result = await execute(sql, params);
            console.log('[MovieService] Upserted movie:', movie.id, result ? 'success' : 'failed');
            return result;
        } catch (error) {
            if (error instanceof MovieServiceError) {
                throw error;
            }
            console.error('[MovieService] Upsert error:', error);
            throw new MovieServiceError(
                `Failed to upsert movie ${movie.id}`,
                'UPSERT_ERROR',
                error as Error
            );
        }
    },

    /**
     * Upsert multiple movies in a single transaction
     */
    upsertMany: async (movies: Movie[]): Promise<{ success: number; failed: number }> => {
        if (movies.length === 0) {
            return { success: 0, failed: 0 };
        }

        let success = 0;
        let failed = 0;

        try {
            await transaction(async (tx) => {
                for (const movie of movies) {
                    try {
                        validateMovie(movie);

                        const sql = `
              INSERT OR REPLACE INTO movies
              (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `;

                        const params = [
                            movie.id,
                            movie.title,
                            movie.overview || '',
                            movie.poster_path,
                            movie.backdrop_path,
                            movie.release_date || '',
                            movie.vote_average || 0,
                            JSON.stringify(movie.genre_ids || []),
                        ];

                        await new Promise<void>((resolve, reject) => {
                            tx.executeSql(
                                sql,
                                params,
                                () => {
                                    success++;
                                    resolve();
                                },
                                (_, error) => {
                                    failed++;
                                    console.warn('[MovieService] Batch upsert error for movie', movie.id, error);
                                    resolve(); // Continue with other movies
                                    return true;
                                }
                            );
                        });
                    } catch {
                        failed++;
                    }
                }
            });
        } catch (error) {
            console.error('[MovieService] Batch upsert transaction error:', error);
        }

        console.log('[MovieService] Batch upsert complete:', { success, failed });
        return { success, failed };
    },

    /**
     * Get a movie by ID
     */
    getById: async (id: number): Promise<MovieWithGenres | null> => {
        try {
            const sql = 'SELECT * FROM movies WHERE id = ?';
            const row = await queryOne<RawMovie>(sql, [id]);

            if (!row) {
                console.log('[MovieService] Movie not found:', id);
                return null;
            }

            console.log('[MovieService] Found movie:', id);
            return mapToMovie(row);
        } catch (error) {
            console.error('[MovieService] getById error:', error);
            throw new MovieServiceError(
                `Failed to get movie ${id}`,
                'GET_BY_ID_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get multiple movies by IDs
     */
    getByIds: async (ids: number[]): Promise<MovieWithGenres[]> => {
        if (ids.length === 0) {
            return [];
        }

        try {
            const placeholders = ids.map(() => '?').join(',');
            const sql = `SELECT * FROM movies WHERE id IN (${placeholders})`;
            const rows = await query<RawMovie>(sql, ids);

            console.log('[MovieService] getByIds:', { requested: ids.length, found: rows.length });
            return rows.map(mapToMovie);
        } catch (error) {
            console.error('[MovieService] getByIds error:', error);
            throw new MovieServiceError(
                'Failed to get movies by IDs',
                'GET_BY_IDS_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get all movies (use with caution - can be slow for large datasets)
     */
    getAll: async (limit = 100): Promise<MovieWithGenres[]> => {
        try {
            const sql = 'SELECT * FROM movies ORDER BY updated_at DESC LIMIT ?';
            const rows = await query<RawMovie>(sql, [limit]);
            return rows.map(mapToMovie);
        } catch (error) {
            console.error('[MovieService] getAll error:', error);
            throw new MovieServiceError(
                'Failed to get all movies',
                'GET_ALL_ERROR',
                error as Error
            );
        }
    },

    /**
     * Search movies by title
     */
    search: async (queryText: string, limit = 20): Promise<MovieWithGenres[]> => {
        if (!queryText || queryText.trim().length < 2) {
            console.warn('[MovieService] Search query too short:', queryText);
            return [];
        }

        try {
            const sql = `
        SELECT * FROM movies
        WHERE title LIKE ?
        ORDER BY vote_average DESC
        LIMIT ?
      `;
            const rows = await query<RawMovie>(sql, [`%${queryText}%`, limit]);
            return rows.map(mapToMovie);
        } catch (error) {
            console.error('[MovieService] Search error:', error);
            throw new MovieServiceError(
                `Failed to search movies with query "${queryText}"`,
                'SEARCH_ERROR',
                error as Error
            );
        }
    },

    /**
     * Delete a movie by ID
     */
    delete: async (id: number): Promise<boolean> => {
        try {
            const sql = 'DELETE FROM movies WHERE id = ?';
            const result = await execute(sql, [id]);
            console.log('[MovieService] Deleted movie:', id, result ? 'success' : 'not found');
            return result;
        } catch (error) {
            console.error('[MovieService] Delete error:', error);
            throw new MovieServiceError(
                `Failed to delete movie ${id}`,
                'DELETE_ERROR',
                error as Error
            );
        }
    },

    /**
     * Delete orphan movies (not in favorites or watchlist)
     */
    deleteOrphans: async (): Promise<number> => {
        try {
            const sql = `
        DELETE FROM movies
        WHERE id NOT IN (
          SELECT movie_id FROM favorites
          UNION
          SELECT movie_id FROM watchlist
        )
      `;
            const result = await execute(sql, []);
            console.log('[MovieService] Deleted orphan movies:', result);
            return result ? 1 : 0;
        } catch (error) {
            console.error('[MovieService] deleteOrphans error:', error);
            throw new MovieServiceError(
                'Failed to delete orphan movies',
                'DELETE_ORPHANS_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get movie count
     */
    count: async (): Promise<number> => {
        try {
            const sql = 'SELECT COUNT(*) as count FROM movies';
            const row = await queryOne<{ count: number }>(sql, []);
            return row?.count || 0;
        } catch (error) {
            console.error('[MovieService] Count error:', error);
            return 0;
        }
    },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { MovieWithGenres, RawMovie };

