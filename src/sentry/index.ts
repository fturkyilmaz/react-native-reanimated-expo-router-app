import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Sentry yapılandırma arayüzü
 */
export interface SentryConfig {
    /** Sentry DSN */
    dsn: string;
    /** Çalışma ortamı */
    environment: 'development' | 'staging' | 'production';
    /** Debug modu */
    debug?: boolean;
    /** Sample rate (0.0 - 1.0) */
    sampleRate?: number;
    /** Traces sample rate */
    tracesSampleRate?: number;
    /** Session replay sample rate */
    replaysSessionSampleRate?: number;
    /** On error sample rate */
    replaysOnErrorSampleRate?: number;
}

/**
 * React Navigation Integration options
 */
export interface ReactNavigationConfig {
    enableTimeToInitialDisplay?: boolean;
    routeChangeTimeoutMs?: number;
    ignoreEmptyBackNavigationTransactions?: boolean;
}

/**
 * Varsayılan yapılandırma
 */
const defaultConfig: SentryConfig = {
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
    sampleRate: 1.0,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
};

// React Navigation Integration instance
let navigationIntegration: any = null;

/**
 * Sentry React Navigation Integration'ı al
 */
export function getNavigationIntegration(): any {
    return navigationIntegration;
}

/**
 * Sentry'i başlat
 */
export function initializeSentry(config: Partial<SentryConfig> = {}): void {
    const mergedConfig = { ...defaultConfig, ...config };

    if (!mergedConfig.dsn) {
        console.warn('[Sentry] DSN not provided. Sentry will not be initialized.');
        return;
    }

    // Create React Navigation Integration
    const expoGo = isRunningInExpoGo();
    navigationIntegration = Sentry.reactNavigationIntegration({
        enableTimeToInitialDisplay: !expoGo,
        routeChangeTimeoutMs: 10000,
        ignoreEmptyBackNavigationTransactions: true,
    });

    Sentry.init({
        dsn: mergedConfig.dsn,
        environment: mergedConfig.environment,
        debug: mergedConfig.debug,
        sampleRate: mergedConfig.sampleRate,
        tracesSampleRate: mergedConfig.tracesSampleRate,
        replaysSessionSampleRate: mergedConfig.replaysSessionSampleRate,
        replaysOnErrorSampleRate: mergedConfig.replaysOnErrorSampleRate,
        // React Navigation specific options
        integrations: [navigationIntegration!],
        enableNativeFramesTracking: !expoGo,
        enableNativeCrashHandling: true,
        enableNativeNagger: true,
        autoInitializeNativeSdk: true,
        // Release information
        release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
        dist: Constants.expoConfig?.version,
        // Tags
        initialScope: {
            tags: {
                'app.version': Constants.expoConfig?.version,
                'app.build': Constants.nativeBuildVersion,
                'device.platform': Platform.OS,
                'device.version': Platform.Version,
            },
        },
    });

    console.log('[Sentry] Initialized successfully');
}

/**
 * Sentry kapat
 */
export function closeSentry(): Promise<void> {
    return Sentry.close();
}

/**
 * Manuel hata raporu gönder
 */
export function captureException(
    error: Error,
    context?: {
        extra?: Record<string, unknown>;
        tags?: Record<string, string>;
        user?: Sentry.User;
    }
): string {
    return Sentry.captureException(error, {
        extra: context?.extra,
        tags: context?.tags,
        user: context?.user,
    });
}

/**
 * Manuel mesaj gönder
 */
export function captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info'
): string {
    return Sentry.captureMessage(message, level);
}

/**
 * Breadcrumb ekle
 */
export function addBreadcrumb(
    breadcrumb: Sentry.Breadcrumb
): void {
    Sentry.addBreadcrumb(breadcrumb);
}

/**
 * User bilgisi ayarla
 */
export function setUser(user: Sentry.User | null): void {
    Sentry.setUser(user);
}

/**
 * Tag ekle
 */
export function setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
}

/**
 * Context ekle
 */
export function setContext(
    name: string,
    context: Record<string, unknown> | null
): void {
    Sentry.setContext(name, context);
}

/**
 * Extra veri ekle
 */
export function setExtra(key: string, extra: unknown): void {
    Sentry.setExtra(key, extra);
}

/**
 * Scope ile çalış
 */
export function withScope(callback: (scope: Sentry.Scope) => void): void {
    Sentry.withScope(callback);
}

/**
 * Navigation breadcrumb'ı ekle
 */
export function addNavigationBreadcrumb(
    from: string,
    to: string
): void {
    addBreadcrumb({
        category: 'navigation',
        message: `Navigated from ${from} to ${to}`,
        data: { from, to },
        level: 'info',
        type: 'navigation',
    });
}

/**
 * API breadcrumb'ı ekle
 */
export function addApiBreadcrumb(
    endpoint: string,
    method: string,
    statusCode: number,
    duration?: number
): void {
    addBreadcrumb({
        category: 'api',
        message: `${method} ${endpoint}`,
        data: {
            endpoint,
            method,
            statusCode,
            duration,
        },
        level: statusCode >= 400 ? 'error' : 'info',
        type: 'http',
    });
}

/**
 * User action breadcrumb'ı ekle
 */
export function addUserActionBreadcrumb(
    action: string,
    component: string,
    details?: Record<string, unknown>
): void {
    addBreadcrumb({
        category: 'ui.click',
        message: `${action} on ${component}`,
        data: {
            action,
            component,
            ...details,
        },
        level: 'info',
        type: 'user',
    });
}

// Re-export Sentry
export { Sentry };
