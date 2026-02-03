/**
 * Network Status Hook
 * 
 * Integrates @react-native-community/netinfo with TanStack Query's onlineManager
 * to provide automatic online/offline detection and mutation queue processing.
 */

import { mutationQueue } from '@/core/services/offline-cache';
import NetInfo, { type NetInfoState, type NetInfoSubscription } from '@react-native-community/netinfo';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// Mutation type definitions
const MUTATION_HANDLERS: Record<string, (variables: unknown) => Promise<unknown>> = {
    'TOGGLE_FAVORITE': async (variables) => {
        console.log('[MutationQueue] Processing TOGGLE_FAVORITE:', variables);
        return { success: true };
    },
    'ADD_FAVORITE': async (variables) => {
        console.log('[MutationQueue] Processing ADD_FAVORITE:', variables);
        return { success: true };
    },
    'REMOVE_FAVORITE': async (variables) => {
        console.log('[MutationQueue] Processing REMOVE_FAVORITE:', variables);
        return { success: true };
    },
};

/**
 * Process all pending mutations in the queue
 */
async function processMutationQueue(): Promise<void> {
    try {
        const queueSize = await mutationQueue.getQueueSize();
        if (queueSize === 0) {
            console.log('[NetworkStatus] No pending mutations');
            return;
        }

        console.log(`[NetworkStatus] Processing ${queueSize} pending mutations`);

        let processed = 0;
        let failed = 0;

        while (true) {
            const mutation = await mutationQueue.dequeue();
            if (!mutation) break;

            try {
                const handler = MUTATION_HANDLERS[mutation.type];
                if (handler) {
                    const variables = JSON.parse(mutation.variables);
                    await handler(variables);
                    await mutationQueue.remove(mutation.id);
                    processed++;
                } else {
                    console.warn(`[NetworkStatus] No handler for mutation type: ${mutation.type}`);
                    await mutationQueue.remove(mutation.id);
                }
            } catch (error) {
                console.error(`[NetworkStatus] Mutation failed:`, error);

                if (mutation.retryCount >= 3) {
                    await mutationQueue.remove(mutation.id);
                    failed++;
                } else {
                    await mutationQueue.incrementRetry(mutation.id);
                    failed++;
                }
            }
        }

        console.log(`[NetworkStatus] Queue processed: ${processed} success, ${failed} failed`);

        if (failed > 0) {
            console.warn(`[NetworkStatus] ${failed} mutations failed after retries`);
        }
    } catch (error) {
        console.error('[NetworkStatus] Error processing queue:', error);
    }
}

/**
 * Hook to monitor network status and manage offline/online state
 */
export function useNetworkStatus() {
    const queryClient = useQueryClient();
    const previousState = useRef<boolean | null>(null);
    const networkSubscription = useRef<NetInfoSubscription | null>(null);

    useEffect(() => {
        // Set up React Query online manager
        onlineManager.setEventListener((setOnline) => {
            return NetInfo.addEventListener((state: NetInfoState) => {
                const isOnline = !!state.isConnected;
                setOnline(isOnline);
            });
        });

        // Listen for network state changes
        networkSubscription.current = NetInfo.addEventListener(async (state: NetInfoState) => {
            const isOnline = !!state.isConnected;

            if (previousState.current !== isOnline) {
                previousState.current = isOnline;

                if (isOnline) {
                    console.log('[NetworkStatus] Network online - processing queue');
                    await processMutationQueue();
                    await queryClient.refetchQueries({ stale: true });
                    console.log('[NetworkStatus] All queries refetched');
                } else {
                    console.log('[NetworkStatus] Network offline - mutations queued');
                }
            }
        });

        // Initial network check
        NetInfo.fetch().then(async (state: NetInfoState) => {
            const isOnline = !!state.isConnected;
            onlineManager.setOnline(isOnline);
            previousState.current = isOnline;

            if (isOnline) {
                await processMutationQueue();
            }
        });

        return () => {
            if (networkSubscription.current) {
                networkSubscription.current();
            }
        };
    }, [queryClient]);
}

/**
 * Hook to get current network status
 */
export function useNetworkInfo() {
    const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

    useEffect(() => {
        NetInfo.fetch().then(setNetworkState);
        const subscription = NetInfo.addEventListener(setNetworkState);
        return () => subscription();
    }, []);

    return {
        isOnline: networkState?.isConnected ?? false,
        isConnected: networkState?.isConnected ?? false,
        isInternetReachable: networkState?.isInternetReachable ?? false,
        type: networkState?.type ?? 'unknown',
        details: networkState?.details ?? null,
    };
}

/**
 * Hook to enqueue mutations when offline
 */
export function useOfflineMutation<T>(
    mutationType: string,
    handler: (variables: T) => Promise<unknown>
) {
    const { isOnline } = useNetworkInfo();

    const mutate = useCallback(
        async (variables: T): Promise<{ queued: boolean; result?: unknown }> => {
            if (!isOnline) {
                await mutationQueue.enqueue(mutationType, variables);
                console.log(`[OfflineMutation] Queued: ${mutationType}`);
                return { queued: true };
            }

            try {
                const result = await handler(variables);
                return { queued: false, result };
            } catch (error) {
                console.error(`[OfflineMutation] Mutation failed:`, error);
                throw error;
            }
        },
        [mutationType, handler, isOnline]
    );

    return { mutate, isOnline };
}

/**
 * Hook to check and display offline banner
 */
export function useOfflineBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [offlineCount, setOfflineCount] = useState(0);

    useEffect(() => {
        const subscription = NetInfo.addEventListener((state: NetInfoState) => {
            const isOffline = !state.isConnected;
            setShowBanner(isOffline);

            if (isOffline) {
                mutationQueue.getQueueSize().then(setOfflineCount);
            } else {
                setOfflineCount(0);
            }
        });

        NetInfo.fetch().then((state: NetInfoState) => {
            setShowBanner(!state.isConnected);
        });

        return () => subscription();
    }, []);

    return { showBanner, offlineCount, hasPendingMutations: offlineCount > 0 };
}

// Type exports
export type { NetInfoState, NetInfoSubscription };
