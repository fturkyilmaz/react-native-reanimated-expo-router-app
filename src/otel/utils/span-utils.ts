import { Attributes, context, Span, SpanStatusCode, trace } from '@opentelemetry/api';

import { getTracer } from '../index';

/**
 * Span oluşturma seçenekleri
 */
export interface CreateSpanOptions {
    /** Span adı */
    name: string;
    /** Span attribute'ları */
    attributes?: Attributes;
    /** Parent span */
    parentSpan?: Span;
    /** Span kind */
    kind?: number;
}

/**
 * Yeni bir span oluştur
 */
export function createSpan(options: CreateSpanOptions): Span {
    const tracer = getTracer();
    const { name, attributes, parentSpan } = options;

    // Parent span varsa context oluştur
    let parentContext = context.active();
    if (parentSpan) {
        parentContext = trace.setSpan(parentContext, parentSpan);
    }

    const span = tracer.startSpan(name, {
        attributes,
    }, parentContext);

    return span;
}

/**
 * Span'ı başarılı olarak işaretle ve bitir
 */
export function endSpan(span: Span, attributes?: Attributes): void {
    if (attributes) {
        span.setAttributes(attributes);
    }
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
}

/**
 * Span'ı hata ile işaretle ve bitir
 */
export function endSpanWithError(
    span: Span,
    error: Error | string,
    attributes?: Attributes
): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    span.setStatus({
        code: SpanStatusCode.ERROR,
        message: errorMessage,
    });

    span.recordException({
        name: typeof error === 'string' ? 'Error' : error.name,
        message: errorMessage,
        stack: errorStack,
    });

    if (attributes) {
        span.setAttributes(attributes);
    }

    span.end();
}

/**
 * Exception kaydet
 */
export function recordException(
    error: Error | string,
    attributes?: Attributes,
    span?: Span
): void {
    const targetSpan = span || getTracer().startSpan('exception');

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    const errorName = typeof error === 'string' ? 'Error' : error.name;

    targetSpan.recordException({
        name: errorName,
        message: errorMessage,
        stack: errorStack,
    });

    targetSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: errorMessage,
    });

    if (attributes) {
        targetSpan.setAttributes(attributes);
    }

    if (!span) {
        targetSpan.end();
    }
}

/**
 * Bir fonksiyonu span içinde çalıştır
 */
export async function withSpan<T>(
    options: CreateSpanOptions,
    fn: (span: Span) => Promise<T> | T
): Promise<T> {
    const span = createSpan(options);

    try {
        const result = await fn(span);
        endSpan(span);
        return result;
    } catch (error) {
        endSpanWithError(span, error as Error);
        throw error;
    }
}

/**
 * Event ekle
 */
export function addEvent(
    span: Span,
    name: string,
    attributes?: Attributes
): void {
    span.addEvent(name, attributes);
}

/**
 * Aktif span context'ini al
 */
export function getCurrentSpanContext() {
    const currentSpan = trace.getSpan(context.active());
    return currentSpan?.spanContext();
}

/**
 * Span attribute'larını güncelle
 */
export function setSpanAttributes(span: Span, attributes: Attributes): void {
    span.setAttributes(attributes);
}

/**
 * Span'a tag ekle (attribute olarak)
 */
export function addSpanTag(span: Span, key: string, value: string | number | boolean): void {
    span.setAttribute(key, value);
}

/**
 * API span'ı oluştur
 */
export function createApiSpan(
    endpoint: string,
    method: string,
    attributes?: Attributes
): Span {
    return createSpan({
        name: `HTTP ${method}`,
        attributes: {
            'http.method': method,
            'http.url': endpoint,
            'api.endpoint': endpoint,
            ...attributes,
        },
    });
}

/**
 * Kullanıcı eylemi span'ı oluştur
 */
export function createUserActionSpan(
    actionType: string,
    componentName: string,
    attributes?: Attributes
): Span {
    return createSpan({
        name: `user.action.${actionType}`,
        attributes: {
            'user.action.type': actionType,
            'ui.component.name': componentName,
            ...attributes,
        },
    });
}

/**
 * Performans span'ı oluştur
 */
export function createPerformanceSpan(
    operation: string,
    target: string,
    attributes?: Attributes
): Span {
    return createSpan({
        name: `perf.${operation}`,
        attributes: {
            'perf.operation': operation,
            'perf.target': target,
            ...attributes,
        },
    });
}
