/**
 * Analytics event property tipleri
 */
export type AnalyticsPropertyValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

/**
 * Analytics event tipi
 */
export interface AnalyticsEvent {
    name: string;
    properties?: AnalyticsProperties;
    timestamp?: number;
}

/**
 * User property tipleri
 */
export type UserPropertyValue = string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[];

export interface UserProperties {
    [key: string]: UserPropertyValue;
}

/**
 * Analytics adapter arayüzü
 */
export interface AnalyticsAdapter {
    /** Adapter adı */
    readonly name: string;
    /** Aktif mi */
    readonly isEnabled: boolean;

    /** Başlat */
    initialize(): Promise<void> | void;

    /** Event gönder */
    trackEvent(event: string, properties?: AnalyticsProperties): void;

    /** Screen view gönder */
    trackScreen(screenName: string, properties?: AnalyticsProperties): void;

    /** User property ayarla */
    setUserProperties(properties: UserProperties): void;

    /** User ID ayarla */
    setUserId(userId: string | null): void;

    /** Reset */
    reset(): void;
}

/**
 * Feature flag tipi
 */
export interface FeatureFlag {
    key: string;
    value: boolean | string | number;
    variation?: string;
}

/**
 * Feature flag adapter arayüzü
 */
export interface FeatureFlagAdapter {
    /** Adapter adı */
    readonly name: string;

    /** Başlat */
    initialize(): Promise<void> | void;

    /** Boolean flag kontrolü */
    isEnabled(key: string, defaultValue?: boolean): boolean;

    /** String değer al */
    getString(key: string, defaultValue?: string): string;

    /** Number değer al */
    getNumber(key: string, defaultValue?: number): number;

    /** Tüm flag'leri al */
    getAllFlags(): Record<string, FeatureFlag>;

    /** Flag değişikliği dinle */
    onFlagChange(callback: (key: string, value: unknown) => void): () => void;

    /** Flag'leri yenile */
    refresh(): Promise<void>;
}

/**
 * A/B test varyant tipi
 */
export interface ABTestVariant {
    name: string;
    value: string;
    weight?: number;
}

/**
 * A/B test tipi
 */
export interface ABTest {
    name: string;
    variants: ABTestVariant[];
    currentVariant?: string;
}

/**
 * A/B test adapter arayüzü
 */
export interface ABTestAdapter {
    /** Adapter adı */
    readonly name: string;

    /** Başlat */
    initialize(): Promise<void> | void;

    /** Varyant al */
    getVariant(testName: string, defaultVariant?: string): string;

    /** Conversion kaydet */
    trackConversion(testName: string, goal: string, value?: number): void;

    /** Tüm testleri al */
    getAllTests(): Record<string, ABTest>;
}

/**
 * Analytics servis yapılandırması
 */
export interface AnalyticsConfig {
    /** Debug modu */
    debug?: boolean;
    /** Otomatik screen tracking */
    autoTrackScreens?: boolean;
    /** Otomatik session tracking */
    autoTrackSessions?: boolean;
}

/**
 * Feature flag servis yapılandırması
 */
export interface FeatureFlagConfig {
    /** Refresh interval (ms) */
    refreshInterval?: number;
    /** Offline mode */
    offlineMode?: boolean;
}

/**
 * A/B test servis yapılandırması
 */
export interface ABTestConfig {
    /** Auto enroll */
    autoEnroll?: boolean;
    /** Persist variants */
    persistVariants?: boolean;
}

/**
 * Event kategorileri
 */
export enum EventCategory {
    LIFECYCLE = 'lifecycle',
    NAVIGATION = 'navigation',
    USER_ACTION = 'user_action',
    CONTENT = 'content',
    AUTH = 'auth',
    COMMERCE = 'commerce',
    ERROR = 'error',
    FEATURE = 'feature',
}

/**
 * Lifecycle event'leri
 */
export enum LifecycleEvent {
    APP_OPEN = 'app_open',
    APP_BACKGROUND = 'app_background',
    APP_FOREGROUND = 'app_foreground',
    SESSION_START = 'session_start',
    SESSION_END = 'session_end',
    APP_INSTALL = 'app_install',
    APP_UPDATE = 'app_update',
}

/**
 * Navigation event'leri
 */
export enum NavigationEvent {
    SCREEN_VIEW = 'screen_view',
    TAB_SWITCH = 'tab_switch',
    BACK_NAVIGATION = 'back_navigation',
    MODAL_OPEN = 'modal_open',
    MODAL_CLOSE = 'modal_close',
}

/**
 * User action event'leri
 */
export enum UserActionEvent {
    BUTTON_PRESS = 'button_press',
    SWIPE = 'swipe',
    SCROLL = 'scroll',
    SEARCH = 'search',
    FILTER_APPLY = 'filter_apply',
    SORT_CHANGE = 'sort_change',
    PULL_TO_REFRESH = 'pull_to_refresh',
}

/**
 * Content event'leri
 */
export enum ContentEvent {
    MOVIE_VIEW = 'movie_view',
    MOVIE_PLAY = 'movie_play',
    MOVIE_PAUSE = 'movie_pause',
    MOVIE_COMPLETE = 'movie_complete',
    MOVIE_FAVORITE = 'movie_favorite',
    MOVIE_UNFAVORITE = 'movie_unfavorite',
    MOVIE_SHARE = 'movie_share',
    TRAILER_WATCH = 'trailer_watch',
    CAST_VIEW = 'cast_view',
}

/**
 * Auth event'leri
 */
export enum AuthEvent {
    LOGIN_START = 'login_start',
    LOGIN_SUCCESS = 'login_success',
    LOGIN_FAILURE = 'login_failure',
    LOGOUT = 'logout',
    REGISTER_START = 'register_start',
    REGISTER_SUCCESS = 'register_success',
    REGISTER_FAILURE = 'register_failure',
    BIOMETRIC_AUTH = 'biometric_auth',
    PASSWORD_RESET = 'password_reset',
}

/**
 * Commerce event'leri
 */
export enum CommerceEvent {
    SUBSCRIPTION_VIEW = 'subscription_view',
    SUBSCRIPTION_START = 'subscription_start',
    SUBSCRIPTION_COMPLETE = 'subscription_complete',
    SUBSCRIPTION_CANCEL = 'subscription_cancel',
    PURCHASE_VIEW = 'purchase_view',
    PURCHASE_START = 'purchase_start',
    PURCHASE_COMPLETE = 'purchase_complete',
    PURCHASE_CANCEL = 'purchase_cancel',
}

/**
 * Feature event'leri
 */
export enum FeatureEvent {
    FEATURE_ENABLED = 'feature_enabled',
    FEATURE_DISABLED = 'feature_disabled',
    EXPERIMENT_ENROLLED = 'experiment_enrolled',
    EXPERIMENT_CONVERSION = 'experiment_conversion',
}
