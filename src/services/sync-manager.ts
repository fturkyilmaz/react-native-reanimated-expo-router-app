// @ts-nocheck - Complex types
import { useAuthStore } from '@/store/authStore';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { FavoritesService, MovieService, SyncQueueService, WatchlistService } from './local-db.service';
import { supabaseService } from './supabase-service';

// Type for sync queue items
type LocalSyncQueue = {
    id: number;
    table_name: string;
    record_id: number;
    action: string;
    created_at: number;
    retry_count: number;
};

// Maximum retry attempts for failed sync operations
const MAX_RETRY_COUNT = 3;

// Delay between retry attempts (ms)
const RETRY_DELAY = 2000;

class SyncManager {
    private isSyncing = false;
    private isOnline = false;
    private unsubscribeNetInfo: (() => void) | null = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Monitor network status
        NetInfo.fetch().then(state => {
            this.isOnline = state.isConnected ?? false;
        });

        this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected ?? false;

            // Auto-sync when coming back online
            if (wasOffline && this.isOnline) {
                this.syncAll();
            }
        });
    }

    // Sync all pending changes to Supabase
    async syncAll(): Promise<void> {
        if (!this.isOnline || this.isSyncing) return;

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping sync');
                this.isSyncing = false;
                return;
            }

            // Get all pending sync items
            const pendingItems = await SyncQueueService.getAll();

            if (pendingItems.length === 0) {
                console.log('[SyncManager] No pending items to sync');
                this.isSyncing = false;
                return;
            }

            console.log('[SyncManager] Syncing', pendingItems.length, 'items');

            // Process each item
            for (const item of pendingItems) {
                // Skip items that have exceeded max retries
                if (item.retry_count >= MAX_RETRY_COUNT) {
                    console.warn('[SyncManager] Skipping item with max retries:', item.id);
                    continue;
                }

                const success = await this.processSyncItem(item, user.id);

                if (success) {
                    await SyncQueueService.remove(item.id);
                }
            }

        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // Sync favorites only
    async syncFavorites(): Promise<void> {
        if (!this.isOnline || this.isSyncing) return;

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping favorites sync');
                this.isSyncing = false;
                return;
            }

            // Get pending favorites
            const pendingFavorites = await FavoritesService.getUnsynced();

            for (const item of pendingFavorites) {
                const movie: any = await MovieService.getById(item.movie_id);
                if (movie) {
                    if (item.synced === 0) {
                        await supabaseService.addFavorite(user.id, movie);
                    }
                    await FavoritesService.markSynced(item.id);
                }
            }

            console.log('[SyncManager] Favorites synced successfully');
        } catch (error) {
            console.error('Sync favorites error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // Sync watchlist only
    async syncWatchlist(): Promise<void> {
        if (!this.isOnline || this.isSyncing) return;

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping watchlist sync');
                this.isSyncing = false;
                return;
            }

            // Get pending watchlist
            const pendingWatchlist = await WatchlistService.getUnsynced();

            for (const item of pendingWatchlist) {
                const movie: any = await MovieService.getById(item.movie_id);
                if (movie) {
                    if (item.synced === 0) {
                        await supabaseService.addToWatchlist(user.id, movie);
                    }
                    await WatchlistService.markSynced(item.id);
                }
            }

            console.log('[SyncManager] Watchlist synced successfully');
        } catch (error) {
            console.error('Sync watchlist error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processSyncItem(item: LocalSyncQueue, userId: string): Promise<boolean> {
        let success = false;
        let attempt = 0;

        while (attempt < MAX_RETRY_COUNT && !success) {
            try {
                if (item.table_name === 'favorites') {
                    if (item.action === 'INSERT') {
                        const movie: any = await MovieService.getById(item.record_id);
                        if (movie) {
                            success = await supabaseService.addFavorite(userId, movie);
                        } else {
                            console.warn('[SyncManager] Movie not found for favorite sync:', item.record_id);
                            success = true; // Skip if movie not found
                        }
                    } else if (item.action === 'DELETE') {
                        success = await supabaseService.removeFavorite(userId, item.record_id);
                    }
                } else if (item.table_name === 'watchlist') {
                    if (item.action === 'INSERT') {
                        const movie: any = await MovieService.getById(item.record_id);
                        if (movie) {
                            success = await supabaseService.addToWatchlist(userId, movie);
                        } else {
                            console.warn('[SyncManager] Movie not found for watchlist sync:', item.record_id);
                            success = true; // Skip if movie not found
                        }
                    } else if (item.action === 'DELETE') {
                        success = await supabaseService.removeFromWatchlist(userId, item.record_id);
                    }
                }

                if (!success && attempt < MAX_RETRY_COUNT - 1) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
                }

                attempt++;
            } catch (error) {
                console.error('[SyncManager] Error processing sync item (attempt', attempt + 1, '):', error);

                if (attempt >= MAX_RETRY_COUNT - 1) {
                    // Increment retry count in database
                    await SyncQueueService.incrementRetry(item.id);
                    console.warn('[SyncManager] Max retries reached for item:', item.id);
                } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
                }
                attempt++;
            }
        }

        return success;
    }

    // Pull data from Supabase to local
    async pullFromSupabase(userId: string): Promise<void> {
        if (!this.isOnline) {
            console.log('[SyncManager] Offline, skipping pull');
            return;
        }

        if (!userId) {
            console.log('[SyncManager] No user ID provided, skipping pull');
            return;
        }

        try {
            console.log('[SyncManager] Pulling data from Supabase for user:', userId);

            // Pull favorites
            const remoteFavorites: any = await supabaseService.getFavorites(userId);
            if (remoteFavorites && remoteFavorites.length > 0) {
                for (const movie of remoteFavorites) {
                    await MovieService.upsert(movie);
                    await FavoritesService.add(movie.id, userId, true); // Online = true
                }
                console.log('[SyncManager] Pulled', remoteFavorites.length, 'favorites');
            }

            // Pull watchlist
            const remoteWatchlist: any = await supabaseService.getWatchlist(userId);
            if (remoteWatchlist && remoteWatchlist.length > 0) {
                for (const movie of remoteWatchlist) {
                    await MovieService.upsert(movie);
                    await WatchlistService.add(movie.id, userId, true); // Online = true
                }
                console.log('[SyncManager] Pulled', remoteWatchlist.length, 'watchlist items');
            }
        } catch (error) {
            console.error('Pull from Supabase error:', error);
        }
    }

    // Cleanup
    destroy(): void {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
        }
    }
}

// Singleton instance
export const syncManager = new SyncManager();

// React hook for sync status
export function useSyncStatus() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    useEffect(() => {
        const checkSync = () => {
            // Simple polling to check sync status
            setIsSyncing((syncManager as any).isSyncing);
        };

        const interval = setInterval(checkSync, 1000);
        return () => clearInterval(interval);
    }, []);

    const triggerSync = useCallback(async () => {
        await syncManager.syncAll();
        setLastSynced(new Date());
    }, []);

    return { isSyncing, lastSynced, triggerSync };
}
