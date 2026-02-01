import { Attributes, Span } from '@opentelemetry/api';
import { useCallback, useRef } from 'react';

import {
    createApiSpan,
    createSpan,
    createUserActionSpan,
    endSpan,
    endSpanWithError,
    recordException,
} from '../utils/span-utils';

/**
 * useTrace hook seçenekleri
 */
export interface UseTraceOptions {
    /** Varsayılan span adı prefix'i */
    prefix?: string;
    /** Varsayılan attribute'lar */
    defaultAttributes?: Attributes;
}

/**
 * Trace yönetimi hook'u
 * 
 * @example
 * ```typescript
 * const { startSpan, endSpan, recordError, traceAsync } = useTrace('user.action');
 * 
 * const handlePress = async () => {
 *   const span = startSpan('button.press', { 'ui.component': 'MovieCard' });
 *   try {
 *     await doSomething();
 *     endSpan(span);
 *   } catch (error) {
 *     recordError(span, error);
 *   }
 * };
 * ```
 */
export function useTrace(options: UseTraceOptions = {}) {
    const { prefix = '', defaultAttributes = {} } = options;
    const activeSpansRef = useRef<Map<string, Span>>(new Map());

    /**
     * Yeni bir span başlat
     */
    const startSpan = useCallback((
        name: string,
        attributes?: Attributes,
        spanId?: string
    ): Span => {
        const fullName = prefix ? `${prefix}.${name}` : name;
        const span = createSpan({
            name: fullName,
            attributes: { ...defaultAttributes, ...attributes },
        });

        if (spanId) {
            activeSpansRef.current.set(spanId, span);
        }

        return span;
    }, [prefix, defaultAttributes]);

    /**
     * Span'ı bitir
     */
    const endSpanCallback = useCallback((span: Span | string, attributes?: Attributes): void => {
        let targetSpan: Span | undefined;

        if (typeof span === 'string') {
            targetSpan = activeSpansRef.current.get(span);
            activeSpansRef.current.delete(span);
        } else {
            targetSpan = span;
        }

        if (targetSpan) {
            endSpan(targetSpan, attributes);
        }
    }, []);

    /**
     * Span'ı hata ile bitir
     */
    const recordError = useCallback((
        span: Span | string,
        error: Error | string,
        attributes?: Attributes
    ): void => {
        let targetSpan: Span | undefined;

        if (typeof span === 'string') {
            targetSpan = activeSpansRef.current.get(span);
            activeSpansRef.current.delete(span);
        } else {
            targetSpan = span;
        }

        if (targetSpan) {
            endSpanWithError(targetSpan, error, attributes);
        }
    }, []);

    /**
     * Asenkron fonksiyonu trace et
     */
    const traceAsync = useCallback(<T>(
        name: string,
        fn: () => Promise<T>,
        attributes?: Attributes
    ): Promise<T> => {
        const span = startSpan(name, attributes);

        return fn()
            .then((result) => {
                endSpanCallback(span);
                return result;
            })
            .catch((error) => {
                recordError(span, error);
                throw error;
            });
    }, [startSpan, endSpanCallback, recordError]);

    /**
     * Kullanıcı eylemi span'ı oluştur
     */
    const startUserAction = useCallback((
        actionType: string,
        componentName: string,
        attributes?: Attributes
    ): Span => {
        const span = createUserActionSpan(actionType, componentName, {
            ...defaultAttributes,
            ...attributes,
        });
        return span;
    }, [defaultAttributes]);

    /**
     * API span'ı oluştur
     */
    const startApiCall = useCallback((
        endpoint: string,
        method: string,
        attributes?: Attributes
    ): Span => {
        const span = createApiSpan(endpoint, method, {
            ...defaultAttributes,
            ...attributes,
        });
        return span;
    }, [defaultAttributes]);

    /**
     * Exception kaydet (span'siz)
     */
    const logException = useCallback((
        error: Error | string,
        attributes?: Attributes
    ): void => {
        recordException(error, { ...defaultAttributes, ...attributes });
    }, [defaultAttributes]);

    /**
     * Tüm aktif span'ları temizle
     */
    const clearActiveSpans = useCallback((): void => {
        activeSpansRef.current.forEach((span) => {
            try {
                span.end();
            } catch {
                // Ignore errors when ending spans
            }
        });
        activeSpansRef.current.clear();
    }, []);

    return {
        startSpan,
        endSpan: endSpanCallback,
        recordError,
        traceAsync,
        startUserAction,
        startApiCall,
        logException,
        clearActiveSpans,
    };
}
