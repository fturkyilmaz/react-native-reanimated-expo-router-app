# Duplicate Service Consolidation Strategy

## Overview

This document provides a detailed strategy for consolidating duplicate service implementations in the CineSearch project.

---

## Current State Analysis

### Duplicate Services Map

| Service          | Primary Location                     | Duplicate Location                                  | Lines to Remove |
| ---------------- | ------------------------------------ | --------------------------------------------------- | --------------- |
| MovieService     | `src/services/movie-service.ts`      | `src/services/local-db.service.ts` (lines 5-94)     | ~90             |
| FavoritesService | `src/services/favorites-service.ts`  | `src/services/local-db.service.ts` (lines 97-274)   | ~180            |
| WatchlistService | `src/services/watchlist-service.ts`  | `src/services/local-db.service.ts` (lines 277-438)  | ~160            |
| SyncQueueService | `src/services/sync-queue-service.ts` | `src/services/local-db.service.ts` (lines 441-500+) | ~60+            |

**Total duplicate code: ~500 lines**

---

## Import Analysis

### Current Import Map

Let me trace all imports to understand usage:

```bash
# Search for all imports of these services
grep -r "from '@/services/favorites-service'" src/
grep -r "from '@/services/watchlist-service'" src/
grep -r "from '@/services/sync-queue-service'" src/
grep -r "from '@/services/movie-service'" src/
grep -r "from '@/services/local-db.service'" src/
```

### Expected Findings

#### FavoritesService Imports

**Primary Service (`src/services/favorites-service.ts`):**

```typescript
// Used in:
- src/hooks/use-favorites.tsx
- src/services/sync-manager.ts (syncFavorites method)
```

**Duplicate Service (`src/services/local-db.service.ts`):**

```typescript
// Used in:
- src/store/authStore.ts (via UserService import)
- Potentially other legacy code
```

#### WatchlistService Imports

**Primary Service (`src/services/watchlist-service.ts`):**

```typescript
// Used in:
- src/hooks/use-watchlist.tsx
- src/services/sync-manager.ts (syncWatchlist method)
```

**Duplicate Service (`src/services/local-db.service.ts`):**

```typescript
// Used in:
- Potentially legacy code
```

#### MovieService Imports

**Primary Service (`src/services/movie-service.ts`):**

```typescript
// Used in:
-src / services / favorites -
  service.ts(internal) -
  src / services / watchlist -
  service.ts(internal);
```

**Duplicate Service (`src/services/local-db.service.ts`):**

```typescript
// Used in:
- src/store/authStore.ts (via UserService import)
```

#### SyncQueueService Imports

**Primary Service (`src/services/sync-queue-service.ts`):**

```typescript
// Used in:
-src / services / sync -
  manager.ts -
  src / services / favorites -
  service.ts(internal) -
  src / services / watchlist -
  service.ts(internal);
```

**Duplicate Service (`src/services/local-db.service.ts`):**

```typescript
// Used in:
- Potentially nowhere (legacy)
```

---

## Consolidation Strategy

### Phase 1: Analysis & Planning

#### Step 1.1: Find All Imports

```bash
# Create a comprehensive import map
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "local-db.service"
```

#### Step 1.2: Document Usage

Create a table of all files importing from `local-db.service`:

| File                          | Import             | Usage     | Action Required       |
| ----------------------------- | ------------------ | --------- | --------------------- |
| `src/store/authStore.ts`      | `UserService`      | User CRUD | Update import         |
| `src/hooks/use-favorites.tsx` | `FavoritesService` | Favorites | Already using primary |
| `src/hooks/use-watchlist.tsx` | `WatchlistService` | Watchlist | Already using primary |

#### Step 1.3: Identify Breaking Changes

- Files that import from `local-db.service` will break
- Need to update all import statements
- Need to verify API compatibility

---

### Phase 2: Prepare Primary Services

#### Step 2.1: Verify Primary Service APIs

**FavoritesService API:**

```typescript
export const FavoritesService = {
  add: (movie: Movie, isOnline: boolean) => Promise<boolean>
  remove: (movieId: number, isOnline: boolean) => Promise<boolean>
  toggle: (movie: Movie, isOnline: boolean) => Promise<boolean>
  isFavorite: (movieId: number) => Promise<boolean>
  getAll: () => Promise<Movie[]>
  getIds: () => Promise<number[]>
  count: () => Promise<number>
  getUnsynced: () => Promise<RawFavorite[]>
  markAsSynced: (movieId: number) => Promise<boolean>
  clear: () => Promise<number>
}
```

**Duplicate FavoritesService API:**

```typescript
export const FavoritesService = {
  add: (movieId: number, userId: string, isOnline: boolean) => Promise<boolean>
  remove: (movieId: number, isOnline: boolean) => Promise<boolean>
  getAll: (userId: string) => Promise<Movie[]>
  isFavorite: (movieId: number, userId: string) => Promise<boolean>
  getUnsynced: () => Promise<RawFavorite[]>
  markAsSynced: (movieId: number) => Promise<boolean>
}
```

**API Differences:**

1. Primary takes `Movie` object, duplicate takes `movieId`
2. Primary has `userId` hardcoded as 'local', duplicate accepts it
3. Primary has more methods (`toggle`, `getIds`, `count`, `clear`)

#### Step 2.2: Create Compatibility Layer

If the duplicate API is used anywhere, create a compatibility layer:

```typescript
// src/services/favorites-service.ts

// Add compatibility methods if needed
export const FavoritesService = {
  // ... existing methods ...

  // Compatibility method for legacy code
  addById: async (
    movieId: number,
    userId: string = "local",
    isOnline: boolean = true,
  ): Promise<boolean> => {
    // Fetch movie data first
    const movie = await MovieService.getById(movieId);
    if (!movie) {
      throw new FavoritesServiceError("Movie not found", "MOVIE_NOT_FOUND");
    }
    return FavoritesService.add(movie, isOnline);
  },

  // Compatibility method for legacy code
  getAllByUser: async (userId: string = "local"): Promise<Movie[]> => {
    // For now, userId is ignored (always 'local')
    return FavoritesService.getAll();
  },

  // Compatibility method for legacy code
  isFavoriteByUser: async (
    movieId: number,
    userId: string = "local",
  ): Promise<boolean> => {
    // For now, userId is ignored (always 'local')
    return FavoritesService.isFavorite(movieId);
  },
};
```

---

### Phase 3: Update Imports

#### Step 3.1: Update `src/store/authStore.ts`

**Current Import:**

```typescript
import { UserService } from "@/services/local-db.service";
```

**Problem:** `UserService` doesn't exist in `local-db.service.ts` as a separate export. It's actually `MovieService` being used for user operations.

**Solution Options:**

**Option A: Create a proper UserService**

```typescript
// src/services/user-service.ts (NEW FILE)
import { getDatabase } from "@/db/database";
import { logger } from "@/utils/logger";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  token: string;
}

export const UserService = {
  upsert: async (user: User): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) {
      logger.auth.error("Database not available");
      return false;
    }

    try {
      return new Promise((resolve) => {
        db.transaction((tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO users (id, email, name, phone, bio, avatar, token, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
            [
              user.id,
              user.email,
              user.name,
              user.phone,
              user.bio,
              user.avatar,
              user.token,
            ],
            (_, result) => {
              logger.auth.info("User upserted", { userId: user.id });
              resolve(true);
            },
            (_, error) => {
              logger.auth.error("User upsert failed", {
                userId: user.id,
                error,
              });
              resolve(false);
              return true;
            },
          );
        });
      });
    } catch (error) {
      logger.auth.error("User upsert exception", { error });
      return false;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const db = await getDatabase();
    if (!db) return null;

    try {
      return new Promise((resolve) => {
        db.transaction((tx) => {
          tx.executeSql(
            "SELECT * FROM users ORDER BY updated_at DESC LIMIT 1",
            [],
            (_, result) => {
              if (result.rows.length > 0) {
                resolve(result.rows.item(0) as User);
              } else {
                resolve(null);
              }
            },
            () => {
              resolve(null);
              return true;
            },
          );
        });
      });
    } catch (error) {
      logger.auth.error("Get current user failed", { error });
      return null;
    }
  },

  delete: async (userId: string): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) return false;

    try {
      return new Promise((resolve) => {
        db.transaction((tx) => {
          tx.executeSql(
            "DELETE FROM users WHERE id = ?",
            [userId],
            (_, result) => {
              logger.auth.info("User deleted", { userId });
              resolve(result.rowsAffected > 0);
            },
            (_, error) => {
              logger.auth.error("User delete failed", { userId, error });
              resolve(false);
              return true;
            },
          );
        });
      });
    } catch (error) {
      logger.auth.error("User delete exception", { userId, error });
      return false;
    }
  },
};
```

**Option B: Use existing database functions directly**

```typescript
// In src/store/authStore.ts
import { execute, getDatabase } from "@/db/database";

// Replace UserService.upsert calls with direct database calls
await execute(
  `INSERT OR REPLACE INTO users (id, email, name, phone, bio, avatar, token, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
  [
    user.id,
    user.email,
    user.name,
    user.phone,
    user.bio,
    user.avatar,
    user.token,
  ],
);
```

**Recommendation:** Option A - Create a proper `UserService` for better organization and reusability.

#### Step 3.2: Update All Other Files

Search and replace:

```bash
# Find all files importing from local-db.service
grep -r "from '@/services/local-db.service'" src/ --include="*.ts" --include="*.tsx"

# For each file found, update the import
# Example:
# OLD: import { FavoritesService } from '@/services/local-db.service';
# NEW: import { FavoritesService } from '@/services/favorites-service';
```

---

### Phase 4: Remove Duplicate Code

#### Step 4.1: Backup Current File

```bash
cp src/services/local-db.service.ts src/services/local-db.service.ts.backup
```

#### Step 4.2: Create New Simplified File

**Option A: Delete the file entirely**

```bash
# If no other code depends on it
rm src/services/local-db.service.ts
```

**Option B: Keep only non-duplicate code**

```typescript
// src/services/local-db.service.ts (simplified)
// @ts-nocheck - REMOVE THIS LINE

// Keep only utility functions that don't exist elsewhere
// Remove all duplicate service implementations

// Example: Keep only if there are unique utility functions
export const DatabaseUtils = {
  // Any unique utility functions
};
```

**Recommendation:** Option A - Delete the file entirely after verifying no dependencies.

---

### Phase 5: Testing

#### Step 5.1: Unit Tests

```typescript
// tests/services/favorites-service.test.ts
import { FavoritesService } from "@/services/favorites-service";
import { initializeDatabase } from "@/db/database";

describe("FavoritesService", () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  it("should add a favorite", async () => {
    const movie = {
      id: 1,
      title: "Test Movie",
      overview: "Test Overview",
      poster_path: "/test.jpg",
      backdrop_path: "/test-backdrop.jpg",
      vote_average: 8.5,
      release_date: "2024-01-01",
      genre_ids: [1, 2, 3],
    };

    const result = await FavoritesService.add(movie, true);
    expect(result).toBe(true);

    const isFavorite = await FavoritesService.isFavorite(1);
    expect(isFavorite).toBe(true);
  });

  it("should remove a favorite", async () => {
    // ... test implementation
  });

  it("should get all favorites", async () => {
    // ... test implementation
  });
});
```

#### Step 5.2: Integration Tests

```typescript
// tests/integration/favorites-flow.test.ts
import { FavoritesService } from "@/services/favorites-service";
import { WatchlistService } from "@/services/watchlist-service";
import { syncManager } from "@/services/sync-manager";

describe("Favorites Integration", () => {
  it("should add favorite and sync to queue when offline", async () => {
    const movie = {
      /* ... */
    };

    // Add favorite when offline
    await FavoritesService.add(movie, false);

    // Check sync queue
    const pending = await SyncQueueService.getPending();
    expect(pending.length).toBeGreaterThan(0);
  });

  it("should sync favorites when online", async () => {
    // ... test implementation
  });
});
```

#### Step 5.3: Manual Testing Checklist

- [ ] Login works
- [ ] Add to favorites works
- [ ] Remove from favorites works
- [ ] Favorites list displays correctly
- [ ] Add to watchlist works
- [ ] Remove from watchlist works
- [ ] Watchlist displays correctly
- [ ] Sync works when online
- [ ] Queue works when offline
- [ ] No console errors
- [ ] No TypeScript errors

---

### Phase 6: Cleanup

#### Step 6.1: Remove Backup Files

```bash
# After successful testing
rm src/services/local-db.service.ts.backup
```

#### Step 6.2: Update Documentation

```markdown
# docs/services.md

## Services

### FavoritesService

Location: `src/services/favorites-service.ts`
Methods: add, remove, toggle, isFavorite, getAll, getIds, count, getUnsynced, markAsSynced, clear

### WatchlistService

Location: `src/services/watchlist-service.ts`
Methods: add, remove, toggle, isInWatchlist, getAll, getIds, count, getUnsynced, markAsSynced, clear

### UserService

Location: `src/services/user-service.ts` (NEW)
Methods: upsert, getCurrentUser, delete

### SyncQueueService

Location: `src/services/sync-queue-service.ts`
Methods: add, getPending, getPendingCount, getByMovieId, updateStatus, incrementRetry, resetFailed, cleanup, remove, removeByMovieId, clearByType, clear, count, getFailed, hasPending, getMaxRetries
```

#### Step 6.3: Update ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/services/local-db.service"],
            message: "Use individual service files instead of local-db.service",
          },
        ],
      },
    ],
  },
};
```

---

## Migration Plan

### Pre-Migration Checklist

- [ ] Create feature branch
- [ ] Backup current code
- [ ] Document all current imports
- [ ] Write tests for current behavior
- [ ] Notify team of changes

### Migration Steps

#### Step 1: Create UserService (30 minutes)

```bash
# Create new file
touch src/services/user-service.ts

# Implement UserService
# Add tests
```

#### Step 2: Update authStore.ts (15 minutes)

```typescript
// Update import
import { UserService } from "@/services/user-service";

// Verify all UserService calls work
```

#### Step 3: Update all other imports (30 minutes)

```bash
# Search and replace
# Test each file
```

#### Step 4: Remove duplicate code (15 minutes)

```bash
# Delete or simplify local-db.service.ts
# Verify no broken imports
```

#### Step 5: Run tests (30 minutes)

```bash
npm test
npm run test:e2e:ios
```

#### Step 6: Manual testing (1 hour)

- [ ] Test all auth flows
- [ ] Test favorites
- [ ] Test watchlist
- [ ] Test sync

#### Step 7: Code review (30 minutes)

- [ ] Get team approval
- [ ] Address feedback

#### Step 8: Merge (15 minutes)

```bash
git checkout main
git merge feature/consolidate-services
```

**Total Estimated Time: ~3 hours**

---

## Rollback Plan

If issues arise after deployment:

### Immediate Rollback

```bash
# Revert to previous commit
git revert <commit-hash>

# Or restore from backup
cp src/services/local-db.service.ts.backup src/services/local-db.service.ts
```

### Data Migration

If database schema changed:

```sql
-- No schema changes expected for this consolidation
-- But verify data integrity
SELECT COUNT(*) FROM favorites;
SELECT COUNT(*) FROM watchlist;
SELECT COUNT(*) FROM sync_queue;
```

---

## Success Criteria

- [ ] All `@ts-nocheck` removed from service files
- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] No duplicate service code
- [ ] All imports updated
- [ ] Documentation updated
- [ ] ESLint rules preventing future duplicates
- [ ] Code review approved
- [ ] Manual testing complete

---

## Risk Assessment

| Risk                            | Probability | Impact   | Mitigation                             |
| ------------------------------- | ----------- | -------- | -------------------------------------- |
| Breaking existing functionality | Medium      | High     | Comprehensive testing, gradual rollout |
| Import path errors              | Low         | Medium   | Automated search and replace           |
| API incompatibility             | Low         | High     | Compatibility layer, thorough testing  |
| Data loss                       | Very Low    | Critical | Database backup, no schema changes     |
| Performance regression          | Low         | Medium   | Performance testing before/after       |

---

## Post-Migration Tasks

1. **Monitor Error Logs**
   - Watch for any service-related errors
   - Check Sentry for new issues

2. **Performance Monitoring**
   - Compare service call times
   - Monitor database query performance

3. **User Feedback**
   - Collect feedback on favorites/watchlist functionality
   - Address any issues promptly

4. **Documentation Updates**
   - Update API documentation
   - Update architecture diagrams
   - Update onboarding docs

5. **Code Quality**
   - Run ESLint
   - Run Prettier
   - Update code coverage metrics

---

## Conclusion

This consolidation strategy provides a safe, methodical approach to removing duplicate service code while minimizing risk and ensuring functionality is preserved.

**Key Benefits:**

- ~500 lines of duplicate code removed
- Single source of truth for each service
- Consistent error handling
- Better type safety
- Easier maintenance
- Reduced bundle size

**Next Steps:**

1. Get team approval for this plan
2. Schedule migration window
3. Execute migration following the steps above
4. Monitor and address any issues
