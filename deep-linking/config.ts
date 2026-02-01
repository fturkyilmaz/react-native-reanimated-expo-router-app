/**
 * Deep Linking Configuration
 * 
 * Defines URL schemes, routes, and mappings for deep linking.
 * Supports both custom URL schemes and universal/app links.
 */

/**
 * Deep link route configuration
 */
export interface DeepLinkRoute {
    /** Route pattern (e.g., 'movie/:id') */
    pattern: string;
    /** Target screen path */
    screen: string;
    /** Parameter mappings */
    params?: Record<string, string>;
    /** Whether authentication is required */
    requiresAuth?: boolean;
}

/**
 * Deep link configuration object
 */
export interface DeepLinkConfig {
    /** Custom URL scheme (e.g., 'cinesearch') */
    scheme: string;
    /** Universal/App link domains */
    domains: {
        production: string;
        staging?: string;
        development?: string;
    };
    /** Route definitions */
    routes: Record<string, DeepLinkRoute>;
    /** Default screen when route not found */
    fallbackScreen: string;
}

/**
 * Default deep link configuration
 */
export const DEEP_LINK_CONFIG: DeepLinkConfig = {
    scheme: 'cinesearch',
    domains: {
        production: 'https://cinesearch.app',
        staging: 'https://staging.cinesearch.app',
        development: 'https://dev.cinesearch.app',
    },
    routes: {
        // Home / Search
        home: {
            pattern: '',
            screen: '/(tabs)/index',
        },
        search: {
            pattern: 'search',
            screen: '/(tabs)/index',
            params: { search: ':q' },
        },

        // Movie details
        movie: {
            pattern: 'movie/:id',
            screen: '/(movies)/[id]',
            params: { id: ':id' },
        },

        // User sections
        favorites: {
            pattern: 'favorites',
            screen: '/(tabs)/favorites',
            requiresAuth: true,
        },
        settings: {
            pattern: 'settings',
            screen: '/(tabs)/settings',
        },

        // Auth
        login: {
            pattern: 'login',
            screen: '/(auth)/login',
        },
        register: {
            pattern: 'register',
            screen: '/(auth)/register',
        },
    },
    fallbackScreen: '/(tabs)/index',
};

/**
 * Get all URL prefixes for linking configuration
 */
export function getLinkingPrefixes(): string[] {
    const prefixes = [`${DEEP_LINK_CONFIG.scheme}://`];

    // Add domain prefixes
    Object.values(DEEP_LINK_CONFIG.domains).forEach((domain) => {
        if (domain) {
            prefixes.push(domain);
        }
    });

    return prefixes;
}

/**
 * Parse a deep link URL
 */
export function parseDeepLink(url: string): {
    route: string | null;
    params: Record<string, string>;
} {
    try {
        // Remove scheme and domain
        let path = url;

        // Remove custom scheme
        if (path.startsWith(`${DEEP_LINK_CONFIG.scheme}://`)) {
            path = path.replace(`${DEEP_LINK_CONFIG.scheme}://`, '');
        }

        // Remove domain prefixes
        Object.values(DEEP_LINK_CONFIG.domains).forEach((domain) => {
            if (domain && path.startsWith(domain)) {
                path = path.replace(domain, '');
            }
        });

        // Remove leading slash
        path = path.replace(/^\//, '');

        // Parse query parameters
        const [pathPart, queryPart] = path.split('?');
        const params: Record<string, string> = {};

        if (queryPart) {
            const searchParams = new URLSearchParams(queryPart);
            searchParams.forEach((value, key) => {
                params[key] = value;
            });
        }

        // Match route
        for (const [routeName, route] of Object.entries(DEEP_LINK_CONFIG.routes)) {
            const pattern = route.pattern;
            const patternParts = pattern.split('/');
            const pathParts = pathPart.split('/');

            if (patternParts.length !== pathParts.length && !pattern.includes(':')) {
                continue;
            }

            let matches = true;
            const extractedParams: Record<string, string> = { ...params };

            for (let i = 0; i < patternParts.length; i++) {
                const patternPart = patternParts[i];
                const pathPartValue = pathParts[i];

                if (patternPart.startsWith(':')) {
                    // Parameter
                    const paramName = patternPart.slice(1);
                    extractedParams[paramName] = pathPartValue;
                } else if (patternPart !== pathPartValue) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                return { route: routeName, params: extractedParams };
            }
        }

        return { route: null, params };
    } catch (error) {
        console.error('[DeepLink] Failed to parse URL:', error);
        return { route: null, params: {} };
    }
}

/**
 * Build a deep link URL
 */
export function buildDeepLink(
    route: string,
    params?: Record<string, string>,
    useUniversalLink: boolean = false
): string {
    const routeConfig = DEEP_LINK_CONFIG.routes[route];

    if (!routeConfig) {
        console.warn(`[DeepLink] Unknown route: ${route}`);
        return `${DEEP_LINK_CONFIG.scheme}://`;
    }

    const baseUrl = useUniversalLink
        ? DEEP_LINK_CONFIG.domains.production
        : `${DEEP_LINK_CONFIG.scheme}://`;

    let path = routeConfig.pattern;

    // Replace parameters in path
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, encodeURIComponent(value));
        });
    }

    // Build query string for remaining params
    const queryParams: Record<string, string> = {};
    if (params && routeConfig.params) {
        Object.entries(params).forEach(([key, value]) => {
            if (!path.includes(value)) {
                queryParams[key] = value;
            }
        });
    }

    const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    if (queryString) {
        return `${baseUrl}${path}?${queryString}`;
    }

    return `${baseUrl}${path}`;
}

/**
 * Get screen path from route name
 */
export function getScreenFromRoute(
    route: string,
    params?: Record<string, string>
): { screen: string; params: Record<string, string> } | null {
    const routeConfig = DEEP_LINK_CONFIG.routes[route];

    if (!routeConfig) {
        return null;
    }

    let screen = routeConfig.screen;
    const finalParams = { ...params };

    // Replace dynamic segments in screen path
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            screen = screen.replace(`[${key}]`, value);
            delete finalParams[key];
        });
    }

    return { screen, params: finalParams };
}

/**
 * Check if route requires authentication
 */
export function routeRequiresAuth(route: string): boolean {
    const routeConfig = DEEP_LINK_CONFIG.routes[route];
    return routeConfig?.requiresAuth ?? false;
}

/**
 * Expo Router linking configuration
 */
export function getExpoRouterConfig() {
    return {
        prefixes: getLinkingPrefixes(),
        config: {
            screens: {
                '(tabs)': {
                    screens: {
                        index: {
                            path: '',
                            parse: {
                                search: (search: string) => search,
                            },
                        },
                        favorites: 'favorites',
                        settings: 'settings',
                    },
                },
                '(movies)': {
                    screens: {
                        '[id]': 'movie/:id',
                    },
                },
                '(auth)': {
                    screens: {
                        login: 'login',
                        register: 'register',
                        'forgot-password': 'forgot-password',
                    },
                },
            },
        },
    };
}

export default DEEP_LINK_CONFIG;
