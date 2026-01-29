import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  const scale = useSharedValue(1);

  if (focused) {
    scale.value = withSpring(1.2, { damping: 10 });
  } else {
    scale.value = withSpring(1);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
        },
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          let iconName: any = 'home';
          if (route.name === 'index') iconName = 'film';
          else if (route.name === 'favorites') iconName = 'heart';
          else if (route.name === 'profile') iconName = 'person';

          return <TabIcon name={iconName} color={color} focused={focused} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoriler' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}