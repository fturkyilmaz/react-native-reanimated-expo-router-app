// @ts-nocheck - Complex types (debugged SyncManager)
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
    public isSyncing = false;
    private isOnline = false;
    private unsubscribeNetInfo: (() => void) | null = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        console.log('[SyncManager] initialize called');
        // initial network state
        NetInfo.fetch().then(state => {
            this.isOnline = state.isConnected ?? false;
            console.log('[SyncManager] initial network state:', this.isOnline);
        }).catch(e => {
            console.warn('[SyncManager] NetInfo.fetch failed:', e);
        });

        this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected ?? false;
            console.log('[SyncManager] network changed. isOnline:', this.isOnline);

            // Auto-sync when coming back online
            if (wasOffline && this.isOnline) {
                console.log('[SyncManager] Came back online — starting syncAll');
                this.syncAll().catch(err => console.error('[SyncManager] syncAll error on reconnect:', err));
            }
        });
    }

    // Sync all pending changes to Supabase
    async syncAll(): Promise<void> {
        console.log('[SyncManager] syncAll called. isOnline:', this.isOnline, 'isSyncing:', this.isSyncing);
        if (!this.isOnline) {
            console.log('[SyncManager] offline — skipping syncAll');
            return;
        }
        if (this.isSyncing) {
            console.log('[SyncManager] already syncing — skipping concurrent run');
            return;
        }

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            console.log('[SyncManager] current user from store:', user?.id ?? null);
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping sync');
                this.isSyncing = false;
                return;
            }

            // Get all pending sync items
            const pendingItems = await SyncQueueService.getAll();
            console.log('[SyncManager] pendingItems count:', pendingItems?.length ?? 0);

            if (!pendingItems || pendingItems.length === 0) {
                console.log('[SyncManager] No pending items to sync');
                this.isSyncing = false;
                return;
            }

            console.log('[SyncManager] Syncing', pendingItems.length, 'items');

            // Process each item sequentially (could be parallelized if desired)
            for (const item of pendingItems) {
                console.log('[SyncManager] Processing item:', item.id, item.table_name, item.action, 'record:', item.record_id, 'retry_count:', item.retry_count);

                // Skip items that have exceeded max retries
                if (item.retry_count >= MAX_RETRY_COUNT) {
                    console.warn('[SyncManager] Skipping item with max retries:', item.id);
                    continue;
                }

                const success = await this.processSyncItem(item, user.id);

                if (success) {
                    console.log('[SyncManager] Item synced successfully, removing from queue:', item.id);
                    await SyncQueueService.remove(item.id);
                } else {
                    console.warn('[SyncManager] Item failed to sync:', item.id);
                    // increment retry count so we don't loop forever
                    await SyncQueueService.incrementRetry(item.id);
                }
            }

        } catch (error) {
            console.error('[SyncManager] syncAll error:', error);
        } finally {
            this.isSyncing = false;
            console.log('[SyncManager] syncAll finished');
        }
    }

    // Sync favorites only
    async syncFavorites(): Promise<void> {
        console.log('[SyncManager] syncFavorites called. isOnline:', this.isOnline, 'isSyncing:', this.isSyncing);
        if (!this.isOnline) {
            console.log('[SyncManager] offline — skipping syncFavorites');
            return;
        }
        if (this.isSyncing) {
            console.log('[SyncManager] already syncing — skipping syncFavorites');
            return;
        }

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            console.log('[SyncManager] user for syncFavorites:', user?.id ?? null);
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping favorites sync');
                this.isSyncing = false;
                return;
            }

            // Get pending favorites
            const pendingFavorites = await FavoritesService.getUnsynced();
            console.log('[SyncManager] pendingFavorites count:', pendingFavorites?.length ?? 0);

            for (const item of pendingFavorites) {
                console.log('[SyncManager] syncing favorite localId:', item.id, 'movie_id:', item.movie_id, 'synced:', item.synced);
                const movie: any = await MovieService.getById(item.movie_id);
                if (!movie) {
                    console.warn('[SyncManager] Movie not found for favorite sync, skipping localId:', item.id);
                    // mark as synced to avoid infinite retries? depends on policy — here we skip
                    continue;
                }

                if (item.synced === 0) {
                    console.log('[SyncManager] calling supabaseService.addFavorite for movie:', movie.id);
                    const res: any = await supabaseService.addFavorite(user.id, movie);
                    // Expect res to be { success: boolean, data?: any, error?: any } ideally
                    console.log('[SyncManager] supabaseService.addFavorite result:', res);

                    // If supabaseService returns boolean (legacy), handle both cases
                    const success = typeof res === 'boolean' ? res : (res?.success === true);

                    if (success) {
                        console.log('[SyncManager] supabase addFavorite succeeded for localId:', item.id);
                        await FavoritesService.markSynced(item.id);
                    } else {
                        console.warn('[SyncManager] supabase addFavorite failed for localId:', item.id, 'res:', res);
                        // do not mark synced; SyncQueueService will handle retries if used
                    }
                } else {
                    console.log('[SyncManager] item already marked synced, skipping:', item.id);
                }
            }

            console.log('[SyncManager] Favorites sync loop finished');
        } catch (error) {
            console.error('[SyncManager] Sync favorites error:', error);
        } finally {
            this.isSyncing = false;
            console.log('[SyncManager] syncFavorites finished');
        }
    }

    // Sync watchlist only
    async syncWatchlist(): Promise<void> {
        console.log('[SyncManager] syncWatchlist called. isOnline:', this.isOnline, 'isSyncing:', this.isSyncing);
        if (!this.isOnline) {
            console.log('[SyncManager] offline — skipping syncWatchlist');
            return;
        }
        if (this.isSyncing) {
            console.log('[SyncManager] already syncing — skipping syncWatchlist');
            return;
        }

        this.isSyncing = true;

        try {
            const { user } = useAuthStore.getState();
            console.log('[SyncManager] user for syncWatchlist:', user?.id ?? null);
            if (!user?.id) {
                console.log('[SyncManager] No user logged in, skipping watchlist sync');
                this.isSyncing = false;
                return;
            }

            // Get pending watchlist
            const pendingWatchlist = await WatchlistService.getUnsynced();
            console.log('[SyncManager] pendingWatchlist count:', pendingWatchlist?.length ?? 0);

            for (const item of pendingWatchlist) {
                console.log('[SyncManager] syncing watchlist localId:', item.id, 'movie_id:', item.movie_id, 'synced:', item.synced);
                const movie: any = await MovieService.getById(item.movie_id);
                if (!movie) {
                    console.warn('[SyncManager] Movie not found for watchlist sync, skipping localId:', item.id);
                    continue;
                }

                if (item.synced === 0) {
                    console.log('[SyncManager] calling supabaseService.addToWatchlist for movie:', movie.id);
                    const res: any = await supabaseService.addToWatchlist(user.id, movie);
                    console.log('[SyncManager] supabaseService.addToWatchlist result:', res);
                    const success = typeof res === 'boolean' ? res : (res?.success === true);

                    if (success) {
                        console.log('[SyncManager] supabase addToWatchlist succeeded for localId:', item.id);
                        await WatchlistService.markSynced(item.id);
                    } else {
                        console.warn('[SyncManager] supabase addToWatchlist failed for localId:', item.id, 'res:', res);
                    }
                } else {
                    console.log('[SyncManager] item already marked synced, skipping:', item.id);
                }
            }

            console.log('[SyncManager] Watchlist sync loop finished');
        } catch (error) {
            console.error('[SyncManager] Sync watchlist error:', error);
        } finally {
            this.isSyncing = false;
            console.log('[SyncManager] syncWatchlist finished');
        }
    }

    private async processSyncItem(item: LocalSyncQueue, userId: string): Promise<boolean> {
        console.log('[SyncManager] processSyncItem start for item:', item.id);
        let success = false;
        let attempt = 0;

        while (attempt < MAX_RETRY_COUNT && !success) {
            try {
                console.log(`[SyncManager] attempt ${attempt + 1} for item ${item.id}`);
                if (item.table_name === 'favorites') {
                    if (item.action === 'INSERT') {
                        const movie: any = await MovieService.getById(item.record_id);
                        if (movie) {
                            const res: any = await supabaseService.addFavorite(userId, movie);
                            console.log('[SyncManager] addFavorite response:', res);
                            success = typeof res === 'boolean' ? res : (res?.success === true);
                        } else {
                            console.warn('[SyncManager] Movie not found for favorite sync:', item.record_id);
                            success = true; // Skip if movie not found
                        }
                    } else if (item.action === 'DELETE') {
                        const res: any = await supabaseService.removeFavorite(userId, item.record_id);
                        success = typeof res === 'boolean' ? res : (res?.success === true);
                    }
                } else if (item.table_name === 'watchlist') {
                    if (item.action === 'INSERT') {
                        const movie: any = await MovieService.getById(item.record_id);
                        if (movie) {
                            const res: any = await supabaseService.addToWatchlist(userId, movie);
                            success = typeof res === 'boolean' ? res : (res?.success === true);
                        } else {
                            console.warn('[SyncManager] Movie not found for watchlist sync:', item.record_id);
                            success = true; // Skip if movie not found
                        }
                    } else if (item.action === 'DELETE') {
                        const res: any = await supabaseService.removeFromWatchlist(userId, item.record_id);
                        success = typeof res === 'boolean' ? res : (res?.success === true);
                    }
                }

                if (!success) {
                    console.warn(`[SyncManager] attempt ${attempt + 1} failed for item ${item.id}`);
                    if (attempt < MAX_RETRY_COUNT - 1) {
                        const delay = RETRY_DELAY * (attempt + 1);
                        console.log(`[SyncManager] waiting ${delay}ms before retrying item ${item.id}`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    console.log(`[SyncManager] success on attempt ${attempt + 1} for item ${item.id}`);
                }

                attempt++;
            } catch (error) {
                console.error('[SyncManager] Error processing sync item (attempt', attempt + 1, '):', error);

                if (attempt >= MAX_RETRY_COUNT - 1) {
                    // Increment retry count in database
                    try {
                        await SyncQueueService.incrementRetry(item.id);
                        console.warn('[SyncManager] Max retries reached for item:', item.id);
                    } catch (incErr) {
                        console.error('[SyncManager] Failed to increment retry count for item:', item.id, incErr);
                    }
                } else {
                    const delay = RETRY_DELAY * (attempt + 1);
                    console.log(`[SyncManager] waiting ${delay}ms after error before next attempt for item ${item.id}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                attempt++;
            }
        }

        console.log('[SyncManager] processSyncItem finished for item:', item.id, 'success:', success);
        return success;
    }

    // Pull data from Supabase to local
    async pullFromSupabase(userId: string): Promise<void> {
        console.log('[SyncManager] pullFromSupabase called for user:', userId);
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
            console.log('[SyncManager] remoteFavorites count:', remoteFavorites?.length ?? 0);
            if (remoteFavorites && remoteFavorites.length > 0) {
                for (const movie of remoteFavorites) {
                    console.log('[SyncManager] pulling favorite movie id:', movie.movie_id ?? movie.id ?? 'unknown', 'title:', movie.title);
                    // Ensure movie exists locally
                    await MovieService.upsert(movie);
                    // Add to local favorites with userId (mark as synced)
                    await FavoritesService.add(movie.movie_id ?? movie.id, userId, true);
                }
                console.log('[SyncManager] Pulled', remoteFavorites.length, 'favorites');
            } else {
                console.log('[SyncManager] No remote favorites to pull');
            }

            // Pull watchlist
            const remoteWatchlist: any = await supabaseService.getWatchlist(userId);
            console.log('[SyncManager] remoteWatchlist count:', remoteWatchlist?.length ?? 0);
            if (remoteWatchlist && remoteWatchlist.length > 0) {
                for (const movie of remoteWatchlist) {
                    console.log('[SyncManager] pulling watchlist movie id:', movie.movie_id ?? movie.id ?? 'unknown', 'title:', movie.title);
                    await MovieService.upsert(movie);
                    await WatchlistService.add(movie.movie_id ?? movie.id, userId, true);
                }
                console.log('[SyncManager] Pulled', remoteWatchlist.length, 'watchlist items');
            } else {
                console.log('[SyncManager] No remote watchlist items to pull');
            }
        } catch (error) {
            console.error('[SyncManager] Pull from Supabase error:', error);
        }
    }

    // Cleanup
    destroy(): void {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
            this.unsubscribeNetInfo = null;
        }
        console.log('[SyncManager] destroyed');
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
