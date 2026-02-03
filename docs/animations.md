# Animations

## Overview

CineSearch uses Lottie for complex animations and Reanimated for gesture-based animations.

## Lottie Animations

```tsx
import LottieView from 'lottie-react-native';
import successAnimation from '@/assets/animations/success.json';

<LottieView
  source={successAnimation}
  autoPlay
  loop={false}
  style={styles.animation}
/>
```

## Reanimated Hooks

### Fade In

```tsx
import { useFadeIn } from '@/hooks/use-animations';

function MyComponent() {
  const { animatedStyle, start } = useFadeIn();
  
  return <Animated.View style={animatedStyle} />;
}
```

### Scale/Pulse

```tsx
import { useScale } from '@/hooks/use-animations';

function PulseButton() {
  const { animatedStyle, pulse } = useScale();
  
  return <Animated.View style={animatedStyle} onPress={pulse} />;
}
```

### Shake (Error Feedback)

```tsx
import { useShake } from '@/hooks/use-animations';

function ErrorField() {
  const { animatedStyle, shake } = useShake();
  
  return <Animated.View style={animatedStyle} />;
}
```

## Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Success feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Light impact
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

## Performance Guidelines

1. Use `useMemo` and `useCallback` to prevent re-renders
2. Prefer `transform` over `top`, `left`, `right`, `bottom`
3. Use `shouldAnimateExclusion` for large lists
4. Test animations on low-end devices

## Related Files

- [`src/hooks/use-animations.ts`](../src/hooks/use-animations.ts)
- [`src/assets/animations/`](../src/assets/animations/)
