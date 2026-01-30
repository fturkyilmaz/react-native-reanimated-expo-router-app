import { Ionicons } from '@expo/vector-icons';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';
import { DynamicColorIOS } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
};

function TabIcon({ name, focused }: TabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, {
      damping: 10,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? '#007AFF' : '#1C1C1E'}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <NativeTabs iconColor={{
      default: '#787878ff',
      selected: '#007AFF',
    }}
      backgroundColor="rgba(255,255,255,0.95)"
      blurEffect="systemMaterial"
      labelStyle={{
        color: DynamicColorIOS({
          dark: '#fff',
          light: '#000',
        }),
      }} tintColor={DynamicColorIOS({
        dark: '#007AFF',
        light: '#000',
      })}>
      {/* Keşfet */}
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'film', selected: 'film.fill' }} />
        <Label>Keşfet</Label>
      </NativeTabs.Trigger>

      {/* Favoriler */}
      <NativeTabs.Trigger name="favorites">
        <Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <Label>Favoriler</Label>
      </NativeTabs.Trigger>

      {/* Ayarlar */}
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gear', selected: 'gearshape.fill' }} />
        <Label>Ayarlar</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}