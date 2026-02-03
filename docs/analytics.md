# Analytics & Tracking

## Overview

CineSearch implements comprehensive analytics using multiple adapters (Amplitude, Firebase, Mixpanel, PostHog).

## Event Tracking

```typescript
import { analytics, TRACKING_EVENTS } from '@/analytics';

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
```

## Using Analytics Hook

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

export function MyScreen() {
  useAnalytics();
  
  return <ScreenContent />;
}
```

## Performance Monitoring

```typescript
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
    throw error;
  }
}
```

## Related Files

- [`src/analytics/core/analytics-service.ts`](../src/analytics/core/analytics-service.ts)
- [`src/analytics/adapters/`](../src/analytics/adapters/)
- [`src/otel/hooks/usePerformance.ts`](../src/otel/hooks/usePerformance.ts)
