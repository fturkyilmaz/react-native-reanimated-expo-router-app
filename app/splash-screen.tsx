import { useTheme } from '@/hooks/use-theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
    const { theme, isDarkMode } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.15)' : '#FFF3F3' }]}>
                    <Text style={[styles.logo, { color: theme.primary }]}>🎬</Text>
                </View>
                <Text style={[styles.appName, { color: theme.text }]}>CineSearch</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={theme.primary} size="small" />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        fontSize: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
    },
});
