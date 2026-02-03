import { useTheme } from '@/hooks/use-theme';
import { Stack } from 'expo-router';
import { useMemo } from 'react';

export default function AuthLayout() {
    const { theme, isDarkMode } = useTheme();

    const headerStyle = useMemo(() => ({
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderBottomWidth: 0,
        shadowOpacity: 0,
    }), [isDarkMode]);

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerBackTitle: 'Geri',
                headerStyle,
                headerTintColor: theme.primary,
            }}
        >
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ title: '' }} />
        </Stack>
    );
}
