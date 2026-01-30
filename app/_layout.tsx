import { AuthTransition } from '@/components/auth-transition';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';
import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
    <QueryProvider>
      <GestureHandlerRootView style={styles.container}>
        <AuthProvider>
          <FavoritesProvider>
            <RootLayoutNav />
          </FavoritesProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});