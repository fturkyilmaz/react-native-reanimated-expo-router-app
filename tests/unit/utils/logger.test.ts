/**
 * Logger Unit Tests
 */

import { LOG_CATEGORIES, logger } from '@/utils/logger';

describe('Logger', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('log levels', () => {
        it('should call console.log for info level', () => {
            logger.info('Test message');
            expect(console.log).toHaveBeenCalled();
        });

        it('should call console.log for warn level', () => {
            logger.warn('Warning message');
            expect(console.log).toHaveBeenCalled();
        });

        it('should call console.log for error level', () => {
            logger.error('Error message');
            expect(console.log).toHaveBeenCalled();
        });

        it('should support context object', () => {
            const context = { userId: 123, action: 'login' };
            logger.info('User action', context);
            expect(console.log).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                'color: #3B82F6',
                context
            );
        });
    });

    describe('category support', () => {
        it('should support API category', () => {
            logger.api.info('API request', { url: '/movies' });
            expect(console.log).toHaveBeenCalled();
        });

        it('should support AUTH category', () => {
            logger.auth.info('Login success', { userId: 456 });
            expect(console.log).toHaveBeenCalled();
        });

        it('should support MOVIES category', () => {
            logger.movies.info('Fetch movies', { page: 1 });
            expect(console.log).toHaveBeenCalled();
        });

        it('should support OFFLINE category', () => {
            logger.offline.info('Cache hit', { movieId: 789 });
            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('LOG_CATEGORIES', () => {
        it('should have required categories', () => {
            expect(LOG_CATEGORIES.API).toBe('API');
            expect(LOG_CATEGORIES.AUTH).toBe('AUTH');
            expect(LOG_CATEGORIES.MOVIES).toBe('MOVIES');
            expect(LOG_CATEGORIES.OFFLINE).toBe('OFFLINE');
            expect(LOG_CATEGORIES.NAVIGATION).toBe('NAVIGATION');
            expect(LOG_CATEGORIES.NOTIFICATIONS).toBe('NOTIFICATIONS');
            expect(LOG_CATEGORIES.SECURITY).toBe('SECURITY');
            expect(LOG_CATEGORIES.PERFORMANCE).toBe('PERFORMANCE');
        });
    });
});
