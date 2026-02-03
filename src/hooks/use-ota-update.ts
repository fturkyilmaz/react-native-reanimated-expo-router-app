/**
 * EAS Update Hook
 * 
 * Provides functionality to check for and download OTA updates.
 * 
 * Usage:
 * const { isUpdateAvailable, checkForUpdates, applyUpdate } = useOTAUpdate();
 */

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';

type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error';

interface UseOTAUpdateReturn {
    status: UpdateStatus;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    currentVersion: string;
    checkForUpdates: () => Promise<void>;
    applyUpdate: () => Promise<void>;
    error: string | null;
}

/**
 * Hook to manage EAS OTA updates
 * 
 * @example
 * const { isUpdateAvailable, checkForUpdates, applyUpdate } = useOTAUpdate();
 * 
 * // Check for updates on mount
 * useEffect(() => {
 *   checkForUpdates();
 * }, []);
 * 
 * // Show update dialog
 * if (isUpdateAvailable) {
 *   Alert.alert(
 *     'Update Available',
 *     'A new version is available. Update now?',
 *     [
 *       { text: 'Later', style: 'cancel' },
 *       { text: 'Update', onPress: applyUpdate }
 *     ]
 *   );
 * }
 */
export function useOTAUpdate(): UseOTAUpdateReturn {
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [isUpdatePending, setIsUpdatePending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentVersion = Application.nativeApplicationVersion || '1.0.0';
    const checkForUpdatesRef = useRef<() => Promise<void> | null>(null);

    useEffect(() => {
        if (!__DEV__) {
            checkForUpdatesRef.current?.();
        }
    }, []);

    const checkForUpdates = useCallback(async () => {
        checkForUpdatesRef.current = async () => {
            if (__DEV__) {
                console.log('[OTA] Skipping update check in development mode');
                return;
            }

            try {
                setStatus('checking');
                setError(null);

                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    console.log('[OTA] Update available');
                    setIsUpdateAvailable(true);
                    setStatus('idle');
                } else {
                    console.log('[OTA] No update available');
                    setIsUpdateAvailable(false);
                    setStatus('idle');
                }
            } catch (err) {
                console.error('[OTA] Check failed:', err);
                setError(err instanceof Error ? err.message : 'Failed to check for updates');
                setStatus('error');
            }
        };
    }, []);

    const applyUpdate = useCallback(async () => {
        try {
            setStatus('downloading');
            setError(null);

            await Updates.fetchUpdateAsync();

            setIsUpdatePending(true);
            setStatus('ready');

            // Reload to apply the update
            await Updates.reloadAsync();
        } catch (err) {
            console.error('[OTA] Download failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to download update');
            setStatus('error');
        }
    }, []);

    return {
        status,
        isUpdateAvailable,
        isUpdatePending,
        currentVersion,
        checkForUpdates,
        applyUpdate,
        error,
    };
}

/**
 * Hook for automatic update checking
 */
export function useAutoUpdate(options?: {
    checkOnMount?: boolean;
    checkInterval?: number;
}) {
    const { checkOnMount = true, checkInterval } = options || {};
    const { checkForUpdates, isUpdateAvailable, status } = useOTAUpdate();

    useEffect(() => {
        if (checkOnMount) {
            checkForUpdates();
        }
    }, [checkOnMount, checkForUpdates]);

    useEffect(() => {
        if (!checkInterval) return;

        const interval = setInterval(() => {
            checkForUpdates();
        }, checkInterval);

        return () => clearInterval(interval);
    }, [checkInterval, checkForUpdates]);

    return {
        isUpdateAvailable,
        status,
        checkForUpdates,
    };
}

export type { UseOTAUpdateReturn };
