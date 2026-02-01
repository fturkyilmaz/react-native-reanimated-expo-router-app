import { AuthTransition } from '@/components/auth-transition';
import { ErrorBoundary } from '@/components/error-boundary';
import { DeepLinkProvider } from '@/deep-linking';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';
import i18n from '@/i18n';
import { OpenTelemetryProvider } from '@/otel/provider';
import { QueryProvider } from '@/providers/query-provider';
import type { SecurityCheckResult } from '@/security';
import { SecurityProvider } from '@/security';
import { SentryProvider } from '@/sentry/provider';
import { useAuthStore } from '@/store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n';

function RootLayoutNav() {
  const authStore = useAuthStore();


  return (
    <View style={styles.container}>
      <AuthTransition
        isVisible={authStore.isTransitioning}
        onAnimationComplete={authStore.completeTransition}
        userName={authStore.user?.name || ''}
      />

      <StatusBar style="light" />
      <Stack screenOptions={{ animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(movies)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SentryProvider dsn={process.env.EXPO_PUBLIC_SENTRY_DSN}>
      <OpenTelemetryProvider>
        <SecurityProvider
          blockOnCompromised={!__DEV__}
          runStorageAudit={__DEV__}
          onSecurityCheck={(result: SecurityCheckResult) => {
            if (result.isCompromised) {
              console.warn('[Security] Device compromised:', result.riskLevel, result.checks);
            }
          }}
        >
          <DeepLinkProvider>
            <I18nextProvider i18n={i18n}>
              <QueryProvider>
                <GestureHandlerRootView style={styles.container}>
                  <ErrorBoundary>
                    <AuthProvider>
                      <FavoritesProvider>
                        <RootLayoutNav />
                      </FavoritesProvider>
                    </AuthProvider>
                  </ErrorBoundary>
                </GestureHandlerRootView>
              </QueryProvider>
            </I18nextProvider>
          </DeepLinkProvider>
        </SecurityProvider>
      </OpenTelemetryProvider>
    </SentryProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});