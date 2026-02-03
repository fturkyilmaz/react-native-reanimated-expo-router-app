# CineSearch - Expert-Level Expo Project Plan

This document outlines the comprehensive improvements needed to elevate the CineSearch project to expert level following [Expo Best Practices](https://zaferayan.medium.com/expo-best-practices-kapsaml%C4%B1-rehber-0edbf7b3c28f).

## Current State Analysis

### Strengths ✓
- Good folder structure with clear separation of concerns
- React Query integration for data fetching
- Security features (SSL pinning, biometric auth)
- Telemetry with OpenTelemetry and Sentry
- i18n support with i18next
- Glass effect UI integration

### Areas for Improvement
- Data fetching patterns need optimization
- TypeScript strict mode not enabled
- No centralized design system
- Testing coverage needs expansion
- Project structure can be more feature-based

---

## Phase 1: Project Structure & Architecture

### 1.1 New Folder Structure
```
src/
├── core/                    # Shared utilities, types, constants
│   ├── constants/           # Theme, spacing, typography tokens
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Helper functions
│   └── config/             # App configuration
├── features/               # Feature-based modules
│   ├── auth/              # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   └── store/
│   ├── movies/            # Movies feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   └── services/
│   └── settings/          # Settings feature
├── ui/                    # Reusable design system
│   ├── components/        # Atomic components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Input/
│   ├── theme/             # Theme configuration
│   └── styles/
├── hooks/                 # Shared custom hooks
├── stores/                # Global state stores
└── services/              # API services
```

### 1.2 Design System Tokens
Create centralized theme tokens in [`src/core/constants/theme.ts`](src/core/constants/theme.ts):

```typescript
// Colors
export const COLORS = {
  primary: '#E50914',
  primaryLight: 'rgba(229, 9, 20, 0.1)',
  background: '#000000',
  surface: '#121212',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  error: '#CF6679',
  success: '#4CAF50',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Typography
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
};
```

---

## Phase 2: Data Fetching & React Query

### 2.1 Query Keys Constants
Create [`src/core/types/query-keys.ts`](src/core/types/query-keys.ts):

```typescript
export const queryKeys = {
  movies: {
    all: ['movies'] as const,
    list: (category: string, page: number) =>
      ['movies', 'list', category, page] as const,
    detail: (id: number) => ['movies', 'detail', id] as const,
    search: (query: string, page: number) =>
      ['movies', 'search', query, page] as const,
  },
  favorites: {
    all: ['favorites'] as const,
  },
};
```

### 2.2 React Query Hook Pattern
Create [`src/features/movies/hooks/use-movies.ts`](src/features/movies/hooks/use-movies.ts):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdb';
import { queryKeys } from '@/core/types/query-keys';
import type { Movie } from '@/core/types';

export function useMovies(category: 'popular' | 'top_rated' | 'upcoming', page = 1) {
  return useQuery({
    queryKey: queryKeys.movies.list(category, page),
    queryFn: () => tmdbService.getMovies(category, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => tmdbService.getMovieDetails(id),
    enabled: !!id,
  });
}
```

### 2.3 Optimistic Updates for Mutations
```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movie: Movie) =>
      isFavorite(movie.id)
        ? removeFavorite(movie.id)
        : addFavorite(movie),
    onMutate: async (movie) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData(queryKeys.favorites.all);

      queryClient.setQueryData(queryKeys.favorites.all, (old: Movie[] = []) => {
        const isFav = old.some(f => f.id === movie.id);
        return isFav
          ? old.filter(f => f.id !== movie.id)
          : [...old, movie];
      });

      return { previousFavorites };
    },
    onError: (err, movie, context) => {
      queryClient.setQueryData(queryKeys.favorites.all, context?.previousFavorites);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}
```

---

## Phase 3: TypeScript Improvements

### 3.1 Update tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 3.2 Shared Type Definitions
Create [`src/core/types/index.ts`](src/core/types/index.ts):

```typescript
// Base types
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Movie types
export interface Movie extends BaseEntity {
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
  genreIds: number[];
}

// API Response types
export interface PaginatedResponse<T> {
  results: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

// Utility types
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
```

---

## Phase 4: Performance Optimization

### 4.1 Component Memoization
```typescript
import { memo, useCallback, useMemo } from 'react';

interface MovieCardProps {
  movie: Movie;
  index: number;
  onPress: (id: number) => void;
}

export const MovieCard = memo(function MovieCard({
  movie,
  index,
  onPress,
}: MovieCardProps) {
  const handlePress = useCallback(() => onPress(movie.id), [movie.id, onPress]);

  const itemStyle = useMemo(
    () => [styles.card, { marginLeft: index % 2 === 0 ? 0 : 8 }],
    [index]
  );

  return (
    <Pressable style={itemStyle} onPress={handlePress}>
      {/* ... */}
    </Pressable>
  );
});
```

### 4.2 FlatList Optimization
```typescript
<FlatList
  data={movies}
  renderItem={renderItem}
  keyExtractor={(item) => `${item.id}-${item.posterPath}`}
  numColumns={2}
  columnWrapperStyle={styles.columnWrapper}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={6}
  removeClippedSubviews={true}
/>
```

### 4.3 Image Caching with expo-image
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: tmdbService.getImageUrl(movie.posterPath) }}
  style={styles.poster}
  contentFit="cover"
  transition={300}
  cachePolicy="memoryDisk"
/>
```

---

## Phase 5: Error Handling & Resilience

### 5.1 Global Error Boundary with Retry
Create [`src/ui/components/ErrorBoundary/ErrorBoundary.tsx`](src/ui/components/ErrorBoundary/ErrorBoundary.tsx):

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { extra: errorInfo });
    logErrorToTelemetry(error, 'react-error-boundary');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Button title="Retry" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}
```

### 5.2 Network Error Recovery
```typescript
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

export function useNetworkStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected;

      if (isOnline) {
        // Refetch all queries when coming back online
        queryClient.refetchQueries({ stale: true });
      }

      onlineManager.setOnline(isOnline);
    });

    return unsubscribe;
  }, [queryClient]);
}
```

---

## Phase 6: Security Enhancements

### 6.1 Complete SecurityProvider Integration
```typescript
// Uncomment and configure in app/_layout.tsx
import { SecurityProvider, SecurityCheckResult } from '@/security';

<SecurityProvider
  blockOnCompromised={!__DEV__}
  runStorageAudit={__DEV__}
  onSecurityCheck={(result: SecurityCheckResult) => {
    if (result.isCompromised) {
      console.warn('[Security] Device compromised:', result.riskLevel);
      Sentry.captureMessage('Security check failed', {
        level: 'error',
        extra: { riskLevel: result.riskLevel, checks: result.checks },
      });
    }
  }}
>
```

### 6.2 Root/Jailbreak Detection
```typescript
import { isRooted, isJailbroken } from '@/security/device-security';

const securityChecks = async () => {
  const [isDeviceRooted, isDeviceJailbroken] = await Promise.all([
    isRooted(),
    isJailbroken(),
  ]);

  if (isDeviceRooted || isDeviceJailbroken) {
    return { isCompromised: true, riskLevel: 'HIGH' };
  }

  return { isCompromised: false, riskLevel: 'LOW' };
};
```

---

## Phase 7: Testing Strategy

### 7.1 Unit Tests Structure
```
tests/unit/
├── features/
│   └── movies/
│       ├── hooks/
│       │   └── use-movies.test.ts
│       └── components/
│           └── movie-card.test.tsx
├── stores/
│   └── auth-store.test.ts
└── services/
    └── tmdb.test.ts
```

### 7.2 Example Unit Test
```typescript
// tests/unit/features/movies/hooks/use-movies.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useMovies } from '@/features/movies/hooks/use-movies';
import { queryClient } from '@/test-utils';

describe('useMovies', () => {
  it('should return movies data', async () => {
    const { result } = renderHook(() => useMovies('popular'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### 7.3 Integration Tests
```typescript
// tests/integration/auth-flow.test.ts
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';

describe('Authentication Flow', () => {
  it('should navigate to home on successful login', async () => {
    const { navigate } = mockNavigation();

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByText('Login');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('Home');
    });
  });
});
```

---

## Phase 8: UI/UX Improvements

### 8.1 Reusable Button Component
Create [`src/ui/components/Button/Button.tsx`](src/ui/components/Button/Button.tsx):

```typescript
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { ButtonProps } from './Button.types';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </Pressable>
  );
}
```

### 8.2 Haptic Feedback Integration
```typescript
import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

// Usage
const handleSelect = (item: Item) => {
  hapticFeedback.light();
  onSelect(item);
};
```

---

## Phase 9: Documentation

### 9.1 Architecture Documentation
Update [`README.md`](README.md) with:
- Project overview and architecture
- Tech stack explanation
- Folder structure guide
- Development setup instructions
- Deployment guide

### 9.2 API Documentation
Create [`docs/API.md`](docs/API.md):
- API endpoints documentation
- Request/response examples
- Error codes and handling

### 9.3 Contributing Guide
Create [`CONTRIBUTING.md`](CONTRIBUTING.md):
- Code style guidelines
- Commit message convention
- Pull request process
- Testing requirements

---

## Implementation Order

1. **Week 1: Foundation**
   - Update project structure
   - Create design system tokens
   - Enable TypeScript strict mode

2. **Week 2: Data Layer**
   - Implement React Query patterns
   - Create query keys constants
   - Add optimistic updates

3. **Week 3: Components & UI**
   - Create reusable UI components
   - Implement error boundaries
   - Add haptic feedback

4. **Week 4: Testing & Polish**
   - Expand test coverage
   - Complete documentation
   - Performance optimization

---

## Metrics for Success

- **Type Safety**: 100% TypeScript coverage, no implicit `any`
- **Test Coverage**: 80%+ unit test coverage
- **Performance**: 60fps animations, <100ms API response time
- **Error Handling**: <0.1% crash-free sessions
- **Code Quality**: ESLint + Prettier compliance
