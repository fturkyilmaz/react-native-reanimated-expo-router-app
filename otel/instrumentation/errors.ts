import { Attributes } from '@opentelemetry/api';
import { ErrorInfo } from 'react';

import { recordException } from '../utils/span-utils';

/**
 * Error boundary error handler
 * 
 * @example
 * ```typescript
 * componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 *   handleErrorBoundaryError(error, errorInfo, {
 *     component: 'MovieDetailScreen'
 *   });
 * }
 * ```
 */
export function handleErrorBoundaryError(
    error: Error,
    errorInfo: ErrorInfo,
    additionalAttributes?: Attributes
): void {
    recordException(error, {
        'error.source': 'react',
        'error.component_stack': errorInfo.componentStack ?? undefined,
        'error.handled': true,
        ...additionalAttributes,
    });
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandler(): () => void {
    // React Native global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        recordException(error, {
            'error.source': 'global',
            'error.is_fatal': isFatal ?? false,
            'error.handled': false,
        });

        // Orijinal handler'ı çağır
        if (originalHandler) {
            originalHandler(error, isFatal);
        }
    });

    // Cleanup fonksiyonu
    return () => {
        ErrorUtils.setGlobalHandler(originalHandler);
    };
}

/**
 * Promise rejection handler
 */
export function setupPromiseRejectionHandler(): () => void {
    const handler = (event: { reason?: unknown }): void => {
        const error = event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));

        recordException(error, {
            'error.source': 'promise_rejection',
            'error.handled': false,
        });
    };

    // React Native için global rejection handler
    if (typeof global !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rnGlobal = global as any;

        // Eski handler'ı sakla
        const originalRejectionTracker = rnGlobal.__rnx_rejection_tracker;

        // Yeni handler ekle
        rnGlobal.__rnx_rejection_tracker = {
            track: (error: Error) => {
                recordException(error, {
                    'error.source': 'promise_rejection',
                    'error.handled': false,
                });

                // Eski tracker'ı çağır
                if (originalRejectionTracker?.track) {
                    originalRejectionTracker.track(error);
                }
            },
        };

        return () => {
            rnGlobal.__rnx_rejection_tracker = originalRejectionTracker;
        };
    }

    return () => {
        // Cleanup yapılamadı
    };
}

/**
 * API hatası kaydet
 */
export function logApiError(
    error: Error,
    endpoint: string,
    method: string,
    additionalAttributes?: Attributes
): void {
    recordException(error, {
        'error.source': 'api',
        'api.endpoint': endpoint,
        'api.method': method,
        'error.handled': true,
        ...additionalAttributes,
    });
}

/**
 * UI hatası kaydet
 */
export function logUIError(
    error: Error,
    componentName: string,
    action?: string,
    additionalAttributes?: Attributes
): void {
    recordException(error, {
        'error.source': 'ui',
        'error.component': componentName,
        ...(action && { 'user.action': action }),
        'error.handled': true,
        ...additionalAttributes,
    });
}

/**
 * Business logic hatası kaydet
 */
export function logLogicError(
    error: Error,
    operation: string,
    additionalAttributes?: Attributes
): void {
    recordException(error, {
        'error.source': 'logic',
        'operation.name': operation,
        'error.handled': true,
        ...additionalAttributes,
    });
}

/**
 * Tüm error handler'ları başlat
 */
export function initializeErrorHandlers(): () => void {
    const cleanupGlobal = setupGlobalErrorHandler();
    const cleanupPromise = setupPromiseRejectionHandler();

    return () => {
        cleanupGlobal();
        cleanupPromise();
    };
}

// ErrorUtils tip tanımı
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ErrorUtils?: {
                getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | null;
                setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
            };
        }
    }
}
