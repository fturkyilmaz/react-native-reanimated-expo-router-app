/**
 * Secure Storage Tests
 */

import { SecureStorage, StorageKey } from '@/security';

describe('SecureStorage', () => {
    let storage: SecureStorage;

    beforeEach(() => {
        storage = SecureStorage.getInstance();
    });

    afterEach(async () => {
        // Clean up after each test
        await storage.deleteSecureItem(StorageKey.AUTH_TOKEN);
        await storage.deleteItem(StorageKey.THEME_PREFERENCE);
    });

    describe('Secure Items', () => {
        it('should store and retrieve secure item', async () => {
            const testValue = 'test-token-123';

            const setResult = await storage.setSecureItem(StorageKey.AUTH_TOKEN, testValue);
            expect(setResult.success).toBe(true);

            const getResult = await storage.getSecureItem(StorageKey.AUTH_TOKEN);
            expect(getResult.success).toBe(true);
            expect(getResult.data).toBe(testValue);
        });

        it('should return null for non-existent secure item', async () => {
            const result = await storage.getSecureItem(StorageKey.REFRESH_TOKEN);
            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('should delete secure item', async () => {
            await storage.setSecureItem(StorageKey.AUTH_TOKEN, 'test');

            const deleteResult = await storage.deleteSecureItem(StorageKey.AUTH_TOKEN);
            expect(deleteResult.success).toBe(true);

            const getResult = await storage.getSecureItem(StorageKey.AUTH_TOKEN);
            expect(getResult.data).toBeNull();
        });
    });

    describe('Regular Items', () => {
        it('should store and retrieve regular item', async () => {
            const testValue = 'dark';

            const setResult = await storage.setItem(StorageKey.THEME_PREFERENCE, testValue);
            expect(setResult.success).toBe(true);

            const getResult = await storage.getItem(StorageKey.THEME_PREFERENCE);
            expect(getResult.success).toBe(true);
            expect(getResult.data).toBe(testValue);
        });

        it('should delete regular item', async () => {
            await storage.setItem(StorageKey.THEME_PREFERENCE, 'light');

            const deleteResult = await storage.deleteItem(StorageKey.THEME_PREFERENCE);
            expect(deleteResult.success).toBe(true);

            const getResult = await storage.getItem(StorageKey.THEME_PREFERENCE);
            expect(getResult.data).toBeNull();
        });
    });

    describe('Object Storage', () => {
        it('should store and retrieve object securely', async () => {
            const testObject = { id: '1', name: 'Test User', email: 'test@test.com' };

            const setResult = await storage.setObject(StorageKey.USER_DATA, testObject, true);
            expect(setResult.success).toBe(true);
            expect(setResult.data).toEqual(testObject);

            const getResult = await storage.getObject<typeof testObject>(StorageKey.USER_DATA, true);
            expect(getResult.success).toBe(true);
            expect(getResult.data).toEqual(testObject);
        });

        it('should store and retrieve object in regular storage', async () => {
            const testObject = { theme: 'dark', language: 'tr' };

            await storage.setObject(StorageKey.THEME_PREFERENCE, testObject, false);

            const getResult = await storage.getObject<typeof testObject>(StorageKey.THEME_PREFERENCE, false);
            expect(getResult.success).toBe(true);
            expect(getResult.data).toEqual(testObject);
        });
    });

    describe('Sensitive Key Detection', () => {
        it('should identify sensitive keys', () => {
            expect(storage.isSensitiveKey(StorageKey.AUTH_TOKEN)).toBe(true);
            expect(storage.isSensitiveKey(StorageKey.USER_DATA)).toBe(true);
            expect(storage.isSensitiveKey(StorageKey.REFRESH_TOKEN)).toBe(true);
        });

        it('should identify non-sensitive keys', () => {
            expect(storage.isSensitiveKey(StorageKey.THEME_PREFERENCE)).toBe(false);
            expect(storage.isSensitiveKey(StorageKey.LANGUAGE)).toBe(false);
        });
    });

    describe('Storage Audit', () => {
        it('should perform storage audit', async () => {
            // Add some test data
            await storage.setSecureItem(StorageKey.AUTH_TOKEN, 'secret-token');
            await storage.setItem(StorageKey.THEME_PREFERENCE, 'dark');

            const audit = await storage.performAudit();

            expect(Array.isArray(audit)).toBe(true);
            expect(audit.length).toBeGreaterThan(0);

            // Check audit structure
            const auditItem = audit[0];
            expect(auditItem).toHaveProperty('key');
            expect(auditItem).toHaveProperty('storageType');
            expect(auditItem).toHaveProperty('riskLevel');
            expect(auditItem).toHaveProperty('recommendation');
        });

        it('should identify high-risk items', async () => {
            await storage.setItem(StorageKey.AUTH_TOKEN, 'secret'); // Storing sensitive in regular storage

            await storage.performAudit();
            const highRiskItems = storage.getHighRiskItems();

            // Should have at least one high-risk item
            expect(highRiskItems.length).toBeGreaterThan(0);
            expect(highRiskItems[0].riskLevel).toBe('high');
        });
    });

    describe('Clear Operations', () => {
        it('should clear sensitive data', async () => {
            await storage.setSecureItem(StorageKey.AUTH_TOKEN, 'test');
            await storage.setItem(StorageKey.THEME_PREFERENCE, 'dark');

            const result = await storage.clearSensitiveData();
            expect(result.success).toBe(true);

            // Sensitive data should be cleared
            const tokenResult = await storage.getSecureItem(StorageKey.AUTH_TOKEN);
            expect(tokenResult.data).toBeNull();
        });
    });

    describe('Storage Stats', () => {
        it('should get storage statistics', async () => {
            await storage.setItem(StorageKey.THEME_PREFERENCE, 'dark');

            const stats = await storage.getStorageStats();

            expect(stats).toHaveProperty('asyncStorage');
            expect(stats).toHaveProperty('secureStorage');
            expect(stats.asyncStorage).toHaveProperty('keys');
            expect(stats.asyncStorage).toHaveProperty('size');
            expect(stats.secureStorage).toHaveProperty('keys');
        });
    });
});
