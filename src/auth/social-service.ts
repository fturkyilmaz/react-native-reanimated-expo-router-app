/**
 * Social Authentication Service
 * 
 * Handles social login operations for Google, Apple, and Facebook.
 * This implementation uses expo-auth-session for OAuth flows.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SocialAuthConfig, SocialAuthError, SocialAuthResult, SocialProvider, SocialUser } from './types';

// Note: In a real app, you would use these imports:
// import * as Google from 'expo-google-sign-in';
// import * as AppleAuthentication from 'expo-apple-authentication';
// import * as Facebook from 'expo-facebook';

const AUTH_STORAGE_KEY = 'social_auth_tokens';
const USER_STORAGE_KEY = 'social_auth_user';

/**
 * Generate a random string for state parameter
 */
async function generateState(): Promise<string> {
    const randomValues = new Uint32Array(32);
    crypto.getRandomValues(randomValues);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const state = Array.from(randomValues)
        .map((val) => chars[val % chars.length])
        .join('');
    return state;
}

/**
 * Store auth tokens securely
 */
async function storeTokens(provider: SocialProvider, tokens: Record<string, string>): Promise<void> {
    const existingTokens = await getStoredTokens();
    const updatedTokens = {
        ...existingTokens,
        [provider]: tokens,
    };
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(updatedTokens));
}

/**
 * Retrieve stored auth tokens
 */
async function getStoredTokens(): Promise<Record<string, Record<string, string>>> {
    const tokens = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    return tokens ? JSON.parse(tokens) : {};
}

/**
 * Clear stored tokens for a provider
 */
async function clearTokens(provider: SocialProvider): Promise<void> {
    const existingTokens = await getStoredTokens();
    delete existingTokens[provider];
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(existingTokens));
}

/**
 * Store user data
 */
async function storeUser(user: SocialUser): Promise<void> {
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Retrieve stored user data
 */
async function getStoredUser(): Promise<SocialUser | null> {
    const user = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Clear stored user data
 */
async function clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
}

/**
 * Create an auth error
 */
function createAuthError(provider: SocialProvider, code: SocialAuthError['code'], message: string): SocialAuthError {
    return { code, message, provider };
}

/**
 * Social Authentication Service
 */
export class SocialAuthService {
    private static instance: SocialAuthService;
    private config: SocialAuthConfig;

    private constructor(config: SocialAuthConfig = {}) {
        this.config = {
            googleClientId: config.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
            appleServiceId: config.appleServiceId || process.env.EXPO_PUBLIC_APPLE_SERVICE_ID,
            facebookAppId: config.facebookAppId || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
            scopes: config.scopes ?? true,
            forceAccountSelection: config.forceAccountSelection ?? false,
        };
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: SocialAuthConfig): SocialAuthService {
        if (!SocialAuthService.instance) {
            SocialAuthService.instance = new SocialAuthService(config);
        }
        return SocialAuthService.instance;
    }

    /**
     * Check if a provider is configured
     */
    isProviderConfigured(provider: SocialProvider): boolean {
        switch (provider) {
            case 'google':
                return !!this.config.googleClientId;
            case 'apple':
                return !!this.config.appleServiceId;
            case 'facebook':
                return !!this.config.facebookAppId;
            default:
                return false;
        }
    }

    /**
     * Check if Apple Sign In is available (iOS 13+)
     */
    async isAppleSignInAvailable(): Promise<boolean> {
        if (Platform.OS !== 'ios') return false;
        // In real implementation, check AppleAuthentication.isAvailableAsync()
        return true;
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<SocialAuthResult> {
        // In a real implementation, you would use:
        // const result = await Google.signInAsync({
        //   clientId: this.config.googleClientId,
        //   scopes: this.config.scopes ? ['profile', 'email'] : undefined,
        // });

        // Mock implementation for demo
        await this.simulateNetworkDelay();

        const mockUser: SocialUser = {
            id: 'google_123456789',
            email: 'user@gmail.com',
            name: 'Google User',
            firstName: 'Google',
            lastName: 'User',
            photo: 'https://via.placeholder.com/100',
            provider: 'google',
        };

        await storeTokens('google', {
            accessToken: 'mock_google_access_token',
            refreshToken: 'mock_google_refresh_token',
            expiresAt: String(Date.now() + 3600000),
        });
        await storeUser(mockUser);

        return { success: true, user: mockUser };
    }

    /**
     * Sign in with Apple
     */
    async signInWithApple(): Promise<SocialAuthResult> {
        if (!(await this.isAppleSignInAvailable())) {
            return {
                success: false,
                error: createAuthError('apple', 'NOT_SUPPORTED', 'Apple Sign In is not available on this device'),
            };
        }

        // In a real implementation, you would use:
        // const credential = await AppleAuthentication.signInAsync({
        //   requestedScopes: [
        //     AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        //     AppleAuthentication.AppleAuthenticationScope.EMAIL,
        //   ],
        // });

        // Mock implementation for demo
        await this.simulateNetworkDelay();

        const mockUser: SocialUser = {
            id: 'apple_123456789',
            email: 'user@icloud.com',
            name: 'Apple User',
            firstName: 'Apple',
            lastName: 'User',
            provider: 'apple',
        };

        await storeTokens('apple', {
            identityToken: 'mock_apple_identity_token',
            userId: 'apple_123456789',
        });
        await storeUser(mockUser);

        return { success: true, user: mockUser };
    }

    /**
     * Sign in with Facebook
     */
    async signInWithFacebook(): Promise<SocialAuthResult> {
        // In a real implementation, you would use:
        // await Facebook.initializeAsync({ appId: this.config.facebookAppId });
        // const result = await Facebook.logInWithReadPermissionsAsync({
        //   permissions: ['public_profile', 'email'],
        // });

        // Mock implementation for demo
        await this.simulateNetworkDelay();

        const mockUser: SocialUser = {
            id: 'facebook_123456789',
            email: 'user@facebook.com',
            name: 'Facebook User',
            firstName: 'Facebook',
            lastName: 'User',
            photo: 'https://via.placeholder.com/100',
            provider: 'facebook',
        };

        await storeTokens('facebook', {
            accessToken: 'mock_facebook_access_token',
            expiresAt: String(Date.now() + 3600000),
        });
        await storeUser(mockUser);

        return { success: true, user: mockUser };
    }

    /**
     * Sign out from a provider
     */
    async signOut(provider: SocialProvider): Promise<void> {
        // In a real implementation, you would sign out from the respective SDK
        await clearTokens(provider);

        // Clear user only if signing out from the current provider
        const currentUser = await getStoredUser();
        if (currentUser?.provider === provider) {
            await clearUser();
        }
    }

    /**
     * Sign out from all providers
     */
    async signOutAll(): Promise<void> {
        const providers: SocialProvider[] = ['google', 'apple', 'facebook'];
        for (const provider of providers) {
            if (this.isProviderConfigured(provider)) {
                await this.signOut(provider);
            }
        }
    }

    /**
     * Get stored user for a provider
     */
    async getUser(): Promise<SocialUser | null> {
        return getStoredUser();
    }

    /**
     * Check if user is signed in
     */
    async isSignedIn(): Promise<boolean> {
        const tokens = await getStoredTokens();
        const providers = ['google', 'apple', 'facebook'] as const;
        return providers.some(provider => tokens[provider]?.accessToken || tokens[provider]?.identityToken);
    }

    /**
     * Simulate network delay for mock implementation
     */
    private simulateNetworkDelay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export const socialAuthService = SocialAuthService.getInstance();
