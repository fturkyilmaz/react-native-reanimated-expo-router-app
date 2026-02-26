/**
 * useComponentTrace - Component Performance Tracking
 * 
 * React hook for tracking component render performance using OpenTelemetry.
 * Uses existing span-utils for OpenTelemetry integration.
 */

import { Attributes, Span } from '@opentelemetry/api';
import { useCallback, useEffect, useRef } from 'react';
import {
    createSpan,
    createUserActionSpan,
    endSpan,
    endSpanWithError,
} from '../utils/span-utils';

/**
 * Performance tracking options
 */
interface TraceOptions {
    /** Component name for the trace */
    componentName: string;
    /** Additional attributes to add to the span */
    attributes?: Attributes;
    /** Whether to track re-renders */
    trackRenders?: boolean;
    /** Minimum duration to log (ms) */
    minDurationMs?: number;
}

/**
 * Result of a traced component
 */
interface TraceResult {
    /** Start the trace */
    start: () => void;
    /** End the trace */
    end: () => void;
    /** Record an exception */
    recordException: (error: Error) => void;
    /** Set an attribute */
    setAttribute: (key: string, value: string | number | boolean) => void;
    /** Add an event */
    addEvent: (name: string, attributes?: Attributes) => void;
    /** Get render count */
    getRenderCount: () => number;
}

/**
 * Hook for tracking component performance
 * 
 * @param options - Trace configuration options
 * @returns Trace control methods
 * 
 * @example
 * ```tsx
 * function MovieList() {
 *     const trace = useComponentTrace({ 
 *         componentName: 'MovieList',
 *         trackRenders: true,
 *     });
 *     
 *     useEffect(() => {
 *         trace.start();
 *         fetchMovies();
 *         trace.end();
 *     }, []);
 *     
 *     return <FlatList data={data} renderItem={renderItem} />;
 * }
 * ```
 */
export function useComponentTrace(options: TraceOptions): TraceResult {
    const { componentName, attributes = {}, trackRenders = false, minDurationMs = 0 } = options;

    const spanRef = useRef<Span | null>(null);
    const startTimeRef = useRef<number>(0);
    const renderCountRef = useRef(0);

    // Track renders if enabled
    useEffect(() => {
        if (trackRenders) {
            renderCountRef.current += 1;
        }
    });

    const start = useCallback(() => {
        if (__DEV__) return;

        spanRef.current = createSpan({
            name: componentName,
            attributes: {
                'component.type': 'react',
                'component.name': componentName,
                ...attributes,
            },
        });
        startTimeRef.current = Date.now();
    }, [componentName, attributes]);

    const end = useCallback(() => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        const duration = Date.now() - startTimeRef.current;

        // Only log if duration exceeds minimum
        if (duration >= minDurationMs) {
            spanRef.current.setAttribute('duration.ms', duration);
        }

        if (renderCountRef.current > 0) {
            spanRef.current.setAttribute('render.count', renderCountRef.current);
        }

        endSpan(spanRef.current);
        spanRef.current = null;
    }, [minDurationMs]);

    const recordException = useCallback((error: Error) => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        endSpanWithError(spanRef.current, error);
        spanRef.current = null;
    }, []);

    const setAttribute = useCallback((key: string, value: string | number | boolean) => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        spanRef.current.setAttribute(key, value);
    }, []);

    const addEvent = useCallback((name: string, eventAttributes?: Attributes) => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        spanRef.current.addEvent(name, eventAttributes);
    }, []);

    const getRenderCount = useCallback(() => {
        return renderCountRef.current;
    }, []);

    return {
        start,
        end,
        recordException,
        setAttribute,
        addEvent,
        getRenderCount,
    };
}

/**
 * Hook for measuring component mount time
 * 
 * @param componentName - Name of the component
 * @returns Mount time in milliseconds
 * 
 * @example
 * ```tsx
 * const mountTime = useMountTime('MovieDetail');
 * console.log(`MovieDetail mounted in ${mountTime}ms`);
 * ```
 */
export function useMountTime(componentName: string): number {
    const startTimeRef = useRef<number>(0);
    const mountTimeRef = useRef<number>(0);

    useEffect(() => {
        startTimeRef.current = Date.now();
        return () => {
            mountTimeRef.current = Date.now() - startTimeRef.current;
        };
    }, []);

    useEffect(() => {
        if (mountTimeRef.current > 0 && !__DEV__) {
            const span = createSpan({
                name: `${componentName}.mount`,
                attributes: {
                    'component.name': componentName,
                    'mount.time.ms': mountTimeRef.current,
                },
            });
            endSpan(span);
        }
    }, [componentName]);

    return mountTimeRef.current;
}

/**
 * Hook for tracking user interactions
 * 
 * @param actionType - Type of action (e.g., 'button_press', 'swipe')
 * @param componentName - Name of the component
 * @returns Trace control methods
 * 
 * @example
 * ```tsx
 * const traceAction = useUserActionTrace('button_press', 'MovieCard');
 * 
 * <TouchableOpacity onPress={traceAction.start}>
 * ```
 */
export function useUserActionTrace(actionType: string, componentName: string) {
    const spanRef = useRef<Span | null>(null);

    const start = useCallback(() => {
        if (__DEV__) return;

        spanRef.current = createUserActionSpan(actionType, componentName, {
            'component.name': componentName,
            'action.type': actionType,
        });
    }, [actionType, componentName]);

    const end = useCallback(() => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        endSpan(spanRef.current);
        spanRef.current = null;
    }, []);

    const cancel = useCallback(() => {
        if (__DEV__) return;
        if (!spanRef.current) return;

        spanRef.current.end();
        spanRef.current = null;
    }, []);

    return { start, end, cancel };
}
