/**
 * Notification Service
 * 
 * Handles push notification registration, scheduling, and management.
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications = require('expo-notifications');

import { NotificationCategory, NotificationPayload, setupAndroidChannels } from './config';

/**
 * Notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Notification service class
 */
export class NotificationService {
    private static instance: NotificationService;
    private pushToken: string | null = null;
    private isInitialized = false;

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Initialize notification service
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Request permissions
            const hasPermission = await this.requestPermissions();

            if (!hasPermission) {
                console.log('[Notifications] Permission denied');
                return false;
            }

            // Get push token
            await this.registerForPushNotifications();

            // Setup Android channels
            if (Platform.OS === 'android') {
                await setupAndroidChannels();
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('[Notifications] Initialization error:', error);
            return false;
        }
    }

    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.error('[Notifications] Error requesting permissions:', error);
            return false;
        }
    }

    /**
     * Check current permission status
     */
    async getPermissionStatus(): Promise<NotificationPermissionStatus> {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            return status as NotificationPermissionStatus;
        } catch (error) {
            console.error('[Notifications] Error getting permission status:', error);
            return 'undetermined';
        }
    }

    /**
     * Register for push notifications
     */
    private async registerForPushNotifications(): Promise<void> {
        if (!Device.isDevice) {
            console.log('[Notifications] Push notifications not available on simulator');
            return;
        }

        try {
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
            });

            this.pushToken = token.data;
            console.log('[Notifications] Push token:', this.pushToken);
        } catch (error) {
            console.error('[Notifications] Error getting push token:', error);
        }
    }

    /**
     * Get current push token
     */
    getPushToken(): string | null {
        return this.pushToken;
    }

    /**
     * Schedule a local notification
     */
    async scheduleNotification(
        payload: NotificationPayload,
        trigger?: { seconds?: number; date?: Date; repeats?: boolean }
    ): Promise<string | null> {
        try {
            const notificationTrigger = trigger?.date
                ? { date: trigger.date }
                : trigger?.seconds
                    ? { seconds: trigger.seconds, repeats: trigger.repeats || false }
                    : null;

            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: payload.title,
                    body: payload.body,
                    data: payload.data || {},
                    categoryIdentifier: payload.category || NotificationCategory.SYSTEM,
                },
                trigger: notificationTrigger,
            });

            console.log('[Notifications] Scheduled notification:', identifier);
            return identifier;
        } catch (error) {
            console.error('[Notifications] Error scheduling notification:', error);
            return null;
        }
    }

    /**
     * Schedule a movie reminder
     */
    async scheduleMovieReminder(
        movieId: string,
        movieTitle: string,
        releaseDate: Date
    ): Promise<string | null> {
        // Schedule for 9 AM on release date
        const reminderDate = new Date(releaseDate);
        reminderDate.setHours(9, 0, 0, 0);

        // If date is in the past, don't schedule
        if (reminderDate < new Date()) {
            console.log('[Notifications] Release date is in the past, not scheduling');
            return null;
        }

        return this.scheduleNotification(
            {
                title: `${movieTitle} çıktı! 🎬`,
                body: 'İzlemek için hemen uygulamayı açın.',
                data: {
                    type: NotificationCategory.REMINDER,
                    movieId,
                },
                category: NotificationCategory.REMINDER,
            },
            { date: reminderDate }
        );
    }

    /**
     * Cancel a scheduled notification
     */
    async cancelNotification(identifier: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
            console.log('[Notifications] Cancelled notification:', identifier);
        } catch (error) {
            console.error('[Notifications] Error cancelling notification:', error);
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log('[Notifications] Cancelled all notifications');
        } catch (error) {
            console.error('[Notifications] Error cancelling all notifications:', error);
        }
    }

    /**
     * Get all scheduled notifications
     */
    async getScheduledNotifications(): Promise<unknown[]> {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('[Notifications] Error getting scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        try {
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('[Notifications] Error setting badge count:', error);
        }
    }

    /**
     * Clear badge
     */
    async clearBadge(): Promise<void> {
        await this.setBadgeCount(0);
    }

    /**
     * Check if notifications are enabled
     */
    async areNotificationsEnabled(): Promise<boolean> {
        const status = await this.getPermissionStatus();
        return status === 'granted';
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

export default notificationService;
