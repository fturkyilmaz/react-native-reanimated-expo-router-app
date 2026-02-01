/**
 * Deep Linking Config Tests
 */

import {
    buildDeepLink,
    DEEP_LINK_CONFIG,
    getExpoRouterConfig,
    getLinkingPrefixes,
    getScreenFromRoute,
    parseDeepLink,
    routeRequiresAuth,
} from '@/deep-linking/config';

describe('Deep Link Config', () => {
    describe('Configuration', () => {
        it('should have valid scheme', () => {
            expect(DEEP_LINK_CONFIG.scheme).toBe('cinesearch');
        });

        it('should have production domain', () => {
            expect(DEEP_LINK_CONFIG.domains.production).toBe('https://cinesearch.app');
        });

        it('should have routes defined', () => {
            expect(Object.keys(DEEP_LINK_CONFIG.routes).length).toBeGreaterThan(0);
        });

        it('should have fallback screen', () => {
            expect(DEEP_LINK_CONFIG.fallbackScreen).toBeDefined();
        });
    });

    describe('getLinkingPrefixes', () => {
        it('should include custom scheme', () => {
            const prefixes = getLinkingPrefixes();
            expect(prefixes).toContain('cinesearch://');
        });

        it('should include domain prefixes', () => {
            const prefixes = getLinkingPrefixes();
            expect(prefixes).toContain('https://cinesearch.app');
        });
    });

    describe('parseDeepLink', () => {
        it('should parse movie detail URL', () => {
            const result = parseDeepLink('cinesearch://movie/123');
            expect(result.route).toBe('movie');
            expect(result.params).toEqual({ id: '123' });
        });

        it('should parse search URL with query', () => {
            const result = parseDeepLink('cinesearch://search?q=batman');
            expect(result.route).toBe('search');
            expect(result.params).toEqual({ q: 'batman' });
        });

        it('should parse favorites URL', () => {
            const result = parseDeepLink('cinesearch://favorites');
            expect(result.route).toBe('favorites');
            expect(result.params).toEqual({});
        });

        it('should parse settings URL', () => {
            const result = parseDeepLink('cinesearch://settings');
            expect(result.route).toBe('settings');
            expect(result.params).toEqual({});
        });

        it('should parse login URL', () => {
            const result = parseDeepLink('cinesearch://login');
            expect(result.route).toBe('login');
        });

        it('should parse universal link URL', () => {
            const result = parseDeepLink('https://cinesearch.app/movie/456');
            expect(result.route).toBe('movie');
            expect(result.params).toEqual({ id: '456' });
        });

        it('should return null for unknown routes', () => {
            const result = parseDeepLink('cinesearch://unknown');
            expect(result.route).toBeNull();
        });

        it('should handle URLs with multiple query params', () => {
            const result = parseDeepLink('cinesearch://search?q=batman&year=2024');
            expect(result.params).toHaveProperty('q', 'batman');
        });
    });

    describe('buildDeepLink', () => {
        it('should build movie detail URL', () => {
            const url = buildDeepLink('movie', { id: '123' });
            expect(url).toContain('/movie/123');
        });

        it('should build search URL with query', () => {
            const url = buildDeepLink('search', { q: 'batman' });
            expect(url).toContain('/search');
            expect(url).toContain('q=batman');
        });

        it('should use custom scheme by default', () => {
            const url = buildDeepLink('favorites');
            expect(url).toContain('cinesearch://');
        });

        it('should use universal link when requested', () => {
            const url = buildDeepLink('movie', { id: '123' }, true);
            expect(url).toContain('https://cinesearch.app');
        });

        it('should handle special characters in params', () => {
            const url = buildDeepLink('search', { q: 'batman & robin' });
            expect(url).not.toContain(' ');
            expect(url).toContain(encodeURIComponent('batman & robin'));
        });
    });

    describe('getScreenFromRoute', () => {
        it('should get screen for movie route', () => {
            const result = getScreenFromRoute('movie', { id: '123' });
            expect(result?.screen).toBe('/(movies)/123');
        });

        it('should get screen for favorites route', () => {
            const result = getScreenFromRoute('favorites');
            expect(result?.screen).toBe('/(tabs)/favorites');
        });

        it('should get screen for settings route', () => {
            const result = getScreenFromRoute('settings');
            expect(result?.screen).toBe('/(tabs)/settings');
        });

        it('should get screen for login route', () => {
            const result = getScreenFromRoute('login');
            expect(result?.screen).toBe('/(auth)/login');
        });

        it('should return null for unknown route', () => {
            const result = getScreenFromRoute('unknown');
            expect(result).toBeNull();
        });

        it('should include remaining params', () => {
            const result = getScreenFromRoute('search', { q: 'batman', filter: 'new' });
            expect(result?.params).toEqual({ filter: 'new' });
        });
    });

    describe('routeRequiresAuth', () => {
        it('should return true for favorites route', () => {
            expect(routeRequiresAuth('favorites')).toBe(true);
        });

        it('should return false for movie route', () => {
            expect(routeRequiresAuth('movie')).toBe(false);
        });

        it('should return false for search route', () => {
            expect(routeRequiresAuth('search')).toBe(false);
        });

        it('should return false for unknown route', () => {
            expect(routeRequiresAuth('unknown')).toBe(false);
        });
    });

    describe('getExpoRouterConfig', () => {
        it('should return valid config object', () => {
            const config = getExpoRouterConfig();

            expect(config).toHaveProperty('prefixes');
            expect(config).toHaveProperty('config');
            expect(config.config).toHaveProperty('screens');
        });

        it('should include prefixes', () => {
            const config = getExpoRouterConfig();
            expect(config.prefixes.length).toBeGreaterThan(0);
        });

        it('should include tab screens', () => {
            const config = getExpoRouterConfig();
            expect(config.config.screens).toHaveProperty('(tabs)');
        });

        it('should include movie screens', () => {
            const config = getExpoRouterConfig();
            expect(config.config.screens).toHaveProperty('(movies)');
        });

        it('should include auth screens', () => {
            const config = getExpoRouterConfig();
            expect(config.config.screens).toHaveProperty('(auth)');
        });
    });
});
