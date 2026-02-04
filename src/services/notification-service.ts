/**
 * Push Notification Service
 * 
 * Provides functions to send and manage push notifications.
 */


const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushNotificationPayload {
    to: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    badge?: number;
    sound?: string;
    channelId?: string;
    priority?: 'default' | 'high';
}

export interface NotificationResponse {
    id: string;
    status: 'ok' | 'error';
    message?: string;
    details?: Record<string, unknown>;
}

/**
 * Send a push notification to a single device
 * 
 * @example
 * await notificationService.send({
 *   to: token,
 *   title: 'New Movie',
 *   body: 'A new movie has been released!',
 *   data: { type: 'movie_release', movieId: '123' }
 * });
 */
export async function sendNotification(
    payload: PushNotificationPayload
): Promise<NotificationResponse> {
    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data?.data?.[0]) {
            return data.data[0] as NotificationResponse;
        }

        if (data?.status) {
            return data as NotificationResponse;
        }

        return {
            id: '',
            status: 'error',
            message: 'Invalid response',
            details: data,
        };
    } catch (error) {
        console.error('[NotificationService] Send failed:', error);
        return {
            id: '',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send notifications to multiple devices
 */
export async function sendNotifications(
    payloads: PushNotificationPayload[]
): Promise<NotificationResponse[]> {
    const results = await Promise.all(
        payloads.map((payload) => sendNotification(payload))
    );
    return results;
}

/**
 * Send movie release notification
 */
export async function notifyMovieRelease(
    pushToken: string,
    movieId: number,
    movieTitle: string,
    releaseDate: string
): Promise<NotificationResponse> {
    return sendNotification({
        to: pushToken,
        title: '🎬 New Movie Released',
        body: `${movieTitle} is now available!`,
        data: {
            type: 'movie_release',
            movieId: movieId.toString(),
        },
        sound: 'default',
        priority: 'high',
    });
}

/**
 * Send favorite notification
 */
export async function notifyFavoriteUpdate(
    pushToken: string,
    movieTitle: string,
    isAdded: boolean
): Promise<NotificationResponse> {
    return sendNotification({
        to: pushToken,
        title: isAdded ? '❤️ Added to Favorites' : '💔 Removed from Favorites',
        body: isAdded
            ? `${movieTitle} has been added to your favorites`
            : `${movieTitle} has been removed from your favorites`,
        data: {
            type: 'favorite_update',
        },
    });
}

/**
 * Send recommendation notification
 */
export async function notifyRecommendation(
    pushToken: string,
    movieId: number,
    movieTitle: string,
    reason: string
): Promise<NotificationResponse> {
    return sendNotification({
        to: pushToken,
        title: '🔥 Recommended for You',
        body: `Because you liked ${reason}: ${movieTitle}`,
        data: {
            type: 'recommendation',
            movieId: movieId.toString(),
        },
        sound: 'default',
    });
}

/**
 * Cancel all scheduled notifications
 * Note: This is a no-op in Expo Push Notifications
 * as scheduled notifications are handled by the server
 */
export async function cancelAllNotifications(): Promise<void> {
    console.log('[NotificationService] cancelAllNotifications called');
    // In Expo Push, notifications are sent from server
    // To cancel, you would need to manage this on your backend
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
    title: string,
    body: string,
    triggerInSeconds: number
): Promise<string> {
    // For local notifications, use expo-notifications directly
    // This is a placeholder for local notification scheduling
    console.log('[NotificationService] scheduleNotification called:', { title, body, triggerInSeconds });
    return 'local-notification-id';
}

export const notificationService = {
    send: sendNotification,
    sendMultiple: sendNotifications,
    notifyMovieRelease,
    notifyFavoriteUpdate,
    notifyRecommendation,
    cancelAll: cancelAllNotifications,
    schedule: scheduleNotification,
};
