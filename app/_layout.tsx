import { AuthTransition } from '@/components/auth-transition';
import { AuthProvider } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';
import i18n from '@/i18n';
import { OpenTelemetryProvider } from '@/otel/provider';
import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/authStore';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n';

function RootLayoutNav() {
  const router = useRouter();
  const { user, isAuthenticated, isTransitioning, completeTransition, isBiometricEnabled, updateLastAuthenticated } = useAuthStore();
  const { authenticate, checkBiometricSupport } = useBiometricAuth();
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(false);

  // Uygulama açılışında biyometrik kontrolü
  useEffect(() => {
    const checkBiometricOnLaunch = async () => {
      // Kullanıcı oturum açık ve biyometrik aktif mi kontrol et
      if (isAuthenticated && isBiometricEnabled && user) {
        setIsCheckingBiometric(true);

        // Cihaz hala biyometrik destekliyor mu kontrol et
        const support = await checkBiometricSupport();
        if (!support.isAvailable || !support.isEnrolled) {
          // Biyometrik artık kullanılamıyor, kontrolü atla
          setIsCheckingBiometric(false);
          return;
        }

        // Biyometrik doğrulama yap
        const result = await authenticate();

        if (!result.success) {
          // Doğrulama başarısız veya iptal edildi, login ekranına yönlendir
          router.replace('/(auth)/login');
        } else {
          // Doğrulama başarılı, son doğrulama zamanını güncelle
          updateLastAuthenticated();
        }

        setIsCheckingBiometric(false);
      }
    };

    checkBiometricOnLaunch();
  }, [isAuthenticated, isBiometricEnabled, user]);

  if (isCheckingBiometric) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

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
    <OpenTelemetryProvider>
      <I18nextProvider i18n={i18n}>
        <QueryProvider>
          <GestureHandlerRootView style={styles.container}>
            <AuthProvider>
              <FavoritesProvider>
                <RootLayoutNav />
              </FavoritesProvider>
            </AuthProvider>
          </GestureHandlerRootView>
        </QueryProvider>
      </I18nextProvider>
    </OpenTelemetryProvider>
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