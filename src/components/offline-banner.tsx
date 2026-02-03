/**
 * Offline Banner Component
 * 
 * Displays a banner when the device is offline and shows
 * pending mutation count if there are any.
 */

import { useOfflineBanner } from '@/hooks/use-network-status';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface OfflineBannerProps {
    onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { showBanner, offlineCount, hasPendingMutations } = useOfflineBanner();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onRetry?.();
    };

    if (!showBanner) {
        return null;
    }

    return (
        <Pressable
            style={[styles.container, { backgroundColor: colors.warning }]}
            onPress={handlePress}
            accessibilityLabel={t('offline.bannerLabel')}
            accessibilityHint={t('offline.bannerHint')}
        >
            <View style={styles.content}>
                <Ionicons
                    name="cloud-offline-outline"
                    size={20}
                    color={colors.background}
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.background }]}>
                        {t('offline.title')}
                    </Text>
                    {hasPendingMutations && (
                        <Text style={[styles.subtitle, { color: colors.background }]}>
                            {t('offline.pendingMutations', { count: offlineCount })}
                        </Text>
                    )}
                </View>
                {onRetry && (
                    <Ionicons
                        name="refresh"
                        size={20}
                        color={colors.background}
                        style={styles.icon}
                    />
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.9,
        marginTop: 2,
    },
    icon: {
        marginLeft: 8,
    },
});
