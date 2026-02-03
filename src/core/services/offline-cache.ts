/**
 * Offline Cache Service using expo-sqlite
 * 
 * This service provides caching capabilities for offline data storage
 * using SQLite database for larger datasets.
 */

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'cinesearch.db';
let dbInstance: SQLiteDatabase | null = null;

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export interface QueuedMutation<T = unknown> {
    id: string;
    type: string;
    variables: string;
    timestamp: number;
    retryCount: number;
}

function getDatabase(): SQLiteDatabase {
    if (!dbInstance) {
        dbInstance = openDatabaseSync(DB_NAME);
        initializeSchema(dbInstance);
    }
    return dbInstance;
}

async function initializeSchema(db: SQLiteDatabase): Promise<void> {
    try {
        // Cache table for offline data
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

        // Mutation queue table for offline mutations
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mutation_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        variables TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    `);

        // Favorites table for offline favorites
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY,
        movie_data TEXT NOT NULL,
        added_at INTEGER NOT NULL
      );
    `);

        console.log('[OfflineCache] Database schema initialized');
    } catch (error) {
        console.error('[OfflineCache] Schema initialization failed:', error);
        throw error;
    }
}

export class OfflineCache {
    private db = getDatabase();
    private static instance: OfflineCache;

    static getInstance(): OfflineCache {
        if (!OfflineCache.instance) {
            OfflineCache.instance = new OfflineCache();
        }
        return OfflineCache.instance;
    }

    /**
     * Set data in cache with TTL (time to live)
     */
    async set<T>(key: string, data: T, ttlMinutes = 60): Promise<void> {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttlMinutes * 60 * 1000,
            };

            await this.db.runAsync(
                `INSERT OR REPLACE INTO cache (key, data, timestamp, expires_at) VALUES (?, ?, ?, ?)`,
                [key, JSON.stringify(entry), entry.timestamp, entry.expiresAt]
            );

            console.log(`[OfflineCache] Cached: ${key}`);
        } catch (error) {
            console.error(`[OfflineCache] Set failed for ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get data from cache if not expired
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const result = await this.db.getFirstAsync<{ data: string }>(
                `SELECT data FROM cache WHERE key = ? AND expires_at > ?`,
                [key, Date.now()]
            );

            if (!result) {
                console.log(`[OfflineCache] Cache miss: ${key}`);
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(result.data);
            console.log(`[OfflineCache] Cache hit: ${key}`);
            return entry.data;
        } catch (error) {
            console.error(`[OfflineCache] Get failed for ${key}:`, error);
            return null;
        }
    }

    /**
     * Check if key exists and is valid in cache
     */
    async has(key: string): Promise<boolean> {
        try {
            const result = await this.db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM cache WHERE key = ? AND expires_at > ?`,
                [key, Date.now()]
            );
            return (result?.count ?? 0) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Invalidate a specific cache entry
     */
    async invalidate(key: string): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM cache WHERE key = ?`, [key]);
            console.log(`[OfflineCache] Invalidated: ${key}`);
        } catch (error) {
            console.error(`[OfflineCache] Invalidate failed for ${key}:`, error);
        }
    }

    /**
     * Clear all expired cache entries
     */
    async clearExpired(): Promise<number> {
        try {
            const result = await this.db.runAsync(
                `DELETE FROM cache WHERE expires_at <= ?`,
                [Date.now()]
            );
            console.log(`[OfflineCache] Cleared ${result.changes} expired entries`);
            return result.changes;
        } catch (error) {
            console.error('[OfflineCache] Clear expired failed:', error);
            return 0;
        }
    }

    /**
     * Clear all cache entries
     */
    async clearAll(): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM cache`);
            console.log('[OfflineCache] Cleared all cache');
        } catch (error) {
            console.error('[OfflineCache] Clear all failed:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ size: number; expired: number }> {
        try {
            const totalResult = await this.db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM cache`
            );
            const expiredResult = await this.db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM cache WHERE expires_at <= ?`,
                [Date.now()]
            );

            return {
                size: totalResult?.count ?? 0,
                expired: expiredResult?.count ?? 0,
            };
        } catch {
            return { size: 0, expired: 0 };
        }
    }
}

export class MutationQueue {
    private db = getDatabase();
    private static instance: MutationQueue;

    static getInstance(): MutationQueue {
        if (!MutationQueue.instance) {
            MutationQueue.instance = new MutationQueue();
        }
        return MutationQueue.instance;
    }

    /**
     * Enqueue a mutation for later execution
     */
    async enqueue<T>(type: string, variables: T): Promise<string> {
        try {
            const id = generateId();
            await this.db.runAsync(
                `INSERT INTO mutation_queue (id, type, variables, timestamp, retry_count) VALUES (?, ?, ?, ?, 0)`,
                [id, type, JSON.stringify(variables), Date.now()]
            );

            console.log(`[MutationQueue] Enqueued: ${type} (${id})`);
            return id;
        } catch (error) {
            console.error('[MutationQueue] Enqueue failed:', error);
            throw error;
        }
    }

    /**
     * Dequeue the next mutation
     */
    async dequeue(): Promise<QueuedMutation | null> {
        try {
            const result = await this.db.getFirstAsync<QueuedMutation>(
                `SELECT * FROM mutation_queue ORDER BY timestamp ASC LIMIT 1`
            );
            return result;
        } catch (error) {
            console.error('[MutationQueue] Dequeue failed:', error);
            return null;
        }
    }

    /**
     * Remove a mutation from queue
     */
    async remove(id: string): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
            console.log(`[MutationQueue] Removed: ${id}`);
        } catch (error) {
            console.error(`[MutationQueue] Remove failed for ${id}:`, error);
        }
    }

    /**
     * Increment retry count for a mutation
     */
    async incrementRetry(id: string): Promise<void> {
        try {
            await this.db.runAsync(
                `UPDATE mutation_queue SET retry_count = retry_count + 1 WHERE id = ?`,
                [id]
            );
        } catch (error) {
            console.error(`[MutationQueue] Increment retry failed for ${id}:`, error);
        }
    }

    /**
     * Get the number of pending mutations
     */
    async getQueueSize(): Promise<number> {
        try {
            const result = await this.db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM mutation_queue`
            );
            return result?.count ?? 0;
        } catch {
            return 0;
        }
    }

    /**
     * Clear all pending mutations
     */
    async clear(): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM mutation_queue`);
            console.log('[MutationQueue] Cleared all');
        } catch (error) {
            console.error('[MutationQueue] Clear failed:', error);
        }
    }
}

export class FavoritesStore {
    private db = getDatabase();
    private static instance: FavoritesStore;

    static getInstance(): FavoritesStore {
        if (!FavoritesStore.instance) {
            FavoritesStore.instance = new FavoritesStore();
        }
        return FavoritesStore.instance;
    }

    /**
     * Add a movie to favorites (offline first)
     */
    async add(movie: Movie): Promise<void> {
        try {
            await this.db.runAsync(
                `INSERT OR REPLACE INTO favorites (id, movie_data, added_at) VALUES (?, ?, ?)`,
                [movie.id, JSON.stringify(movie), Date.now()]
            );
            console.log(`[FavoritesStore] Added: ${movie.title}`);
        } catch (error) {
            console.error('[FavoritesStore] Add failed:', error);
            throw error;
        }
    }

    /**
     * Remove a movie from favorites
     */
    async remove(movieId: number): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM favorites WHERE id = ?`, [movieId]);
            console.log(`[FavoritesStore] Removed: ${movieId}`);
        } catch (error) {
            console.error('[FavoritesStore] Remove failed:', error);
            throw error;
        }
    }

    /**
     * Get all favorites
     */
    async getAll(): Promise<Movie[]> {
        try {
            const results = await this.db.getAllAsync<{ movie_data: string }>(
                `SELECT movie_data FROM favorites ORDER BY added_at DESC`
            );

            return results.map((r) => JSON.parse(r.movie_data) as Movie);
        } catch (error) {
            console.error('[FavoritesStore] GetAll failed:', error);
            return [];
        }
    }

    /**
     * Check if a movie is in favorites
     */
    async has(movieId: number): Promise<boolean> {
        try {
            const result = await this.db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM favorites WHERE id = ?`,
                [movieId]
            );
            return (result?.count ?? 0) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Toggle favorite status
     */
    async toggle(movie: Movie): Promise<boolean> {
        const exists = await this.has(movie.id);
        if (exists) {
            await this.remove(movie.id);
            return false;
        } else {
            await this.add(movie);
            return true;
        }
    }

    /**
     * Clear all favorites
     */
    async clear(): Promise<void> {
        try {
            await this.db.runAsync(`DELETE FROM favorites`);
            console.log('[FavoritesStore] Cleared all');
        } catch (error) {
            console.error('[FavoritesStore] Clear failed:', error);
        }
    }
}

// Helper functions
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Types for the movie data
export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date: string;
    genre_ids?: number[];
}

// Export singleton instances
export const offlineCache = OfflineCache.getInstance();
export const mutationQueue = MutationQueue.getInstance();
export const favoritesStore = FavoritesStore.getInstance();
