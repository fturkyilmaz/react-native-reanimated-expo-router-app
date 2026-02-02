import { useCallback } from 'react';

import {
    addApiBreadcrumb,
    addNavigationBreadcrumb,
    addUserActionBreadcrumb,
    captureException,
    captureMessage,
    setContext,
    setExtra,
    setTag,
    setUser,
} from '../index';

/**
 * Sentry hook'u
 * 
 * @example
 * ```tsx
 * const { captureError, setUserContext, addBreadcrumb } = useSentry();
 * 
 * // Hata yakalama
 * try {
 *   await apiCall();
 * } catch (error) {
 *   captureError(error, { tags: { api: 'tmdb' } });
 * }
 * ```
 */
export function useSentry() {
    /**
     * Hata yakalama
     */
    const captureError = useCallback((
        error: Error,
        context?: {
            extra?: Record<string, unknown>;
            tags?: Record<string, string>;
        }
    ): string => {
        return captureException(error, context);
    }, []);

    /**
     * Mesaj gönder
     */
    const logMessage = useCallback((
        message: string,
        level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
    ): string => {
        return captureMessage(message, level);
    }, []);

    /**
     * Kullanıcı bilgisi ayarla
     */
    const setUserContext = useCallback((user: {
        id: string;
        email?: string;
        username?: string;
    } | null): void => {
        setUser(user);
    }, []);

    /**
     * Tag ekle
     */
    const addTag = useCallback((key: string, value: string): void => {
        setTag(key, value);
    }, []);

    /**
     * Context ekle
     */
    const addContext = useCallback((
        name: string,
        context: Record<string, unknown>
    ): void => {
        setContext(name, context);
    }, []);

    /**
     * Extra veri ekle
     */
    const addExtra = useCallback((key: string, value: unknown): void => {
        setExtra(key, value);
    }, []);

    /**
     * Navigation breadcrumb ekle
     */
    const logNavigation = useCallback((from: string, to: string): void => {
        addNavigationBreadcrumb(from, to);
    }, []);

    /**
     * API breadcrumb ekle
     */
    const logApiCall = useCallback((
        endpoint: string,
        method: string,
        statusCode: number,
        duration?: number
    ): void => {
        addApiBreadcrumb(endpoint, method, statusCode, duration);
    }, []);

    /**
     * User action breadcrumb ekle
     */
    const logUserAction = useCallback((
        action: string,
        component: string,
        details?: Record<string, unknown>
    ): void => {
        addUserActionBreadcrumb(action, component, details);
    }, []);

    return {
        captureError,
        logMessage,
        setUserContext,
        addTag,
        addContext,
        addExtra,
        logNavigation,
        logApiCall,
        logUserAction,
    };
}
