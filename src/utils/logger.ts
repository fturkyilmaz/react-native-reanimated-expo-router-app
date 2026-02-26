/**
 * Structured Logging Utility
 * 
 * Provides centralized logging with levels, context, and remote error tracking.
 * Includes Sentry breadcrumbs for all log levels.
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API request failed', { url, statusCode });
 * logger.movies.info('Adding to favorites', { movieId: 123 });
 */

import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    category?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Get log level from environment or default to 'info'
const CURRENT_LEVEL = (__DEV__ ? 'debug' : 'info') as LogLevel;

// Category prefixes for organized logging
const CATEGORIES = {
    API: 'API',
    AUTH: 'AUTH',
    NAVIGATION: 'NAVIGATION',
    NOTIFICATIONS: 'NOTIFICATIONS',
    MOVIES: 'MOVIES',
    OFFLINE: 'OFFLINE',
    SECURITY: 'SECURITY',
    PERFORMANCE: 'PERFORMANCE',
    DATABASE: 'DATABASE',
    SYNC: 'SYNC',
} as const;

type LogCategory = (typeof CATEGORIES)[keyof typeof CATEGORIES];

/**
 * Convert log level to Sentry severity
 */
function levelToSentry(level: LogLevel): string {
    switch (level) {
        case 'debug':
            return 'debug';
        case 'info':
            return 'info';
        case 'warn':
            return 'warning';
        case 'error':
            return 'error';
        default:
            return 'info';
    }
}

/**
 * Add breadcrumb to Sentry for tracing
 */
function addBreadcrumb(
    message: string,
    level: string,
    context?: Record<string, unknown>,
    category?: string
): void {
    try {
        Sentry.addBreadcrumb({
            message,
            level: level as any,
            data: __DEV__ ? context : sanitizeContext(context),
            category: category || 'logger',
            type: 'default',
        });
    } catch {
        // Silent fail - don't break logging if Sentry fails
    }
}

/**
 * Core logging function
 */
function log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    category?: LogCategory
) {
    // Skip if below current log level
    if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL]) return;

    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: __DEV__ ? context : sanitizeContext(context),
        category,
    };

    // Console output with styling
    const styles: Record<LogLevel, string> = {
        debug: 'color: #6B7280',
        info: 'color: #3B82F6',
        warn: 'color: #F59E0B',
        error: 'color: #EF4444',
    };

    const prefix = category ? `[${category}] ` : '';

    console.log(
        `%c${entry.timestamp} %c${prefix}${message}`,
        'color: #9CA3AF; font-size: 10px',
        styles[level],
        context || ''
    );

    // Add breadcrumb to Sentry (all levels for tracing)
    const sentryLevel = levelToSentry(level);
    addBreadcrumb(message, sentryLevel, context, category);

    // Remote error tracking in production
    if (level === 'error') {
        Sentry.captureException(new Error(message), {
            extra: context,
            tags: { category: category || 'general' },
        });
    }

    // Track warnings in production
    if (level === 'warn' && !__DEV__) {
        Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
        });
    }
}

/**
 * Remove sensitive data from context before sending to remote
 */
function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'accessToken'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
        const isSensitive = sensitiveKeys.some((sk) => key.toLowerCase().includes(sk));
        sanitized[key] = isSensitive ? '[REDACTED]' : value;
    }

    return sanitized;
}

/**
 * Logger instance with category support
 */
export const logger = {
    debug: (message: string, context?: Record<string, unknown>, category?: LogCategory) =>
        log('debug', message, context, category),
    info: (message: string, context?: Record<string, unknown>, category?: LogCategory) =>
        log('info', message, context, category),
    warn: (message: string, context?: Record<string, unknown>, category?: LogCategory) =>
        log('warn', message, context, category),
    error: (message: string, context?: Record<string, unknown>, category?: LogCategory) =>
        log('error', message, context, category),

    // Category-specific loggers
    api: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.API),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.API),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.API),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.API),
    },
    auth: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.AUTH),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.AUTH),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.AUTH),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.AUTH),
    },
    navigation: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.NAVIGATION),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.NAVIGATION),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.NAVIGATION),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.NAVIGATION),
    },
    movies: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.MOVIES),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.MOVIES),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.MOVIES),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.MOVIES),
    },
    offline: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.OFFLINE),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.OFFLINE),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.OFFLINE),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.OFFLINE),
    },
    database: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.DATABASE),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.DATABASE),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.DATABASE),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.DATABASE),
    },
    sync: {
        debug: (message: string, context?: Record<string, unknown>) =>
            log('debug', message, context, CATEGORIES.SYNC),
        info: (message: string, context?: Record<string, unknown>) =>
            log('info', message, context, CATEGORIES.SYNC),
        warn: (message: string, context?: Record<string, unknown>) =>
            log('warn', message, context, CATEGORIES.SYNC),
        error: (message: string, context?: Record<string, unknown>) =>
            log('error', message, context, CATEGORIES.SYNC),
    },
};

export const LOG_CATEGORIES = CATEGORIES;
export type { LogCategory, LogEntry, LogLevel };
