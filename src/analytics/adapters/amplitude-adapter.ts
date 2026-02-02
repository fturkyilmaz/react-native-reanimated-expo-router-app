import { Identify, identify, init, setUserId, track } from '@amplitude/analytics-react-native';

import {
    AnalyticsAdapter,
    AnalyticsProperties,
    UserProperties,
} from '../core/types';

/**
 * Amplitude Analytics Adapter
 */
export class AmplitudeAdapter implements AnalyticsAdapter {
    readonly name = 'amplitude';
    readonly isEnabled: boolean;

    private apiKey: string;
    private isInitialized = false;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.isEnabled = !!apiKey;
    }

    async initialize(): Promise<void> {
        if (!this.isEnabled || this.isInitialized) {
            return;
        }

        try {
            init(this.apiKey);

            this.isInitialized = true;
            console.log('[Amplitude] Initialized');
        } catch (error) {
            console.error('[Amplitude] Error initializing:', error);
        }
    }

    trackEvent(event: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled || !this.isInitialized) return;

        try {
            // Properties'i Amplitude formatına dönüştür
            const eventProperties = this.convertProperties(properties);

            track(event, eventProperties);
        } catch (error) {
            console.error('[Amplitude] Error tracking event:', error);
        }
    }

    trackScreen(screenName: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled || !this.isInitialized) return;

        this.trackEvent('screen_view', {
            screen_name: screenName,
            ...properties,
        });
    }

    setUserProperties(properties: UserProperties): void {
        if (!this.isEnabled || !this.isInitialized) return;

        try {
            const identifyObj = new Identify();

            Object.entries(properties).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    identifyObj.set(key, value.join(','));
                } else if (value !== null && value !== undefined) {
                    identifyObj.set(key, value);
                }
            });

            identify(identifyObj);
        } catch (error) {
            console.error('[Amplitude] Error setting user properties:', error);
        }
    }

    setUserId(userId: string | null): void {
        if (!this.isEnabled || !this.isInitialized) return;

        try {
            setUserId(userId ?? undefined);
        } catch (error) {
            console.error('[Amplitude] Error setting user ID:', error);
        }
    }

    reset(): void {
        if (!this.isEnabled || !this.isInitialized) return;

        try {
            setUserId(undefined);
        } catch (error) {
            console.error('[Amplitude] Error resetting:', error);
        }
    }

    /**
     * Properties'i Amplitude formatına dönüştür
     */
    private convertProperties(properties?: AnalyticsProperties): Record<string, string | number | boolean | null> {
        if (!properties) return {};

        const result: Record<string, string | number | boolean | null> = {};

        Object.entries(properties).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                result[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                result[key] = value;
            } else {
                result[key] = String(value);
            }
        });

        return result;
    }
}

// Singleton instance
let amplitudeAdapter: AmplitudeAdapter | null = null;

/**
 * Amplitude adapter instance al
 */
export function getAmplitudeAdapter(apiKey?: string): AmplitudeAdapter {
    if (!amplitudeAdapter && apiKey) {
        amplitudeAdapter = new AmplitudeAdapter(apiKey);
    }
    return amplitudeAdapter!;
}
