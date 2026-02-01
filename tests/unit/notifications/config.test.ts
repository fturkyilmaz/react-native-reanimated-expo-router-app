/**
 * Notifications Config Tests
 */

import {
    ANDROID_CHANNELS,
    DEFAULT_NOTIFICATION_CONFIG,
    NotificationCategory,
    NotificationPriority,
    configureNotificationHandler,
    getChannelIdForCategory,
    setupAndroidChannels,
} from '@/notifications/config';

describe('Notifications Config', () => {
    describe('Enums', () => {
        it('should have NEW_MOVIE category', () => {
            expect(NotificationCategory.NEW_MOVIE).toBe('new_movie');
        });

        it('should have FAVORITE_UPDATE category', () => {
            expect(NotificationCategory.FAVORITE_UPDATE).toBe('favorite_update');
        });

        it('should have RECOMMENDATION category', () => {
            expect(NotificationCategory.RECOMMENDATION).toBe('recommendation');
        });

        it('should have SYSTEM category', () => {
            expect(NotificationCategory.SYSTEM).toBe('system');
        });

        it('should have REMINDER category', () => {
            expect(NotificationCategory.REMINDER).toBe('reminder');
        });

        it('should have HIGH priority', () => {
            expect(NotificationPriority.HIGH).toBe('high');
        });

        it('should have DEFAULT priority', () => {
            expect(NotificationPriority.DEFAULT).toBe('default');
        });

        it('should have LOW priority', () => {
            expect(NotificationPriority.LOW).toBe('low');
        });
    });

    describe('Default Config', () => {
        it('should have enabled set to true', () => {
            expect(DEFAULT_NOTIFICATION_CONFIG.enabled).toBe(true);
        });

        it('should have categories array', () => {
            expect(Array.isArray(DEFAULT_NOTIFICATION_CONFIG.categories)).toBe(true);
            expect(DEFAULT_NOTIFICATION_CONFIG.categories.length).toBeGreaterThan(0);
        });

        it('should include NEW_MOVIE in categories', () => {
            expect(DEFAULT_NOTIFICATION_CONFIG.categories).toContain(
                NotificationCategory.NEW_MOVIE
            );
        });

        it('should have quiet hours config', () => {
            expect(DEFAULT_NOTIFICATION_CONFIG.quietHours).toHaveProperty('enabled');
            expect(DEFAULT_NOTIFICATION_CONFIG.quietHours).toHaveProperty('start');
            expect(DEFAULT_NOTIFICATION_CONFIG.quietHours).toHaveProperty('end');
        });

        it('should have quiet hours disabled by default', () => {
            expect(DEFAULT_NOTIFICATION_CONFIG.quietHours.enabled).toBe(false);
        });
    });

    describe('Android Channels', () => {
        it('should have HIGH_PRIORITY channel', () => {
            expect(ANDROID_CHANNELS.HIGH_PRIORITY).toBeDefined();
            expect(ANDROID_CHANNELS.HIGH_PRIORITY.id).toBe('high-priority');
        });

        it('should have DEFAULT channel', () => {
            expect(ANDROID_CHANNELS.DEFAULT).toBeDefined();
            expect(ANDROID_CHANNELS.DEFAULT.id).toBe('default');
        });

        it('should have LOW_PRIORITY channel', () => {
            expect(ANDROID_CHANNELS.LOW_PRIORITY).toBeDefined();
            expect(ANDROID_CHANNELS.LOW_PRIORITY.id).toBe('low-priority');
        });

        it('should have valid channel structure', () => {
            const channel = ANDROID_CHANNELS.DEFAULT;
            expect(channel).toHaveProperty('id');
            expect(channel).toHaveProperty('name');
            expect(channel).toHaveProperty('importance');
            expect(channel).toHaveProperty('description');
        });
    });

    describe('getChannelIdForCategory', () => {
        it('should return high priority channel for NEW_MOVIE', () => {
            const channelId = getChannelIdForCategory(NotificationCategory.NEW_MOVIE);
            expect(channelId).toBe(ANDROID_CHANNELS.HIGH_PRIORITY.id);
        });

        it('should return high priority channel for FAVORITE_UPDATE', () => {
            const channelId = getChannelIdForCategory(NotificationCategory.FAVORITE_UPDATE);
            expect(channelId).toBe(ANDROID_CHANNELS.HIGH_PRIORITY.id);
        });

        it('should return default channel for RECOMMENDATION', () => {
            const channelId = getChannelIdForCategory(NotificationCategory.RECOMMENDATION);
            expect(channelId).toBe(ANDROID_CHANNELS.DEFAULT.id);
        });

        it('should return low priority channel for SYSTEM', () => {
            const channelId = getChannelIdForCategory(NotificationCategory.SYSTEM);
            expect(channelId).toBe(ANDROID_CHANNELS.LOW_PRIORITY.id);
        });

        it('should return low priority channel for REMINDER', () => {
            const channelId = getChannelIdForCategory(NotificationCategory.REMINDER);
            expect(channelId).toBe(ANDROID_CHANNELS.LOW_PRIORITY.id);
        });

        it('should return default channel for undefined', () => {
            const channelId = getChannelIdForCategory(undefined);
            expect(channelId).toBe(ANDROID_CHANNELS.DEFAULT.id);
        });
    });

    describe('configureNotificationHandler', () => {
        it('should be a function', () => {
            expect(typeof configureNotificationHandler).toBe('function');
        });
    });

    describe('setupAndroidChannels', () => {
        it('should be a function', () => {
            expect(typeof setupAndroidChannels).toBe('function');
        });
    });
});
