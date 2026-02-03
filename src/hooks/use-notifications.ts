/**
 * Push Notifications Hook
 * 
 * Provides functionality for managing push notifications.
 * 
 * Usage:
 * const { token, requestPermission, handleNotification } = useNotifications();
 */

import * as Device from 'expo-device';
import {
    addNotificationReceivedListener,
    getExpoPushTokenAsync,
    getPermissionsAsync,
    Notification,
    NotificationBehavior,
    NotificationResponse,
    requestPermissionsAsync,
    setNotificationCategoryAsync,
    setNotificationHandler,
} from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface UseNotificationsReturn {
    token: string | null;
    permissionStatus: PermissionStatus;
    requestPermission: () => Promise<boolean>;
    handleNotification: (notification: Notification) => void;
    handleNotificationResponse: (response: NotificationResponse) => void;
    lastNotification: Notification | null;
}

/**
 * Hook to manage push notifications
 * 
 * @example
 * const { token, requestPermission } = useNotifications();
 * 
 * useEffect(() => {
 *   if (!token) {
 *     requestPermission();
 *   }
 * }, [token]);
 */
export function useNotifications(): UseNotificationsReturn {
    const [token, setToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
    const [lastNotification, setLastNotification] = useState<Notification | null>(null);
    const handleNotificationRef = useRef<(notification: Notification) => void>(() => { });

    // Get initial permission status
    useEffect(() => {
        checkPermissionStatus();
    }, []);

    // Register for push notifications
    useEffect(() => {
        if (permissionStatus !== 'granted') return;

        registerForPushNotifications().then((pushToken) => {
            if (pushToken) {
                setToken(pushToken);
                console.log('[Notifications] Token received:', pushToken);
            }
        });
    }, [permissionStatus]);

    // Listen for notifications
    useEffect(() => {
        const subscription = addNotificationReceivedListener((notification) => {
            setLastNotification(notification);
            handleNotificationRef.current(notification);
        });

        return () => subscription.remove();
    }, []);

    const checkPermissionStatus = async () => {
        if (!Device.isDevice) {
            console.log('[Notifications] Must use physical device');
            return;
        }

        const { status } = await getPermissionsAsync();
        setPermissionStatus(status as PermissionStatus);
    };

    const requestPermission = async (): Promise<boolean> => {
        if (!Device.isDevice) {
            console.log('[Notifications] Must use physical device');
            return false;
        }

        try {
            const { status } = await requestPermissionsAsync();
            setPermissionStatus(status as PermissionStatus);

            if (status === 'granted') {
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                    setToken(pushToken);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('[Notifications] Permission error:', error);
            return false;
        }
    };

    const registerForPushNotifications = async (): Promise<string | null> => {
        try {
            const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;

            if (!projectId) {
                console.warn('[Notifications] Project ID not found');
                return null;
            }

            const pushToken = await getExpoPushTokenAsync({
                projectId,
            });

            return pushToken.data;
        } catch (error) {
            console.error('[Notifications] Token registration failed:', error);
            return null;
        }
    };

    const handleNotification = useCallback((notification: Notification) => {
        handleNotificationRef.current = notification => {
            console.log('[Notifications] Received:', notification.request.content.title);

            // Handle notification based on data
            const data = notification.request.content.data as { type?: string; movieId?: number } | undefined;
            if (data?.type === 'movie_release') {
                // Navigate to movie detail
                console.log('[Notifications] Navigate to movie:', data.movieId);
            }
        };
    }, []);

    const handleNotificationResponse = useCallback((response: NotificationResponse) => {
        console.log('[Notifications] User interacted:', response.notification.request.content.title);

        const data = response.notification.request.content.data as { type?: string; movieId?: number } | undefined;
        if (data?.type === 'movie_release') {
            // Navigate to movie detail
            console.log('[Notifications] Navigate to movie:', data.movieId);
        }
    }, []);

    return {
        token,
        permissionStatus,
        requestPermission,
        handleNotification,
        handleNotificationResponse,
        lastNotification,
    };
}

/**
 * Hook to manage notification categories (action buttons)
 */
export function useNotificationCategories() {
    useEffect(() => {
        const categories = [
            {
                identifier: 'movie_release',
                actions: [
                    {
                        identifier: 'view',
                        buttonTitle: 'View Movie',
                        options: { opensAppToForeground: false },
                    },
                    {
                        identifier: 'dismiss',
                        buttonTitle: 'Dismiss',
                        options: { opensAppToForeground: false },
                    },
                ],
            },
            {
                identifier: 'general',
                actions: [
                    {
                        identifier: 'open',
                        buttonTitle: 'Open',
                        options: { opensAppToForeground: true },
                    },
                    {
                        identifier: 'dismiss',
                        buttonTitle: 'Dismiss',
                        options: { opensAppToForeground: false },
                    },
                ],
            },
        ];

        categories.forEach(async (category) => {
            try {
                await setNotificationCategoryAsync(category.identifier, category.actions);
            } catch (error) {
                console.error('[Notifications] Category setup failed:', error);
            }
        });
    }, []);
}

/**
 * Hook to manage notification behaviors
 */
export function useNotificationBehavior() {
    useEffect(() => {
        setNotificationHandler({
            handleNotification: async (): Promise<NotificationBehavior> => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }, []);
}

export type { UseNotificationsReturn };
