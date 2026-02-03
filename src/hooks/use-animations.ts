/**
 * Animation Hooks
 * 
 * Provides reusable animation hooks using Lottie and Reanimated.
 * 
 * Usage:
 * const { animatedStyle, start } = useFadeIn();
 */

import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';
import {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

// ============= Lottie Hooks =============

export function useLottieAnimation(options?: {
    autoPlay?: boolean;
    loop?: boolean;
    speed?: number;
}) {
    const { autoPlay = false, speed = 1 } = options || {};
    const animationRef = useRef<LottieView>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);

    useEffect(() => {
        if (autoPlay && animationRef.current) {
            animationRef.current.play();
            setIsPlaying(true);
        }
    }, [autoPlay]);

    const play = useCallback((fromProgress?: number, toProgress?: number) => {
        if (animationRef.current) {
            animationRef.current.play(fromProgress ?? 0, toProgress ?? 100);
            setIsPlaying(true);
        }
    }, []);

    const pause = useCallback(() => {
        if (animationRef.current) {
            animationRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const reset = useCallback(() => {
        if (animationRef.current) {
            animationRef.current.reset();
            setIsPlaying(false);
        }
    }, []);

    return {
        animationRef,
        isPlaying,
        play,
        pause,
        reset,
        speed,
    };
}

export function useSuccessAnimation() {
    const { animationRef, play, reset } = useLottieAnimation({
        autoPlay: false,
        loop: false,
    });

    const triggerSuccess = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        play(0, 100);
    }, [play]);

    return { animationRef, triggerSuccess, reset };
}

export function useErrorAnimation() {
    const { animationRef, play, reset } = useLottieAnimation({
        autoPlay: false,
        loop: false,
    });

    const triggerError = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        play(0, 100);
    }, [play]);

    return { animationRef, triggerError, reset };
}

// ============= Reanimated Hooks =============

export function useFadeIn(options?: { duration?: number; delay?: number }) {
    const { duration = 300, delay = 0 } = options || {};
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const start = useCallback(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration }));
    }, [delay, duration, opacity]);

    const reset = useCallback(() => {
        opacity.value = 0;
    }, [opacity]);

    return { animatedStyle, start, reset, opacity };
}

export function useFadeOut(options?: { duration?: number; delay?: number }) {
    const { duration = 300, delay = 0 } = options || {};
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const start = useCallback(() => {
        opacity.value = withDelay(delay, withTiming(0, { duration }));
    }, [delay, duration, opacity]);

    const reset = useCallback(() => {
        opacity.value = 1;
    }, [opacity]);

    return { animatedStyle, start, reset, opacity };
}

export function useScale(options?: {
    initialScale?: number;
    targetScale?: number;
    duration?: number;
}) {
    const { initialScale = 1, targetScale = 1.1, duration = 150 } = options || {};
    const scale = useSharedValue(initialScale);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const pulse = useCallback(() => {
        scale.value = withSequence(
            withTiming(targetScale, { duration: duration / 2 }),
            withTiming(initialScale, { duration: duration / 2 })
        );
    }, [initialScale, targetScale, duration, scale]);

    const reset = useCallback(() => {
        scale.value = initialScale;
    }, [initialScale, scale]);

    return { animatedStyle, pulse, reset, scale };
}

export function useSlideIn(options?: { duration?: number; delay?: number }) {
    const { duration = 300, delay = 0 } = options || {};
    const translateY = useSharedValue(100);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const start = useCallback(() => {
        translateY.value = withDelay(delay, withTiming(0, { duration }));
    }, [delay, duration, translateY]);

    const reset = useCallback(() => {
        translateY.value = 100;
    }, [translateY]);

    return { animatedStyle, start, reset, translateY };
}

export function useSpringAnimation(options?: {
    initialValue?: number;
    damping?: number;
    stiffness?: number;
}) {
    const { initialValue = 0, damping = 15, stiffness = 150 } = options || {};
    const progress = useSharedValue(initialValue);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: progress.value }],
    }));

    const trigger = useCallback((value = 1) => {
        progress.value = withSpring(value, { damping, stiffness });
    }, [damping, stiffness, progress]);

    const reset = useCallback(() => {
        progress.value = initialValue;
    }, [initialValue, progress]);

    return { animatedStyle, trigger, reset, progress };
}

export function useShake(options?: { intensity?: number }) {
    const { intensity = 10 } = options || {};
    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const shake = useCallback(() => {
        translateX.value = withSequence(
            withTiming(-intensity, { duration: 50 }),
            withTiming(intensity, { duration: 50 }),
            withTiming(-intensity, { duration: 50 }),
            withTiming(intensity, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    }, [intensity, translateX]);

    const reset = useCallback(() => {
        translateX.value = 0;
    }, [translateX]);

    return { animatedStyle, shake, reset, translateX };
}

export function useProgressBar(maxValue = 100) {
    const progress = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const setProgress = useCallback((value: number) => {
        progress.value = Math.min(Math.max(value, 0), maxValue);
    }, [maxValue, progress]);

    const animateTo = useCallback((value: number, duration = 300) => {
        progress.value = withTiming(Math.min(Math.max(value, 0), maxValue), {
            duration,
            easing: Easing.out(Easing.cubic),
        });
    }, [maxValue, progress]);

    const reset = useCallback(() => {
        progress.value = 0;
    }, [progress]);

    return { animatedStyle, setProgress, animateTo, reset, progress, maxValue };
}
