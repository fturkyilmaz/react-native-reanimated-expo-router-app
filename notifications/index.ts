/**
 * Notifications Module
 * 
 * Centralized exports for push notification functionality.
 */

// Configuration
export {
    ANDROID_CHANNELS, configureNotificationHandler, DEFAULT_NOTIFICATION_CONFIG, getChannelIdForCategory, NotificationCategory,
    NotificationPriority, setupAndroidChannels
} from './config';
export type {
    NotificationConfig,
    NotificationPayload
} from './config';

// Service
export {
    NotificationService,
    notificationService
} from './service';
export type {
    NotificationPermissionStatus
} from './service';

// Provider
export {
    NotificationProvider,
    useNotifications
} from './provider';

// Default export
export { default } from './provider';
