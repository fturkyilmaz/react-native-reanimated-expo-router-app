import { SocialAuthProvider } from '@/auth';
import { AuthTransition } from '@/components/auth-transition';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';
import { COLORS } from '@/core/constants/theme';
import DeepLinkProvider from '@/deep-linking';
import { AuthProvider } from '@/hooks/use-auth';
import { FavoritesProvider } from '@/hooks/use-favorites';
import { useNetworkStatus } from '@/hooks/use-network-status';
import i18n from '@/i18n';
import { OpenTelemetryProvider } from '@/otel/provider';
import { QueryProvider } from '@/providers/query-provider';
import { SecurityProvider } from '@/security/security-provider';
import { SentryProvider } from '@/sentry/provider';
import { useAuthStore } from '@/store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

function RootLayoutNav() {
  const { user, isTransitioning, completeTransition } = useAuthStore();

  // Initialize network status monitoring (inside QueryProvider)
  useNetworkStatus();

  return (
    <>
      <AuthTransition
        isVisible={isTransitioning}
        onAnimationComplete={completeTransition}
        userName={user?.name || ''}
      />
      <OfflineBanner />

      <StatusBar style="light" />
      <Stack screenOptions={{ animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(movies)" options={{ headerShown: false }} />
        <Stack.Screen name="(settings)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const handleSecurityCheck = (result: { isCompromised: boolean; riskLevel: string }) => {
    if (result.isCompromised) {
      console.warn('[Security] Device compromised:', result.riskLevel);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardProvider>
        <SentryProvider dsn={process.env.EXPO_PUBLIC_SENTRY_DSN}>
          <OpenTelemetryProvider>
            <SecurityProvider
              blockOnCompromised={!__DEV__}
              runStorageAudit={__DEV__}
              onSecurityCheck={handleSecurityCheck}
            >
              <DeepLinkProvider>
                <I18nextProvider i18n={i18n}>
                  <QueryProvider>
                    <ErrorBoundary>
                      <AuthProvider>
                        <FavoritesProvider>
                          <SocialAuthProvider>
                            <RootLayoutNav />
                          </SocialAuthProvider>
                        </FavoritesProvider>
                      </AuthProvider>
                    </ErrorBoundary>
                  </QueryProvider>
                </I18nextProvider>
              </DeepLinkProvider>
            </SecurityProvider>
          </OpenTelemetryProvider>
        </SentryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
