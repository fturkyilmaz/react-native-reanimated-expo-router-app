import { subscribeToNetworkChanges } from '@/utils/offline-manager';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const { t } = useTranslation();
    const translateY = useSharedValue(-60);

    useEffect(() => {
        // Check initial state
        const unsubscribe = subscribeToNetworkChanges((online) => {
            runOnJS(setIsOffline)(!online);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const bannerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        if (isOffline) {
            translateY.value = withTiming(0, { duration: 300 });
        } else {
            translateY.value = withTiming(-60, { duration: 300 });
        }
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <Animated.View style={[styles.container, bannerStyle]}>
            <View style={styles.content}>
                <Text style={styles.icon}>📡</Text>
                <Text style={styles.text}>{t('offline.banner')}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#FF6B6B',
        paddingTop: 45, // Status bar height
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 16,
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
