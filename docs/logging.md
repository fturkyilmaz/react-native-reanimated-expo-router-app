# Logging Strategy

## Overview

CineSearch uses a centralized structured logging system that provides consistent, categorized, and level-based logging across the application.

## Usage

### Basic Logging

```typescript
import { logger } from '@/utils/logger';

// Simple message
logger.info('User logged in');

// With context
logger.info('API request completed', { 
  url: '/movies/popular', 
  statusCode: 200,
  duration: 150 
});
```

### Category-Based Logging

```typescript
import { logger } from '@/utils/logger';

// API logs
logger.api.info('Fetching movies', { page: 1, category: 'popular' });
logger.api.error('API request failed', { url: '/movies', error: 'timeout' });

// Authentication logs
logger.auth.info('Login successful', { userId: 123 });
logger.auth.warn('Login attempt with invalid credentials', { email: 'user@example.com' });

// Movie-related logs
logger.movies.info('Cache hit', { movieId: 456 });
logger.movies.debug('Rendering movie card', { index: 0 });

// Offline operations
logger.offline.info('Mutation queued', { type: 'favorite_add', movieId: 789 });
logger.offline.warn('Sync failed, will retry', { attempt: 2 });
```

### Custom Category with Log Function

```typescript
import { logger, LOG_CATEGORIES } from '@/utils/logger';

logger.info('Custom message', { data }, LOG_CATEGORIES.NAVIGATION);
```

## Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `debug` | Detailed debug information | Development only, troubleshooting |
| `info` | General informational messages | Normal application flow |
| `warn` | Warning conditions | Recoverable issues, deprecated usage |
| `error` | Error conditions | Failures that need attention |

## Log Entry Structure

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601 format
  level: LogLevel;        // debug | info | warn | error
  message: string;        // Human-readable message
  context?: Record<string, unknown>;  // Additional data
  category?: string;      // Log category (e.g., 'API', 'AUTH')
}
```

## Environment Behavior

### Development (`__DEV__`)
- All log levels enabled (including `debug`)
- Full context data displayed
- Styled console output

### Production
- Only `info`, `warn`, and `error` levels shown
- Sensitive data automatically sanitized
- Errors sent to Sentry for monitoring

## Sensitive Data Handling

The logger automatically redacts sensitive information:

```typescript
// This context will have sensitive values masked
logger.error('Auth failed', {
  email: 'user@example.com',
  password: 'secret123',        // Will be redacted
  apiKey: 'sk-12345',           // Will be redacted
  creditCard: '4111-1111-1111-1111'  // Will be redacted
});

// Output: password: '[REDACTED]', apiKey: '[REDACTED]', creditCard: '[REDACTED]'
```

## Integration with Sentry

Errors are automatically sent to Sentry for error tracking:

```typescript
logger.error('Database connection failed', { 
  database: 'movies.db',
  error: err.message 
});
// Automatically captured by Sentry with context
```

## Categories Reference

| Category | Prefix | Description |
|----------|--------|-------------|
| API | `[API]` | HTTP requests and responses |
| AUTH | `[AUTH]` | Authentication and authorization |
| NAVIGATION | `[NAVIGATION]` | Screen transitions and routing |
| NOTIFICATIONS | `[NOTIFICATIONS]` | Push notification events |
| MOVIES | `[MOVIES]` | Movie data fetching and caching |
| OFFLINE | `[OFFLINE]` | Offline sync and persistence |
| SECURITY | `[SECURITY]` | Security checks and events |
| PERFORMANCE | `[PERFORMANCE]` | Performance metrics and traces |

## Best Practices

1. **Use appropriate log levels**: Reserve `error` for actual errors, use `warn` for recoverable issues
2. **Include contextual data**: Always include relevant IDs, status codes, and timing information
3. **Use categories**: Group logs by feature for easier filtering
4. **Avoid sensitive data**: Never log passwords, tokens, or personal information
5. **Write actionable messages**: Log messages should help diagnose issues

## Example: API Request Logging

```typescript
import { logger } from '@/utils/logger';

async function fetchMovies(page: number) {
  logger.api.info('Fetching movies', { page, category: 'popular' });
  
  const startTime = Date.now();
  try {
    const response = await fetch(`/api/movies?page=${page}`);
    const duration = Date.now() - startTime;
    
    logger.api.info('Movies fetched successfully', {
      page,
      statusCode: response.status,
      duration
    });
    
    return response.json();
  } catch (error) {
    logger.api.error('Failed to fetch movies', {
      page,
      error: error.message
    });
    throw error;
  }
}
```
