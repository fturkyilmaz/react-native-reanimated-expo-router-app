/**
 * Button Component
 * Reusable button with multiple variants, sizes, and states
 */

import { COLORS } from '@/core/constants/theme';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    /** Button title */
    title: string;
    /** Callback when button is pressed */
    onPress: () => void;
    /** Button variant style */
    variant?: ButtonVariant;
    /** Button size */
    size?: ButtonSize;
    /** Whether button is in loading state */
    loading?: boolean;
    /** Whether button is disabled */
    disabled?: boolean;
    /** Optional icon to show before text */
    icon?: React.ReactNode;
    /** Optional icon to show after text */
    iconRight?: React.ReactNode;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
    /** Test ID for testing */
    testID?: string;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
        container: {
            backgroundColor: COLORS.primary,
        },
        text: {
            color: COLORS.white,
        },
    },
    secondary: {
        container: {
            backgroundColor: COLORS.gray700,
        },
        text: {
            color: COLORS.white,
        },
    },
    outline: {
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: COLORS.primary,
        },
        text: {
            color: COLORS.primary,
        },
    },
    ghost: {
        container: {
            backgroundColor: 'transparent',
        },
        text: {
            color: COLORS.text,
        },
    },
    danger: {
        container: {
            backgroundColor: COLORS.error,
        },
        text: {
            color: COLORS.white,
        },
    },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
        container: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
        },
        text: {
            fontSize: 14,
            fontWeight: '600',
        },
    },
    md: {
        container: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
        },
        text: {
            fontSize: 16,
            fontWeight: '600',
        },
    },
    lg: {
        container: {
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 16,
        },
        text: {
            fontSize: 18,
            fontWeight: '700',
        },
    },
};

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconRight,
    style,
    testID,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            style={[
                styles.container,
                variantStyles[variant].container,
                sizeStyles[size].container,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: isDisabled }}
            testID={testID}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? COLORS.white : COLORS.primary}
                    size="small"
                />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text
                        style={[
                            styles.text,
                            variantStyles[variant].text,
                            sizeStyles[size].text,
                        ]}
                    >
                        {title}
                    </Text>
                    {iconRight && <>{iconRight}</>}
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default Button;
