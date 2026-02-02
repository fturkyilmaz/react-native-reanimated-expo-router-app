/**
 * Notification Provider
 * 
 * React Context provider for push notifications.
 * Handles notification initialization, listeners, and navigation.
 */

import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { configureNotificationHandler, NotificationPayload } from './config';
import { NotificationService } from './service';

/**
 * Notification context state
 */
interface NotificationContextState {
    /** Whether notifications are initialized */
    isInitialized: boolean;
    /** Whether notifications are enabled */
    isEnabled: boolean;
    /** Push token */
    pushToken: string | null;
    /** Initialize notifications */
    initialize: () => Promise<boolean>;
    /** Request permissions */
    requestPermissions: () => Promise<boolean>;
    /** Schedule a notification */
    scheduleNotification: (
        payload: NotificationPayload,
        trigger?: { seconds?: number; date?: Date; repeats?: boolean }
    ) => Promise<string | null>;
    /** Schedule movie reminder */
    scheduleMovieReminder: (
        movieId: string,
        movieTitle: string,
        releaseDate: Date
    ) => Promise<string | null>;
    /** Cancel notification */
    cancelNotification: (identifier: string) => Promise<void>;
    /** Cancel all notifications */
    cancelAllNotifications: () => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextState>({
    isInitialized: false,
    isEnabled: false,
    pushToken: null,
    initialize: async () => false,
    requestPermissions: async () => false,
    scheduleNotification: async () => null,
    scheduleMovieReminder: async () => null,
    cancelNotification: async () => { },
    cancelAllNotifications: async () => { },
});

/**
 * Hook to access notification context
 */
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

/**
 * Notification Provider Props
 */
interface NotificationProviderProps {
    children: React.ReactNode;
    /** Whether to auto-initialize on mount */
    autoInitialize?: boolean;
}

/**
 * Notification Provider Component
 */
export function NotificationProvider({
    children,
    autoInitialize = true,
}: NotificationProviderProps) {
    const router = useRouter();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [pushToken, setPushToken] = useState<string | null>(null);

    const service = NotificationService.getInstance();

    /**
     * Initialize notifications
     */
    const initialize = useCallback(async (): Promise<boolean> => {
        // Configure notification handler
        configureNotificationHandler();

        const success = await service.initialize();

        if (success) {
            setIsInitialized(true);
            setIsEnabled(true);
            setPushToken(service.getPushToken());
        }

        return success;
    }, [service]);

    /**
     * Request permissions
     */
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        const granted = await service.requestPermissions();

        if (granted) {
            setIsEnabled(true);
            // Re-initialize to get push token
            await initialize();
        }

        return granted;
    }, [service, initialize]);

    /**
     * Schedule notification
     */
    const scheduleNotification = useCallback(
        async (
            payload: NotificationPayload,
            trigger?: { seconds?: number; date?: Date; repeats?: boolean }
        ): Promise<string | null> => {
            return service.scheduleNotification(payload, trigger);
        },
        [service]
    );

    /**
     * Schedule movie reminder
     */
    const scheduleMovieReminder = useCallback(
        async (
            movieId: string,
            movieTitle: string,
            releaseDate: Date
        ): Promise<string | null> => {
            return service.scheduleMovieReminder(movieId, movieTitle, releaseDate);
        },
        [service]
    );

    /**
     * Cancel notification
     */
    const cancelNotification = useCallback(
        async (identifier: string): Promise<void> => {
            await service.cancelNotification(identifier);
        },
        [service]
    );

    /**
     * Cancel all notifications
     */
    const cancelAllNotifications = useCallback(async (): Promise<void> => {
        await service.cancelAllNotifications();
    }, [service]);

    /**
     * Handle notification response (user tapped notification)
     */
    const handleNotificationResponse = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response: any) => {
            const data = response.notification.request.content.data;

            console.log('[NotificationProvider] Notification tapped:', data);

            // Navigate based on notification type
            if (data.movieId) {
                router.push(`/(movies)/${data.movieId}`);
            } else if (data.url) {
                // Handle deep link URL
                router.push(data.url);
            }
        },
        [router]
    );

    // Auto-initialize on mount
    useEffect(() => {
        if (autoInitialize) {
            initialize();
        }
    }, [autoInitialize, initialize]);

    // Setup notification listeners
    useEffect(() => {
        if (!isInitialized) return;

        // Listen for incoming notifications
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notificationListener: any = null; // Placeholder - would use Notifications.addNotificationReceivedListener

        // Listen for notification responses
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseListener: any = null; // Placeholder - would use Notifications.addNotificationResponseReceivedListener

        return () => {
            // Cleanup listeners
            if (notificationListener) {
                notificationListener.remove();
            }
            if (responseListener) {
                responseListener.remove();
            }
        };
    }, [isInitialized]);

    const contextValue: NotificationContextState = {
        isInitialized,
        isEnabled,
        pushToken,
        initialize,
        requestPermissions,
        scheduleNotification,
        scheduleMovieReminder,
        cancelNotification,
        cancelAllNotifications,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export default NotificationProvider;
