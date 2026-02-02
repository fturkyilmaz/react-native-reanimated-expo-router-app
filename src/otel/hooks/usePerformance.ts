import { Attributes } from '@opentelemetry/api';
import { useCallback, useEffect, useRef } from 'react';

import { createPerformanceSpan, endSpan, endSpanWithError } from '../utils/span-utils';

/**
 * Performans ölçüm hook'u
 * 
 * @example
 * ```typescript
 * const { measureScreenLoad, measureAsync } = usePerformance();
 * 
 * useEffect(() => {
 *   const endMeasurement = measureScreenLoad('MovieDetail');
 *   // ... veri yükle
 *   endMeasurement();
 * }, []);
 * ```
 */
export function usePerformance() {
    const measurementsRef = useRef<Map<string, number>>(new Map());

    /**
     * Ekran yükleme süresini ölç
     */
    const measureScreenLoad = useCallback((
        screenName: string,
        loadType: 'initial' | 'navigation' = 'initial',
        additionalAttributes?: Attributes
    ): (() => void) => {
        const startTime = performance.now();
        const span = createPerformanceSpan('screen_load', screenName, {
            'screen.name': screenName,
            'screen.load.type': loadType,
            ...additionalAttributes,
        });

        return () => {
            const duration = performance.now() - startTime;
            endSpan(span, {
                'screen.load.duration_ms': duration,
            });
        };
    }, []);

    /**
     * Component render süresini ölç
     */
    const measureRender = useCallback((
        componentName: string,
        additionalAttributes?: Attributes
    ): (() => void) => {
        const startTime = performance.now();
        const span = createPerformanceSpan('render', componentName, {
            'component.name': componentName,
            ...additionalAttributes,
        });

        return () => {
            const duration = performance.now() - startTime;
            endSpan(span, {
                'component.render.duration_ms': duration,
            });
        };
    }, []);

    /**
     * API çağrı süresini ölç
     */
    const measureApiCall = useCallback((
        endpoint: string,
        method: string,
        additionalAttributes?: Attributes
    ): (error?: Error) => void => {
        const startTime = performance.now();
        const span = createPerformanceSpan('api_call', endpoint, {
            'api.endpoint': endpoint,
            'api.method': method,
            ...additionalAttributes,
        });

        return (error?: Error) => {
            const duration = performance.now() - startTime;
            if (error) {
                endSpanWithError(span, error, {
                    'api.duration_ms': duration,
                });
            } else {
                endSpan(span, {
                    'api.duration_ms': duration,
                    'api.response.status': 'success',
                });
            }
        };
    }, []);

    /**
     * Asenkron operasyon süresini ölç
     */
    const measureAsync = useCallback(async <T>(
        operationName: string,
        fn: () => Promise<T>,
        additionalAttributes?: Attributes
    ): Promise<T> => {
        const startTime = performance.now();
        const span = createPerformanceSpan('async_operation', operationName, {
            'operation.name': operationName,
            ...additionalAttributes,
        });

        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            endSpan(span, {
                'operation.duration_ms': duration,
                'operation.status': 'success',
            });
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            endSpanWithError(span, error as Error, {
                'operation.duration_ms': duration,
                'operation.status': 'error',
            });
            throw error;
        }
    }, []);

    /**
     * Manuel zamanlama başlat
     */
    const startTiming = useCallback((key: string): void => {
        measurementsRef.current.set(key, performance.now());
    }, []);

    /**
     * Manuel zamanlama bitir ve süreyi al
     */
    const endTiming = useCallback((key: string): number | null => {
        const startTime = measurementsRef.current.get(key);
        if (!startTime) {
            return null;
        }
        measurementsRef.current.delete(key);
        return performance.now() - startTime;
    }, []);

    /**
     * Custom metrik kaydet
     */
    const recordMetric = useCallback((
        name: string,
        value: number,
        unit?: string,
        attributes?: Attributes
    ): void => {
        const span = createPerformanceSpan('metric', name, {
            'metric.name': name,
            'metric.value': value,
            ...(unit && { 'metric.unit': unit }),
            ...attributes,
        });
        endSpan(span);
    }, []);

    /**
     * React Native için useEffect hook'u ile ekran yükleme ölçümü
     */
    const useScreenLoadEffect = useCallback((
        screenName: string,
        dependencies: React.DependencyList = [],
        loadType: 'initial' | 'navigation' = 'initial'
    ): void => {
        useEffect(() => {
            const endMeasurement = measureScreenLoad(screenName, loadType);
            return () => {
                endMeasurement();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, dependencies);
    }, [measureScreenLoad]);

    /**
     * React Native için useEffect hook'u ile render ölçümü
     */
    const useRenderEffect = useCallback((
        componentName: string,
        dependencies: React.DependencyList = []
    ): void => {
        useEffect(() => {
            const endMeasurement = measureRender(componentName);
            return () => {
                endMeasurement();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, dependencies);
    }, [measureRender]);

    return {
        measureScreenLoad,
        measureRender,
        measureApiCall,
        measureAsync,
        startTiming,
        endTiming,
        recordMetric,
        useScreenLoadEffect,
        useRenderEffect,
    };
}
