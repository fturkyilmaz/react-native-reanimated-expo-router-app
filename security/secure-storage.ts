/**
 * Secure Storage Module
 * 
 * Provides secure storage for sensitive data with automatic security auditing.
 * Uses expo-secure-store for sensitive data and AsyncStorage for non-sensitive data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage key enumeration
 * Centralizes all storage keys for better management and auditing
 */
export enum StorageKey {
    // Authentication
    AUTH_TOKEN = 'cinesearch.auth_token',
    REFRESH_TOKEN = 'cinesearch.refresh_token',
    USER_DATA = 'cinesearch.user_data',
    SESSION_ID = 'cinesearch.session_id',

    // Security
    BIOMETRIC_ENABLED = 'cinesearch.biometric_enabled',
    PIN_CODE = 'cinesearch.pin_code',
    SECURITY_SETTINGS = 'cinesearch.security_settings',

    // Preferences
    THEME_PREFERENCE = 'cinesearch.theme_preference',
    LANGUAGE = 'cinesearch.language',
    NOTIFICATIONS_ENABLED = 'cinesearch.notifications_enabled',

    // Analytics
    ANALYTICS_CONSENT = 'cinesearch.analytics_consent',
    ANALYTICS_USER_ID = 'cinesearch.analytics_user_id',

    // Feature Flags
    FEATURE_FLAGS = 'cinesearch.feature_flags',

    // Cache
    MOVIES_CACHE = 'cinesearch.movies_cache',
    FAVORITES_CACHE = 'cinesearch.favorites_cache',
    SEARCH_HISTORY = 'cinesearch.search_history',
}

/**
 * Storage item metadata
 */
export interface StorageItem {
    key: string;
    isSecure: boolean;
    sensitive: boolean;
    description: string;
}

/**
 * Storage audit result
 */
export interface StorageAudit {
    key: string;
    storageType: 'secure' | 'insecure';
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
    details?: {
        size?: number;
        lastModified?: string;
        containsSensitiveData?: boolean;
    };
}

/**
 * Storage operation result
 */
export interface StorageResult<T = string> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Secure Storage Manager
 * 
 * Manages secure storage operations with automatic security auditing
 */
export class SecureStorage {
    private static instance: SecureStorage;
    private auditLog: StorageAudit[] = [];
    private sensitiveKeys: Set<string> = new Set([
        StorageKey.AUTH_TOKEN,
        StorageKey.REFRESH_TOKEN,
        StorageKey.USER_DATA,
        StorageKey.SESSION_ID,
        StorageKey.PIN_CODE,
        StorageKey.SECURITY_SETTINGS,
        StorageKey.ANALYTICS_USER_ID,
    ]);

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): SecureStorage {
        if (!SecureStorage.instance) {
            SecureStorage.instance = new SecureStorage();
        }
        return SecureStorage.instance;
    }

    /**
     * Store sensitive data securely
     * 
     * @param key - Storage key
     * @param value - Value to store
     * @param options - Secure store options
     */
    async setSecureItem(
        key: StorageKey,
        value: string,
        options?: SecureStore.SecureStoreOptions
    ): Promise<StorageResult> {
        try {
            const secureOptions: SecureStore.SecureStoreOptions = {
                keychainService: 'com.cinesearch.secure',
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                ...options,
            };

            await SecureStore.setItemAsync(key, value, secureOptions);

            return {
                success: true,
                data: value,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to store ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Store non-sensitive data
     * 
     * @param key - Storage key
     * @param value - Value to store
     */
    async setItem(key: StorageKey, value: string): Promise<StorageResult> {
        try {
            await AsyncStorage.setItem(key, value);

            return {
                success: true,
                data: value,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to store ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Store object as JSON
     * 
     * @param key - Storage key
     * @param value - Object to store
     * @param secure - Whether to use secure storage
     */
    async setObject<T>(
        key: StorageKey,
        value: T,
        secure: boolean = false
    ): Promise<StorageResult<T>> {
        try {
            const jsonValue = JSON.stringify(value);

            if (secure) {
                const result = await this.setSecureItem(key, jsonValue);
                return {
                    success: result.success,
                    data: value,
                    error: result.error,
                };
            } else {
                const result = await this.setItem(key, jsonValue);
                return {
                    success: result.success,
                    data: value,
                    error: result.error,
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Retrieve secure item
     * 
     * @param key - Storage key
     */
    async getSecureItem(key: StorageKey): Promise<StorageResult> {
        try {
            const value = await SecureStore.getItemAsync(key);

            return {
                success: true,
                data: value || undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to retrieve ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Retrieve item
     * 
     * @param key - Storage key
     */
    async getItem(key: StorageKey): Promise<StorageResult> {
        try {
            const value = await AsyncStorage.getItem(key);

            return {
                success: true,
                data: value || undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to retrieve ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Retrieve and parse JSON object
     * 
     * @param key - Storage key
     * @param secure - Whether to use secure storage
     */
    async getObject<T>(key: StorageKey, secure: boolean = false): Promise<StorageResult<T>> {
        try {
            const result = secure
                ? await this.getSecureItem(key)
                : await this.getItem(key);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'No data found',
                };
            }

            const parsed = JSON.parse(result.data) as T;

            return {
                success: true,
                data: parsed,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Delete secure item
     * 
     * @param key - Storage key
     */
    async deleteSecureItem(key: StorageKey): Promise<StorageResult> {
        try {
            await SecureStore.deleteItemAsync(key);

            return {
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to delete ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Delete item
     * 
     * @param key - Storage key
     */
    async deleteItem(key: StorageKey): Promise<StorageResult> {
        try {
            await AsyncStorage.removeItem(key);

            return {
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SecureStorage] Failed to delete ${key}:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Check if key should use secure storage
     * 
     * @param key - Storage key
     */
    isSensitiveKey(key: string): boolean {
        return this.sensitiveKeys.has(key);
    }

    /**
     * Perform comprehensive storage security audit
     */
    async performAudit(): Promise<StorageAudit[]> {
        this.auditLog = [];

        try {
            // Audit AsyncStorage
            const asyncKeys = await AsyncStorage.getAllKeys();

            for (const key of asyncKeys) {
                const value = await AsyncStorage.getItem(key);
                await this.analyzeStorageItem(key, value || '', false);
            }

            // Audit SecureStore (we can't list keys, but we can check known sensitive keys)
            for (const key of this.sensitiveKeys) {
                try {
                    const value = await SecureStore.getItemAsync(key);
                    if (value !== null) {
                        await this.analyzeStorageItem(key, value, true);
                    }
                } catch {
                    // Key doesn't exist in secure storage
                }
            }

            return this.auditLog;
        } catch (error) {
            console.error('[SecureStorage] Audit failed:', error);
            return this.auditLog;
        }
    }

    /**
     * Analyze a storage item for security risks
     */
    private async analyzeStorageItem(
        key: string,
        value: string,
        isSecureStorage: boolean
    ): Promise<void> {
        const sensitivePatterns = [
            /token/i,
            /password/i,
            /secret/i,
            /key/i,
            /auth/i,
            /credential/i,
            /session/i,
            /pin/i,
            /ssn/i,
            /credit.?card/i,
        ];

        const isSensitiveKey = this.isSensitiveKey(key);
        const containsSensitiveData = sensitivePatterns.some(pattern =>
            pattern.test(key) || pattern.test(value)
        );

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        let recommendation = '';

        if (isSensitiveKey || containsSensitiveData) {
            if (!isSecureStorage) {
                riskLevel = 'high';
                recommendation = `Move sensitive data to secure storage: ${key}`;
            } else {
                riskLevel = 'low';
                recommendation = 'Properly stored in secure storage';
            }
        } else {
            if (isSecureStorage) {
                riskLevel = 'medium';
                recommendation = 'Non-sensitive data in secure storage - consider using AsyncStorage';
            } else {
                riskLevel = 'low';
                recommendation = 'Appropriate storage for non-sensitive data';
            }
        }

        this.auditLog.push({
            key,
            storageType: isSecureStorage ? 'secure' : 'insecure',
            riskLevel,
            recommendation,
            details: {
                size: value.length,
                containsSensitiveData,
            },
        });
    }

    /**
     * Get high-risk items from last audit
     */
    getHighRiskItems(): StorageAudit[] {
        return this.auditLog.filter(item => item.riskLevel === 'high');
    }

    /**
     * Clear all storage (use with caution)
     */
    async clearAll(): Promise<StorageResult> {
        try {
            // Clear AsyncStorage
            await AsyncStorage.clear();

            // Clear SecureStore (known keys only)
            for (const key of this.sensitiveKeys) {
                try {
                    await SecureStore.deleteItemAsync(key);
                } catch {
                    // Ignore errors for individual keys
                }
            }

            return {
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Clear only sensitive data
     */
    async clearSensitiveData(): Promise<StorageResult> {
        try {
            for (const key of this.sensitiveKeys) {
                // Try to delete from both storages
                try {
                    await SecureStore.deleteItemAsync(key);
                } catch {
                    // Ignore errors
                }

                try {
                    await AsyncStorage.removeItem(key);
                } catch {
                    // Ignore errors
                }
            }

            return {
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats(): Promise<{
        asyncStorage: { keys: number; size: number };
        secureStorage: { keys: number };
    }> {
        const asyncKeys = await AsyncStorage.getAllKeys();
        let asyncSize = 0;

        for (const key of asyncKeys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                asyncSize += value.length;
            }
        }

        // Count secure storage items (known keys only)
        let secureCount = 0;
        for (const key of this.sensitiveKeys) {
            try {
                const value = await SecureStore.getItemAsync(key);
                if (value !== null) {
                    secureCount++;
                }
            } catch {
                // Key doesn't exist
            }
        }

        return {
            asyncStorage: {
                keys: asyncKeys.length,
                size: asyncSize,
            },
            secureStorage: {
                keys: secureCount,
            },
        };
    }
}

/**
 * Hook for React components to access secure storage
 */
export function useSecureStorage() {
    const storage = SecureStorage.getInstance();

    return {
        setSecureItem: storage.setSecureItem.bind(storage),
        setItem: storage.setItem.bind(storage),
        setObject: storage.setObject.bind(storage),
        getSecureItem: storage.getSecureItem.bind(storage),
        getItem: storage.getItem.bind(storage),
        getObject: storage.getObject.bind(storage),
        deleteSecureItem: storage.deleteSecureItem.bind(storage),
        deleteItem: storage.deleteItem.bind(storage),
        isSensitiveKey: storage.isSensitiveKey.bind(storage),
        performAudit: storage.performAudit.bind(storage),
        getHighRiskItems: storage.getHighRiskItems.bind(storage),
        clearSensitiveData: storage.clearSensitiveData.bind(storage),
        getStorageStats: storage.getStorageStats.bind(storage),
    };
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

export default secureStorage;
