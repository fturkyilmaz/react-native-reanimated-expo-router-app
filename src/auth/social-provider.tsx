/**
 * Social Authentication Provider
 * 
 * React Context provider for social authentication.
 * Wraps the app to provide social auth state globally.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { socialAuthService } from './social-service';
import type { SocialAuthContextValue, SocialAuthError, SocialProvider, SocialUser } from './types';

/**
 * Social auth context default values
 */
const defaultContextValue: SocialAuthContextValue = {
    isLoading: true,
    isSigningIn: false,
    user: null,
    error: null,
    isConfigured: false,
    signIn: async () => ({ success: false, error: { code: 'FAILED', message: 'Not initialized', provider: 'google' as SocialProvider } }),
    signOut: async () => { },
    getUser: async () => null,
    clearError: () => { },
};

/**
 * Social auth context
 */
const SocialAuthContext = createContext<SocialAuthContextValue>(defaultContextValue);

/**
 * Social auth provider props
 */
interface SocialAuthProviderProps {
    children: React.ReactNode;
    config?: {
        googleClientId?: string;
        appleServiceId?: string;
        facebookAppId?: string;
    };
}

/**
 * Social Authentication Provider Component
 */
export function SocialAuthProvider({ children, config }: SocialAuthProviderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [user, setUser] = useState<SocialUser | null>(null);
    const [error, setError] = useState<SocialAuthError | null>(null);

    // Check if providers are configured
    const isConfigured = useMemo(() => {
        return (
            socialAuthService.isProviderConfigured('google') ||
            socialAuthService.isProviderConfigured('apple') ||
            socialAuthService.isProviderConfigured('facebook')
        );
    }, []);

    // Check initial session
    useEffect(() => {
        checkInitialSession();
    }, []);

    const checkInitialSession = async () => {
        try {
            const storedUser = await socialAuthService.getUser();
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (err) {
            console.error('Error checking initial session:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Sign in with a social provider
     */
    const signIn = useCallback(async (provider: SocialProvider): Promise<{ success: boolean; user?: SocialUser; error?: SocialAuthError }> => {
        if (!socialAuthService.isProviderConfigured(provider)) {
            const authError: SocialAuthError = {
                code: 'NOT_SUPPORTED',
                message: `${provider} login is not configured. Please set up your app credentials.`,
                provider,
            };
            setError(authError);
            return { success: false, error: authError };
        }

        setIsSigningIn(true);
        setError(null);

        try {
            let result: { success: boolean; user?: SocialUser; error?: SocialAuthError };

            switch (provider) {
                case 'google':
                    result = await socialAuthService.signInWithGoogle();
                    break;
                case 'apple':
                    result = await socialAuthService.signInWithApple();
                    break;
                case 'facebook':
                    result = await socialAuthService.signInWithFacebook();
                    break;
                default:
                    result = {
                        success: false,
                        error: {
                            code: 'NOT_SUPPORTED',
                            message: 'Provider not supported',
                            provider,
                        },
                    };
            }

            if (result.success && result.user) {
                setUser(result.user);
            } else if (result.error) {
                setError(result.error);
            }

            return result;
        } catch (err) {
            const authError: SocialAuthError = {
                code: 'FAILED',
                message: err instanceof Error ? err.message : 'An unexpected error occurred',
                provider,
            };
            setError(authError);
            return { success: false, error: authError };
        } finally {
            setIsSigningIn(false);
        }
    }, []);

    /**
     * Sign out from a provider or all providers
     */
    const signOut = useCallback(async (provider?: SocialProvider) => {
        setIsLoading(true);
        try {
            if (provider) {
                await socialAuthService.signOut(provider);
            } else {
                await socialAuthService.signOutAll();
            }
            setUser(null);
        } catch (err) {
            console.error('Error signing out:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get current user
     */
    const getUser = useCallback(async (): Promise<SocialUser | null> => {
        return socialAuthService.getUser();
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const contextValue: SocialAuthContextValue = {
        isLoading,
        isSigningIn,
        user,
        error,
        isConfigured,
        signIn,
        signOut,
        getUser,
        clearError,
    };

    return (
        <SocialAuthContext.Provider value={contextValue}>
            {children}
        </SocialAuthContext.Provider>
    );
}

/**
 * Hook to use social auth context
 */
export function useSocialAuth(): SocialAuthContextValue {
    const context = useContext(SocialAuthContext);
    if (!context) {
        throw new Error('useSocialAuth must be used within a SocialAuthProvider');
    }
    return context;
}

/**
 * Hook to sign in with a specific provider
 */
export function useProviderSignIn(provider: SocialProvider) {
    const { signIn, isSigningIn, error, clearError } = useSocialAuth();

    const signInWithProvider = useCallback(async () => {
        return signIn(provider);
    }, [signIn, provider]);

    return {
        signIn: signInWithProvider,
        isSigningIn,
        error,
        clearError,
    };
}

/**
 * Hook to check if user is signed in
 */
export function useIsSignedIn(): boolean {
    const { user } = useSocialAuth();
    return !!user;
}

export default SocialAuthProvider;
