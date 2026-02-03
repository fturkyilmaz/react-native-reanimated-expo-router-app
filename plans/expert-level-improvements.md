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

---

## Phase 10: Offline Support & Persistence

### 10.1 Storage Strategy
- **expo-sqlite**: Large data caching (movies, favorites, cache)
- **localStorage**: Small data (theme, settings, user preferences)

```typescript
// Install localStorage adapter for expo-sqlite
import "expo-sqlite/localStorage/install";

// Small data - localStorage
localStorage.setItem("theme", "dark");
localStorage.setItem("language", "tr");

// Large data - expo-sqlite
import { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('cinesearch.db');
db.execAsync(`
  CREATE TABLE IF NOT EXISTS movie_cache (
    id INTEGER PRIMARY KEY,
    data TEXT,
    expires_at INTEGER
  );
`);
```

### 10.2 Offline Data Caching
```typescript
// src/core/services/offline-cache.ts
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('cinesearch.db');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class OfflineCache {
  async set<T>(key: string, data: T, ttlMinutes = 60): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };
    
    await db.runAsync(
      `INSERT OR REPLACE INTO cache VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=?, expires_at=?`,
      [key, JSON.stringify(entry), entry.timestamp, entry.expiresAt]
    );
  }
  
  async get<T>(key: string): Promise<T | null> {
    const result = await db.getFirstAsync<{ data: string }>(
      `SELECT * FROM cache WHERE key = ? AND expires_at > ?`,
      [key, Date.now()]
    );
    
    if (!result) return null;
    const entry: CacheEntry<T> = JSON.parse(result.data);
    return entry.data;
  }
  
  async invalidate(key: string): Promise<void> {
    await db.runAsync(`DELETE FROM cache WHERE key = ?`, [key]);
  }
}

// Usage with React Query
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineCache } from '@/core/services/offline-cache';

export function useCachedMovies(category: string, page: number) {
  return useQuery({
    queryKey: ['movies', category, page],
    queryFn: async () => {
      const data = await tmdbService.getMovies(category, page);
      await offlineCache.set(`movies:${category}:${page}`, data, 60);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 10.3 Mutation Queue for Offline
```typescript
// src/core/services/mutation-queue.ts
export interface QueuedMutation<T> {
  id: string;
  type: string;
  variables: T;
  timestamp: number;
  retryCount: number;
}

const MUTATION_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS mutation_queue (
    id TEXT PRIMARY KEY,
    type TEXT,
    variables TEXT,
    timestamp INTEGER,
    retry_count INTEGER
  );
`;

export class MutationQueue {
  private db = openDatabaseSync('cinesearch.db');
  
  async enqueue<T>(type: string, variables: T): Promise<void> {
    const id = crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO mutation_queue VALUES (?, ?, ?, ?, 0)`,
      [id, type, JSON.stringify(variables), Date.now()]
    );
  }
  
  async dequeue(): Promise<QueuedMutation<unknown> | null> {
    const result = await this.db.getFirstAsync<QueuedMutation<unknown>>(
      `SELECT * FROM mutation_queue ORDER BY timestamp ASC LIMIT 1`
    );
    return result;
  }
  
  async remove(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
  }
  
  async incrementRetry(id: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE mutation_queue SET retry_count = retry_count + 1 WHERE id = ?`,
      [id]
    );
  }
  
  async getQueueSize(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM mutation_queue`
    );
    return result?.count ?? 0;
  }
}

// Process queue when online
async function processMutationQueue(queue: MutationQueue) {
  const mutation = await queue.dequeue();
  if (!mutation) return;
  
  try {
    switch (mutation.type) {
      case 'TOGGLE_FAVORITE':
        await tmdbService.toggleFavorite(JSON.parse(mutation.variables as string));
        break;
    }
    await queue.remove(mutation.id);
  } catch (error) {
    if (mutation.retryCount < 3) {
      await queue.incrementRetry(mutation.id);
    } else {
      await queue.remove(mutation.id);
      // Notify user about failed mutation
    }
  }
}
```

### 10.4 Network Status Integration
```typescript
// src/hooks/use-network-status.ts
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useNetworkStatus() {
  useEffect(() => {
    // Set up React Query online manager
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
      });
    });
    
    // Process queue when coming back online
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const queue = new MutationQueue();
        await processMutationQueue(queue);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
}
```

---

## Phase 11: API Layer Improvements

### 11.1 API Client with Interceptors
```typescript
// src/core/api/client.ts
import axios from 'axios';
import * as Sentry from 'sentry-expo';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await secureStorage.getItem('refreshToken');
        const { accessToken } = await authService.refreshToken(refreshToken);
        await secureStorage.setItem('authToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await authService.logout();
        router.replace('/login');
        return Promise.reject(refreshError);
      }
    }
    
    // Sentry reporting
    Sentry.captureException(error, {
      extra: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
      },
    });
    
    return Promise.reject(error);
  }
);
```

### 11.2 Retry with Exponential Backoff
```typescript
// src/core/api/retry.ts
export const MAX_RETRIES = 3;
export const BASE_DELAY = 1000; // 1 second

export function calculateDelay(retryCount: number): number {
  return BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 100;
}

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response || error.code === 'ECONNABORTED';
  }
  return false;
}

// Usage with API client
async function fetchWithRetry<T>(
  request: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }
      await delay(calculateDelay(i));
    }
  }
  
  throw lastError;
}
```

### 11.3 API Error Standardization
```typescript
// src/core/api/errors.ts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// Standardized error handling
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new ApiException(
          ERROR_CODES.VALIDATION_ERROR,
          data.message || 'Validation error',
          400,
          data.errors
        );
      case 401:
        throw new ApiException(
          ERROR_CODES.UNAUTHORIZED,
          'Unauthorized',
          401
        );
      case 403:
        throw new ApiException(
          ERROR_CODES.FORBIDDEN,
          'Forbidden',
          403
        );
      case 404:
        throw new ApiException(
          ERROR_CODES.NOT_FOUND,
          'Resource not found',
          404
        );
      case 429:
        throw new ApiException(
          ERROR_CODES.RATE_LIMITED,
          'Too many requests',
          429
        );
      case 500:
        throw new ApiException(
          ERROR_CODES.SERVER_ERROR,
          'Internal server error',
          500
        );
      default:
        throw new ApiException(
          'UNKNOWN_ERROR',
          'An unexpected error occurred',
          status
        );
    }
  }
  
  throw new ApiException(
    ERROR_CODES.NETWORK_ERROR,
    'Network error',
    0
  );
}
```

---

## Phase 12: Accessibility (a11y)

### 12.1 WCAG Guidelines
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44x44 points
- **Focus Order**: Logical navigation order
- **Labels**: All interactive elements have accessibilityLabel

```typescript
// src/ui/components/Button/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string; // Required for a11y
  accessibilityHint?: string; // Optional: describes action
  accessibilityRole?: 'button' | 'link' | 'menuitem';
  testID?: string;
}

export function Button({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: disabled }}
      testID={testID}
      style={[styles.button, variantStyles]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
```

### 12.2 Screen Reader Support
```typescript
// src/hooks/use-accessibility.ts
import { useCallback } from 'react';
import * as Speech from 'expo-speech';

export function useAnnounceForAccessibility() {
  const announce = useCallback((message: string, options?: Speech.SpeechOptions) => {
    if (AccessibilityInfo.isScreenReaderEnabled()) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);
  
  return announce;
}

// Usage in movie card
function MovieCard({ movie, onPress }) {
  const announce = useAnnounceForAccessibility();
  
  const handlePress = () => {
    announce(`Opening ${movie.title}`);
    onPress();
  };
  
  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${movie.title}, rated ${movie.voteAverage} out of 10`}
      accessibilityHint="Double tap to open movie details"
    >
      {/* ... */}
    </Pressable>
  );
}
```

### 12.3 Color Contrast Validation
```typescript
// src/utils/accessibility.ts
export function meetsContrastRatio(foreground: string, background: string): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Theme validation
export const accessibilityTheme = {
  text: {
    primary: '#FFFFFF', // Contrast: 16:1 on dark background
    secondary: 'rgba(255, 255, 255, 0.87)', // Contrast: 7:1 on dark background
    disabled: 'rgba(255, 255, 255, 0.38)', // Contrast: 3:1 - Minimum for large text
  },
  error: '#CF6679', // Contrast: 7:1 on dark background
  success: '#4CAF50', // Contrast: 4.5:1 on dark background
};
```

---

## Phase 13: CI/CD Pipeline

### 13.1 GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install
      - run: yarn lint
      - run: yarn typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install
      - run: yarn test:unit --coverage
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install
      - run: yarn build:ios
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - run: yarn build:android
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: builds
          path: dist/
```

### 13.2 EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 13.3 Environment Variables
```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api.cinesearch.com
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn

# .env.staging
EXPO_PUBLIC_API_URL=https://staging-api.cinesearch.com
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## Phase 14: Analytics & Tracking

### 14.1 Event Tracking
```typescript
// src/analytics/tracker.ts
import { analytics } from '@/analytics';

export const TRACKING_EVENTS = {
  SCREEN_VIEW: 'screen_view',
  MOVIE_VIEW: 'movie_view',
  SEARCH: 'search',
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
  SHARE: 'share',
  LOGIN: 'login',
  LOGOUT: 'logout',
} as const;

export function trackScreenView(screenName: string, params?: Record<string, unknown>) {
  analytics.track(TRACKING_EVENTS.SCREEN_VIEW, {
    screen_name: screenName,
    ...params,
  });
}

export function trackMovieView(movieId: number, title: string) {
  analytics.track(TRACKING_EVENTS.MOVIE_VIEW, {
    movie_id: movieId,
    movie_title: title,
    timestamp: Date.now(),
  });
}

export function trackSearch(query: string, resultsCount: number) {
  analytics.track(TRACKING_EVENTS.SEARCH, {
    search_query: query,
    results_count: resultsCount,
  });
}
```

### 14.2 User Journey Analytics
```typescript
// src/hooks/use-analytics.ts
import { useEffect, useRef } from 'react';
import { useNavigation } from 'expo-router';
import { trackScreenView } from '@/analytics/tracker';

export function useAnalytics() {
  const navigation = useNavigation();
  const currentRoute = useRef<string>();
  
  useEffect(() => {
    const unsubscribe = navigation.addListener((state) => {
      const routeName = state.routes[state.index].name;
      
      if (routeName !== currentRoute.current) {
        currentRoute.current = routeName;
        trackScreenView(routeName);
      }
    });
    
    return unsubscribe;
  }, [navigation]);
}
```

### 14.3 Performance Monitoring
```typescript
// src/analytics/performance.ts
import { performance } from '@/analytics';
import { Trace } from '@/otel';

@Trace('search_movies')
export async function searchMovies(query: string) {
  const startTime = Date.now();
  performance.startMeasurement('search_duration');
  
  try {
    const results = await tmdbService.searchMovies(query);
    
    performance.stopMeasurement('search_duration');
    analytics.track('search_completed', {
      query,
      results_count: results.length,
      duration_ms: Date.now() - startTime,
    });
    
    return results;
  } catch (error) {
    performance.stopMeasurement('search_duration');
    analytics.track('search_failed', {
      query,
      error: error.message,
    });
    throw error;
  }
}
```

---

## Updated Implementation Order

1. **Week 1: Foundation**
   - Update project structure
   - Create design system tokens
   - Enable TypeScript strict mode
   - Set up expo-sqlite for offline caching

2. **Week 2: Data Layer**
   - Implement React Query patterns
   - Create query keys constants
   - Add optimistic updates
   - Implement mutation queue for offline

3. **Week 3: Components & UI**
   - Create reusable UI components
   - Implement error boundaries
   - Add haptic feedback
   - Implement accessibility features

4. **Week 4: Infrastructure**
   - API layer with interceptors and retry
   - CI/CD pipeline setup
   - Analytics integration
   - Performance monitoring

5. **Week 5: Testing & Polish**
   - Expand test coverage
   - Complete documentation
   - Performance optimization
   - Bug fixes and refinements

---

## Phase 15: State Management Best Practices

### 15.1 Zustand Store Organization
```typescript
// src/stores/types.ts
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

// src/stores/auth-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

### 15.2 Store Splitting Strategy
```typescript
// Avoid monolithic stores - split by domain
// src/stores/
├── auth-store.ts       # Authentication state
├── theme-store.ts      # Theme preferences
├── favorites-store.ts  # User favorites
└── ui-store.ts         # UI state (modals, toasts)
```

### 15.3 Selector Pattern
```typescript
// Good - selective rendering
export function UserAvatar() {
  const user = useAuthStore((state) => state.user);
  return <Avatar source={{ uri: user?.avatar }} />;
}

// Avoid - causes unnecessary re-renders
const user = useAuthStore(); // Entire store
```

---

## Phase 16: Deep Linking Configuration

### 16.1 URL Scheme Setup
```typescript
// app.json
{
  "expo": {
    "scheme": "cinesearch",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cinesearch.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#000000"
      },
      "package": "com.cinesearch.app"
    }
  }
}
```

### 16.2 Deep Link Handler
```typescript
// src/deep-linking/handler.ts
type DeepLinkRoute = 
  | { type: 'movie'; id: number }
  | { type: 'profile'; username: string }
  | { type: 'search'; query: string };

export function parseDeepLink(url: string): DeepLinkRoute | null {
  const parsed = new URL(url);
  const path = parsed.hostname;
  const params = Object.fromEntries(parsed.searchParams);

  if (path === 'movie') {
    return { type: 'movie', id: parseInt(params.id, 10) };
  }
  if (path === 'user') {
    return { type: 'profile', username: params.username };
  }
  if (path === 'search') {
    return { type: 'search', query: params.q };
  }

  return null;
}
```

### 16.3 Universal Links (iOS)
```typescript
// Associated Domains - Add to app.json
{
  "expo": {
    "ios": {
      "associatedDomains": [
        "applinks:cinesearch.com",
        "applinks:www.cinesearch.com"
      ]
    }
  }
}

// apple-app-site-association file on server
// https://cinesearch.com/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.cinesearch.app",
      "paths": ["/movie/*", "/user/*"]
    }]
  }
}
```

---

## Phase 17: Push Notifications

### 17.1 Notification Configuration
```typescript
// src/notifications/config.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return token.data;
}
```

### 17.2 Notification Categories
```typescript
// src/notifications/categories.ts
import * as Notifications from 'expo-notifications';

export function setupNotificationCategories() {
  Notifications.setNotificationCategoryIdentifier('movie_release', [
    {
      identifier: 'view',
      buttonTitle: 'View',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: { opensAppToForeground: false },
    },
  ]);
}
```

### 17.3 Notification Service Integration
```typescript
// src/notifications/service.ts
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const message = {
    to: token,
    title,
    body,
    data,
    icon: './assets/images/notification-icon.png',
    color: '#E50914',
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

---

## Phase 18: OTA Updates (EAS Update)

### 18.1 EAS Update Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  },
  "updates": {
    "url": "https://u.expo.dev/PROJECT_ID",
    "enabled": true
  }
}
```

### 18.2 Update Strategy
```typescript
// src/config/updates.ts
import Updates from 'expo-updates';

export async function checkForUpdates(): Promise<boolean> {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update check failed:', error);
    return false;
  }
}

// Automatic check on app start
if (!__DEV__) {
  Updates.useUpdates();
}
```

### 18.3 Channel Management
```bash
# Create channels
eas update:configure --channel production
 eas update:configure --channel staging
 eas update:configure --channel development

# Publish updates
eas update --channel production --message "Fix login bug"
```

---

## Phase 19: Animations & Transitions

### 19.1 Lottie Animations
```typescript
// src/components/LoadingAnimation.tsx
import LottieView from 'lottie-react-native';
import loadingAnimation from '@/assets/animations/success.json';

export function LoadingAnimation() {
  return (
    <LottieView
      source={loadingAnimation}
      autoPlay
      loop
      style={styles.animation}
    />
  );
}
```

### 19.2 Reanimated Shared Values
```typescript
// src/hooks/useAnimatedValue.ts
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export function useFadeIn() {
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const start = () => {
    opacity.value = withTiming(1, { duration: 300 });
  };
  
  return { animatedStyle, start };
}
```

### 19.3 Gesture Animations
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export function SwipeableCard({ children }) {
  const translationX = useSharedValue(0);
  
  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translationX.value = e.translationX;
    })
    .onEnd((e) => {
      translationX.value = withSpring(0);
    });
  
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ transform: [{ translateX: translationX }] }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## Phase 20: Logging Strategy

### 20.1 Structured Logging
```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as LogLevel;

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
) {
  if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL]) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
  
  console.log(JSON.stringify(entry));
  
  // In production, send to remote logging service
  if (level === 'error') {
    Sentry.captureException(new Error(message), { extra: context });
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
};
```

### 20.2 Debug Screen for Development
```typescript
// src/screens/DebugScreen.tsx
export function DebugScreen() {
  const logs = useRef<LogEntry[]>([]);
  
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      logs.current.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: args.join(' '),
      });
      originalLog(...args);
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);
  
  return (
    <FlatList
      data={logs.current}
      renderItem={({ item }) => (
        <Text>{item.timestamp} [{item.level}] {item.message}</Text>
      )}
    />
  );
}
```

---

## Phase 21: Video Playback

### 21.1 Expo Video Integration
```typescript
// src/components/VideoPlayer.tsx
import { Video, ResizeMode } from 'expo-video';

export function VideoPlayer({ uri, posterUri }: { uri: string; posterUri?: string }) {
  return (
    <Video
      source={{ uri }}
      posterSource={{ uri: posterUri }}
      style={styles.video}
      resizeMode={ResizeMode.CONTAIN}
      useNativeControls
      shouldPlay
      isLooping
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
```

### 21.2 Fullscreen Video
```typescript
import { useVideoPlayer, VideoView } from 'expo-video';

export function FullscreenVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      allowsFullscreen
      showsPlaybackControls
    />
  );
}
```

---

## Final Implementation Order (6 Weeks)

1. **Week 1: Foundation**
   - Update project structure
   - Create design system tokens
   - Enable TypeScript strict mode
   - Set up expo-sqlite for offline caching

2. **Week 2: Data Layer**
   - Implement React Query patterns
   - Create query keys constants
   - Add optimistic updates
   - Implement mutation queue for offline

3. **Week 3: Components & UI**
   - Create reusable UI components
   - Implement error boundaries
   - Add haptic feedback
   - Implement accessibility features

4. **Week 4: Infrastructure**
   - API layer with interceptors and retry
   - CI/CD pipeline setup
   - Analytics integration
   - Performance monitoring

5. **Week 5: Advanced Features**
   - Push notifications
   - Deep linking
   - OTA updates
   - Animations

6. **Week 6: Testing & Polish**
   - Expand test coverage
   - Complete documentation
   - Performance optimization
   - Bug fixes and refinements
