/**
 * Card Component
 * Reusable card component with multiple variants
 */

import { COLORS, SHADOWS } from '@/core/constants/theme';
import React, { memo } from 'react';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps {
    /** Card content */
    children: React.ReactNode;
    /** Card variant style */
    variant?: CardVariant;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
    /** Callback when card is pressed */
    onPress?: () => void;
    /** Whether card is interactive */
    interactive?: boolean;
    /** Test ID for testing */
    testID?: string;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
    elevated: {
        backgroundColor: COLORS.surface,
        ...SHADOWS.medium,
    },
    outlined: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    filled: {
        backgroundColor: COLORS.backgroundSecondary,
    },
};

const CardComponent = ({
    children,
    variant = 'elevated',
    style,
    onPress,
    interactive = false,
    testID,
}: CardProps) => {
    const CardWrapper = interactive ? Pressable : View;
    const pressableStyle = interactive
        ? ({ pressed }: { pressed: boolean }) => [
            styles.container,
            variantStyles[variant],
            style,
            pressed && styles.pressed,
        ]
        : [styles.container, variantStyles[variant], style];

    return (
        <CardWrapper
            style={pressableStyle}
            onPress={onPress}
            testID={testID}
        >
            {children}
        </CardWrapper>
    );
};

export const Card = memo(CardComponent);

interface CardHeaderProps {
    /** Header content */
    children: React.ReactNode;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

export function CardHeader({ children, style }: CardHeaderProps) {
    return <View style={[styles.cardHeader, style]}>{children}</View>;
}

interface CardContentProps {
    /** Content */
    children: React.ReactNode;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

export function CardContent({ children, style }: CardContentProps) {
    return <View style={[styles.cardContent, style]}>{children}</View>;
}

interface CardFooterProps {
    /** Footer content */
    children: React.ReactNode;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

export function CardFooter({ children, style }: CardFooterProps) {
    return <View style={[styles.cardFooter, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    cardContent: {
        padding: 16,
    },
    cardFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
});

export default Card;
