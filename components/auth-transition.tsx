import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface AuthTransitionProps {
    isVisible: boolean;
    onAnimationComplete: () => void;
    userName: string;
}

export function AuthTransition({
    isVisible,
    onAnimationComplete,
    userName,
}: AuthTransitionProps) {
    const containerOpacity = useSharedValue(0);
    const scale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const { t } = useTranslation();

    useEffect(() => {
        if (!isVisible) return;

        containerOpacity.value = withTiming(1, { duration: 200 });

        scale.value = withSequence(
            withSpring(1.2, { damping: 14, stiffness: 200 }),
            withSpring(1, { damping: 16, stiffness: 200 }),
            withDelay(
                1000,
                withTiming(20, { duration: 400 }, () => {
                    runOnJS(onAnimationComplete)();
                })
            )
        );

        textOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    }, [isVisible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: (1 - textOpacity.value) * 16 }],
    }));

    if (!isVisible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
            <Animated.View style={[styles.container, containerStyle]}>
                <Animated.View style={scaleStyle}>
                    <LottieView source={require('@/assets/animations/success.json')} autoPlay loop={false} style={styles.lottie} />
                </Animated.View>

                <Animated.Text style={[styles.welcomeText, textStyle]}>
                    {t('authTransition.welcome', { name: userName })}
                </Animated.Text>

                <Animated.Text style={[styles.subText, textStyle]}>
                    {t('authTransition.subText')}
                </Animated.Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    lottie: {
        width: 200,
        height: 200,
    },
    welcomeText: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    subText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        marginTop: 10,
    },
});