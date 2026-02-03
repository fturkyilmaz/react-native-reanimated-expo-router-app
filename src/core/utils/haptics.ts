/**
 * Haptic Feedback Utility
 * Centralized haptic feedback for consistent user experience
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback types
 */
export type HapticType =
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'selection';

/**
 * Haptic feedback configuration
 */
const hapticConfig: Record<HapticType, Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType> = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
    selection: Haptics.ImpactFeedbackStyle.Light,
};

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(type: HapticType): void {
    if (Platform.OS === 'ios') {
        if (type === 'success' || type === 'warning' || type === 'error') {
            Haptics.notificationAsync(hapticConfig[type] as Haptics.NotificationFeedbackType);
        } else {
            Haptics.impactAsync(hapticConfig[type] as Haptics.ImpactFeedbackStyle);
        }
    }
    // Android doesn't support haptics in the same way
}

/**
 * Predefined haptic patterns for common interactions
 */
export const haptics = {
    /**
     * Light tap for buttons and selections
     */
    tap: () => triggerHaptic('light'),

    /**
     * Medium tap for important actions
     */
    press: () => triggerHaptic('medium'),

    /**
     * Heavy tap for destructive actions
     */
    heavy: () => triggerHaptic('heavy'),

    /**
     * Success feedback for completed actions
     */
    success: () => triggerHaptic('success'),

    /**
     * Warning feedback
     */
    warning: () => triggerHaptic('warning'),

    /**
     * Error feedback
     */
    error: () => triggerHaptic('error'),

    /**
     * Selection change feedback
     */
    selection: () => triggerHaptic('selection'),

    /**
     * Navigation swipe feedback
     */
    swipe: () => triggerHaptic('light'),

    /**
     * Long press feedback
     */
    longPress: () => triggerHaptic('medium'),
};

/**
 * Hook for using haptic feedback in components
 */
export function useHaptic() {
    return haptics;
}

export default haptics;
