/**
 * Unit Tests for Notification Service
 */

import {
    notifyFavoriteUpdate,
    notifyMovieRelease,
    notifyRecommendation,
    sendNotification,
    sendNotifications,
    type PushNotificationPayload,
} from '@/services/notification-service';

// Mock fetch
global.fetch = jest.fn();

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendNotification', () => {
        it('should send a notification successfully', async () => {
            const mockResponse = {
                data: [
                    {
                        status: 'ok',
                        id: 'notification-123',
                    },
                ],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const payload: PushNotificationPayload = {
                to: 'ExpoPushToken[xxx]',
                title: 'Test Title',
                body: 'Test Body',
            };

            const result = await sendNotification(payload);

            expect(fetch).toHaveBeenCalledWith(
                'https://exp.host/--/api/v2/push/send',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(result.status).toBe('ok');
            expect(result.id).toBe('notification-123');
        });

        it('should handle network errors', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const payload: PushNotificationPayload = {
                to: 'ExpoPushToken[xxx]',
                title: 'Test Title',
                body: 'Test Body',
            };

            const result = await sendNotification(payload);

            expect(result.status).toBe('error');
            expect(result.message).toBe('Network error');
        });
    });

    describe('sendNotifications', () => {
        it('should send multiple notifications', async () => {
            const mockResponse = {
                data: [
                    { status: 'ok', id: 'notification-1' },
                    { status: 'ok', id: 'notification-2' },
                ],
            };

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const payloads: PushNotificationPayload[] = [
                { to: 'token1', title: 'Title 1', body: 'Body 1' },
                { to: 'token2', title: 'Title 2', body: 'Body 2' },
            ];

            const results = await sendNotifications(payloads);

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('ok');
            expect(results[1].status).toBe('ok');
        });
    });

    describe('notifyMovieRelease', () => {
        it('should send movie release notification', async () => {
            const mockResponse = {
                data: [{ status: 'ok', id: 'movie-notification' }],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await notifyMovieRelease(
                'ExpoPushToken[xxx]',
                123,
                'Inception',
                '2024-01-15'
            );

            const [, options] = (fetch as jest.Mock).mock.calls[0];
            const parsedBody = JSON.parse(options.body);

            expect(parsedBody).toMatchObject({
                to: 'ExpoPushToken[xxx]',
                title: '🎬 New Movie Released',
                body: 'Inception is now available!',
                data: {
                    type: 'movie_release',
                    movieId: '123',
                },
                priority: 'high',
                sound: 'default',
            });
            expect(result.status).toBe('ok');
        });
    });

    describe('notifyFavoriteUpdate', () => {
        it('should send favorite added notification', async () => {
            const mockResponse = {
                data: [{ status: 'ok', id: 'fav-notification' }],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await notifyFavoriteUpdate(
                'ExpoPushToken[xxx]',
                'Inception',
                true
            );

            const [, options] = (fetch as jest.Mock).mock.calls[0];
            const parsedBody = JSON.parse(options.body);

            expect(parsedBody).toMatchObject({
                to: 'ExpoPushToken[xxx]',
                title: '❤️ Added to Favorites',
                body: 'Inception has been added to your favorites',
                data: {
                    type: 'favorite_update',
                },
            });
            expect(result.status).toBe('ok');
        });

        it('should send favorite removed notification', async () => {
            const mockResponse = {
                data: [{ status: 'ok', id: 'unfav-notification' }],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await notifyFavoriteUpdate(
                'ExpoPushToken[xxx]',
                'Inception',
                false
            );

            const [, options] = (fetch as jest.Mock).mock.calls[0];
            const parsedBody = JSON.parse(options.body);

            expect(parsedBody).toMatchObject({
                to: 'ExpoPushToken[xxx]',
                title: '💔 Removed from Favorites',
                body: 'Inception has been removed from your favorites',
                data: {
                    type: 'favorite_update',
                },
            });
            expect(result.status).toBe('ok');
        });
    });

    describe('notifyRecommendation', () => {
        it('should send recommendation notification', async () => {
            const mockResponse = {
                data: [{ status: 'ok', id: 'rec-notification' }],
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await notifyRecommendation(
                'ExpoPushToken[xxx]',
                456,
                'Interstellar',
                'science fiction'
            );

            const [, options] = (fetch as jest.Mock).mock.calls[0];
            const parsedBody = JSON.parse(options.body);

            expect(parsedBody).toMatchObject({
                to: 'ExpoPushToken[xxx]',
                title: '🔥 Recommended for You',
                body: 'Because you liked science fiction: Interstellar',
                data: {
                    type: 'recommendation',
                    movieId: '456',
                },
                sound: 'default',
            });
            expect(result.status).toBe('ok');
        });
    });
});
