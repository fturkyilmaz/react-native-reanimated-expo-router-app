import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AuthTransitionProps {
    isVisible: boolean;
    onAnimationComplete: () => void;
    userName: string;
}

export function AuthTransition({ isVisible, onAnimationComplete, userName }: AuthTransitionProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1, { damping: 15 })
            );

            textOpacity.value = withTiming(1, { duration: 600 });

            const timer = setTimeout(() => {
                scale.value = withTiming(20, { duration: 800 }, () => {
                    runOnJS(onAnimationComplete)();
                });
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: (1 - textOpacity.value) * 20 }],
    }));

    if (!isVisible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
            <Animated.View style={[styles.container, containerStyle]}>
                <LottieView
                    source={require('@/assets/animations/success.json')}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                />
                <Animated.Text style={[styles.welcomeText, textStyle]}>
                    Hoşgeldin {userName}! 🎬
                </Animated.Text>
                <Animated.Text style={[styles.subText, textStyle]}>
                    Film dünyası seni bekliyor...
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