/**
 * SSL Pinning Tests
 */

import {
    buildDeepLink,
    getScreenFromRoute,
    parseDeepLink,
    routeRequiresAuth
} from '@/deep-linking/config';
import { SSLPinningManager } from '@/security';

describe('SSLPinningManager', () => {
    let manager: SSLPinningManager;

    beforeEach(() => {
        manager = SSLPinningManager.getInstance();
        manager.clearConfigs();
        manager.setEnabled(true);
    });

    describe('Configuration', () => {
        it('should add pin configuration', () => {
            manager.addPinConfig({
                domain: 'test.com',
                pins: ['sha256/TEST123'],
            });

            const config = manager.getPinConfig('test.com');
            expect(config).toBeDefined();
            expect(config?.domain).toBe('test.com');
        });

        it('should remove pin configuration', () => {
            manager.addPinConfig({
                domain: 'test.com',
                pins: ['sha256/TEST123'],
            });

            manager.removePinConfig('test.com');
            const config = manager.getPinConfig('test.com');
            expect(config).toBeUndefined();
        });

        it('should enable/disable SSL pinning', () => {
            expect(manager.isEnabled()).toBe(true);

            manager.setEnabled(false);
            expect(manager.isEnabled()).toBe(false);

            manager.setEnabled(true);
            expect(manager.isEnabled()).toBe(true);
        });
    });

    describe('Certificate Validation', () => {
        beforeEach(() => {
            manager.addPinConfig({
                domain: 'api.example.com',
                pins: [
                    'sha256/PRIMARY123',
                    'sha256/BACKUP456',
                ],
            });
        });

        it('should validate matching certificate', () => {
            const result = manager.validateCertificate('api.example.com', [
                'sha256/PRIMARY123',
            ]);

            expect(result.isValid).toBe(true);
            expect(result.matchedPin).toBe('sha256/PRIMARY123');
        });

        it('should validate with backup pin', () => {
            const result = manager.validateCertificate('api.example.com', [
                'sha256/BACKUP456',
            ]);

            expect(result.isValid).toBe(true);
            expect(result.matchedPin).toBe('sha256/BACKUP456');
        });

        it('should reject non-matching certificate', () => {
            const result = manager.validateCertificate('api.example.com', [
                'sha256/INVALID789',
            ]);

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('does not match');
        });

        it('should allow unknown domains when no config exists', () => {
            const result = manager.validateCertificate('unknown.com', [
                'sha256/ANYTHING',
            ]);

            expect(result.isValid).toBe(true);
        });

        it('should skip validation when disabled', () => {
            manager.setEnabled(false);

            const result = manager.validateCertificate('api.example.com', [
                'sha256/INVALID',
            ]);

            expect(result.isValid).toBe(true);
        });
    });

    describe('Subdomain Support', () => {
        beforeEach(() => {
            manager.addPinConfig({
                domain: 'example.com',
                pins: ['sha256/TEST'],
                includeSubdomains: true,
            });
        });

        it('should match subdomains when enabled', () => {
            const config = manager.getPinConfig('api.example.com');
            expect(config).toBeDefined();
            expect(config?.domain).toBe('example.com');
        });

        it('should not match subdomains when disabled', () => {
            manager.addPinConfig({
                domain: 'other.com',
                pins: ['sha256/TEST'],
                includeSubdomains: false,
            });

            const config = manager.getPinConfig('api.other.com');
            expect(config).toBeUndefined();
        });
    });

    describe('Expiration', () => {
        it('should reject expired pins', () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            manager.addPinConfig({
                domain: 'expired.com',
                pins: ['sha256/TEST'],
                expirationDate: pastDate.toISOString(),
            });

            const result = manager.validateCertificate('expired.com', [
                'sha256/TEST',
            ]);

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('expired');
        });
    });
});

describe('Deep Link Config', () => {
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

        it('should parse universal link URL', () => {
            const result = parseDeepLink('https://cinesearch.app/movie/456');
            expect(result.route).toBe('movie');
            expect(result.params).toEqual({ id: '456' });
        });

        it('should return null for unknown routes', () => {
            const result = parseDeepLink('cinesearch://unknown');
            expect(result.route).toBeNull();
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

        it('should use universal link when requested', () => {
            const url = buildDeepLink('movie', { id: '123' }, true);
            expect(url).toContain('https://cinesearch.app');
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

        it('should return null for unknown route', () => {
            const result = getScreenFromRoute('unknown');
            expect(result).toBeNull();
        });
    });

    describe('routeRequiresAuth', () => {
        it('should return true for favorites route', () => {
            expect(routeRequiresAuth('favorites')).toBe(true);
        });

        it('should return false for movie route', () => {
            expect(routeRequiresAuth('movie')).toBe(false);
        });

        it('should return false for unknown route', () => {
            expect(routeRequiresAuth('unknown')).toBe(false);
        });
    });
});
