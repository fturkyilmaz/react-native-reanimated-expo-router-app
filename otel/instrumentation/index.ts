export {
    createTMDBTracedFetch,
    createTracedFetch,
    updateSpanWithError,
    updateSpanWithResponse,
    withTracing,
    type FetchInstrumentationOptions
} from './fetch';

export {
    handleErrorBoundaryError,
    initializeErrorHandlers,
    logApiError,
    logLogicError,
    logUIError,
    setupGlobalErrorHandler,
    setupPromiseRejectionHandler
} from './errors';

