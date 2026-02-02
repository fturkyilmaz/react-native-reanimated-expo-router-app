/**
 * Push Notifications Configuration
 * 
 * Defines notification categories, permissions, and default settings.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications = require('expo-notifications');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = any;

/**
 * Notification categories
 */
export enum NotificationCategory {
    NEW_MOVIE = 'new_movie',
    FAVORITE_UPDATE = 'favorite_update',
    RECOMMENDATION = 'recommendation',
    SYSTEM = 'system',
    REMINDER = 'reminder',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
    HIGH = 'high',
    DEFAULT = 'default',
    LOW = 'low',
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
    /** Whether notifications are enabled */
    enabled: boolean;
    /** Enabled categories */
    categories: NotificationCategory[];
    /** Quiet hours (24h format) */
    quietHours: {
        enabled: boolean;
        start: number; // 0-23
        end: number; // 0-23
    };
}

/**
 * Default notification configuration
 */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
    enabled: true,
    categories: [
        NotificationCategory.NEW_MOVIE,
        NotificationCategory.FAVORITE_UPDATE,
        NotificationCategory.RECOMMENDATION,
        NotificationCategory.SYSTEM,
    ],
    quietHours: {
        enabled: false,
        start: 22, // 10 PM
        end: 8,    // 8 AM
    },
};

/**
 * Notification payload structure
 */
export interface NotificationPayload {
    title: string;
    body: string;
    data?: {
        type: NotificationCategory;
        movieId?: string;
        url?: string;
        action?: string;
    };
    category?: NotificationCategory;
    priority?: NotificationPriority;
}

/**
 * Configure notification handler
 */
export function configureNotificationHandler(): void {
    Notifications.setNotificationHandler({
        handleNotification: async (notification: Notification) => {
            const data = notification.request.content.data;

            // Check quiet hours
            if (isQuietHours()) {
                return {
                    shouldShowAlert: false,
                    shouldPlaySound: false,
                    shouldSetBadge: false,
                };
            }

            // Determine presentation based on category
            const category = data?.type as NotificationCategory;
            const priority = getCategoryPriority(category);

            return {
                shouldShowAlert: priority !== NotificationPriority.LOW,
                shouldPlaySound: priority === NotificationPriority.HIGH,
                shouldSetBadge: true,
            };
        },
    });
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(): boolean {
    const config = DEFAULT_NOTIFICATION_CONFIG;

    if (!config.quietHours.enabled) {
        return false;
    }

    const now = new Date();
    const hour = now.getHours();
    const { start, end } = config.quietHours;

    if (start < end) {
        return hour >= start && hour < end;
    } else {
        // Handles overnight quiet hours (e.g., 22:00 - 08:00)
        return hour >= start || hour < end;
    }
}

/**
 * Get priority for a notification category
 */
function getCategoryPriority(category?: NotificationCategory): NotificationPriority {
    switch (category) {
        case NotificationCategory.NEW_MOVIE:
        case NotificationCategory.FAVORITE_UPDATE:
            return NotificationPriority.HIGH;
        case NotificationCategory.RECOMMENDATION:
            return NotificationPriority.DEFAULT;
        case NotificationCategory.SYSTEM:
        case NotificationCategory.REMINDER:
        default:
            return NotificationPriority.LOW;
    }
}

/**
 * Android notification channels
 */
export const ANDROID_CHANNELS = {
    HIGH_PRIORITY: {
        id: 'high-priority',
        name: 'High Priority',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Important notifications about your favorite movies',
    },
    DEFAULT: {
        id: 'default',
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'General notifications and recommendations',
    },
    LOW_PRIORITY: {
        id: 'low-priority',
        name: 'Low Priority',
        importance: Notifications.AndroidImportance.LOW,
        description: 'System notifications and updates',
    },
};

/**
 * Setup Android notification channels
 */
export async function setupAndroidChannels(): Promise<void> {
    for (const channel of Object.values(ANDROID_CHANNELS)) {
        await Notifications.setNotificationChannelAsync(channel.id, {
            name: channel.name,
            importance: channel.importance,
            description: channel.description,
            vibrationPattern: channel.importance === Notifications.AndroidImportance.HIGH
                ? [0, 250, 250, 250]
                : undefined,
            lightColor: '#E50914',
        });
    }
}

/**
 * Get channel ID for a category
 */
export function getChannelIdForCategory(category?: NotificationCategory): string {
    const priority = getCategoryPriority(category);

    switch (priority) {
        case NotificationPriority.HIGH:
            return ANDROID_CHANNELS.HIGH_PRIORITY.id;
        case NotificationPriority.LOW:
            return ANDROID_CHANNELS.LOW_PRIORITY.id;
        default:
            return ANDROID_CHANNELS.DEFAULT.id;
    }
}

export default DEFAULT_NOTIFICATION_CONFIG;
