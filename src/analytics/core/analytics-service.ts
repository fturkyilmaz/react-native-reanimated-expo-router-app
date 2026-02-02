import {
    AnalyticsAdapter,
    AnalyticsConfig,
    AnalyticsEvent,
    AnalyticsProperties,
    UserProperties,
} from './types';

/**
 * Analytics Service
 * Birden fazla analytics adapter'ını yönetir
 */
export class AnalyticsService {
    private adapters: Map<string, AnalyticsAdapter> = new Map();
    private config: AnalyticsConfig;
    private eventQueue: AnalyticsEvent[] = [];
    private isInitialized = false;

    constructor(config: AnalyticsConfig = {}) {
        this.config = {
            debug: false,
            autoTrackScreens: true,
            autoTrackSessions: true,
            ...config,
        };
    }

    /**
     * Adapter ekle
     */
    addAdapter(adapter: AnalyticsAdapter): void {
        if (this.adapters.has(adapter.name)) {
            console.warn(`[Analytics] Adapter ${adapter.name} already exists`);
            return;
        }

        this.adapters.set(adapter.name, adapter);

        if (this.isInitialized && adapter.isEnabled) {
            adapter.initialize();
        }

        if (this.config.debug) {
            console.log(`[Analytics] Adapter added: ${adapter.name}`);
        }
    }

    /**
     * Adapter kaldır
     */
    removeAdapter(name: string): void {
        this.adapters.delete(name);

        if (this.config.debug) {
            console.log(`[Analytics] Adapter removed: ${name}`);
        }
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
            if (adapter.isEnabled) {
                const result = adapter.initialize();
                if (result instanceof Promise) {
                    initPromises.push(result);
                }
            }
        });

        await Promise.all(initPromises);

        this.isInitialized = true;

        // Kuyruktaki event'leri gönder
        this.flushQueue();

        if (this.config.debug) {
            console.log('[Analytics] Service initialized');
        }
    }

    /**
     * Event gönder (tüm adapter'lara)
     */
    trackEvent(event: string, properties?: AnalyticsProperties): void {
        const analyticsEvent: AnalyticsEvent = {
            name: event,
            properties,
            timestamp: Date.now(),
        };

        if (!this.isInitialized) {
            this.eventQueue.push(analyticsEvent);
            return;
        }

        this.adapters.forEach((adapter) => {
            if (adapter.isEnabled) {
                try {
                    adapter.trackEvent(event, properties);
                } catch (error) {
                    console.error(`[Analytics] Error tracking event in ${adapter.name}:`, error);
                }
            }
        });

        if (this.config.debug) {
            console.log('[Analytics] Event tracked:', event, properties);
        }
    }

    /**
     * Screen view gönder
     */
    trackScreen(screenName: string, properties?: AnalyticsProperties): void {
        const screenProperties = {
            screen_name: screenName,
            ...properties,
        };

        this.trackEvent('screen_view', screenProperties);

        // Ayrıca her adapter'ın trackScreen metodunu çağır
        this.adapters.forEach((adapter) => {
            if (adapter.isEnabled) {
                try {
                    adapter.trackScreen(screenName, properties);
                } catch (error) {
                    console.error(`[Analytics] Error tracking screen in ${adapter.name}:`, error);
                }
            }
        });
    }

    /**
     * User property ayarla
     */
    setUserProperties(properties: UserProperties): void {
        this.adapters.forEach((adapter) => {
            if (adapter.isEnabled) {
                try {
                    adapter.setUserProperties(properties);
                } catch (error) {
                    console.error(`[Analytics] Error setting user properties in ${adapter.name}:`, error);
                }
            }
        });

        if (this.config.debug) {
            console.log('[Analytics] User properties set:', properties);
        }
    }

    /**
     * User ID ayarla
     */
    setUserId(userId: string | null): void {
        this.adapters.forEach((adapter) => {
            if (adapter.isEnabled) {
                try {
                    adapter.setUserId(userId);
                } catch (error) {
                    console.error(`[Analytics] Error setting user ID in ${adapter.name}:`, error);
                }
            }
        });

        if (this.config.debug) {
            console.log('[Analytics] User ID set:', userId);
        }
    }

    /**
     * Reset
     */
    reset(): void {
        this.adapters.forEach((adapter) => {
            if (adapter.isEnabled) {
                try {
                    adapter.reset();
                } catch (error) {
                    console.error(`[Analytics] Error resetting ${adapter.name}:`, error);
                }
            }
        });

        if (this.config.debug) {
            console.log('[Analytics] Reset');
        }
    }

    /**
     * Kuyruktaki event'leri gönder
     */
    private flushQueue(): void {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event) {
                this.trackEvent(event.name, event.properties);
            }
        }
    }

    /**
     * Aktif adapter'ları al
     */
    getActiveAdapters(): string[] {
        return Array.from(this.adapters.values())
            .filter((adapter) => adapter.isEnabled)
            .map((adapter) => adapter.name);
    }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

/**
 * Analytics service instance al
 */
export function getAnalyticsService(config?: AnalyticsConfig): AnalyticsService {
    if (!analyticsService) {
        analyticsService = new AnalyticsService(config);
    }
    return analyticsService;
}

/**
 * Analytics service'i sıfırla (test için)
 */
export function resetAnalyticsService(): void {
    analyticsService = null;
}
