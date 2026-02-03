/**
 * Core Type Definitions
 * Shared TypeScript types following Expo best practices
 */

import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Base entity interface for all domain models
 */
export interface BaseEntity {
    id: number | string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Movie domain model
 */
export interface Movie extends BaseEntity {
    title: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    voteAverage: number;
    releaseDate: string;
    genreIds: number[];
}

/**
 * Extended movie details with additional metadata
 */
export interface MovieDetails extends Movie {
    runtime: number;
    genres: { id: number; name: string }[];
    homepage: string;
    tagline: string;
    budget?: number;
    revenue?: number;
    status?: string;
    originalLanguage?: string;
    spokenLanguages?: { english_name: string; iso_639_1: string }[];
}

/**
 * Genre model
 */
export interface Genre {
    id: number;
    name: string;
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
    results: T[];
    page: number;
    totalPages: number;
    totalResults: number;
}

/**
 * API error response
 */
export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

/**
 * User domain model
 */
export interface User extends BaseEntity {
    id: string;
    email: string;
    name: string;
    token: string;
    avatarUrl?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Async operation state
 */
export type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
    | { ok: true; value: T }
    | { ok: false; error: E };

/**
 * Utility types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Async<T> = Promise<T>;
export type Dispatch<T> = (value: T) => void;

/**
 * Component prop types
 */
export interface WithChildren {
    children: React.ReactNode;
}

export interface WithStyle {
    style?: StyleProp<ViewStyle>;
}

export interface WithClassName {
    className?: string;
}

/**
 * Navigation types
 */
export type RootStackParamList = {
    '(tabs)': undefined;
    '(auth)': undefined;
    '(movies)': undefined;
    '(movies)/[id]': { id: string };
    'language-sheet': undefined;
};

export type AuthStackParamList = {
    login: undefined;
    register: undefined;
    'forgot-password': undefined;
};

export type MoviesStackParamList = {
    'movie-list': { category: 'popular' | 'top_rated' | 'upcoming' };
    'movie-detail': { id: string };
};

export type TabsParamList = {
    index: undefined;
    favorites: undefined;
    settings: undefined;
};

/**
 * Theme types
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
    colors: {
        primary: string;
        primaryLight: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        error: string;
        success: string;
    };
    spacing: Record<string, number>;
    typography: Record<string, { fontSize: number; fontWeight: string; lineHeight: number; letterSpacing: number }>;
}

/**
 * Query key factory
 */
export const queryKeys = {
    movies: {
        all: ['movies'] as const,
        list: (category: string, page: number) =>
            ['movies', 'list', category, page] as const,
        detail: (id: number | string) =>
            ['movies', 'detail', id] as const,
        search: (query: string, page: number) =>
            ['movies', 'search', query, page] as const,
    },
    favorites: {
        all: ['favorites'] as const,
        list: ['favorites', 'list'] as const,
    },
    auth: {
        user: ['auth', 'user'] as const,
        session: ['auth', 'session'] as const,
    },
} as const;

/**
 * Event handler types
 */
export type EventHandler<T = void> = T extends void
    ? () => void
    : (data: T) => void;

/**
 * Form types
 */
export interface FormField {
    value: string;
    error?: string;
    touched: boolean;
}

export interface FormState<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
}
