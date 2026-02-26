# CineSearch Project Refactoring Analysis

## Executive Summary

This document provides a comprehensive analysis of the CineSearch React Native project, identifying critical issues, code duplication, logical errors, and areas for improvement. The project is a movie discovery app built with Expo Router, React Native, TypeScript, and various state management solutions.

---

## 1. Critical Issues

### 1.1 Duplicate Service Implementations

**Severity: HIGH**

The project contains duplicate implementations of the same services in two different locations:

| Service          | Location 1                           | Location 2                                          |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| FavoritesService | `src/services/favorites-service.ts`  | `src/services/local-db.service.ts` (lines 97-274)   |
| WatchlistService | `src/services/watchlist-service.ts`  | `src/services/local-db.service.ts` (lines 277-438)  |
| SyncQueueService | `src/services/sync-queue-service.ts` | `src/services/local-db.service.ts` (lines 441-500+) |
| MovieService     | `src/services/movie-service.ts`      | `src/services/local-db.service.ts` (lines 5-94)     |

**Impact:**

- Maintenance nightmare - changes must be made in multiple places
- Inconsistent behavior between implementations
- Increased bundle size
- Confusion for developers

**Recommendation:**

- Keep the newer, more feature-rich implementations in `src/services/`
- Remove all duplicate code from `src/services/local-db.service.ts`
- Update all imports to use the consolidated services

---

### 1.2 Duplicate Auth Implementations

**Severity: HIGH**

Two separate authentication implementations exist:

1. **Context-based Auth** (`src/hooks/use-auth.tsx`)
   - Uses React Context API
   - Has its own User interface
   - Mock authentication with hardcoded credentials
   - Simple transition handling

2. **Zustand-based Auth** (`src/store/authStore.ts`)
   - Uses Zustand state management
   - Has different User interface
   - Supports Supabase integration
   - Biometric authentication support
   - More feature-rich

**Impact:**

- Confusion about which auth system to use
- Inconsistent user data structures
- Potential authentication state conflicts
- Both are used in different parts of the app

**Recommendation:**

- Consolidate to Zustand-based auth (`authStore.ts`)
- Remove `src/hooks/use-auth.tsx` and `AuthProvider`
- Update all components to use `useAuthStore`

---

### 1.3 Duplicate Movie Hooks

**Severity: MEDIUM**

Two separate movie data fetching hooks exist:

1. **`src/hooks/use-movies.ts`**
   - Simple state-based approach
   - Manual pagination
   - Basic error handling
   - Uses `tmdbService` directly

2. **`src/hooks/useMoviesQuery.ts`**
   - React Query-based approach
   - Infinite scrolling support
   - Better caching
   - More sophisticated

**Impact:**

- Inconsistent data fetching patterns
- Different caching strategies
- Potential duplicate API calls

**Recommendation:**

- Use `useMoviesQuery.ts` as the primary implementation
- Deprecate `use-movies.ts`
- Update all components to use React Query hooks

---

### 1.4 TypeScript Disabled Everywhere

**Severity: HIGH**

Many files have `@ts-nocheck` at the top, completely disabling TypeScript checking:

- `src/store/authStore.ts`
- `src/services/supabase-auth.ts`
- `src/services/sync-manager.ts`
- `src/services/local-db.service.ts`
- `src/db/database.ts`
- `src/supabase/client.ts`
- `src/services/supabase-service.ts`

**Impact:**

- No type safety
- Runtime errors that could be caught at compile time
- Poor developer experience
- Loss of IDE autocomplete

**Recommendation:**

- Remove all `@ts-nocheck` directives
- Fix all TypeScript errors
- Enable strict mode in tsconfig.json (already enabled but ignored)

---

## 2. Security Issues

### 2.1 SQL Injection Risk

**Severity: CRITICAL**

File: `src/db/database.ts` (lines 204-220)

```typescript
const interpolateSQL = (sql: string, params: any[]): string => {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    const value = params[paramIndex++];
    return formatSQLValue(value);
  });
};

const formatSQLValue = (value: any): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
};
```

**Issue:** Manual string interpolation for SQL parameters is vulnerable to SQL injection attacks.

**Recommendation:**

- Use proper parameterized queries
- Remove `interpolateSQL` and `formatSQLValue` functions
- Use SQLite's built-in parameter binding

---

### 2.2 Hardcoded Test Credentials

**Severity: MEDIUM**

File: `app/(auth)/login.tsx` (lines 38-41)

```typescript
defaultValues: {
  email: 'test@test.com',
  password: '123456',
}
```

File: `src/hooks/use-auth.tsx` (lines 67-82)

```typescript
if (email === 'test@test.com' && password === '123456') {
  const mockUser = { ... };
}
```

**Issue:** Hardcoded credentials in production code.

**Recommendation:**

- Remove hardcoded credentials
- Use environment variables for test credentials
- Implement proper authentication flow

---

### 2.3 Inconsistent Error Handling

**Severity: MEDIUM**

Different services handle errors inconsistently:

| Service               | Error Handling                 |
| --------------------- | ------------------------------ |
| `FavoritesService`    | Throws `FavoritesServiceError` |
| `WatchlistService`    | Throws `WatchlistServiceError` |
| `SyncQueueService`    | Throws `SyncQueueServiceError` |
| `local-db.service.ts` | Returns `false` or `null`      |
| `supabase-service.ts` | Returns `false`                |

**Impact:**

- Inconsistent error propagation
- Difficult to handle errors uniformly
- Silent failures in some cases

**Recommendation:**

- Standardize error handling across all services
- Either throw errors consistently or use Result types
- Implement proper error boundaries

---

## 3. Code Quality Issues

### 3.1 Inline Imports Pattern

**Severity: LOW**

Files: `src/hooks/use-favorites.tsx`, `src/hooks/use-watchlist.tsx`

```typescript
// At the bottom of the file (lines 295-297)
import { createContext, useContext } from "react";
```

**Issue:** Imports at the bottom of files is non-standard and confusing.

**Recommendation:**

- Move all imports to the top of files
- Follow standard TypeScript/JavaScript conventions

---

### 3.2 Inconsistent Naming Conventions

**Severity: LOW**

Mix of Turkish and English throughout the codebase:

- Turkish: `Geçersiz e-posta veya şifre`, `Favori eklenemedi`, `İzleme listesi`
- English: `Invalid email or password`, `Failed to add favorite`, `Watchlist`

**Recommendation:**

- Standardize on English for all user-facing strings
- Use i18n for localization (already implemented)
- Keep code comments and variable names in English

---

### 3.3 Unused Code and Variables

**Severity: LOW**

Many files contain unused imports and variables:

- `src/hooks/use-favorites.tsx`: `pendingCount` declared but not used in context
- `src/services/supabase-sync-service.ts`: `handleError` function defined but not used properly
- Various console.log statements for debugging

**Recommendation:**

- Remove unused imports and variables
- Clean up debug console statements
- Use ESLint to catch these issues

---

### 3.4 Missing Type Safety

**Severity: MEDIUM**

Extensive use of `any` type throughout the codebase:

```typescript
// src/services/supabase-service.ts
private client: any = null;
private buildMoviePayload(movie: any) { ... }

// src/db/database.ts
const loadSQLite = async (): Promise<any> => { ... }
const executeSQL = async (database: Database, sql: string, params: any[] = []) => { ... }

// src/services/sync-manager.ts
const logger = { ... } // Not imported, assumed to exist
```

**Recommendation:**

- Replace all `any` types with proper interfaces
- Create shared type definitions
- Enable strict TypeScript checking

---

## 4. Architecture Issues

### 4.1 Circular Dependencies

**Severity: MEDIUM**

Potential circular dependency issues:

```
authStore.ts → UserService → database.ts
sync-manager.ts → FavoritesService → database.ts
use-favorites.tsx → FavoritesService → sync-manager.ts
```

**Recommendation:**

- Use dependency injection
- Create service interfaces
- Restructure to avoid circular imports

---

### 4.2 Inconsistent State Management

**Severity: MEDIUM**

Three different state management approaches used:

1. **React Context** (`use-auth.tsx`)
2. **Zustand** (`authStore.ts`, `themeStore.ts`)
3. **React Query** (server state)

**Impact:**

- Inconsistent patterns
- Learning curve for developers
- Potential state synchronization issues

**Recommendation:**

- Standardize on Zustand for client state
- Use React Query for server state
- Remove Context-based state management

---

### 4.3 Database Transaction Polyfill Issues

**Severity: MEDIUM**

File: `src/db/database.ts` (lines 392-445)

The transaction polyfill doesn't properly handle async operations:

```typescript
database.transaction = (callback: (tx: Transaction) => void) => {
  const tx: Transaction = {
    executeSql: (sql, params, onSuccess, onError) => {
      try {
        const result = executeSQL(database, sql, params); // Not awaited!
        onSuccess?.(tx, result);
      } catch (error) {
        // ...
      }
    },
  };
  callback(tx);
};
```

**Issue:** `executeSQL` returns a Promise but isn't awaited.

**Recommendation:**

- Properly handle async operations in transaction polyfill
- Consider using a proper transaction library
- Test transaction rollback behavior

---

### 4.4 Inconsistent SQLite API Usage

**Severity: MEDIUM**

The code tries to support multiple SQLite APIs:

- `openDatabaseSync` (sync API)
- `openDatabaseAsync` (async API)
- `openDatabase` (legacy API)

**Impact:**

- Complex code to handle all cases
- Potential inconsistencies
- Hard to test

**Recommendation:**

- Choose one API and stick with it
- Prefer the async API for better performance
- Remove legacy API support

---

## 5. Logging and Monitoring Issues

### 5.1 Inconsistent Logging

**Severity: LOW**

Mix of logging approaches:

- `console.log` statements throughout
- `logger` utility in some files
- Debug prefixes like `[DEBUG-]`, `[DEBUG-FavoritesService]`

**Examples:**

```typescript
// src/services/local-db.service.ts
console.log("[DEBUG-MovieService] upsert called for movie.id:", movie.id);

// src/services/tmdb.ts
console.log("[TMDB] Returning mock data for getPopularMovies");

// src/utils/logger.ts
logger.movies.info("Adding to favorites", { movieId: 123 });
```

**Recommendation:**

- Replace all `console.log` with `logger` utility
- Remove debug prefixes
- Use structured logging with context

---

### 5.2 Missing Error Reporting

**Severity: MEDIUM**

Some errors are not properly reported to Sentry:

```typescript
// src/services/supabase-service.ts
catch (e: any) {
  console.error('[SupabaseService] Exception adding favorite:', {
    message: e?.message ?? e,
    stack: e?.stack,
  });
  return false; // Not sent to Sentry!
}
```

**Recommendation:**

- Send all errors to Sentry
- Use proper error boundaries
- Implement error tracking for user actions

---

## 6. Testing Issues

### 6.1 Missing Unit Tests

**Severity: MEDIUM**

Critical services lack unit tests:

- `FavoritesService`
- `WatchlistService`
- `SyncQueueService`
- `authStore`
- `tmdbService`

**Recommendation:**

- Add unit tests for all services
- Use Jest and React Testing Library
- Aim for 80%+ code coverage

---

### 6.2 Missing Integration Tests

**Severity: MEDIUM**

No integration tests for:

- Authentication flow
- Favorites/watchlist operations
- Sync operations
- Offline/online transitions

**Recommendation:**

- Add integration tests for critical flows
- Test with real database
- Mock external APIs

---

### 6.3 E2E Tests Incomplete

**Severity: LOW**

E2E tests exist but may not cover all scenarios:

- `e2e/auth.test.ts`
- `e2e/movies.test.ts`
- `e2e/settings.test.ts`

**Recommendation:**

- Expand E2E test coverage
- Test error scenarios
- Test offline behavior

---

## 7. Documentation Issues

### 7.1 Outdated README

**Severity: LOW**

README.md mentions features that may not match current implementation:

- Mentions "Sename" as app name (should be "CineSearch")
- Architecture diagram may be outdated
- Installation instructions may be incomplete

**Recommendation:**

- Update README with current architecture
- Add setup instructions for Supabase
- Document environment variables

---

### 7.2 Missing API Documentation

**Severity: LOW**

No documentation for:

- Service APIs
- Database schema
- Type definitions
- Component props

**Recommendation:**

- Add JSDoc comments to all public APIs
- Create API documentation
- Document database schema

---

## 8. Performance Issues

### 8.1 Unnecessary Re-renders

**Severity: LOW**

Potential performance issues:

- `useFocusEffect` in favorites/watchlist providers causes reloads
- No memoization for expensive computations
- Large lists without proper optimization

**Recommendation:**

- Use `React.memo` for components
- Implement proper memoization
- Optimize FlatList rendering

---

### 8.2 Bundle Size

**Severity: LOW**

Duplicate code increases bundle size:

- Duplicate services
- Multiple auth implementations
- Unused dependencies

**Recommendation:**

- Remove duplicate code
- Tree-shake unused code
- Analyze bundle size

---

## 9. Specific File Issues

### 9.1 `src/store/authStore.ts`

**Issues:**

- `@ts-nocheck` at top
- `UserService` import may be incorrect
- Complex state management logic
- Inconsistent with other auth implementation

**Recommendation:**

- Remove `@ts-nocheck`
- Fix `UserService` import
- Simplify state logic
- Consolidate with other auth

---

### 9.2 `src/db/database.ts`

**Issues:**

- `@ts-nocheck` at top
- SQL injection risk
- Transaction polyfill issues
- Complex migration logic

**Recommendation:**

- Remove `@ts-nocheck`
- Fix SQL injection
- Fix transaction handling
- Simplify migrations

---

### 9.3 `src/services/local-db.service.ts`

**Issues:**

- Contains duplicate implementations
- `@ts-nocheck` at top
- Debug console statements
- Inconsistent error handling

**Recommendation:**

- Remove all duplicate code
- Remove `@ts-nocheck`
- Clean up console statements
- Standardize error handling

---

### 9.4 `src/hooks/use-favorites.tsx` & `use-watchlist.tsx`

**Issues:**

- Inline imports at bottom
- Unused `pendingCount` variable
- Complex provider logic

**Recommendation:**

- Move imports to top
- Remove unused variables
- Simplify provider logic

---

## 10. Recommended Refactoring Priority

### Phase 1: Critical (Do First)

1. Fix SQL injection vulnerability
2. Remove duplicate service implementations
3. Consolidate auth implementations
4. Remove all `@ts-nocheck` directives

### Phase 2: High Priority

1. Fix TypeScript errors
2. Standardize error handling
3. Remove hardcoded credentials
4. Fix database transaction issues

### Phase 3: Medium Priority

1. Consolidate state management
2. Replace `any` types with proper interfaces
3. Standardize logging
4. Add unit tests

### Phase 4: Low Priority

1. Clean up unused code
2. Fix naming conventions
3. Update documentation
4. Optimize performance

---

## 11. Migration Strategy

### Step 1: Create Feature Branch

```bash
git checkout -b refactor/cleanup
```

### Step 2: Fix Critical Issues

- Fix SQL injection
- Remove duplicates
- Consolidate auth

### Step 3: Run Tests

```bash
npm test
npm run test:e2e:ios
```

### Step 4: Update Documentation

- Update README
- Document changes
- Create migration guide

### Step 5: Code Review

- Get team approval
- Address feedback

### Step 6: Merge

```bash
git checkout main
git merge refactor/cleanup
```

---

## 12. Success Criteria

- [ ] All `@ts-nocheck` directives removed
- [ ] Zero TypeScript errors
- [ ] No duplicate service implementations
- [ ] Single auth implementation
- [ ] All SQL queries use parameterized queries
- [ ] 80%+ test coverage
- [ ] All console.log replaced with logger
- [ ] Documentation updated
- [ ] Bundle size reduced by 20%+

---

## 13. Risks and Mitigations

| Risk                       | Impact | Mitigation                             |
| -------------------------- | ------ | -------------------------------------- |
| Breaking changes           | High   | Comprehensive testing, gradual rollout |
| Data loss                  | High   | Database backup before migration       |
| Performance regression     | Medium | Performance testing, monitoring        |
| Increased development time | Medium | Prioritize critical issues first       |

---

## Conclusion

The CineSearch project has significant technical debt that needs to be addressed. The most critical issues are:

1. **SQL injection vulnerability** - Must be fixed immediately
2. **Duplicate code** - Causes maintenance issues
3. **TypeScript disabled** - Loses type safety benefits
4. **Inconsistent auth** - Confusing and error-prone

By following this refactoring plan, the project will be more maintainable, secure, and performant.
