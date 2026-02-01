import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { useCallback } from 'react';

import {
    AnalyticsAdapter,
    AnalyticsProperties,
    UserProperties,
} from '../core/types';

/**
 * PostHog Analytics Adapter
 */
export class PostHogAdapter implements AnalyticsAdapter {
    readonly name = 'posthog';
    readonly isEnabled: boolean;

    private apiKey: string;
    private host: string;
    private isInitialized = false;

    constructor(apiKey: string, host: string) {
        this.apiKey = apiKey;
        this.host = host;
        this.isEnabled = !!apiKey && !!host;
    }

    async initialize(): Promise<void> {
        if (!this.isEnabled || this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        console.log('[PostHog] Initialized');
    }

    trackEvent(event: string, properties?: AnalyticsProperties): void {
        console.log('[PostHog] Event tracked:', event, properties);
    }

    trackScreen(screenName: string, properties?: AnalyticsProperties): void {
        console.log('[PostHog] Screen tracked:', screenName, properties);
    }

    setUserProperties(properties: UserProperties): void {
        console.log('[PostHog] User properties set:', properties);
    }

    setUserId(userId: string | null): void {
        console.log('[PostHog] User ID set:', userId);
    }

    reset(): void {
        console.log('[PostHog] Reset');
    }
}

// Singleton instance
let posthogAdapter: PostHogAdapter | null = null;

/**
 * PostHog adapter instance al
 */
export function getPostHogAdapter(apiKey?: string, host?: string): PostHogAdapter {
    if (!posthogAdapter && apiKey && host) {
        posthogAdapter = new PostHogAdapter(apiKey, host);
    }
    return posthogAdapter!;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostHogProperties = Record<string, any>;

/**
 * PostHog hook wrapper
 */
export function usePostHogAnalytics() {
    const posthog = usePostHog();

    const trackEvent = useCallback((event: string, properties?: PostHogProperties) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posthog?.capture(event, properties as any);
    }, [posthog]);

    const trackScreen = useCallback((screenName: string, properties?: PostHogProperties) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posthog?.screen(screenName, properties as any);
    }, [posthog]);

    const setUserProperties = useCallback((properties: PostHogProperties) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posthog?.identify(undefined, properties as any);
    }, [posthog]);

    const setUserId = useCallback((userId: string | null) => {
        if (userId) {
            posthog?.identify(userId);
        } else {
            posthog?.reset();
        }
    }, [posthog]);

    const isFeatureEnabled = useCallback((key: string, defaultValue = false): boolean => {
        return posthog?.isFeatureEnabled(key) ?? defaultValue;
    }, [posthog]);

    const getFeatureFlag = useCallback((key: string, defaultValue?: string | boolean): string | boolean | undefined => {
        return posthog?.getFeatureFlag(key) ?? defaultValue;
    }, [posthog]);

    return {
        trackEvent,
        trackScreen,
        setUserProperties,
        setUserId,
        isFeatureEnabled,
        getFeatureFlag,
    };
}

export { PostHogProvider };
