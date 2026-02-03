import { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

interface SkeletonProps {
    width: number;
    height: number;
    style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, style }: SkeletonProps) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0.3, 0.7]),
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height },
                style,
                animatedStyle
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
        borderRadius: 4,
    },
});