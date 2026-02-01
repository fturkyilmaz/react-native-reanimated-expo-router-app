import analytics from '@react-native-firebase/analytics';

import {
    AnalyticsAdapter,
    AnalyticsProperties,
    UserProperties,
} from '../core/types';

/**
 * Firebase Analytics Adapter
 */
export class FirebaseAnalyticsAdapter implements AnalyticsAdapter {
    readonly name = 'firebase';
    readonly isEnabled: boolean;

    private isInitialized = false;

    constructor() {
        // Firebase otomatik başlar, her zaman enabled
        this.isEnabled = true;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        // Firebase Analytics otomatik başlar
        // Ekstra konfigürasyon gerekmez

        this.isInitialized = true;
        console.log('[FirebaseAnalytics] Initialized');
    }

    trackEvent(event: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled) return;

        try {
            // Firebase event isimleri sadece harf, rakam ve alt çizgi içerebilir
            // ve 40 karakterden kısa olmalı
            const sanitizedEvent = this.sanitizeEventName(event);

            // Properties'i Firebase formatına dönüştür
            const params = this.convertProperties(properties);

            analytics().logEvent(sanitizedEvent, params);
        } catch (error) {
            console.error('[FirebaseAnalytics] Error tracking event:', error);
        }
    }

    trackScreen(screenName: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled) return;

        try {
            analytics().logScreenView({
                screen_name: screenName,
                screen_class: screenName,
            });

            // Ekstra properties varsa event olarak gönder
            if (properties && Object.keys(properties).length > 0) {
                this.trackEvent('screen_view', {
                    screen_name: screenName,
                    ...properties,
                });
            }
        } catch (error) {
            console.error('[FirebaseAnalytics] Error tracking screen:', error);
        }
    }

    setUserProperties(properties: UserProperties): void {
        if (!this.isEnabled) return;

        try {
            Object.entries(properties).forEach(([key, value]) => {
                // Firebase user property değerleri 36 karakterden kısa olmalı
                const stringValue = String(value).slice(0, 36);
                analytics().setUserProperty(key, stringValue);
            });
        } catch (error) {
            console.error('[FirebaseAnalytics] Error setting user properties:', error);
        }
    }

    setUserId(userId: string | null): void {
        if (!this.isEnabled) return;

        try {
            analytics().setUserId(userId);
        } catch (error) {
            console.error('[FirebaseAnalytics] Error setting user ID:', error);
        }
    }

    reset(): void {
        if (!this.isEnabled) return;

        try {
            analytics().resetAnalyticsData();
        } catch (error) {
            console.error('[FirebaseAnalytics] Error resetting:', error);
        }
    }

    /**
     * Event ismini Firebase formatına dönüştür
     */
    private sanitizeEventName(event: string): string {
        // Sadece harf, rakam ve alt çizgi
        let sanitized = event.replace(/[^a-zA-Z0-9_]/g, '_');

        // 40 karakter sınırı
        if (sanitized.length > 40) {
            sanitized = sanitized.slice(0, 40);
        }

        return sanitized.toLowerCase();
    }

    /**
     * Properties'i Firebase formatına dönüştür
     */
    private convertProperties(properties?: AnalyticsProperties): Record<string, string | number | boolean> {
        if (!properties) return {};

        const result: Record<string, string | number | boolean> = {};

        Object.entries(properties).forEach(([key, value]) => {
            if (value === null || value === undefined) return;

            // Firebase parametre isimleri 40 karakterden kısa olmalı
            const paramName = key.slice(0, 40);

            // Değer tipini koru ama string limiti uygula
            if (typeof value === 'string') {
                // String değerler 100 karakterden kısa olmalı
                result[paramName] = value.slice(0, 100);
            } else if (typeof value === 'number') {
                result[paramName] = value;
            } else if (typeof value === 'boolean') {
                result[paramName] = value ? 1 : 0; // Firebase boolean'ları int olarak ister
            }
        });

        return result;
    }
}

// Singleton instance
let firebaseAdapter: FirebaseAnalyticsAdapter | null = null;

/**
 * Firebase adapter instance al
 */
export function getFirebaseAdapter(): FirebaseAnalyticsAdapter {
    if (!firebaseAdapter) {
        firebaseAdapter = new FirebaseAnalyticsAdapter();
    }
    return firebaseAdapter;
}
