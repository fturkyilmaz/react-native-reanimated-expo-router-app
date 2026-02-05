/**
 * Settings Route Group Layout
 * 
 * Provides Stack navigation for settings-related screens.
 * 
 * Usage:
 * - Edit Profile: /edit-profile
 */

import { useTheme } from '@/hooks/use-theme';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.card,
                },
                headerTitleStyle: {
                    color: theme.text,
                    fontWeight: '600',
                },
                headerTintColor: theme.text,
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: theme.background,
                },
            }}
        >
            <Stack.Screen
                name="edit-profile"
                options={{
                    // Header options are defined in the screen component
                    // to allow dynamic cancel/save buttons
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="reset-db"
                options={{
                    title: 'Database Sıfırla',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
