/**
 * Social Authentication Hook
 * 
 * React hook for social login functionality.
 * Provides easy access to social auth operations from any component.
 */

import { useCallback, useEffect, useState } from 'react';
import { socialAuthService } from './social-service';
import type { SocialAuthError, SocialAuthResult, SocialProvider, SocialUser } from './types';

export interface UseSocialAuthReturn {
    // State
    isLoading: boolean;
    isSigningIn: boolean;
    user: SocialUser | null;
    error: SocialAuthError | null;
    isConfigured: boolean;

    // Actions
    signIn: (provider: SocialProvider) => Promise<SocialAuthResult>;
    signOut: (provider?: SocialProvider) => Promise<void>;
    getUser: () => Promise<SocialUser | null>;
    clearError: () => void;
    isSignedIn: () => boolean;
}

/**
 * Social authentication hook
 */
export function useSocialAuth(): UseSocialAuthReturn {
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [user, setUser] = useState<SocialUser | null>(null);
    const [error, setError] = useState<SocialAuthError | null>(null);

    // Check if user is already signed in on mount
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
    const signIn = useCallback(async (provider: SocialProvider): Promise<SocialAuthResult> => {
        if (!socialAuthService.isProviderConfigured(provider)) {
            const error: SocialAuthError = {
                code: 'NOT_SUPPORTED',
                message: `${provider} login is not configured. Please set up your app credentials.`,
                provider,
            };
            setError(error);
            return { success: false, error };
        }

        setIsSigningIn(true);
        setError(null);

        try {
            let result: SocialAuthResult;

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
        const storedUser = await socialAuthService.getUser();
        return storedUser;
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Check if user is signed in (synchronous)
     */
    const isSignedIn = useCallback(() => {
        return !!user;
    }, [user]);

    return {
        isLoading,
        isSigningIn,
        user,
        error,
        isConfigured: true, // In real implementation, check each provider
        signIn,
        signOut,
        getUser,
        clearError,
        isSignedIn,
    };
}

/**
 * Sign in with specific provider hook
 */
export function useSocialSignIn(provider: SocialProvider) {
    const { signIn, isSigningIn, error, clearError } = useSocialAuth();

    const signInWithProvider = useCallback(async (): Promise<SocialAuthResult> => {
        return signIn(provider);
    }, [signIn, provider]);

    return {
        signIn: signInWithProvider,
        isSigningIn,
        error,
        clearError,
    };
}

export default useSocialAuth;
