/**
 * Deep Linking Configuration
 * 
 * Defines URL schemes, routes, and mappings for deep linking.
 * Supports both custom URL schemes and universal/app links.
 */

export interface DeepLinkRoute {
    pattern: string;
    screen: string;
    params?: Record<string, string>;
    requiresAuth?: boolean;
}

export interface DeepLinkConfig {
    scheme: string;
    domains: {
        production: string;
        staging?: string;
        development?: string;
    };
    routes: Record<string, DeepLinkRoute>;
    fallbackScreen: string;
}

export const DEEP_LINK_CONFIG: DeepLinkConfig = {
    scheme: 'cinesearch',
    domains: {
        production: 'https://cinesearch.app',
        staging: 'https://staging.cinesearch.app',
        development: 'https://dev.cinesearch.app',
    },
    routes: {
        home: {
            pattern: '',
            screen: '/(tabs)/index',
        },
        search: {
            pattern: 'search',
            screen: '/(tabs)/index',
            params: { q: ':q' },
        },
        movie: {
            pattern: 'movie/:id',
            screen: '/(movies)/[id]',
            params: { id: ':id' },
        },
        favorites: {
            pattern: 'favorites',
            screen: '/(tabs)/favorites',
            requiresAuth: true,
        },
        settings: {
            pattern: 'settings',
            screen: '/(tabs)/settings',
        },
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
    Object.values(DEEP_LINK_CONFIG.domains).forEach((domain) => {
        if (domain) prefixes.push(domain);
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
        let path = url;

        // Handle Expo dev URLs
        if (path.startsWith('exp://')) {
            const expMatch = path.match(/^exp:\/\/[^/]+\/?(.*)$/);
            if (expMatch) path = expMatch[1] || '';
        }

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

        // Split query
        const [pathPart, queryPart] = path.split('?');
        const params: Record<string, string> = {};

        if (queryPart) {
            const searchParams = new URLSearchParams(queryPart);
            searchParams.forEach((value, key) => {
                params[key] = value;
            });
        }

        // Root path fallback
        if (!pathPart || pathPart === '' || pathPart === '--') {
            return { route: 'home', params };
        }

        // Match route
        for (const [routeName, route] of Object.entries(DEEP_LINK_CONFIG.routes)) {
            const patternParts = route.pattern.split('/');
            const pathParts = pathPart.split('/');

            if (patternParts.length !== pathParts.length && !route.pattern.includes(':')) {
                continue;
            }

            let matches = true;
            const extractedParams: Record<string, string> = { ...params };

            for (let i = 0; i < patternParts.length; i++) {
                const patternPart = patternParts[i];
                const pathPartValue = pathParts[i];

                if (patternPart.startsWith(':')) {
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

        // Fallback screen
        return { route: 'home', params };
    } catch (error) {
        console.error('[DeepLink] Failed to parse URL:', error);
        return { route: 'home', params: {} };
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

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, encodeURIComponent(value));
        });
    }

    const queryParams: Record<string, string> = {};
    if (params && routeConfig.params) {
        Object.entries(routeConfig.params).forEach(([key, value]) => {
            if (value.startsWith(':')) {
                const paramName = value.slice(1);
                if (params[paramName]) {
                    queryParams[key] = params[paramName];
                }
            }
        });
    }

    const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
}

/**
 * Get screen path from route name
 */
export function getScreenFromRoute(
    route: string,
    params?: Record<string, string>
): { screen: string; params: Record<string, string> } | null {
    const routeConfig = DEEP_LINK_CONFIG.routes[route];
    if (!routeConfig) return null;

    let screen = routeConfig.screen;
    const finalParams = { ...params };

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
                        index: '',
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
