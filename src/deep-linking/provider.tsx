/**
 * Deep Link Provider
 * 
 * React Context provider for deep linking functionality.
 * Wraps the app and handles all incoming deep links.
 */

import React, { createContext, useCallback, useContext } from 'react';
import { buildDeepLink } from './config';
import { DeepLinkResult, generateMovieQRData, shareMovie, shareSearch, useDeepLinkHandler } from './handler';

/**
 * Deep link context state
 */
interface DeepLinkContextState {
    /** Process an incoming deep link URL */
    processDeepLink: (url: string) => Promise<DeepLinkResult>;
    /** Build a shareable deep link */
    buildShareLink: (route: string, params?: Record<string, string>) => string;
    /** Share a movie */
    shareMovie: (movieId: string, movieTitle: string) => string;
    /** Share search results */
    shareSearch: (query: string) => string;
    /** Generate QR code data */
    generateQRData: (movieId: string) => string;
}

// Create context with default values
const DeepLinkContext = createContext<DeepLinkContextState>({
    processDeepLink: async () => ({ success: false }),
    buildShareLink: () => '',
    shareMovie: () => '',
    shareSearch: () => '',
    generateQRData: () => '',
});

/**
 * Hook to access deep link context
 */
export function useDeepLink() {
    const context = useContext(DeepLinkContext);
    if (!context) {
        throw new Error('useDeepLink must be used within a DeepLinkProvider');
    }
    return context;
}

/**
 * Deep Link Provider Props
 */
interface DeepLinkProviderProps {
    children: React.ReactNode;
}

/**
 * Deep Link Provider Component
 * 
 * Wraps the app and provides deep linking functionality
 */
export function DeepLinkProvider({ children }: DeepLinkProviderProps) {
    const { processDeepLink } = useDeepLinkHandler();

    const buildShareLink = useCallback((route: string, params?: Record<string, string>): string => {
        return buildDeepLink(route, params, true);
    }, []);

    const handleShareMovie = useCallback((movieId: string, movieTitle: string): string => {
        return shareMovie(movieId, movieTitle);
    }, []);

    const handleShareSearch = useCallback((query: string): string => {
        return shareSearch(query);
    }, []);

    const handleGenerateQR = useCallback((movieId: string): string => {
        return generateMovieQRData(movieId);
    }, []);

    const contextValue: DeepLinkContextState = {
        processDeepLink,
        buildShareLink,
        shareMovie: handleShareMovie,
        shareSearch: handleShareSearch,
        generateQRData: handleGenerateQR,
    };

    return (
        <DeepLinkContext.Provider value={contextValue}>
            {children}
        </DeepLinkContext.Provider>
    );
}

export default DeepLinkProvider;
