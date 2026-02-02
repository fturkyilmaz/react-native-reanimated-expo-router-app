/**
 * Deep Linking Module
 * 
 * Centralized exports for deep linking functionality.
 */

// Configuration
export {
    buildDeepLink, DEEP_LINK_CONFIG, getExpoRouterConfig, getLinkingPrefixes, getScreenFromRoute, parseDeepLink, routeRequiresAuth
} from './config';
export type {
    DeepLinkConfig, DeepLinkRoute
} from './config';

// Handler
export {
    generateMovieQRData, getCurrentURL, isValidDeepLink, openExternalURL, shareMovie,
    shareSearch, useDeepLinkHandler
} from './handler';
export type {
    DeepLinkResult
} from './handler';

// Provider
export {
    DeepLinkProvider,
    useDeepLink
} from './provider';

// Default export
export { default } from './provider';
