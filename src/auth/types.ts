/**
 * Social Authentication Types
 * 
 * Defines types for social login providers (Google, Apple, Facebook)
 */

export type SocialProvider = 'google' | 'apple' | 'facebook';

/**
 * User profile data from social login
 */
export interface SocialUser {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    photo?: string;
    provider: SocialProvider;
}

/**
 * Social authentication result
 */
export interface SocialAuthResult {
    success: boolean;
    user?: SocialUser;
    error?: SocialAuthError;
}

/**
 * Social authentication errors
 */
export interface SocialAuthError {
    code: SocialAuthErrorCode;
    message: string;
    provider: SocialProvider;
}

/**
 * Social authentication error codes
 */
export type SocialAuthErrorCode =
    | 'CANCELLED'
    | 'FAILED'
    | 'NOT_SUPPORTED'
    | 'NETWORK_ERROR'
    | 'ACCOUNT_NOT_FOUND';

/**
 * Social login configuration
 */
export interface SocialAuthConfig {
    /** Google OAuth Client ID */
    googleClientId?: string;
    /** Apple Service ID */
    appleServiceId?: string;
    /** Facebook App ID */
    facebookAppId?: string;
    /** Whether to request scopes (email, profile) */
    scopes?: boolean;
    /** Whether to force account selection */
    forceAccountSelection?: boolean;
}

/**
 * Social auth state
 */
export interface SocialAuthState {
    isLoading: boolean;
    isSigningIn: boolean;
    user: SocialUser | null;
    error: SocialAuthError | null;
    isConfigured: boolean;
}

/**
 * Social auth actions
 */
export interface SocialAuthActions {
    signIn: (provider: SocialProvider) => Promise<SocialAuthResult>;
    signOut: (provider?: SocialProvider) => Promise<void>;
    getUser: (provider: SocialProvider) => Promise<SocialUser | null>;
    clearError: () => void;
}

/**
 * Combined social auth context type
 */
export type SocialAuthContextValue = SocialAuthState & SocialAuthActions;
