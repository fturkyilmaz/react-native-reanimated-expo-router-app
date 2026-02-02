/**
 * Deep Link Handler
 * 
 * Handles incoming deep links and routes to appropriate screens.
 * Supports both initial app launch and background/foreground transitions.
 */

import { useAuthStore } from '@/store/authStore';
import * as Linking from 'expo-linking';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
    DEEP_LINK_CONFIG,
    getScreenFromRoute,
    parseDeepLink,
    routeRequiresAuth,
} from './config';

/**
 * Deep link handling result
 */
export interface DeepLinkResult {
    success: boolean;
    route?: string;
    screen?: string;
    params?: Record<string, string>;
    error?: string;
}

/**
 * Hook for handling deep links
 */
export function useDeepLinkHandler() {
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { isAuthenticated } = useAuthStore();
    const isProcessingRef = useRef(false);

    /**
     * Process a deep link URL
     */
    const processDeepLink = useCallback(async (url: string): Promise<DeepLinkResult> => {
        if (isProcessingRef.current) {
            return { success: false, error: 'Already processing a deep link' };
        }

        isProcessingRef.current = true;

        try {
            console.log('[DeepLink] Processing URL:', url);

            // Parse the URL
            const { route, params } = parseDeepLink(url);

            if (!route) {
                console.warn('[DeepLink] Unknown route, navigating to fallback');
                router.replace('/(tabs)/index' as `/${string}`);
                return { success: false, error: 'Unknown route' };
            }

            // Check authentication requirement
            if (routeRequiresAuth(route) && !isAuthenticated) {
                console.log('[DeepLink] Auth required, redirecting to login');
                router.push({
                    pathname: '/(auth)/login',
                    params: { redirect: url },
                });
                return {
                    success: false,
                    error: 'Authentication required',
                    route,
                };
            }

            // Get screen path
            const screenInfo = getScreenFromRoute(route, params);

            if (!screenInfo) {
                console.warn('[DeepLink] Could not resolve screen for route:', route);
                router.replace('/(tabs)/index' as `/${string}`);
                return { success: false, error: 'Could not resolve screen' };
            }

            // Navigate to screen
            console.log('[DeepLink] Navigating to:', screenInfo.screen, screenInfo.params);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const screenPath = screenInfo.screen as any;

            if (Object.keys(screenInfo.params).length > 0) {
                router.push({
                    pathname: screenPath,
                    params: screenInfo.params,
                });
            } else {
                console.log('[DeepLink] Navigating to:', screenPath);
                // router.push(screenPath);
            }

            return {
                success: true,
                route,
                screen: screenInfo.screen,
                params: screenInfo.params,
            };
        } catch (error) {
            console.error('[DeepLink] Error processing URL:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            isProcessingRef.current = false;
        }
    }, [router, isAuthenticated]);

    /**
     * Handle initial URL (app opened from link)
     */
    useEffect(() => {
        const handleInitialURL = async () => {
            try {
                const url = await Linking.getInitialURL();

                if (url) {
                    console.log('[DeepLink] Initial URL:', url);
                    // Wait for navigation to be ready
                    if (navigationState?.key) {
                        await processDeepLink(url);
                    }
                }
            } catch (error) {
                console.error('[DeepLink] Error handling initial URL:', error);
            }
        };

        handleInitialURL();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigationState?.key]);

    /**
     * Handle URL events (app already open)
     */
    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            console.log('[DeepLink] URL event:', url);
            processDeepLink(url);
        });

        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { processDeepLink };
}

/**
 * Share a movie via deep link
 */
export function shareMovie(movieId: string, movieTitle: string): string {
    const url = `${DEEP_LINK_CONFIG.domains.production}/movie/${movieId}`;

    // In a real app, you would use Share API
    // import { Share } from 'react-native';
    // Share.share({
    //   message: `Check out "${movieTitle}" on CineSearch!`,
    //   url,
    // });

    return url;
}

/**
 * Share search results
 */
export function shareSearch(query: string): string {
    const url = `${DEEP_LINK_CONFIG.domains.production}/search?q=${encodeURIComponent(query)}`;
    return url;
}

/**
 * Generate QR code data for a movie
 */
export function generateMovieQRData(movieId: string): string {
    return `${DEEP_LINK_CONFIG.scheme}://movie/${movieId}`;
}

/**
 * Validate a deep link URL
 */
export function isValidDeepLink(url: string): boolean {
    const { route } = parseDeepLink(url);
    return route !== null;
}

/**
 * Get current URL from the app state
 */
export async function getCurrentURL(): Promise<string | null> {
    return Linking.getInitialURL();
}

/**
 * Open a URL externally
 */
export async function openExternalURL(url: string): Promise<boolean> {
    try {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
            return true;
        }

        return false;
    } catch (error) {
        console.error('[DeepLink] Error opening URL:', error);
        return false;
    }
}

export default useDeepLinkHandler;
