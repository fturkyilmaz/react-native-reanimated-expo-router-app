/**
 * Design System Tokens
 * Centralized theme constants following Expo best practices
 */

// Colors
export const COLORS = {
    // Primary brand colors
    primary: '#E50914',
    primaryLight: 'rgba(229, 9, 20, 0.1)',
    primaryDark: '#B2060F',

    // Background colors
    background: '#000000',
    backgroundSecondary: '#121212',
    backgroundTertiary: '#1E1E1E',

    // Surface colors
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',

    // Text colors
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    textInverse: '#000000',

    // Status colors
    error: '#CF6679',
    errorLight: 'rgba(207, 102, 121, 0.1)',
    success: '#4CAF50',
    successLight: 'rgba(76, 175, 80, 0.1)',
    warning: '#FF9800',
    warningLight: 'rgba(255, 152, 0, 0.1)',
    info: '#2196F3',
    infoLight: 'rgba(33, 150, 243, 0.1)',

    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(255, 255, 255, 0.3)',
} as const;

// Spacing scale
export const SPACING = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
} as const;

// Border radius
export const BORDER_RADIUS = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
} as const;

// Typography scale
export const TYPOGRAPHY = {
    // Display styles
    displayLarge: {
        fontSize: 57,
        fontWeight: '400',
        lineHeight: 64,
        letterSpacing: -0.25,
    },
    displayMedium: {
        fontSize: 45,
        fontWeight: '400',
        lineHeight: 52,
        letterSpacing: 0,
    },
    displaySmall: {
        fontSize: 36,
        fontWeight: '400',
        lineHeight: 44,
        letterSpacing: 0,
    },

    // Headline styles
    headlineLarge: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: 0,
    },
    headlineMedium: {
        fontSize: 28,
        fontWeight: '600',
        lineHeight: 36,
        letterSpacing: 0,
    },
    headlineSmall: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: 0,
    },

    // Title styles
    titleLarge: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 28,
        letterSpacing: 0,
    },
    titleMedium: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    titleSmall: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0.1,
    },

    // Body styles
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: 0.5,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        letterSpacing: 0.25,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: 0.4,
    },

    // Label styles
    labelLarge: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    labelSmall: {
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: 0.5,
    },
} as const;

// Shadows
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    small: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
} as const;

// Animation durations
export const ANIMATION = {
    duration: {
        short: 150,
        medium: 300,
        long: 500,
        extraLong: 800,
    },
    easing: {
        easeIn: 'easeIn',
        easeOut: 'easeOut',
        easeInOut: 'easeInOut',
        linear: 'linear',
        spring: 'spring',
    },
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
    small: 320,
    medium: 480,
    large: 768,
    xlarge: 1024,
    xxlarge: 1200,
} as const;

// Z-index scale
export const Z_INDEX = {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 2000,
    popover: 3000,
    toast: 4000,
    tooltip: 5000,
} as const;

// Export type helpers
export type ColorKey = keyof typeof COLORS;
export type SpacingKey = keyof typeof SPACING;
export type TypographyKey = keyof typeof TYPOGRAPHY;
