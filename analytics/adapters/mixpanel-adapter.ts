import { Mixpanel } from 'mixpanel-react-native';

import {
    AnalyticsAdapter,
    AnalyticsProperties,
    UserProperties,
} from '../core/types';

/**
 * Mixpanel Analytics Adapter
 */
export class MixpanelAdapter implements AnalyticsAdapter {
    readonly name = 'mixpanel';
    readonly isEnabled: boolean;

    private token: string;
    private mixpanel: Mixpanel | null = null;
    private isInitialized = false;

    constructor(token: string) {
        this.token = token;
        this.isEnabled = !!token;
    }

    async initialize(): Promise<void> {
        if (!this.isEnabled || this.isInitialized) {
            return;
        }

        try {
            this.mixpanel = await Mixpanel.init(this.token, true);

            this.isInitialized = true;
            console.log('[Mixpanel] Initialized');
        } catch (error) {
            console.error('[Mixpanel] Error initializing:', error);
        }
    }

    trackEvent(event: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            const eventProperties = this.convertProperties(properties);
            this.mixpanel.track(event, eventProperties);
        } catch (error) {
            console.error('[Mixpanel] Error tracking event:', error);
        }
    }

    trackScreen(screenName: string, properties?: AnalyticsProperties): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        this.trackEvent('screen_view', {
            screen_name: screenName,
            ...properties,
        });
    }

    setUserProperties(properties: UserProperties): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            const peopleProperties = this.convertUserProperties(properties);
            this.mixpanel.getPeople().set(peopleProperties);
        } catch (error) {
            console.error('[Mixpanel] Error setting user properties:', error);
        }
    }

    setUserId(userId: string | null): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            if (userId) {
                this.mixpanel.identify(userId);
            } else {
                this.mixpanel.reset();
            }
        } catch (error) {
            console.error('[Mixpanel] Error setting user ID:', error);
        }
    }

    reset(): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            this.mixpanel.reset();
        } catch (error) {
            console.error('[Mixpanel] Error resetting:', error);
        }
    }

    /**
     * Properties'i Mixpanel formatına dönüştür
     */
    private convertProperties(properties?: AnalyticsProperties): Record<string, unknown> {
        if (!properties) return {};

        const result: Record<string, unknown> = {};

        Object.entries(properties).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                result[key] = value;
            }
        });

        return result;
    }

    /**
     * User properties'i Mixpanel formatına dönüştür
     */
    private convertUserProperties(properties?: UserProperties): Record<string, unknown> {
        if (!properties) return {};

        const result: Record<string, unknown> = {};

        Object.entries(properties).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                result[key] = value;
            }
        });

        return result;
    }

    /**
     * Time event (manuel timing için)
     */
    timeEvent(event: string): void {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            this.mixpanel.timeEvent(event);
        } catch (error) {
            console.error('[Mixpanel] Error timing event:', error);
        }
    }

    /**
     * Alias ekle (signup sonrası için)
     */
    async alias(alias: string): Promise<void> {
        if (!this.isEnabled || !this.isInitialized || !this.mixpanel) return;

        try {
            const distinctId = await this.mixpanel.getDistinctId();
            this.mixpanel.alias(alias, distinctId);
        } catch (error) {
            console.error('[Mixpanel] Error creating alias:', error);
        }
    }
}

// Singleton instance
let mixpanelAdapter: MixpanelAdapter | null = null;

/**
 * Mixpanel adapter instance al
 */
export function getMixpanelAdapter(token?: string): MixpanelAdapter {
    if (!mixpanelAdapter && token) {
        mixpanelAdapter = new MixpanelAdapter(token);
    }
    return mixpanelAdapter!;
}
