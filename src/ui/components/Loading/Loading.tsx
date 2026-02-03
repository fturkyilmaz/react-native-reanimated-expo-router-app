/**
 * Loading Component
 * Reusable loading indicator with multiple variants
 */

import { COLORS, SPACING, TYPOGRAPHY } from '@/core/constants/theme';
import React, { memo } from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

export type LoadingVariant = 'default' | 'dots' | 'bars' | 'spinner';
export type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingProps {
    /** Loading variant */
    variant?: LoadingVariant;
    /** Loading size */
    size?: LoadingSize;
    /** Optional text to show below */
    text?: string;
    /** Custom color */
    color?: string;
    /** Full screen loading */
    fullScreen?: boolean;
    /** Overlay background color */
    overlayColor?: string;
    /** Test ID */
    testID?: string;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

const sizeConfig: Record<LoadingSize, { indicator: number | 'small' | 'large'; fontSize: number }> = {
    small: { indicator: 'small', fontSize: 12 },
    medium: { indicator: 'small', fontSize: 14 },
    large: { indicator: 'large', fontSize: 16 },
};

export const Loading = memo(function Loading({
    variant = 'spinner',
    size = 'medium',
    text,
    color,
    fullScreen = false,
    overlayColor = COLORS.overlay,
    testID,
    style,
}: LoadingProps) {
    const indicatorColor = color ?? COLORS.primary;
    const sizeConfigData = sizeConfig[size];

    const containerStyle = fullScreen
        ? styles.fullScreenContainer
        : styles.container;

    const overlayStyle = fullScreen
        ? [styles.overlay, { backgroundColor: overlayColor }]
        : null;

    const renderContent = () => {
        switch (variant) {
            case 'dots':
                return (
                    <View style={styles.dotsContainer}>
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: indicatorColor },
                                animationStyle.dot1,
                            ]}
                        />
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: indicatorColor },
                                animationStyle.dot2,
                            ]}
                        />
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: indicatorColor },
                                animationStyle.dot3,
                            ]}
                        />
                    </View>
                );

            case 'bars':
                return (
                    <View style={styles.barsContainer}>
                        <View
                            style={[
                                styles.bar,
                                { backgroundColor: indicatorColor },
                                animationStyle.bar1,
                            ]}
                        />
                        <View
                            style={[
                                styles.bar,
                                { backgroundColor: indicatorColor },
                                animationStyle.bar2,
                            ]}
                        />
                        <View
                            style={[
                                styles.bar,
                                { backgroundColor: indicatorColor },
                                animationStyle.bar3,
                            ]}
                        />
                    </View>
                );

            default:
                return (
                    <ActivityIndicator
                        size={sizeConfigData.indicator}
                        color={indicatorColor}
                        testID={testID}
                    />
                );
        }
    };

    return (
        <View style={[containerStyle, style]} testID={testID}>
            {fullScreen && <View style={overlayStyle} />}
            <View style={styles.content}>
                {renderContent()}
                {text && (
                    <Text
                        style={[
                            styles.text,
                            { fontSize: sizeConfigData.fontSize },
                        ]}
                    >
                        {text}
                    </Text>
                )}
            </View>
        </View>
    );
});

/**
 * Skeleton Loader Component
 */
interface SkeletonProps {
    /** Width of skeleton */
    width: number;
    /** Height of skeleton */
    height: number;
    /** Border radius */
    borderRadius?: number;
    /** Test ID */
    testID?: string;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

export const Skeleton = memo(function Skeleton({
    width,
    height,
    borderRadius = 8,
    testID,
    style,
}: SkeletonProps) {
    return (
        <View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                style,
            ]}
            testID={testID}
        />
    );
});

/**
 * Shimmer Effect for Skeleton
 */
interface SkeletonShimmerProps {
    children: React.ReactNode;
    /** Whether shimmer is active */
    loading?: boolean;
    /** Shimmer speed in ms */
    speed?: number;
}

export function SkeletonShimmer({
    children,
    loading = true,
    speed = 1500,
}: SkeletonShimmerProps) {
    // Simplified - in production you'd use react-native-shimmer
    return loading ? <>{children}</> : null;
}

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
    /** Progress value (0-1) */
    progress: number;
    /** Progress color */
    color?: string;
    /** Background color */
    backgroundColor?: string;
    /** Height of progress bar */
    height?: number;
    /** Whether to show percentage text */
    showPercentage?: boolean;
    /** Test ID */
    testID?: string;
}

export function ProgressBar({
    progress,
    color = COLORS.primary,
    backgroundColor = COLORS.gray700,
    height = 8,
    showPercentage = false,
    testID,
}: ProgressBarProps) {
    const progressWidth = Math.min(Math.max(progress, 0), 1) * 100;

    return (
        <View style={styles.progressContainer} testID={testID}>
            <View
                style={[
                    styles.progressBackground,
                    { backgroundColor, height },
                ]}
            >
                <View
                    style={[
                        styles.progressBar,
                        {
                            backgroundColor: color,
                            width: `${progressWidth}%`,
                            height,
                        },
                    ]}
                />
            </View>
            {showPercentage && (
                <Text style={styles.progressText}>
                    {Math.round(progressWidth)}%
                </Text>
            )}
        </View>
    );
}

// Animation styles (simplified - would use react-native-reanimated in production)
const animationStyle = {
    dot1: { opacity: 0.3 },
    dot2: { opacity: 0.6 },
    dot3: { opacity: 1 },
    bar1: { opacity: 0.3 },
    bar2: { opacity: 0.6 },
    bar3: { opacity: 1 },
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    fullScreenContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        alignItems: 'center',
    },
    text: {
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 4,
        height: 32,
    },
    bar: {
        width: 8,
        borderRadius: 4,
    },
    skeleton: {
        backgroundColor: COLORS.gray700,
        overflow: 'hidden',
    },
    progressContainer: {
        width: '100%',
    },
    progressBackground: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        borderRadius: 4,
    },
    progressText: {
        ...TYPOGRAPHY.labelSmall,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'right',
    },
});

export default Loading;
