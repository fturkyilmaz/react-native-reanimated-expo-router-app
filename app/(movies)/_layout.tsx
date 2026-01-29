// app/movies/_layout.tsx
import { Stack } from 'expo-router';

export default function MoviesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#fff',
        headerBackTitle: 'Geri',
        animation: 'slide_from_right',
        headerShown: false,
      }}
    />
  );
}