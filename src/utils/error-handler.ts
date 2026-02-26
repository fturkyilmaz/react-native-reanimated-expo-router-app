/**
 * Error Handler Utility
 * 
 * Centralized error handling with Sentry and OpenTelemetry integration.
 * Provides structured logging and error tracking.
 */

import { AppError, type ErrorSeverity } from '@/errors/app-error';
import { logApiError } from '@/otel/instrumentation/errors';
import { captureException, captureMessage, setUser } from '@/sentry';
import { Platform } from 'react-native';

/**
 * Error context for logging
 */
interface ErrorContext {
    component?: string;
    screen?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    tags?: Record<string, string>;
}

/**
 * Global error handler configuration
 */
interface ErrorHandlerConfig {
    /** Whether to show error details to user */
    showDetailsToUser: boolean;
    /** Default user message for unknown errors */
    defaultUserMessage: string;
    /** Whether to capture errors to Sentry */
    captureToSentry: boolean;
    /** Whether to log to OpenTelemetry */
    logToOtel: boolean;
    /** Minimum severity to report */
    minReportSeverity: ErrorSeverity;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
    showDetailsToUser: __DEV__,
    defaultUserMessage: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    captureToSentry: !__DEV__,
    logToOtel: true,
    minReportSeverity: 'medium',
};

/**
 * Error handler instance
 */
class ErrorHandler {
    private config: ErrorHandlerConfig;
    private userId?: string;

    constructor(config: Partial<ErrorHandlerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Configure the error handler
     */
    configure(config: Partial<ErrorHandlerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Set user context for error tracking
     */
    setUser(userId?: string): void {
        this.userId = userId;

        if (userId) {
            setUser({ id: userId });
        } else {
            setUser(null);
        }
    }

    /**
     * Handle an error with full context
     */
    handle(error: unknown, context: ErrorContext = {}): AppError {
        const appError = error instanceof AppError
            ? error
            : AppError.from(error);

        // Add context to error
        if (context.component) {
            appError.context.component = context.component;
        }
        if (context.screen) {
            appError.context.screen = context.screen;
        }
        if (context.action) {
            appError.context.action = context.action;
        }

        // Add platform info
        appError.context.platform = Platform.OS;
        appError.context.timestamp = new Date().toISOString();

        // Log to console in development
        if (__DEV__) {
            console.error(`[ErrorHandler] ${appError.toString()}`, {
                code: appError.code,
                severity: appError.severity,
                context: appError.context,
                stack: appError.stack,
            });
        }

        // Capture to Sentry based on severity
        if (this.config.captureToSentry && this.shouldReport(appError.severity)) {
            captureException(appError, {
                extra: {
                    code: appError.code,
                    severity: appError.severity,
                    context: appError.context,
                    timestamp: appError.timestamp.toISOString(),
                },
                tags: {
                    error_code: appError.code,
                    severity: appError.severity,
                    ...context.tags,
                },
                user: context.userId ? { id: context.userId } : undefined,
            });
        }

        // Log to OpenTelemetry
        if (this.config.logToOtel) {
            logApiError(
                appError,
                appError.code,
                'error',
                {
                    'error.code': appError.code,
                    'error.severity': appError.severity,
                    'error.component': context.component,
                    'error.screen': context.screen,
                }
            );
        }

        return appError;
    }

    /**
     * Handle an error and return user-friendly message
     */
    handleWithMessage(error: unknown, context: ErrorContext = {}): {
        error: AppError;
        userMessage: string;
    } {
        const appError = this.handle(error, context);

        const userMessage = this.config.showDetailsToUser
            ? `${appError.message} (${appError.code})`
            : this.config.defaultUserMessage;

        return { error: appError, userMessage };
    }

    /**
     * Capture a message to Sentry
     */
    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
        const sentryLevel: 'fatal' | 'error' | 'warning' | 'info' | 'debug' =
            level === 'error' ? 'error' :
                level === 'warning' ? 'warning' : 'info';

        captureMessage(message, sentryLevel);
    }

    /**
     * Add breadcrumb for Sentry
     */
    addBreadcrumb(
        category: string,
        message: string,
        data?: Record<string, unknown>,
        _level: 'debug' | 'info' | 'warning' | 'error' = 'info'
    ): void {
        if (__DEV__) {
            console.log(`[Breadcrumb] ${category}: ${message}`, data);
        }
    }

    /**
     * Create a Result from a promise with error handling
     */
    async wrap<T>(
        promise: Promise<T>,
        context: ErrorContext = {}
    ): Promise<{ success: true; data: T } | { success: false; error: AppError; userMessage: string }> {
        try {
            const data = await promise;
            return { success: true, data };
        } catch (error) {
            const { error: appError, userMessage } = this.handleWithMessage(error, context);
            return { success: false, error: appError, userMessage };
        }
    }

    /**
     * Determine if error should be reported based on severity
     */
    private shouldReport(severity: ErrorSeverity): boolean {
        const severityOrder: Record<ErrorSeverity, number> = {
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
        };

        return severityOrder[severity] >= severityOrder[this.config.minReportSeverity];
    }
}

/**
 * Singleton instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Helper function to create context with component name
 */
export function createContext(component: string, additionalContext?: Record<string, unknown>): ErrorContext {
    return {
        component,
        ...additionalContext,
    };
}

/**
 * Higher-order function for wrapping component methods with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    component: string,
    action: string
): T {
    return ((...args: Parameters<T>) => {
        try {
            const result = fn(...args);

            // If it's a promise, catch errors
            if (result instanceof Promise) {
                return result.catch((error) => {
                    errorHandler.handle(error, { component, action });
                    throw error;
                });
            }

            return result;
        } catch (error) {
            errorHandler.handle(error, { component, action });
            throw error;
        }
    }) as T;
}

/**
 * React hook for error handling in components
 */
export function useErrorHandler() {
    return {
        handle: (error: unknown, context?: ErrorContext) =>
            errorHandler.handle(error, context),

        handleWithMessage: (error: unknown, context?: ErrorContext) =>
            errorHandler.handleWithMessage(error, context),

        captureMessage: (message: string, level?: 'info' | 'warning' | 'error') =>
            errorHandler.captureMessage(message, level),

        addBreadcrumb: (category: string, message: string, data?: Record<string, unknown>) =>
            errorHandler.addBreadcrumb(category, message, data),

        setUser: (userId?: string) => errorHandler.setUser(userId),
    };
}
