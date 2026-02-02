import { Attributes, Span } from '@opentelemetry/api';

import { createApiSpan, endSpan, endSpanWithError } from '../utils/span-utils';

/**
 * Fetch instrumentation seçenekleri
 */
export interface FetchInstrumentationOptions {
    /** Span adı */
    spanName?: string;
    /** Ek attribute'lar */
    attributes?: Attributes;
    /** API endpoint'i (loglama için) */
    endpoint?: string;
}

/**
 * Fetch çağrısını trace et
 * 
 * @example
 * ```typescript
 * const data = await withTracing(
 *   () => fetch('https://api.example.com/data'),
 *   { spanName: 'api.data.fetch', endpoint: '/data' }
 * );
 * ```
 */
export async function withTracing<T>(
    fetchFn: () => Promise<T>,
    options: FetchInstrumentationOptions = {}
): Promise<T> {
    const { spanName = 'HTTP Request', attributes = {}, endpoint = '' } = options;

    const span = createApiSpan(endpoint, 'GET', attributes);
    span.updateName(spanName);

    try {
        const result = await fetchFn();

        // Response kontrolü
        if (result instanceof Response) {
            span.setAttribute('http.status_code', result.status);

            if (!result.ok) {
                endSpanWithError(
                    span,
                    `HTTP Error: ${result.status} ${result.statusText}`
                );
                return result as T;
            }
        }

        endSpan(span);
        return result;
    } catch (error) {
        endSpanWithError(span, error as Error);
        throw error;
    }
}

/**
 * Fetch wrapper oluştur
 * 
 * @example
 * ```typescript
 * const tracedFetch = createTracedFetch({
 *   baseAttributes: { 'api.service': 'tmdb' }
 * });
 * 
 * const response = await tracedFetch('/movie/popular', {
 *   spanName: 'tmdb.popular'
 * });
 * ```
 */
export function createTracedFetch(defaultOptions: {
    baseAttributes?: Attributes;
    baseUrl?: string;
} = {}) {
    const { baseAttributes = {}, baseUrl = '' } = defaultOptions;

    return async function tracedFetch(
        url: string,
        options: FetchInstrumentationOptions & RequestInit = {}
    ): Promise<Response> {
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        const { spanName, attributes = {}, endpoint, ...fetchOptions } = options;

        return withTracing(
            () => fetch(fullUrl, fetchOptions),
            {
                spanName: spanName || `HTTP ${fetchOptions.method || 'GET'}`,
                endpoint: endpoint || url,
                attributes: { ...baseAttributes, ...attributes },
            }
        );
    };
}

/**
 * TMDB API için özel traced fetch
 */
export function createTMDBTracedFetch(apiKey: string, baseUrl: string) {
    return createTracedFetch({
        baseUrl,
        baseAttributes: {
            'api.service': 'tmdb',
            'api.version': '3',
        },
    });
}

/**
 * Span'ı manuel olarak fetch response ile güncelle
 */
export function updateSpanWithResponse(span: Span, response: Response): void {
    span.setAttribute('http.status_code', response.status);
    span.setAttribute('http.status_text', response.statusText);

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
        span.setAttribute('http.response_content_length', parseInt(contentLength, 10));
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
        span.setAttribute('http.response_content_type', contentType);
    }
}

/**
 * Span'ı manuel olarak fetch error ile güncelle
 */
export function updateSpanWithError(span: Span, error: Error): void {
    endSpanWithError(span, error);
}
