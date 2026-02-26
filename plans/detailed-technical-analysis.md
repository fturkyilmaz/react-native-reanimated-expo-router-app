# Detailed Technical Analysis - Critical Issues

## Issue 1: SQL Injection Vulnerability (CRITICAL)

### Location

File: `src/db/database.ts`, lines 204-220

### Current Code

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

### The Problem

This function manually interpolates SQL parameters by replacing `?` placeholders with formatted string values. This is **NOT** true parameterized query binding and is vulnerable to SQL injection.

### Attack Vector Example

```typescript
// User input (malicious)
const userInput = "'; DROP TABLE users; --";

// This would be interpolated as:
const sql = "SELECT * FROM movies WHERE title = ?";
const result = interpolateSQL(sql, [userInput]);
// Result: "SELECT * FROM movies WHERE title = '''; DROP TABLE users; --'"
```

While the current `formatSQLValue` does escape single quotes, this approach is still dangerous because:

1. It's not a true parameterized query
2. Different SQL dialects have different escape requirements
3. It doesn't protect against all injection vectors
4. It bypasses SQLite's built-in parameter binding security

### How It's Used

```typescript
// In executeSQL function (lines 176-199)
const executeSQL = async (
  database: Database,
  sql: string,
  params: any[] = [],
): Promise<ResultSet> => {
  if (useSyncAPI && database.execSync) {
    const interpolated = interpolateSQL(sql, params); // VULNERABLE!
    const result = database.execSync(interpolated);
    return parseResult(result);
  }
  // ...
};
```

### The Fix

Use SQLite's built-in parameter binding instead:

```typescript
// Option 1: Use runAsync with proper parameter binding
if (database.runAsync) {
  await database.runAsync(sql, params); // SQLite handles binding
  return {
    rows: { length: 0, item: () => null },
    rowsAffected: 1,
    insertId: 0,
  };
}

// Option 2: For execAsync, use prepared statements
if (database.execAsync) {
  // Don't interpolate - pass params separately
  const result = await database.execAsync(sql, params);
  return parseResult(result);
}
```

### Impact

- **Security Risk**: SQL injection could lead to data loss, data theft, or complete database compromise
- **Compliance**: Violates OWASP security guidelines
- **Trust**: Users' data could be compromised

---

## Issue 2: Duplicate Service Implementations (HIGH)

### Overview

The same services are implemented twice with different approaches and inconsistencies.

### Comparison Table

| Feature             | `src/services/favorites-service.ts` | `src/services/local-db.service.ts` |
| ------------------- | ----------------------------------- | ---------------------------------- |
| Lines of code       | 449 lines                           | ~180 lines (lines 97-274)          |
| Error handling      | Throws `FavoritesServiceError`      | Returns `false` or `null`          |
| Transaction support | ✅ Yes                              | ✅ Yes                             |
| Type safety         | ✅ Strong types                     | ❌ `@ts-nocheck`                   |
| Logging             | ✅ Uses `logger` utility            | ❌ Uses `console.log`              |
| Deduplication       | ✅ INSERT OR IGNORE                 | ❌ Manual check                    |
| Sync queue          | ✅ Integrated                       | ❌ Not integrated                  |
| Validation          | ✅ `validateMovie()`                | ❌ No validation                   |

### Code Comparison

#### Adding a Favorite

**Version 1: `src/services/favorites-service.ts` (Recommended)**

```typescript
add: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
  const db = await getDatabase();
  if (!db) {
    throw new FavoritesServiceError('Database not available', 'DB_UNAVAILABLE');
  }

  try {
    validateMovie(movie);  // ✅ Validation
    logger.movies.info('Adding to favorites', { movieId: movie.id, isOnline });  // ✅ Structured logging

    await transaction(async (tx) => {
      // Step 1: Ensure movie exists
      await new Promise<void>((resolve, reject) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO movies (...) VALUES (...)`,
          [movie.id, movie.title, ...],
          () => resolve(),
          (_, error) => {
            reject(new FavoritesServiceError('Failed to insert movie', 'MOVIE_INSERT_ERROR', error as Error));
            return true;
          }
        );
      });

      // Step 2: Check if already favorite
      const existing = await new Promise<RawFavorite | null>((resolve) => {
        tx.executeSql(
          `SELECT * FROM favorites WHERE movie_id = ? AND user_id = 'local'`,
          [movie.id],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0) as RawFavorite);
            } else {
              resolve(null);
            }
          },
          () => { resolve(null); return true; }
        );
      });

      if (existing) {
        logger.movies.debug('Already favorite', { movieId: movie.id });
        return;  // ✅ Early return
      }

      // Step 3: Insert favorite
      await new Promise<void>((resolve, reject) => {
        tx.executeSql(
          `INSERT INTO favorites (...) VALUES (...)`,
          [movie.id, isOnline ? 1 : 0],
          () => resolve(),
          (_, error) => {
            reject(new FavoritesServiceError('Failed to insert favorite', 'FAVORITE_INSERT_ERROR', error as Error));
            return true;
          }
        );
      });

      // Step 4: Add to sync queue if offline
      if (!isOnline) {
        await new Promise<void>((resolve) => {
          tx.executeSql(
            `INSERT OR IGNORE INTO sync_queue (...) VALUES (...)`,
            [movie.id],
            () => resolve(),
            () => { resolve(); return true; }
          );
        });
      }
    });

    logger.movies.info('Added to favorites', { movieId: movie.id });
    return true;
  } catch (error) {
    if (error instanceof FavoritesServiceError) {
      throw error;
    }
    logger.movies.error('Add failed', { movieId: movie.id, error });
    throw new FavoritesServiceError(
      `Failed to add movie ${movie.id} to favorites`,
      'ADD_ERROR',
      error as Error
    );
  }
}
```

**Version 2: `src/services/local-db.service.ts` (Duplicate)**

```typescript
add: async (movieId, userId = "local", isOnline = true) => {
  console.log(
    "[DEBUG-FavoritesService] add called for movieId:",
    movieId,
    "userId:",
    userId,
  ); // ❌ Debug log
  const db = await getDatabase();
  if (!db) {
    console.error("[DEBUG-FavoritesService] Database not available"); // ❌ Console.error
    return false; // ❌ Returns false instead of throwing
  }

  // First ensure movie exists in movies table
  const movieExists = await MovieService.getById(movieId);
  console.log("[DEBUG-FavoritesService] movieExists:", !!movieExists); // ❌ Debug log
  if (!movieExists) {
    await MovieService.upsert({
      id: movieId,
      title: `Movie ${movieId}`, // ❌ Generic title
      overview: "",
      poster_path: null,
      backdrop_path: null,
      release_date: "",
      vote_average: 0,
      genre_ids: [],
    });
  }

  // Check if already favorite
  const alreadyFavorite = await FavoritesService.isFavorite(movieId, userId);
  console.log("[DEBUG-FavoritesService] alreadyFavorite:", alreadyFavorite); // ❌ Debug log
  if (alreadyFavorite) {
    console.log("[DEBUG-FavoritesService] Movie already in favorites"); // ❌ Debug log
    return true;
  }

  return new Promise((resolve) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR IGNORE INTO favorites (movie_id, user_id, synced) VALUES (?, ?, ?)`,
        [movieId, userId, isOnline ? 1 : 0],
        (_, result) => {
          console.log("[DEBUG-FavoritesService] add success : ", result); // ❌ Debug log
          resolve(true);
        },
        (_, error) => {
          console.error("[DEBUG-FavoritesService] Error adding:", error); // ❌ Console.error
          resolve(false); // ❌ Returns false
          return true;
        },
      );
    });
  });
};
```

### Key Differences

1. **Error Handling**
   - Version 1: Throws typed errors with error codes
   - Version 2: Returns `false` silently

2. **Logging**
   - Version 1: Uses structured `logger.movies` utility
   - Version 2: Uses `console.log` with `[DEBUG-]` prefixes

3. **Validation**
   - Version 1: Validates movie before processing
   - Version 2: No validation

4. **Type Safety**
   - Version 1: Full TypeScript types
   - Version 2: `@ts-nocheck` at top

5. **Sync Queue**
   - Version 1: Adds to sync queue when offline
   - Version 2: No sync queue integration

### Which One Is Used?

Both are imported in different places:

```typescript
// In src/hooks/use-favorites.tsx
import { FavoritesService } from "@/services/favorites-service"; // Uses Version 1

// In src/store/authStore.ts
import { UserService } from "@/services/local-db.service"; // Uses Version 2
```

### The Fix

1. Keep `src/services/favorites-service.ts` (Version 1)
2. Remove all duplicate code from `src/services/local-db.service.ts`
3. Update all imports to use the consolidated service

---

## Issue 3: Duplicate Auth Implementations (HIGH)

### Overview

Two separate authentication systems with different user interfaces and approaches.

### Comparison

| Feature             | `src/hooks/use-auth.tsx` (Context) | `src/store/authStore.ts` (Zustand) |
| ------------------- | ---------------------------------- | ---------------------------------- |
| State management    | React Context                      | Zustand                            |
| Persistence         | SecureStore only                   | SecureStore + Zustand persist      |
| User interface      | Simple (4 fields)                  | Extended (8 fields)                |
| Biometric support   | ❌ No                              | ✅ Yes                             |
| Supabase support    | ❌ No                              | ✅ Yes                             |
| Mock auth           | ✅ Yes                             | ✅ Yes                             |
| Transition handling | ✅ Yes                             | ✅ Yes                             |
| TypeScript          | ✅ Enabled                         | ❌ `@ts-nocheck`                   |

### User Interface Comparison

**Context Auth User:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}
```

**Zustand Auth User:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // Extra
  phone?: string; // Extra
  bio?: string; // Extra
  token: string;
}
```

### Code Comparison

#### Login Function

**Context Version:**

```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true);
  setError(null);

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === "test@test.com" && password === "123456") {
      // ❌ Hardcoded
      const mockUser = {
        id: "1",
        email,
        name: "Furkan",
        token: "mock_jwt_token_" + Date.now(),
      };

      await SecureStore.setItemAsync("userToken", mockUser.token);
      await SecureStore.setItemAsync("userData", JSON.stringify(mockUser));

      setUser(mockUser);
      setIsTransitioning(true);
    } else {
      throw new Error("Geçersiz e-posta veya şifre"); // Turkish error
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu";
    setError(errorMessage);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
```

**Zustand Version:**

```typescript
login: async (email: string, password: string) => {
  set({ isLoading: true, error: null });

  try {
    if (supabaseAuth.isConfigured()) {
      // ✅ Supabase support
      const result = await supabaseAuth.signIn(email, password);
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.user) {
        // Save to SQLite
        await UserService.upsert({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          token: result.user.token,
        });

        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          isTransitioning: true,
        });
      }
    } else {
      // Fallback to mock login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (email === "test@test.com" && password === "123456") {
        // ❌ Hardcoded
        const mockUser: User = {
          id: "1",
          email,
          name: "Furkan",
          token: "jwt_token_" + Date.now(),
        };

        await UserService.upsert({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          token: mockUser.token,
        });

        await secureStorage.setSecureItem(
          StorageKey.AUTH_TOKEN,
          mockUser.token,
        );
        await secureStorage.setObject(StorageKey.USER_DATA, mockUser, true);

        set({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          isTransitioning: true,
        });
      } else {
        throw new Error("Geçersiz e-posta veya şifre"); // Turkish error
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    set({ error: errorMessage, isLoading: false, isTransitioning: false });
    throw error;
  }
};
```

### Which One Is Used?

Both are used in different parts of the app:

```typescript
// In app/_layout.tsx
import { AuthProvider } from '@/hooks/use-auth';  // Context version
import { useAuthStore } from '@/store/authStore';  // Zustand version

function RootLayoutNav() {
  const { user, isTransitioning, completeTransition, isAuthenticated, isHydrated } = useAuthStore();  // Zustand
  // ...
}

export default function RootLayout() {
  return (
    <AuthProvider>  {/* Context provider */}
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

### The Problem

1. **State Confusion**: Two separate auth states can get out of sync
2. **User Data Mismatch**: Different User interfaces
3. **Feature Inconsistency**: Some features only work with one auth system
4. **Maintenance Burden**: Changes must be made in both places

### The Fix

1. Keep Zustand-based auth (`authStore.ts`) - it's more feature-rich
2. Remove Context-based auth (`use-auth.tsx` and `AuthProvider`)
3. Update all components to use `useAuthStore`
4. Fix TypeScript errors in `authStore.ts`

---

## Issue 4: Database Transaction Polyfill Issues (MEDIUM)

### Location

File: `src/db/database.ts`, lines 392-445

### Current Code

```typescript
const setupSyncTransaction = (database: Database): void => {
  if (typeof database.transaction === "function") return;

  database.transaction = (callback: (tx: Transaction) => void) => {
    const tx: Transaction = {
      executeSql: (
        sql: string,
        params: any[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean,
      ) => {
        try {
          const result = executeSQL(database, sql, params); // ❌ Not awaited!
          onSuccess?.(tx, result);
        } catch (error) {
          if (onError?.(tx, error as Error) !== true) {
            console.error("[Database] Transaction error:", error);
          }
        }
      },
    };
    callback(tx);
  };
  console.log("[Database] Transaction polyfill applied (sync API)");
};
```

### The Problem

1. **Async Not Handled**: `executeSQL` returns a Promise but isn't awaited
2. **No Transaction Support**: Doesn't actually create a database transaction
3. **No Rollback**: Can't rollback on error
4. **Race Conditions**: Multiple operations may execute out of order

### Example of the Issue

```typescript
// This code expects transaction behavior
await transaction(async (tx) => {
  await tx.executeSql("INSERT INTO favorites ..."); // Step 1
  await tx.executeSql("INSERT INTO sync_queue ..."); // Step 2
});

// But with the polyfill:
// - executeSQL returns a Promise
// - The polyfill doesn't await it
// - Step 2 might execute before Step 1 completes
// - If Step 2 fails, Step 1 is already committed (no rollback)
```

### The Fix

```typescript
const setupSyncTransaction = (database: Database): void => {
  if (typeof database.transaction === "function") return;

  database.transaction = async (
    callback: (tx: Transaction) => Promise<void>,
  ) => {
    const tx: Transaction = {
      executeSql: async (
        sql: string,
        params: any[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean,
      ) => {
        try {
          const result = await executeSQL(database, sql, params); // ✅ Awaited
          onSuccess?.(tx, result);
        } catch (error) {
          if (onError?.(tx, error as Error) !== true) {
            console.error("[Database] Transaction error:", error);
            throw error; // ✅ Propagate error for rollback
          }
        }
      },
    };

    try {
      await callback(tx); // ✅ Await callback
    } catch (error) {
      console.error("[Database] Transaction failed:", error);
      throw error; // ✅ Transaction failed
    }
  };
  console.log("[Database] Transaction polyfill applied (sync API)");
};
```

### Better Solution

Use a proper transaction library or native SQLite transactions:

```typescript
// Use SQLite's built-in transaction support
database.transaction((tx) => {
  tx.executeSql("BEGIN TRANSACTION");
  tx.executeSql(
    "INSERT INTO favorites ...",
    [],
    () =>
      tx.executeSql(
        "INSERT INTO sync_queue ...",
        [],
        () => tx.executeSql("COMMIT"),
        () => tx.executeSql("ROLLBACK"),
      ),
    () => tx.executeSql("ROLLBACK"),
  );
});
```

---

## Issue 5: TypeScript Disabled Everywhere (HIGH)

### Files with `@ts-nocheck`

| File                               | Lines | Issues                           |
| ---------------------------------- | ----- | -------------------------------- |
| `src/store/authStore.ts`           | 330   | Missing types, any usage         |
| `src/services/supabase-auth.ts`    | 240   | Missing types                    |
| `src/services/sync-manager.ts`     | 430   | Missing logger import, any types |
| `src/services/local-db.service.ts` | 678   | All services, any types          |
| `src/db/database.ts`               | 702   | Database types, any types        |
| `src/supabase/client.ts`           | 39    | Dynamic imports                  |
| `src/services/supabase-service.ts` | 456   | Client type, any types           |

### Example Issues

#### In `src/store/authStore.ts`

```typescript
// @ts-nocheck  ← Disables ALL type checking
import { UserService } from "@/services/local-db.service"; // ← Wrong import path

// This should be:
import { UserService } from "@/services/local-db.service"; // But UserService is not exported from there!
// It should be:
import { UserService } from "@/services/local-db.service"; // Actually, UserService doesn't exist in that file
```

#### In `src/services/sync-manager.ts`

```typescript
// @ts-nocheck  ← Disables ALL type checking
logger.sync.info("Initializing..."); // ← logger is not imported!

// Should be:
import { logger } from "@/utils/logger";
```

#### In `src/db/database.ts`

```typescript
// @ts-nocheck  ← Disables ALL type checking
const loadSQLite = async (): Promise<any> => {
  // ← any type
  // ...
};

const executeSQL = async (
  database: Database,
  sql: string,
  params: any[] = [], // ← any type
): Promise<ResultSet> => {
  // ...
};
```

### The Impact

1. **No Type Safety**: Runtime errors that could be caught at compile time
2. **Poor IDE Support**: No autocomplete, no inline documentation
3. **Hidden Bugs**: Type mismatches go undetected
4. **Refactoring Risk**: Changes can break code without warning

### The Fix

1. Remove all `@ts-nocheck` directives
2. Fix all TypeScript errors
3. Add proper type definitions
4. Fix import paths

---

## Issue 6: Hardcoded Test Credentials (MEDIUM)

### Locations

#### 1. `app/(auth)/login.tsx` (lines 38-41)

```typescript
const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: "test@test.com", // ❌ Hardcoded
    password: "123456", // ❌ Hardcoded
  },
});
```

#### 2. `src/hooks/use-auth.tsx` (lines 67-82)

```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true);
  setError(null);

  try {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === 'test@test.com' && password === '123456') {  // ❌ Hardcoded
      const mockUser = {
        id: '1',
        email,
        name: 'Furkan',
        token: 'mock_jwt_token_' + Date.now(),
      };
      // ...
    }
  }
}
```

#### 3. `src/store/authStore.ts` (lines 98-104)

```typescript
if (email === "test@test.com" && password === "123456") {
  // ❌ Hardcoded
  const mockUser: User = {
    id: "1",
    email,
    name: "Furkan",
    token: "jwt_token_" + Date.now(),
  };
  // ...
}
```

### The Problem

1. **Security Risk**: Credentials in source code can be exposed
2. **Production Issue**: Test credentials might work in production
3. **Maintenance**: Hard to change credentials
4. **Version Control**: Credentials committed to git

### The Fix

#### Option 1: Environment Variables

```typescript
// .env.local
EXPO_PUBLIC_TEST_EMAIL=test@test.com
EXPO_PUBLIC_TEST_PASSWORD=123456

// In code
const defaultValues = {
  email: process.env.EXPO_PUBLIC_TEST_EMAIL || '',
  password: process.env.EXPO_PUBLIC_TEST_PASSWORD || '',
};
```

#### Option 2: Remove Test Credentials

```typescript
const defaultValues = {
  email: "",
  password: "",
};
```

#### Option 3: Development Only

```typescript
const defaultValues = __DEV__
  ? {
      email: "test@test.com",
      password: "123456",
    }
  : {
      email: "",
      password: "",
    };
```

---

## Issue 7: Inconsistent Error Handling (MEDIUM)

### Error Handling Patterns

| Service               | Pattern                        | Return Type                |
| --------------------- | ------------------------------ | -------------------------- |
| `FavoritesService`    | Throws `FavoritesServiceError` | `Promise<boolean>`         |
| `WatchlistService`    | Throws `WatchlistServiceError` | `Promise<boolean>`         |
| `SyncQueueService`    | Throws `SyncQueueServiceError` | `Promise<boolean>`         |
| `local-db.service.ts` | Returns `false`/`null`         | `Promise<boolean \| null>` |
| `supabase-service.ts` | Returns `false`                | `Promise<boolean>`         |
| `tmdbService`         | Returns mock data on error     | `Promise<T>`               |

### Examples

#### Consistent Pattern (Recommended)

```typescript
// src/services/favorites-service.ts
add: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
  try {
    validateMovie(movie);
    // ... logic ...
    return true;
  } catch (error) {
    if (error instanceof FavoritesServiceError) {
      throw error; // Re-throw typed error
    }
    throw new FavoritesServiceError(
      `Failed to add movie ${movie.id} to favorites`,
      "ADD_ERROR",
      error as Error,
    );
  }
};
```

#### Inconsistent Pattern (Problematic)

```typescript
// src/services/local-db.service.ts
add: async (movieId, userId = "local", isOnline = true) => {
  const db = await getDatabase();
  if (!db) {
    console.error("[DEBUG-FavoritesService] Database not available");
    return false; // ❌ Silent failure
  }

  return new Promise((resolve) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO favorites ...`,
        [movieId, userId, isOnline ? 1 : 0],
        (_, result) => {
          console.log("[DEBUG-FavoritesService] add success : ", result);
          resolve(true); // ✅ Success
        },
        (_, error) => {
          console.error("[DEBUG-FavoritesService] Error adding:", error);
          resolve(false); // ❌ Silent failure
          return true;
        },
      );
    });
  });
};
```

### The Problem

1. **Inconsistent API**: Some throw, some return false
2. **Silent Failures**: Errors are swallowed
3. **Hard to Debug**: No error propagation
4. **Poor UX**: Users don't know what went wrong

### The Fix

Standardize on throwing errors:

```typescript
// Define a base error class
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// All services throw errors
export const FavoritesService = {
  add: async (movie: Movie, isOnline: boolean): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) {
      throw new ServiceError("Database not available", "DB_UNAVAILABLE");
    }
    // ... logic ...
    return true;
  },
};

// Components handle errors
try {
  await FavoritesService.add(movie, isOnline);
} catch (error) {
  if (error instanceof ServiceError) {
    // Show user-friendly error
    showError(error.message);
  }
}
```

---

## Summary of Critical Issues

| Issue                 | Severity | Impact                | Effort |
| --------------------- | -------- | --------------------- | ------ |
| SQL Injection         | CRITICAL | Security breach       | Medium |
| Duplicate Services    | HIGH     | Maintenance nightmare | High   |
| Duplicate Auth        | HIGH     | State conflicts       | High   |
| TypeScript Disabled   | HIGH     | No type safety        | High   |
| Transaction Polyfill  | MEDIUM   | Data corruption       | Medium |
| Hardcoded Credentials | MEDIUM   | Security risk         | Low    |
| Inconsistent Errors   | MEDIUM   | Poor UX               | Medium |

### Recommended Action Order

1. **Fix SQL Injection** (Security critical)
2. **Remove Duplicate Services** (Maintenance critical)
3. **Consolidate Auth** (State consistency)
4. **Enable TypeScript** (Type safety)
5. **Fix Transaction Polyfill** (Data integrity)
6. **Remove Hardcoded Credentials** (Security)
7. **Standardize Error Handling** (UX)
