# Testing Strategy

## Overview

CineSearch implements comprehensive testing with unit, integration, and snapshot tests.

## Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/           # Integration tests
│   └── screens/
└── snapshot/              # Snapshot tests
    └── components/
```

## Running Tests

```bash
# Run all tests
yarn test

# Run unit tests only
yarn test:unit

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch
```

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/utils/logger.test.ts
import { logger } from '@/utils/logger';

describe('Logger', () => {
  it('should log info messages', () => {
    logger.info('Test message');
    expect(console.log).toHaveBeenCalled();
  });
});
```

### Hook Test Example

```typescript
// tests/unit/hooks/use-notifications.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useNotifications } from '@/hooks/use-notifications';

describe('useNotifications', () => {
  it('should request permission on mount', async () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permissionStatus).toBe('undetermined');
  });
});
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Mock external dependencies**
4. **Aim for 80%+ coverage**

## Related Files

- [`jest.config.js`](../../jest.config.js)
- [`tests/setup.ts`](../../tests/setup.ts)
- [`tests/__mocks__/test-utils.tsx`](../../tests/__mocks__/test-utils.tsx)
