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
                this.isSyncing = false;
                return;
            }

            // Get all pending sync items
            const pendingItems = await SyncQueueService.getAll();

            for (const item of pendingItems) {
                await this.processSyncItem(item, user.id);
            }

            // Remove synced items
            const syncedIds = pendingItems.map((item: any) => item.id);
            if (syncedIds.length > 0) {
                for (const id of syncedIds) {
                    await SyncQueueService.remove(id);
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

        } catch (error) {
            console.error('Sync watchlist error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processSyncItem(item: LocalSyncQueue, userId: string): Promise<void> {
        try {
            if (item.table_name === 'favorites') {
                if (item.action === 'INSERT') {
                    const movie: any = await MovieService.getById(item.record_id);
                    if (movie) {
                        await supabaseService.addFavorite(userId, movie);
                    }
                } else if (item.action === 'DELETE') {
                    await supabaseService.removeFavorite(userId, item.record_id);
                }
            } else if (item.table_name === 'watchlist') {
                if (item.action === 'INSERT') {
                    const movie: any = await MovieService.getById(item.record_id);
                    if (movie) {
                        await supabaseService.addToWatchlist(userId, movie);
                    }
                } else if (item.action === 'DELETE') {
                    await supabaseService.removeFromWatchlist(userId, item.record_id);
                }
            }
        } catch (error) {
            console.error('Error processing sync item:', error);
            throw error;
        }
    }

    // Pull data from Supabase to local
    async pullFromSupabase(userId: string): Promise<void> {
        if (!this.isOnline) return;

        try {
            // Pull favorites
            const remoteFavorites: any = await supabaseService.getFavorites(userId);
            if (remoteFavorites && remoteFavorites.length > 0) {
                for (const movie of remoteFavorites) {
                    await MovieService.upsert(movie);
                    await FavoritesService.add(movie.id, userId);
                }
            }

            // Pull watchlist
            const remoteWatchlist: any = await supabaseService.getWatchlist(userId);
            if (remoteWatchlist && remoteWatchlist.length > 0) {
                for (const movie of remoteWatchlist) {
                    await MovieService.upsert(movie);
                    await WatchlistService.add(movie.id, userId);
                }
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
