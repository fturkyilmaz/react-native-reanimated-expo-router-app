// @ts-nocheck
/**
 * SyncManager - Sync orchestration and state management
 *
 * Coordinates offline-to-online sync operations.
 * Provides global state management for sync status.
 *
 * Features:
 * - Global network listener for automatic sync
 * - Batch sync operations
 * - Retry failed operations
 * - Orphan movie cleanup
 * - Sync state store with Zustand
 */

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';
import { initializeDatabase } from '../db/database';
import { FavoritesService } from './favorites-service';
import { MovieService } from './movie-service';
import { supabaseSyncService } from './supabase-sync-service';
import { SyncQueueService } from './sync-queue-service';
import { WatchlistService } from './watchlist-service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync state interface
 */
interface SyncState {
    isInitialized: boolean;
    isSyncing: boolean;
    lastSyncTime: number | null;
    pendingCount: number;
    failedCount: number;
    isOnline: boolean;
    error: string | null;
}

/**
 * Sync actions
 */
interface SyncActions {
    setInitialized: (initialized: boolean) => void;
    setSyncing: (syncing: boolean) => void;
    setLastSyncTime: (time: number | null) => void;
    setPendingCount: (count: number) => void;
    setFailedCount: (count: number) => void;
    setOnline: (online: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const initialState: SyncState = {
    isInitialized: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    isOnline: false,
    error: null,
};

export const useSyncStore = create<SyncState & SyncActions>((set) => ({
    ...initialState,

    setInitialized: (initialized) => set({ isInitialized: initialized }),
    setSyncing: (syncing) => set({ isSyncing: syncing }),
    setLastSyncTime: (time) => set({ lastSyncTime: time }),
    setPendingCount: (count) => set({ pendingCount: count }),
    setFailedCount: (count) => set({ failedCount: count }),
    setOnline: (online) => set({ isOnline: online }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),
}));

// ============================================================================
// NETWORK LISTENER
// ============================================================================

let networkUnsubscribe: (() => void) | null = null;

/**
 * Setup global network listener for automatic sync
 */
const setupNetworkListener = (): void => {
    if (networkUnsubscribe) {
        logger.sync.debug('Network listener already active');
        return;
    }

    logger.sync.info('Setting up network listener');
    networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const isConnected = state.isConnected ?? false;
        const wasOffline = !useSyncStore.getState().isOnline;

        logger.sync.debug('Network state changed', { isConnected, wasOffline });

        // Update store
        useSyncStore.getState().setOnline(isConnected);

        // Trigger sync when coming back online
        if (isConnected && wasOffline) {
            logger.sync.info('Back online, triggering sync');
            syncManager.syncAll();
        }
    });
};

/**
 * Cleanup network listener
 */
const cleanupNetworkListener = (): void => {
    if (networkUnsubscribe) {
        networkUnsubscribe();
        networkUnsubscribe = null;
        logger.sync.debug('Network listener cleaned up');
    }
};

// ============================================================================
// SYNC MANAGER
// ============================================================================

export const syncManager = {
    /**
     * Initialize sync manager
     * Should be called once at app startup
     */
    initialize: async (): Promise<void> => {
        logger.sync.info('Initializing...');

        try {
            // Initialize database
            const dbInitialized = await initializeDatabase();
            if (!dbInitialized) {
                throw new Error('Failed to initialize database');
            }

            // Setup network listener
            setupNetworkListener();

            // Check initial network state
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected ?? false;
            useSyncStore.getState().setOnline(isConnected);

            // Update pending count
            const pendingCount = await SyncQueueService.getPendingCount();
            useSyncStore.getState().setPendingCount(pendingCount);

            // Update failed count
            const failedItems = await SyncQueueService.getFailed();
            useSyncStore.getState().setFailedCount(failedItems.length);

            useSyncStore.getState().setInitialized(true);
            logger.sync.info('Initialization complete', { isOnline: isConnected, pendingCount });
        } catch (error) {
            logger.sync.error('Initialization failed', { error: error instanceof Error ? error.message : error });
            useSyncStore.getState().setError('Sync initialization failed');
        }
    },

    /**
     * Cleanup sync manager
     * Should be called at app cleanup
     */
    cleanup: (): void => {
        logger.sync.info('Cleaning up');
        cleanupNetworkListener();
        useSyncStore.getState().reset();
        logger.sync.debug('Cleanup complete');
    },

    /**
     * Sync all pending operations to Supabase
     */
    syncAll: async (): Promise<{ synced: number; failed: number }> => {
        const state = useSyncStore.getState();

        // Prevent multiple simultaneous syncs
        if (state.isSyncing) {
            logger.sync.debug('Sync already in progress, skipping');
            return { synced: 0, failed: 0 };
        }

        // Only sync if online
        if (!state.isOnline) {
            logger.sync.debug('Offline, skipping sync');
            return { synced: 0, failed: 0 };
        }

        useSyncStore.getState().setSyncing(true);
        useSyncStore.getState().setError(null);

        let synced = 0;
        let failed = 0;

        try {
            logger.sync.info('Starting sync');

            // Get pending operations
            const pendingItems = await SyncQueueService.getPending();
            logger.sync.debug('Pending items', { count: pendingItems.length });

            for (const item of pendingItems) {
                // Mark as processing
                await SyncQueueService.updateStatus(item.id, 'processing');

                try {
                    // Sync based on type
                    if (item.type === 'favorite') {
                        if (item.operation === 'add') {
                            await supabaseSyncService.addFavorite(item.movie_id);
                        } else {
                            await supabaseSyncService.removeFavorite(item.movie_id);
                        }
                    } else if (item.type === 'watchlist') {
                        if (item.operation === 'add') {
                            await supabaseSyncService.addToWatchlist(item.movie_id);
                        } else {
                            await supabaseSyncService.removeFromWatchlist(item.movie_id);
                        }
                    }

                    // Mark as completed
                    await SyncQueueService.updateStatus(item.id, 'completed');
                    synced++;
                    logger.sync.info('Synced item', { id: item.id, type: item.type, operation: item.operation });
                } catch (error) {
                    logger.sync.error('Failed to sync item', { id: item.id, error: error instanceof Error ? error.message : error });

                    // Increment retry count
                    await SyncQueueService.incrementRetry(item.id);

                    // Check if max retries exceeded
                    const maxRetries = SyncQueueService.getMaxRetries();
                    if (item.retry_count >= maxRetries - 1) {
                        await SyncQueueService.updateStatus(item.id, 'failed');
                        failed++;
                    } else {
                        // Reset to pending for retry
                        await SyncQueueService.updateStatus(item.id, 'pending');
                    }
                }
            }

            // Cleanup completed items
            await SyncQueueService.cleanup();

            // Update counts
            const pendingCount = await SyncQueueService.getPendingCount();
            const failedItems = await SyncQueueService.getFailed();
            useSyncStore.getState().setPendingCount(pendingCount);
            useSyncStore.getState().setFailedCount(failedItems.length);

            // Update last sync time
            useSyncStore.getState().setLastSyncTime(Date.now());

            logger.sync.info('Sync complete', { synced, failed, pending: pendingCount });
        } catch (error) {
            logger.sync.error('Sync error', { error: error instanceof Error ? error.message : error });
            useSyncStore.getState().setError('Sync failed');
        } finally {
            useSyncStore.getState().setSyncing(false);
        }

        return { synced, failed };
    },

    /**
     * Sync only favorites
     */
    syncFavorites: async (): Promise<number> => {
        const state = useSyncStore.getState();
        if (!state.isOnline) return 0;

        try {
            const unsynced = await FavoritesService.getUnsynced();
            let synced = 0;

            for (const item of unsynced) {
                try {
                    await supabaseSyncService.addFavorite(item.movie_id);
                    await FavoritesService.markAsSynced(item.movie_id);
                    synced++;
                } catch (error) {
                    logger.sync.error('Failed to sync favorite', { movieId: item.movie_id, error: error instanceof Error ? error.message : error });
                }
            }

            logger.sync.debug('Favorites synced', { count: synced });
            return synced;
        } catch (error) {
            logger.sync.error('syncFavorites error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Sync only watchlist
     */
    syncWatchlist: async (): Promise<number> => {
        const state = useSyncStore.getState();
        if (!state.isOnline) return 0;

        try {
            const unsynced = await WatchlistService.getUnsynced();
            let synced = 0;

            for (const item of unsynced) {
                try {
                    await supabaseSyncService.addToWatchlist(item.movie_id);
                    await WatchlistService.markAsSynced(item.movie_id);
                    synced++;
                } catch (error) {
                    logger.sync.error('Failed to sync watchlist', { movieId: item.movie_id, error: error instanceof Error ? error.message : error });
                }
            }

            logger.sync.debug('Watchlist synced', { count: synced });
            return synced;
        } catch (error) {
            logger.sync.error('syncWatchlist error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Retry failed operations
     */
    retryFailed: async (): Promise<{ retried: number; failed: number }> => {
        // Reset failed items to pending
        const resetCount = await SyncQueueService.resetFailed();

        if (resetCount > 0) {
            logger.sync.info('Reset failed items', { count: resetCount });
            // Trigger sync
            const result = await syncManager.syncAll();
            return { retried: result.synced, failed: result.failed };
        }

        return { retried: 0, failed: 0 };
    },

    /**
     * Cleanup orphan movies (not in favorites or watchlist)
     */
    cleanupOrphanMovies: async (): Promise<number> => {
        try {
            const deletedCount = await MovieService.deleteOrphans();
            logger.sync.info('Deleted orphan movies', { count: deletedCount });
            return deletedCount;
        } catch (error) {
            logger.sync.error('cleanupOrphanMovies error', { error: error instanceof Error ? error.message : error });
            return 0;
        }
    },

    /**
     * Force refresh sync state
     */
    refreshState: async (): Promise<void> => {
        const pendingCount = await SyncQueueService.getPendingCount();
        const failedItems = await SyncQueueService.getFailed();
        const netState = await NetInfo.fetch();

        useSyncStore.getState().setPendingCount(pendingCount);
        useSyncStore.getState().setFailedCount(failedItems.length);
        useSyncStore.getState().setOnline(netState.isConnected ?? false);

        logger.sync.info('State refreshed', {
            pending: pendingCount,
            failed: failedItems.length,
            online: netState.isConnected,
        });
    },

    /**
     * Get sync status summary
     */
    getStatus: (): SyncState => {
        return useSyncStore.getState();
    },
};

// ============================================================================
// HOOKS FOR REACT COMPONENTS
// ============================================================================

/**
 * Hook to use sync state
 */
export const useSyncStatus = () => {
    const state = useSyncStore();
    return {
        isInitialized: state.isInitialized,
        isSyncing: state.isSyncing,
        lastSyncTime: state.lastSyncTime,
        pendingCount: state.pendingCount,
        failedCount: state.failedCount,
        isOnline: state.isOnline,
        error: state.error,
    };
};

/**
 * Hook to trigger sync
 */
export const useSyncTrigger = () => {
    const syncAll = async () => {
        return syncManager.syncAll();
    };

    const retryFailed = async () => {
        return syncManager.retryFailed();
    };

    const refresh = async () => {
        await syncManager.refreshState();
    };

    return { syncAll, retryFailed, refresh };
};
