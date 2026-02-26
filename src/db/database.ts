/**
 * CineSearch Database Manager
 *
 * Manages SQLite database initialization, migrations, and provides
 * a unified interface for both sync and async SQLite APIs.
 *
 * Features:
 * - Automatic schema creation and migrations
 * - Transaction polyfill for sync/async APIs
 * - Multi-API support (sync, async, legacy)
 * - Type-safe operations
 */

import { Platform } from "react-native";

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = "cinesearch.db";
export const DB_VERSION = 3;
const MAX_RETRIES = 3;

// ============================================================================
// TYPES
// ============================================================================

interface SQLiteModule {
  openDatabaseSync?: (name: string) => Database;
  openDatabaseAsync?: (name: string) => Promise<Database>;
  openDatabase?: (name: string) => Database;
}

interface Database {
  execSync?: (sql: string) => SQLResult;
  execAsync?: (sql: string) => Promise<SQLResult>;
  getFirstAsync?: (sql: string, params?: unknown[]) => Promise<unknown>;
  getAllAsync?: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  runAsync?: (sql: string, params?: unknown[]) => Promise<RunResult>;
  transaction?: (callback: (tx: Transaction) => void) => void;
  closeAsync?: () => Promise<void>;
}

interface SQLResult {
  rows?: unknown[];
  rowsAffected?: number;
  insertId?: number | bigint;
}

interface RunResult {
  rowsAffected: number;
  insertId: number | bigint;
}

interface Transaction {
  executeSql: (
    sql: string,
    params?: unknown[],
    onSuccess?: (tx: Transaction, result: ResultSet) => void,
    onError?: (tx: Transaction, error: Error) => boolean,
  ) => void;
}

interface ResultSet {
  rows: {
    length: number;
    item: (index: number) => unknown;
  };
  rowsAffected: number;
  insertId: number | bigint;
}

interface Migration {
  version: number;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

// ============================================================================
// STATE
// ============================================================================

let SQLiteModule: SQLiteModule | null = null;
let db: Database | null = null;
let isInitialized = false;
let useSyncAPI = false;

// ============================================================================
// SQL STATEMENTS
// ============================================================================

const SCHEMA = `
  -- Users table (existing)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    avatar TEXT,
    token TEXT NOT NULL,
    updated_at INTEGER
  );

  -- Movies table: Stores movie metadata
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date TEXT,
    vote_average REAL DEFAULT 0,
    genre_ids TEXT DEFAULT '[]',
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Favorites table: User's favorite movies
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    user_id TEXT DEFAULT 'local',
    synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(movie_id, user_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );

  -- Watchlist table: User's watchlist movies
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    user_id TEXT DEFAULT 'local',
    synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(movie_id, user_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );

  -- Sync queue table: Offline operations pending sync
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('favorite', 'watchlist')),
    movie_id INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('add', 'remove')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(type, movie_id, operation, status)
  );

  -- Performance indexes
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_movie ON favorites(movie_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_movie ON watchlist(movie_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type, movie_id);
`;

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

/**
 * Load SQLite module with fallback support
 */
const loadSQLite = async (): Promise<SQLiteModule | null> => {
  if (SQLiteModule) return SQLiteModule;

  try {
    const expoSQLite = require("expo-sqlite");
    SQLiteModule = {
      openDatabaseSync: expoSQLite.openDatabaseSync,
      openDatabaseAsync: expoSQLite.openDatabaseAsync,
      openDatabase: expoSQLite.openDatabase,
    };
    console.log("[Database] SQLite module loaded");
    return SQLiteModule;
  } catch (error) {
    console.error("[Database] Failed to load SQLite module:", error);
    return null;
  }
};

/**
 * Execute a single SQL statement with proper parameterization
 */
const executeSQL = async (
  database: Database,
  sql: string,
  params: unknown[] = [],
): Promise<ResultSet> => {
  if (useSyncAPI && database.execSync) {
    // For sync API, we need to interpolate parameters
    const interpolated = interpolateSQL(sql, params);
    const result = database.execSync(interpolated);
    return parseResult(result);
  }

  if (database.execAsync) {
    // For async API, we need to interpolate parameters
    const interpolated = interpolateSQL(sql, params);
    const result = await database.execAsync(interpolated);
    return parseResult(result);
  }

  if (database.runAsync) {
    // runAsync supports proper parameterization
    const result = await database.runAsync(sql, params);
    return {
      rows: { length: 0, item: () => null },
      rowsAffected: result.rowsAffected,
      insertId: result.insertId,
    };
  }

  throw new Error("[Database] No suitable SQL execution method available");
};

/**
 * Interpolate SQL parameters (for sync/async APIs that don't support parameter binding)
 * Note: This is a fallback for APIs that don't support proper parameterization.
 * The runAsync API should be preferred as it supports proper parameter binding.
 *
 * SECURITY WARNING: This function should only be used as a last resort.
 * Always prefer using runAsync with proper parameter binding.
 */
const interpolateSQL = (sql: string, params: unknown[]): string => {
  // Validate SQL query for potential injection patterns
  if (containsSQLInjection(sql)) {
    throw new Error("[Database] Potential SQL injection detected in query");
  }

  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    const value = params[paramIndex++];
    return formatSQLValue(value);
  });
};

/**
 * Check for potential SQL injection patterns in the query
 */
const containsSQLInjection = (sql: string): boolean => {
  // Check for common SQL injection patterns
  const injectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /(\bOR\b|\bAND\b)\s+['"].*['"]\s*=\s*['"].*['"]/i,
  ];

  // Only check the base query (before parameter placeholders)
  const baseQuery = sql.split("?")[0];
  return injectionPatterns.some((pattern) => pattern.test(baseQuery));
};

/**
 * Format a value for SQL interpolation with proper escaping
 * Note: This function should only be used as a fallback when proper parameterization is not available.
 *
 * SECURITY WARNING: This function attempts to escape values, but it's not foolproof.
 * Always prefer using runAsync with proper parameter binding.
 */
const formatSQLValue = (value: unknown): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    // Validate that it's a valid number
    if (!Number.isFinite(value)) return "NULL";
    return String(value);
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "string") {
    // Comprehensive escaping to prevent SQL injection
    // 1. Escape backslashes first
    let escaped = value.replace(/\\/g, "\\\\");
    // 2. Escape single quotes
    escaped = escaped.replace(/'/g, "''");
    // 3. Remove any null bytes
    escaped = escaped.replace(/\0/g, "");
    // 4. Remove any control characters except newline and tab
    escaped = escaped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    return `'${escaped}'`;
  }
  if (typeof value === "object") {
    // For objects, stringify and escape
    const jsonStr = JSON.stringify(value);
    let escaped = jsonStr.replace(/\\/g, "\\\\");
    escaped = escaped.replace(/'/g, "''");
    escaped = escaped.replace(/\0/g, "");
    escaped = escaped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    return `'${escaped}'`;
  }
  return "NULL";
};

/**
 * Parse SQL result to ResultSet interface
 */
const parseResult = (result: SQLResult): ResultSet => {
  const first = Array.isArray(result) ? result[0] : result;
  const rowsArray = (first?.rows as unknown[]) ?? [];
  return {
    rows: {
      length: rowsArray.length,
      item: (i: number) => rowsArray[i],
    },
    rowsAffected: first?.rowsAffected ?? 0,
    insertId: first?.insertId ?? 0,
  };
};

/**
 * Check if table exists
 */
const tableExists = async (
  database: Database,
  tableName: string,
): Promise<boolean> => {
  const result = await executeSQL(
    database,
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName],
  );
  return result.rows.length > 0;
};

/**
 * Get current database version
 */
const getDatabaseVersion = async (): Promise<number> => {
  const database = await getDatabase();
  if (!database) return 0;

  try {
    if (useSyncAPI && database.execSync) {
      const r = database.execSync("PRAGMA user_version;");
      const row = (r as SQLResult[])[0]?.rows as unknown[];
      return (row?.[0] as { user_version?: number })?.user_version ?? 0;
    }

    if (database.getFirstAsync) {
      const row = await database.getFirstAsync("PRAGMA user_version;");
      return (row as { user_version?: number })?.user_version ?? 0;
    }

    return await new Promise<number>((resolve) => {
      database.transaction!((tx) => {
        tx.executeSql(
          "PRAGMA user_version;",
          [],
          (_, r) => {
            const item = r.rows.item(0) as
              | { user_version?: number }
              | undefined;
            resolve(item?.user_version ?? 0);
          },
          () => {
            resolve(0);
            return true;
          },
        );
      });
    });
  } catch {
    console.warn("[Database] Could not get database version");
    return 0;
  }
};

/**
 * Run migrations
 */
const runMigrations = async (
  database: Database,
  fromVersion: number,
): Promise<void> => {
  console.log(
    `[Database] Running migrations from version ${fromVersion} to ${DB_VERSION}`,
  );

  // v0 -> v1: Create initial schema
  if (fromVersion < 1) {
    console.log("[Database] Migration v0 -> v1: Creating initial schema");
    await executeSQL(database, SCHEMA);
  }

  // v1 -> v2: Add users table columns if needed
  if (fromVersion < 2) {
    console.log("[Database] Migration v1 -> v2: Adding users table columns");
    try {
      await executeSQL(database, `ALTER TABLE users ADD COLUMN avatar TEXT;`);
    } catch (error: unknown) {
      const err = error as Error;
      if (!err.message?.includes("duplicate column name")) {
        throw error;
      }
    }
  }

  // v2 -> v3: Add movies, favorites, watchlist, sync_queue tables
  if (fromVersion < 3) {
    console.log(
      "[Database] Migration v2 -> v3: Adding movies, favorites, watchlist, sync_queue",
    );

    // Drop existing sync_queue if it exists (with old schema)
    try {
      await executeSQL(database, `DROP TABLE IF EXISTS sync_queue;`);
      console.log("[Database] Dropped old sync_queue table");
    } catch (e) {
      console.warn("[Database] Could not drop sync_queue:", e);
    }

    // Create tables
    await executeSQL(
      database,
      `
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        overview TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        release_date TEXT,
        vote_average REAL DEFAULT 0,
        genre_ids TEXT DEFAULT '[]',
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `,
    );

    await executeSQL(
      database,
      `
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        user_id TEXT DEFAULT 'local',
        synced INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(movie_id, user_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      );
    `,
    );

    await executeSQL(
      database,
      `
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        user_id TEXT DEFAULT 'local',
        synced INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(movie_id, user_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      );
    `,
    );

    await executeSQL(
      database,
      `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('favorite', 'watchlist')),
        movie_id INTEGER NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('add', 'remove')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(type, movie_id, operation, status)
      );
    `,
    );

    // Create indexes
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);`,
    );
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_favorites_movie ON favorites(movie_id);`,
    );
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);`,
    );
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_watchlist_movie ON watchlist(movie_id);`,
    );
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);`,
    );
    await executeSQL(
      database,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type, movie_id);`,
    );
  }

  // Set version
  await executeSQL(database, `PRAGMA user_version = ${DB_VERSION};`);
  console.log(`[Database] Migration complete. Version: ${DB_VERSION}`);
};

/**
 * Setup transaction polyfill for sync API
 */
const setupSyncTransaction = (database: Database): void => {
  if (typeof database.transaction === "function") return;

  database.transaction = (callback: (tx: Transaction) => void) => {
    const tx: Transaction = {
      executeSql: (
        sql: string,
        params: unknown[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean,
      ) => {
        // Note: executeSQL is async, but we're in a sync context
        // This is a limitation of the polyfill - it won't properly handle async operations
        executeSQL(database, sql, params)
          .then((result) => {
            onSuccess?.(tx, result);
          })
          .catch((error) => {
            if (onError?.(tx, error as Error) !== true) {
              console.error("[Database] Transaction error:", error);
            }
          });
      },
    };
    callback(tx);
  };
  console.log("[Database] Transaction polyfill applied (sync API)");
};

/**
 * Setup transaction polyfill for async API
 */
const setupAsyncTransaction = (database: Database): void => {
  if (typeof database.transaction === "function") return;

  database.transaction = async (callback: (tx: Transaction) => void) => {
    const tx: Transaction = {
      executeSql: async (
        sql: string,
        params: unknown[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean,
      ) => {
        try {
          const result = await executeSQL(database, sql, params);
          onSuccess?.(tx, result);
        } catch (error) {
          if (onError?.(tx, error as Error) !== true) {
            console.error("[Database] Async transaction error:", error);
          }
        }
      },
    };
    callback(tx);
  };
  console.log("[Database] Transaction polyfill applied (async API)");
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get database instance (singleton)
 */
export const getDatabase = async (): Promise<Database | null> => {
  if (db) return db;

  const sqlite = await loadSQLite();
  if (!sqlite) {
    console.error("[Database] SQLite module not available");
    return null;
  }

  try {
    // Try sync API first (preferred)
    if (typeof sqlite.openDatabaseSync === "function") {
      db = sqlite.openDatabaseSync(DB_NAME);
      useSyncAPI = true;
      console.log("[Database] Using sync API (openDatabaseSync)");
      setupSyncTransaction(db);
      return db;
    }

    // Try async API
    if (typeof sqlite.openDatabaseAsync === "function") {
      db = await sqlite.openDatabaseAsync(DB_NAME);
      useSyncAPI = false;
      console.log("[Database] Using async API (openDatabaseAsync)");
      setupAsyncTransaction(db);
      return db;
    }

    // Fallback to legacy API
    if (typeof sqlite.openDatabase === "function") {
      db = sqlite.openDatabase(DB_NAME);
      useSyncAPI = false;
      console.log("[Database] Using legacy API");
      return db;
    }

    // Web platform warning
    if (Platform.OS === "web") {
      console.warn("[Database] SQLite not supported on web");
      return null;
    }

    throw new Error("[Database] No compatible SQLite API found");
  } catch (error) {
    console.error("[Database] Failed to open database:", error);
    return null;
  }
};

/**
 * Initialize database with migrations
 */
export const initializeDatabase = async (): Promise<boolean> => {
  if (isInitialized) {
    console.log("[Database] Already initialized");
    return true;
  }

  const database = await getDatabase();
  if (!database) {
    console.error("[Database] Failed to initialize: database not available");
    return false;
  }

  try {
    const currentVersion = await getDatabaseVersion();
    console.log(
      `[Database] Current version: ${currentVersion}, Target version: ${DB_VERSION}`,
    );

    if (currentVersion < DB_VERSION) {
      await runMigrations(database, currentVersion);
    }

    isInitialized = true;
    console.log("[Database] Initialized successfully");
    return true;
  } catch (error) {
    console.error("[Database] Failed to initialize:", error);
    return false;
  }
};

/**
 * Reset database (drop all tables and recreate)
 */
export const resetDatabase = async (): Promise<void> => {
  console.log("[Database] Resetting database...");

  const database = await getDatabase();
  if (!database) {
    console.error("[Database] Failed to reset: database not available");
    return;
  }

  try {
    // Drop all tables
    const tables = ["sync_queue", "watchlist", "favorites", "movies", "users"];
    for (const table of tables) {
      await executeSQL(database, `DROP TABLE IF EXISTS ${table};`);
      console.log(`[Database] Dropped table: ${table}`);
    }

    // Reset version
    await executeSQL(database, `PRAGMA user_version = 0;`);

    // Reinitialize
    isInitialized = false;
    await initializeDatabase();

    console.log("[Database] Reset complete");
  } catch (error) {
    console.error("[Database] Failed to reset:", error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db && typeof db.closeAsync === "function") {
    await db.closeAsync();
    db = null;
    isInitialized = false;
    console.log("[Database] Closed");
  }
};

/**
 * Execute a query and return all results
 */
export const query = async <T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const database = await getDatabase();
  if (!database) {
    throw new Error("[Database] Not initialized");
  }

  const result = await executeSQL(database, sql, params);
  const results: T[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    results.push(result.rows.item(i) as T);
  }
  return results;
};

/**
 * Execute a query and return the first result
 */
export const queryOne = async <T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> => {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
};

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export const execute = async (
  sql: string,
  params: unknown[] = [],
): Promise<{ rowsAffected: number; insertId: number | bigint }> => {
  const database = await getDatabase();
  if (!database) {
    throw new Error("[Database] Not initialized");
  }

  const result = await executeSQL(database, sql, params);
  return {
    rowsAffected: result.rowsAffected,
    insertId: result.insertId,
  };
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
  callback: (tx: Transaction) => Promise<T>,
): Promise<T> => {
  const database = await getDatabase();
  if (!database) {
    throw new Error("[Database] Not initialized");
  }

  if (!database.transaction) {
    throw new Error("[Database] Transaction not supported");
  }

  return await new Promise<T>((resolve, reject) => {
    database.transaction!((tx) => {
      callback(tx)
        .then(resolve)
        .catch((error) => {
          console.error("[Database] Transaction failed:", error);
          reject(error);
        });
    });
  });
};

/**
 * Check if database is initialized
 */
export const isDatabaseInitialized = (): boolean => isInitialized;

/**
 * Check if using sync API
 */
export const isUsingSyncAPI = (): boolean => useSyncAPI;
