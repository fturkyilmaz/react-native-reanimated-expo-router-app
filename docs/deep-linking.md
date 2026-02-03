# Deep Linking

## Overview

CineSearch supports URL scheme and universal links for deep linking.

## URL Scheme

```
cinesearch://movie/123
cinesearch://user/username
cinesearch://search?q=action
```

## Configuration

```json
// app.json
{
  "expo": {
    "scheme": "cinesearch",
    "ios": {
      "associatedDomains": [
        "applinks:cinesearch.com"
      ]
    }
  }
}
```

## Deep Link Handler

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

## Usage

```tsx
import { useDeepLinking } from '@/deep-linking';

export default function Layout() {
  useDeepLinking();
  
  return <Stack />;
}
```

## Related Files

- [`src/deep-linking/config.ts`](../src/deep-linking/config.ts)
- [`src/deep-linking/handler.ts`](../src/deep-linking/handler.ts)
- [`src/deep-linking/provider.tsx`](../src/deep-linking/provider.tsx)
