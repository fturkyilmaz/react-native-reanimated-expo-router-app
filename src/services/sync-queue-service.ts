/**
 * SyncQueueService - Offline sync queue management
 *
 * Manages the queue of offline operations to be synced with Supabase.
 * Provides deduplication, retry logic, and status tracking.
 *
 * Features:
 * - Add operations to queue with deduplication
 * - Get pending operations for sync
 * - Update operation status
 * - Retry logic with max retry count
 * - Cleanup completed operations
 */

import { logger } from '@/utils/logger';
import { execute, getDatabase, query, queryOne } from '../db/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync queue item types
 */
export type SyncType = 'favorite' | 'watchlist';
export type SyncOperation = 'add' | 'remove';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Raw sync queue item
 */
interface RawSyncQueueItem {
    id: number;
    type: SyncType;
    movie_id: number;
    operation: SyncOperation;
    status: SyncStatus;
    retry_count: number;
    created_at: number;
    updated_at: number;
}

/**
 * Sync queue item with expanded data
 */
interface SyncQueueItem extends RawSyncQueueItem {
    movie_title?: string;
    movie_poster_path?: string | null;
}

/**
 * Service errors
 */
export class SyncQueueServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'SyncQueueServiceError';
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_NAME = 'sync_queue';
const MAX_RETRIES = 3;

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Validate sync type
 */
const isValidSyncType = (type: string): type is SyncType => {
    return type === 'favorite' || type === 'watchlist';
};

/**
 * Validate sync operation
 */
const isValidSyncOperation = (operation: string): operation is SyncOperation => {
    return operation === 'add' || operation === 'remove';
};

/**
 * Validate sync status
 */
const isValidSyncStatus = (status: string): status is SyncStatus => {
    return ['pending', 'processing', 'completed', 'failed'].includes(status);
};

// ============================================================================
// PUBLIC API
// ============================================================================

export const SyncQueueService = {
    /**
     * Add an operation to the queue
     * Uses INSERT OR IGNORE for deduplication
     */
    add: async (
        type: SyncType,
        movieId: number,
        operation: SyncOperation,
        status: SyncStatus = 'pending'
    ): Promise<boolean> => {
        const db = await getDatabase();
        if (!db) {
            throw new SyncQueueServiceError('Database not available', 'DB_UNAVAILABLE');
        }

        try {
            // Validate inputs
            if (!isValidSyncType(type)) {
                throw new SyncQueueServiceError('Invalid sync type', 'INVALID_TYPE');
            }
            if (!isValidSyncOperation(operation)) {
                throw new SyncQueueServiceError('Invalid sync operation', 'INVALID_OPERATION');
            }

            console.log('[SyncQueueService] Adding to queue:', { type, movieId, operation });

            const sql = `
        INSERT OR IGNORE INTO ${TABLE_NAME}
        (type, movie_id, operation, status, retry_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, strftime('%s', 'now'), strftime('%s', 'now'))
      `;

            const result = await execute(sql, [type, movieId, operation]);
            logger.sync.debug('Added to queue', { type, movieId, operation });
            return result;
        } catch (error) {
            if (error instanceof SyncQueueServiceError) {
                throw error;
            }
            logger.sync.error('Add error', { type, movieId, operation, error: error instanceof Error ? error.message : error });
            throw new SyncQueueServiceError(
                'Failed to add to sync queue',
                'ADD_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get all pending operations (not yet synced)
     */
    getPending: async (): Promise<SyncQueueItem[]> => {
        try {
            const sql = `
        SELECT q.*, m.title as movie_title, m.poster_path as movie_poster_path
        FROM ${TABLE_NAME} q
        LEFT JOIN movies m ON q.movie_id = m.id
        WHERE q.status = 'pending' AND q.retry_count < ?
        ORDER BY q.created_at ASC
      `;

            const rows = await query<SyncQueueItem>(sql, [MAX_RETRIES]);
            logger.sync.debug('getPending', { count: rows.length });
            return rows;
        } catch (error) {
            logger.sync.error('getPending error', { error: error instanceof Error ? error.message : error });
            throw new SyncQueueServiceError(
                'Failed to get pending sync items',
                'GET_PENDING_ERROR',
                error as Error
            );
        }
    },

    /**
     * Get pending count
     */
    getPendingCount: async (): Promise<number> => {
        try {
            const sql = `
        SELECT COUNT(*) as count FROM ${TABLE_NAME}
        WHERE status = 'pending' AND retry_count < ?
      `;
            const row = await queryOne<{ count: number }>(sql, [MAX_RETRIES]);
            return row?.count || 0;
        } catch (error) {
            logger.sync.error('getPendingCount error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Get all operations for a specific movie
     */
    getByMovieId: async (movieId: number): Promise<SyncQueueItem[]> => {
        try {
            const sql = `
        SELECT q.*, m.title as movie_title, m.poster_path as movie_poster_path
        FROM ${TABLE_NAME} q
        LEFT JOIN movies m ON q.movie_id = m.id
        WHERE q.movie_id = ?
        ORDER BY q.created_at DESC
      `;
            return await query<SyncQueueItem>(sql, [movieId]);
        } catch (error) {
            logger.sync.error('getByMovieId error', { movieId, error: error instanceof Error ? error.message : error });
            return [];
        }
    },

    /**
     * Update status of an operation
     */
    updateStatus: async (id: number, status: SyncStatus): Promise<boolean> => {
        if (!isValidSyncStatus(status)) {
            throw new SyncQueueServiceError('Invalid status', 'INVALID_STATUS');
        }

        try {
            const sql = `
        UPDATE ${TABLE_NAME}
        SET status = ?, updated_at = strftime('%s', 'now')
        WHERE id = ?
      `;
            return await execute(sql, [status, id]);
        } catch (error) {
            logger.sync.error('updateStatus error', { id, status, error: error instanceof Error ? error.message : error });
            throw new SyncQueueServiceError(
                'Failed to update sync status',
                'UPDATE_STATUS_ERROR',
                error as Error
            );
        }
    },

    /**
     * Increment retry count for an operation
     */
    incrementRetry: async (id: number): Promise<boolean> => {
        try {
            const sql = `
        UPDATE ${TABLE_NAME}
        SET retry_count = retry_count + 1,
            updated_at = strftime('%s', 'now')
        WHERE id = ?
      `;
            return await execute(sql, [id]);
        } catch (error) {
            logger.sync.error('incrementRetry error', { id, error: error instanceof Error ? error.message : error });
            return false;
        }
    },

    /**
     * Reset failed operations back to pending (for retry)
     */
    resetFailed: async (): Promise<number> => {
        try {
            const sql = `
        UPDATE ${TABLE_NAME}
        SET status = 'pending',
            updated_at = strftime('%s', 'now')
        WHERE status = 'failed' AND retry_count < ?
      `;
            const result = await execute(sql, [MAX_RETRIES]);
            logger.sync.debug('Reset failed', { count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.sync.error('resetFailed error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Remove completed operations
     */
    cleanup: async (): Promise<number> => {
        try {
            const sql = `DELETE FROM ${TABLE_NAME} WHERE status = 'completed'`;
            const result = await execute(sql, []);
            logger.sync.debug('Cleanup', { count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.sync.error('cleanup error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Remove a specific operation
     */
    remove: async (id: number): Promise<boolean> => {
        try {
            const sql = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
            return await execute(sql, [id]);
        } catch (error) {
            logger.sync.error('remove error', { id, error: error instanceof Error ? error.message : error });
            return false;
        }
    },

    /**
     * Remove all operations for a specific movie
     */
    removeByMovieId: async (movieId: number): Promise<number> => {
        try {
            const sql = `DELETE FROM ${TABLE_NAME} WHERE movie_id = ?`;
            const result = await execute(sql, [movieId]);
            logger.sync.debug('Removed by movieId', { movieId, count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.sync.error('removeByMovieId error', { movieId, error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Remove all operations of a specific type
     */
    clearByType: async (type: SyncType): Promise<number> => {
        try {
            const sql = `DELETE FROM ${TABLE_NAME} WHERE type = ?`;
            const result = await execute(sql, [type]);
            logger.sync.debug('Cleared by type', { type, count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.sync.error('clearByType error', { type, error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Clear all operations
     */
    clear: async (): Promise<number> => {
        try {
            const sql = `DELETE FROM ${TABLE_NAME}`;
            const result = await execute(sql, []);
            logger.sync.debug('Cleared all', { count: result });
            return result ? 1 : 0;
        } catch (error) {
            logger.sync.error('clear error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Get total count of operations
     */
    count: async (): Promise<number> => {
        try {
            const sql = `SELECT COUNT(*) as count FROM ${TABLE_NAME}`;
            const row = await queryOne<{ count: number }>(sql, []);
            return row?.count || 0;
        } catch (error) {
            logger.sync.error('count error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Get failed operations
     */
    getFailed: async (): Promise<SyncQueueItem[]> => {
        try {
            const sql = `
        SELECT q.*, m.title as movie_title, m.poster_path as movie_poster_path
        FROM ${TABLE_NAME} q
        LEFT JOIN movies m ON q.movie_id = m.id
        WHERE q.status = 'failed'
        ORDER BY q.updated_at DESC
      `;
            return await query<SyncQueueItem>(sql, []);
        } catch (error) {
            logger.sync.error('getFailed error', { error: error instanceof Error ? error.message : error });
            return [];
        }
    },

    /**
     * Check if there are pending operations
     */
    hasPending: async (): Promise<boolean> => {
        const count = await SyncQueueService.getPendingCount();
        return count > 0;
    },

    /**
     * Get max retries constant
     */
    getMaxRetries: () => MAX_RETRIES,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { RawSyncQueueItem, SyncQueueItem };
