export {
    ApiAttributes,
    DeviceAttributes,
    ErrorAttributes,
    filterSensitiveAttributes,
    HttpAttributes,
    mergeAttributes,
    PerformanceAttributes,
    UserActionAttributes
} from './attributes';

export {
    addEvent,
    addSpanTag,
    createApiSpan,
    createPerformanceSpan,
    createSpan,
    createUserActionSpan,
    endSpan,
    endSpanWithError,
    getCurrentSpanContext,
    recordException,
    setSpanAttributes,
    withSpan,
    type CreateSpanOptions
} from './span-utils';

