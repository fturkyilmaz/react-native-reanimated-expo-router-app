/**
 * Semantic attribute helper fonksiyonları
 */

import { Attributes } from '@opentelemetry/api';

/**
 * HTTP attribute'ları
 */
export const HttpAttributes = {
    method: (method: string): Attributes => ({ 'http.method': method }),
    url: (url: string): Attributes => ({ 'http.url': url }),
    statusCode: (code: number): Attributes => ({ 'http.status_code': code }),
    responseSize: (size: number): Attributes => ({ 'http.response_content_length': size }),
    requestSize: (size: number): Attributes => ({ 'http.request_content_length': size }),
    error: (message: string): Attributes => ({ 'error.message': message }),
} as const;

/**
 * Kullanıcı eylemi attribute'ları
 */
export const UserActionAttributes = {
    type: (actionType: 'tap' | 'swipe' | 'scroll' | 'long_press' | 'input'): Attributes => ({
        'user.action.type': actionType,
    }),
    component: (componentName: string, componentId?: string): Attributes => ({
        'ui.component.name': componentName,
        ...(componentId && { 'ui.component.id': componentId }),
    }),
    screen: (screenName: string): Attributes => ({ 'screen.name': screenName }),
    target: (targetId: string): Attributes => ({ 'user.action.target': targetId }),
} as const;

/**
 * Hata attribute'ları
 */
export const ErrorAttributes = {
    type: (errorType: string): Attributes => ({ 'exception.type': errorType }),
    message: (message: string): Attributes => ({ 'exception.message': message }),
    stacktrace: (stack: string): Attributes => ({ 'exception.stacktrace': stack }),
    source: (source: 'api' | 'ui' | 'logic' | 'react' | 'unknown'): Attributes => ({
        'error.source': source,
    }),
    component: (componentName: string): Attributes => ({ 'error.component': componentName }),
    handled: (isHandled: boolean): Attributes => ({ 'error.handled': isHandled }),
} as const;

/**
 * Performans attribute'ları
 */
export const PerformanceAttributes = {
    screenLoad: (screenName: string, durationMs: number, loadType: 'initial' | 'navigation' = 'initial'): Attributes => ({
        'screen.name': screenName,
        'screen.load.duration_ms': durationMs,
        'screen.load.type': loadType,
    }),
    render: (componentName: string, durationMs: number): Attributes => ({
        'component.name': componentName,
        'component.render.duration_ms': durationMs,
    }),
    apiCall: (endpoint: string, durationMs: number): Attributes => ({
        'api.endpoint': endpoint,
        'api.duration_ms': durationMs,
    }),
} as const;

/**
 * API attribute'ları
 */
export const ApiAttributes = {
    endpoint: (endpoint: string): Attributes => ({ 'api.endpoint': endpoint }),
    method: (method: string): Attributes => ({ 'api.method': method }),
    params: (params: Record<string, unknown>): Attributes => ({
        'api.params': JSON.stringify(params),
    }),
    responseStatus: (status: 'success' | 'error' | 'timeout'): Attributes => ({
        'api.response.status': status,
    }),
    cacheHit: (isHit: boolean): Attributes => ({ 'api.cache.hit': isHit }),
} as const;

/**
 * Cihaz attribute'ları
 */
export const DeviceAttributes = {
    networkType: (type: 'wifi' | 'cellular' | 'unknown'): Attributes => ({
        'device.network.type': type,
    }),
    batteryLevel: (level: number): Attributes => ({ 'device.battery.level': level }),
    memory: (usedMB: number, totalMB: number): Attributes => ({
        'device.memory.used_mb': usedMB,
        'device.memory.total_mb': totalMB,
    }),
} as const;

/**
 * Özel attribute'ları merge et
 */
export function mergeAttributes(...attributeList: Attributes[]): Attributes {
    return attributeList.reduce((merged, attrs) => ({ ...merged, ...attrs }), {});
}

/**
 * Attribute'ları filtrele (PII temizleme)
 */
export function filterSensitiveAttributes(attributes: Attributes): Attributes {
    const sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'authorization', 'cookie'];
    const filtered: Attributes = {};

    for (const [key, value] of Object.entries(attributes)) {
        const isSensitive = sensitiveKeys.some((sensitive) =>
            key.toLowerCase().includes(sensitive)
        );

        if (isSensitive) {
            filtered[key] = '***REDACTED***';
        } else {
            filtered[key] = value;
        }
    }

    return filtered;
}
