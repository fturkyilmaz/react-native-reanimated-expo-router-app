import { FeatureFlag, FeatureFlagAdapter, FeatureFlagConfig } from './types';

/**
 * Feature Flag Service
 * Birden fazla feature flag adapter'ını yönetir
 */
export class FeatureFlagService {
    private adapters: Map<string, FeatureFlagAdapter> = new Map();
    private config: FeatureFlagConfig;
    private cache: Map<string, FeatureFlag> = new Map();
    private listeners: Set<(key: string, value: unknown) => void> = new Set();
    private isInitialized = false;
    private refreshInterval?: ReturnType<typeof setInterval>;

    constructor(config: FeatureFlagConfig = {}) {
        this.config = {
            refreshInterval: 60000, // 1 dakika
            offlineMode: false,
            ...config,
        };
    }

    /**
     * Adapter ekle
     */
    addAdapter(adapter: FeatureFlagAdapter): void {
        if (this.adapters.has(adapter.name)) {
            console.warn(`[FeatureFlag] Adapter ${adapter.name} already exists`);
            return;
        }

        this.adapters.set(adapter.name, adapter);

        // Flag değişikliklerini dinle
        adapter.onFlagChange((key, value) => {
            this.handleFlagChange(key, value);
        });

        if (this.isInitialized) {
            adapter.initialize();
        }
    }

    /**
     * Adapter kaldır
     */
    removeAdapter(name: string): void {
        this.adapters.delete(name);
    }

    /**
     * Servisi başlat
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        const initPromises: Promise<void>[] = [];

        this.adapters.forEach((adapter) => {
            const result = adapter.initialize();
            if (result instanceof Promise) {
                initPromises.push(result);
            }
        });

        await Promise.all(initPromises);

        this.isInitialized = true;

        // Cache'i doldur
        await this.refreshCache();

        // Periyodik refresh başlat
        if (this.config.refreshInterval && this.config.refreshInterval > 0) {
            this.refreshInterval = setInterval(() => {
                this.refreshCache();
            }, this.config.refreshInterval);
        }
    }

    /**
     * Servisi kapat
     */
    destroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.listeners.clear();
        this.cache.clear();
    }

    /**
     * Boolean flag kontrolü
     */
    isEnabled(key: string, defaultValue = false): boolean {
        // Önce cache'e bak
        const cached = this.cache.get(key);
        if (cached && typeof cached.value === 'boolean') {
            return cached.value;
        }

        // Adapter'lardan kontrol et
        for (const adapter of this.adapters.values()) {
            try {
                const value = adapter.isEnabled(key, defaultValue);
                // Cache'e kaydet
                this.cache.set(key, { key, value });
                return value;
            } catch {
                // Sonraki adapter'a geç
                continue;
            }
        }

        return defaultValue;
    }

    /**
     * String değer al
     */
    getString(key: string, defaultValue = ''): string {
        const cached = this.cache.get(key);
        if (cached && typeof cached.value === 'string') {
            return cached.value;
        }

        for (const adapter of this.adapters.values()) {
            try {
                const value = adapter.getString(key, defaultValue);
                this.cache.set(key, { key, value });
                return value;
            } catch {
                continue;
            }
        }

        return defaultValue;
    }

    /**
     * Number değer al
     */
    getNumber(key: string, defaultValue = 0): number {
        const cached = this.cache.get(key);
        if (cached && typeof cached.value === 'number') {
            return cached.value;
        }

        for (const adapter of this.adapters.values()) {
            try {
                const value = adapter.getNumber(key, defaultValue);
                this.cache.set(key, { key, value });
                return value;
            } catch {
                continue;
            }
        }

        return defaultValue;
    }

    /**
     * Tüm flag'leri al
     */
    getAllFlags(): Record<string, FeatureFlag> {
        const allFlags: Record<string, FeatureFlag> = {};

        this.adapters.forEach((adapter) => {
            try {
                const flags = adapter.getAllFlags();
                Object.assign(allFlags, flags);
            } catch (error) {
                console.error(`[FeatureFlag] Error getting flags from ${adapter.name}:`, error);
            }
        });

        // Cache'i güncelle
        Object.entries(allFlags).forEach(([key, flag]) => {
            this.cache.set(key, flag);
        });

        return { ...allFlags, ...Object.fromEntries(this.cache) };
    }

    /**
     * Flag değişikliği dinle
     */
    onFlagChange(callback: (key: string, value: unknown) => void): () => void {
        this.listeners.add(callback);

        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Flag'leri yenile
     */
    async refresh(): Promise<void> {
        const refreshPromises: Promise<void>[] = [];

        this.adapters.forEach((adapter) => {
            try {
                const result = adapter.refresh();
                if (result instanceof Promise) {
                    refreshPromises.push(result);
                }
            } catch (error) {
                console.error(`[FeatureFlag] Error refreshing ${adapter.name}:`, error);
            }
        });

        await Promise.all(refreshPromises);
        await this.refreshCache();
    }

    /**
     * Cache'i yenile
     */
    private async refreshCache(): Promise<void> {
        this.adapters.forEach((adapter) => {
            try {
                const flags = adapter.getAllFlags();
                Object.entries(flags).forEach(([key, flag]) => {
                    this.cache.set(key, flag);
                });
            } catch (error) {
                console.error(`[FeatureFlag] Error refreshing cache from ${adapter.name}:`, error);
            }
        });
    }

    /**
     * Flag değişikliği handler'ı
     */
    private handleFlagChange(key: string, value: unknown): void {
        // Cache'i güncelle
        const flagValue = value as boolean | string | number;
        this.cache.set(key, { key, value: flagValue });

        // Dinleyicileri bilgilendir
        this.listeners.forEach((callback) => {
            try {
                callback(key, value);
            } catch (error) {
                console.error('[FeatureFlag] Error in listener callback:', error);
            }
        });
    }
}

// Singleton instance
let featureFlagService: FeatureFlagService | null = null;

/**
 * Feature flag service instance al
 */
export function getFeatureFlagService(config?: FeatureFlagConfig): FeatureFlagService {
    if (!featureFlagService) {
        featureFlagService = new FeatureFlagService(config);
    }
    return featureFlagService;
}

/**
 * Feature flag service'i sıfırla (test için)
 */
export function resetFeatureFlagService(): void {
    featureFlagService?.destroy();
    featureFlagService = null;
}
