# Offline Support

## Overview

CineSearch implements offline-first architecture using `expo-sqlite` for data persistence and TanStack Query for caching.

## Storage Strategy

| Data Type | Storage | Use Case |
|-----------|---------|----------|
| Small data | SecureStorage | Theme, settings, tokens |
| Large data | SQLite | Movies cache, favorites |

## Offline Cache

```typescript
import { offlineCache } from '@/core/services/offline-cache';

// Set cache with TTL
await offlineCache.set('movies:popular:1', movies, 60);

// Get cache
const cached = await offlineCache.get('movies:popular:1');
```

## Mutation Queue

Offline mutations are queued and synced when back online:

```typescript
import { mutationQueue } from '@/core/services/mutation-queue';

// Queue mutation
await mutationQueue.enqueue('TOGGLE_FAVORITE', { movieId: 123 });

// Process queue when online
await mutationQueue.process();
```

## Network Status

Use the `useNetworkStatus` hook to monitor connectivity:

```tsx
import { useNetworkStatus } from '@/hooks/use-network-status';

function App() {
  useNetworkStatus();
  return <AppContent />;
}
```

## Related Files

- [`src/core/services/offline-cache.ts`](../src/core/services/offline-cache.ts)
- [`src/core/services/mutation-queue.ts`](../src/core/services/mutation-queue.ts)
- [`src/hooks/use-network-status.ts`](../src/hooks/use-network-status.ts)
