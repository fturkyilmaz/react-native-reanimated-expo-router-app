# API Layer

## Overview

CineSearch uses a centralized API client with interceptors, retry logic, and error standardization.

## API Client

```typescript
import { apiClient } from '@/core/api/client';

// GET request
const movies = await apiClient.get('/movie/popular');

// POST request
const result = await apiClient.post('/user/login', { email, password });
```

## Error Handling

```typescript
import { ApiException } from '@/core/api/errors';

try {
  await apiClient.get('/movie/123');
} catch (error) {
  if (error instanceof ApiException) {
    console.error(error.message);
    console.error(error.statusCode);
  }
}
```

## Retry Configuration

```typescript
import { fetchWithRetry } from '@/core/api/retry';

const data = await fetchWithRetry(() => 
  apiClient.get('/movies/popular')
);
```

## Related Files

- [`src/core/api/client.ts`](../src/core/api/client.ts)
- [`src/core/api/errors.ts`](../src/core/api/errors.ts)
- [`src/core/api/retry.ts`](../src/core/api/retry.ts)
- [`src/services/tmdb.ts`](../src/services/tmdb.ts)
