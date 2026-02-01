/**
 * Notification Service Tests
 */

import { NotificationCategory } from '@/notifications/config';
import { NotificationService, notificationService } from '@/notifications/service';

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        service = NotificationService.getInstance();
    });

    describe('Singleton', () => {
        it('should return same instance', () => {
            const instance1 = NotificationService.getInstance();
            const instance2 = NotificationService.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should export singleton', () => {
            expect(notificationService).toBe(NotificationService.getInstance());
        });
    });

    describe('Initialization', () => {
        it('should initialize', async () => {
            const result = await service.initialize();
            expect(typeof result).toBe('boolean');
        });

        it('should return true when already initialized', async () => {
            await service.initialize();
            const result = await service.initialize();
            expect(result).toBe(true);
        });
    });

    describe('Permissions', () => {
        it('should request permissions', async () => {
            const result = await service.requestPermissions();
            expect(typeof result).toBe('boolean');
        });

        it('should get permission status', async () => {
            const status = await service.getPermissionStatus();
            expect(['granted', 'denied', 'undetermined']).toContain(status);
        });
    });

    describe('Push Token', () => {
        it('should get push token (null on simulator)', () => {
            const token = service.getPushToken();
            // On simulator, this will be null
            expect(token === null || typeof token === 'string').toBe(true);
        });
    });

    describe('Local Notifications', () => {
        it('should schedule notification', async () => {
            const identifier = await service.scheduleNotification({
                title: 'Test',
                body: 'Test body',
                data: { type: NotificationCategory.SYSTEM },
            });

            // May be null if permissions not granted
            expect(identifier === null || typeof identifier === 'string').toBe(true);
        });

        it('should schedule notification with trigger', async () => {
            const identifier = await service.scheduleNotification(
                {
                    title: 'Test',
                    body: 'Test body',
                    data: { type: NotificationCategory.REMINDER },
                },
                { seconds: 60 }
            );

            expect(identifier === null || typeof identifier === 'string').toBe(true);
        });

        it('should schedule movie reminder', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const identifier = await service.scheduleMovieReminder(
                '123',
                'Test Movie',
                futureDate
            );

            expect(identifier === null || typeof identifier === 'string').toBe(true);
        });

        it('should not schedule reminder for past date', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const identifier = await service.scheduleMovieReminder(
                '123',
                'Test Movie',
                pastDate
            );

            expect(identifier).toBeNull();
        });
    });

    describe('Cancel Notifications', () => {
        it('should cancel notification', async () => {
            // Should not throw
            await expect(service.cancelNotification('test-id')).resolves.not.toThrow();
        });

        it('should cancel all notifications', async () => {
            // Should not throw
            await expect(service.cancelAllNotifications()).resolves.not.toThrow();
        });
    });

    describe('Scheduled Notifications', () => {
        it('should get scheduled notifications', async () => {
            const notifications = await service.getScheduledNotifications();
            expect(Array.isArray(notifications)).toBe(true);
        });
    });

    describe('Badge', () => {
        it('should set badge count', async () => {
            // Should not throw
            await expect(service.setBadgeCount(5)).resolves.not.toThrow();
        });

        it('should clear badge', async () => {
            // Should not throw
            await expect(service.clearBadge()).resolves.not.toThrow();
        });
    });

    describe('Notification Status', () => {
        it('should check if notifications are enabled', async () => {
            const enabled = await service.areNotificationsEnabled();
            expect(typeof enabled).toBe('boolean');
        });
    });
});
