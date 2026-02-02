import { AuthTransition } from '@/components/auth-transition';
import { ErrorBoundary } from '@/components/error-boundary';
import DeepLinkProvider from '@/deep-linking';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';
import i18n from '@/i18n';
import { OpenTelemetryProvider } from '@/otel/provider';
import { QueryProvider } from '@/providers/query-provider';
import { SentryProvider } from '@/sentry/provider';
import { useAuthStore } from '@/store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayoutNav() {
  const { user, isTransitioning, completeTransition } = useAuthStore();


  return (
    <View style={styles.container}>
      <AuthTransition
        isVisible={isTransitioning}
        onAnimationComplete={completeTransition}
        userName={user?.name || ''}
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
    <GestureHandlerRootView style={styles.container}>
      <SentryProvider dsn={process.env.EXPO_PUBLIC_SENTRY_DSN}>
        <OpenTelemetryProvider>
          {/* <SecurityProvider
          blockOnCompromised={!__DEV__}
          runStorageAudit={__DEV__}
          onSecurityCheck={(result: SecurityCheckResult) => {
            if (result.isCompromised) {
              console.warn('[Security] Device compromised:', result.riskLevel, result.checks);
            }
          }}
        > */}
          <DeepLinkProvider>
            <I18nextProvider i18n={i18n}>
              <QueryProvider>
                <ErrorBoundary>
                  <AuthProvider>
                    <FavoritesProvider>
                      <RootLayoutNav />
                    </FavoritesProvider>
                  </AuthProvider>
                </ErrorBoundary>
              </QueryProvider>
            </I18nextProvider>
          </DeepLinkProvider>
          {/* </SecurityProvider> */}
        </OpenTelemetryProvider>
      </SentryProvider>
    </GestureHandlerRootView>
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