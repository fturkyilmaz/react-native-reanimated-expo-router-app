# State Management

## Overview

CineSearch uses Zustand for global state and TanStack Query for server state.

## Store Structure

```
src/stores/
├── auth-store.ts       # Authentication state
├── theme-store.ts      # Theme preferences
├── favorites-store.ts  # User favorites
└── ui-store.ts         # UI state (modals, toasts)
```

## Zustand Store Example

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '@/security/secure-storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

## Selector Pattern

```typescript
// Good - selective rendering
export function UserAvatar() {
  const user = useAuthStore((state) => state.user);
  return <Avatar source={{ uri: user?.avatar }} />;
}

// Avoid - causes unnecessary re-renders
const user = useAuthStore(); // Entire store
```

## Theme Store

```typescript
// src/stores/theme-store.ts
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  colors: getThemeColors('dark'),
  setMode: (mode) => set({ mode, colors: getThemeColors(mode) }),
}));
```

## Related Files

- [`src/store/authStore.ts`](../src/store/authStore.ts)
- [`src/store/themeStore.ts`](../src/store/themeStore.ts)
