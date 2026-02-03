import { useAuthStore } from '@/store/authStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from './splash-screen';

export default function Index() {
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for hydration to complete
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500); // Minimum splash screen duration

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen while hydrating
  if (!isReady || isLoading) {
    return <SplashScreen />;
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    // User is authenticated - go to tabs
    return <Redirect href="/(tabs)" />;
  }

  // User is not authenticated - go to login
  return <Redirect href="/(auth)/login" />;
}
