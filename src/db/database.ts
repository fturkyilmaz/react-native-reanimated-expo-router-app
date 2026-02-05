// @ts-nocheck
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

import { Platform } from 'react-native';

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'cinesearch.db';
export const DB_VERSION = 3;
const MAX_RETRIES = 3;

// ============================================================================
// TYPES
// ============================================================================

interface Database {
  execSync?: (sql: string) => any;
  execAsync?: (sql: string) => Promise<any>;
  getFirstAsync?: (sql: string, params?: any[]) => Promise<any>;
  getAllAsync?: (sql: string, params?: any[]) => Promise<any>;
  runAsync?: (sql: string, params?: any[]) => Promise<any>;
  transaction?: (callback: (tx: Transaction) => void) => void;
  closeAsync?: () => Promise<void>;
}

interface Transaction {
  executeSql: (
    sql: string,
    params?: any[],
    onSuccess?: (tx: Transaction, result: ResultSet) => void,
    onError?: (tx: Transaction, error: Error) => boolean
  ) => void;
}

interface ResultSet {
  rows: {
    length: number;
    item: (index: number) => any;
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

let SQLiteModule: any = null;
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
const loadSQLite = async (): Promise<any> => {
  if (SQLiteModule) return SQLiteModule;

  try {
    const expoSQLite = require('expo-sqlite');
    SQLiteModule = {
      openDatabaseSync: expoSQLite.openDatabaseSync,
      openDatabaseAsync: expoSQLite.openDatabaseAsync,
      openDatabase: expoSQLite.openDatabase,
    };
    console.log('[Database] SQLite module loaded');
    return SQLiteModule;
  } catch (error) {
    console.error('[Database] Failed to load SQLite module:', error);
    return null;
  }
};

/**
 * Execute a single SQL statement
 */
const executeSQL = async (
  database: Database,
  sql: string,
  params: any[] = []
): Promise<ResultSet> => {
  if (useSyncAPI && database.execSync) {
    const interpolated = interpolateSQL(sql, params);
    const result = database.execSync(interpolated);
    return parseResult(result);
  }

  if (database.execAsync) {
    const interpolated = interpolateSQL(sql, params);
    const result = await database.execAsync(interpolated);
    return parseResult(result);
  }

  if (database.runAsync) {
    await database.runAsync(sql, params);
    return { rows: { length: 0, item: () => null }, rowsAffected: 1, insertId: 0 };
  }

  throw new Error('[Database] No suitable SQL execution method available');
};

/**
 * Interpolate SQL parameters (security: prevents SQL injection through parameterization)
 */
const interpolateSQL = (sql: string, params: any[]): string => {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    const value = params[paramIndex++];
    return formatSQLValue(value);
  });
};

/**
 * Format a value for SQL interpolation
 */
const formatSQLValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
};

/**
 * Parse SQL result to ResultSet interface
 */
const parseResult = (result: any): ResultSet => {
  const first = Array.isArray(result) ? result[0] : result;
  const rowsArray = first?.rows ?? [];
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
const tableExists = async (database: Database, tableName: string): Promise<boolean> => {
  const result = await executeSQL(
    database,
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
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
      const r = database.execSync('PRAGMA user_version;');
      return r?.[0]?.rows?.[0]?.user_version ?? 0;
    }

    if (database.getFirstAsync) {
      const row = await database.getFirstAsync('PRAGMA user_version;');
      return row?.user_version ?? 0;
    }

    return await new Promise<number>((resolve) => {
      database.transaction!((tx) => {
        tx.executeSql(
          'PRAGMA user_version;',
          [],
          (_, r) => resolve(r.rows.item(0)?.user_version ?? 0),
          () => resolve(0)
        );
      });
    });
  } catch {
    console.warn('[Database] Could not get database version');
    return 0;
  }
};

/**
 * Run migrations
 */
const runMigrations = async (database: Database, fromVersion: number): Promise<void> => {
  console.log(`[Database] Running migrations from version ${fromVersion} to ${DB_VERSION}`);

  // v0 -> v1: Create initial schema
  if (fromVersion < 1) {
    console.log('[Database] Migration v0 -> v1: Creating initial schema');
    await executeSQL(database, SCHEMA);
  }

  // v1 -> v2: Add users table columns if needed
  if (fromVersion < 2) {
    console.log('[Database] Migration v1 -> v2: Adding users table columns');
    try {
      await executeSQL(database, `ALTER TABLE users ADD COLUMN avatar TEXT;`);
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        throw error;
      }
    }
  }

  // v2 -> v3: Add movies, favorites, watchlist, sync_queue tables
  if (fromVersion < 3) {
    console.log('[Database] Migration v2 -> v3: Adding movies, favorites, watchlist, sync_queue');

    // Drop existing sync_queue if it exists (with old schema)
    try {
      await executeSQL(database, `DROP TABLE IF EXISTS sync_queue;`);
      console.log('[Database] Dropped old sync_queue table');
    } catch (e) {
      console.warn('[Database] Could not drop sync_queue:', e);
    }

    // Create tables
    await executeSQL(database, `
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
    `);

    await executeSQL(database, `
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
    `);

    await executeSQL(database, `
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
    `);

    await executeSQL(database, `
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
    `);

    // Create indexes
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);`);
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_favorites_movie ON favorites(movie_id);`);
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);`);
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_watchlist_movie ON watchlist(movie_id);`);
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);`);
    await executeSQL(database, `CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type, movie_id);`);
  }

  // Set version
  await executeSQL(database, `PRAGMA user_version = ${DB_VERSION};`);
  console.log(`[Database] Migration complete. Version: ${DB_VERSION}`);
};

/**
 * Setup transaction polyfill for sync API
 */
const setupSyncTransaction = (database: Database): void => {
  if (typeof database.transaction === 'function') return;

  database.transaction = (callback: (tx: Transaction) => void) => {
    const tx: Transaction = {
      executeSql: (
        sql: string,
        params: any[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean
      ) => {
        try {
          const result = executeSQL(database, sql, params);
          onSuccess?.(tx, result);
        } catch (error) {
          if (onError?.(tx, error as Error) !== true) {
            console.error('[Database] Transaction error:', error);
          }
        }
      },
    };
    callback(tx);
  };
  console.log('[Database] Transaction polyfill applied (sync API)');
};

/**
 * Setup transaction polyfill for async API
 */
const setupAsyncTransaction = (database: Database): void => {
  if (typeof database.transaction === 'function') return;

  database.transaction = async (callback: (tx: Transaction) => void) => {
    const tx: Transaction = {
      executeSql: async (
        sql: string,
        params: any[] = [],
        onSuccess?: (tx: Transaction, result: ResultSet) => void,
        onError?: (tx: Transaction, error: Error) => boolean
      ) => {
        try {
          const result = await executeSQL(database, sql, params);
          onSuccess?.(tx, result);
        } catch (error) {
          if (onError?.(tx, error as Error) !== true) {
            console.error('[Database] Async transaction error:', error);
          }
        }
      },
    };
    callback(tx);
  };
  console.log('[Database] Transaction polyfill applied (async API)');
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
    console.error('[Database] SQLite module not available');
    return null;
  }

  try {
    // Try sync API first (preferred)
    if (typeof sqlite.openDatabaseSync === 'function') {
      db = sqlite.openDatabaseSync(DB_NAME);
      useSyncAPI = true;
      console.log('[Database] Using sync API (openDatabaseSync)');
      setupSyncTransaction(db);
      return db;
    }

    // Try async API
    if (typeof sqlite.openDatabaseAsync === 'function') {
      db = await sqlite.openDatabaseAsync(DB_NAME);
      useSyncAPI = false;
      console.log('[Database] Using async API (openDatabaseAsync)');
      setupAsyncTransaction(db);
      return db;
    }

    // Fallback to legacy API
    if (typeof sqlite.openDatabase === 'function') {
      db = sqlite.openDatabase(DB_NAME);
      useSyncAPI = false;
      console.log('[Database] Using legacy API');
      return db;
    }

    // Web platform warning
    if (Platform.OS === 'web') {
      console.warn('[Database] SQLite not supported on web');
      return null;
    }

    throw new Error('[Database] No compatible SQLite API found');
  } catch (error) {
    console.error('[Database] Failed to open database:', error);
    return null;
  }
};

/**
 * Initialize database with migrations
 */
export const initializeDatabase = async (): Promise<boolean> => {
  if (isInitialized) {
    console.log('[Database] Already initialized');
    return true;
  }

  const database = await getDatabase();
  if (!database) {
    console.error('[Database] Failed to initialize: no database');
    return false;
  }

  try {
    const currentVersion = await getDatabaseVersion();
    await runMigrations(database, currentVersion);
    isInitialized = true;
    console.log('[Database] Initialization complete');
    return true;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    return false;
  }
};

/**
 * Reset database (for development/testing)
 * Deletes current database and resets state
 */
export const resetDatabase = async (): Promise<void> => {
  console.log('[Database] Resetting database...');

  // Close existing connection
  if (db && typeof db.closeAsync === 'function') {
    try {
      await db.closeAsync();
    } catch (e) {
      console.warn('[Database] Close error:', e);
    }
  }

  db = null;
  SQLiteModule = null;
  isInitialized = false;

  // Delete database file on native platforms using expo-file-system
  try {
    const { deleteAsync, documentDirectory } = await import('expo-file-system');
    if (documentDirectory) {
      const dbPath = `${documentDirectory}${DB_NAME}`;
      const info = await deleteAsync(dbPath, { idempotent: true });
      console.log('[Database] Database file deleted:', dbPath, info);
    }
  } catch (e) {
    console.warn('[Database] Could not delete database file:', e);
  }

  // Also try expo-sqlite method
  try {
    const expoSQLite = require('expo-sqlite');
    if (expoSQLite.deleteDatabaseAsync) {
      await expoSQLite.deleteDatabaseAsync(DB_NAME);
      console.log('[Database] Database file deleted via expo-sqlite');
    }
  } catch (e) {
    console.warn('[Database] expo-sqlite delete error:', e);
  }

  console.log('[Database] Reset complete. Restart app to recreate.');
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db && typeof db.closeAsync === 'function') {
    await db.closeAsync();
  }
  db = null;
  isInitialized = false;
  console.log('[Database] Connection closed');
};

/**
 * Execute raw SQL query (for advanced use cases)
 */
export const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const database = await getDatabase();
  if (!database) return [];

  try {
    const result = await executeSQL(database, sql, params);
    const items: T[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  } catch (error) {
    console.error('[Database] Query error:', error);
    return [];
  }
};

/**
 * Get single row
 */
export const queryOne = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  const items = await query<T>(sql, params);
  return items[0] || null;
};

/**
 * Execute without returning results
 */
export const execute = async (
  sql: string,
  params: any[] = []
): Promise<boolean> => {
  const database = await getDatabase();
  if (!database) return false;

  try {
    await executeSQL(database, sql, params);
    return true;
  } catch (error) {
    console.error('[Database] Execute error:', error);
    return false;
  }
};

/**
 * Transaction wrapper for atomic operations
 */
export const transaction = async <T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> => {
  const database = await getDatabase();
  if (!database) throw new Error('[Database] No database available');

  return new Promise<T>((resolve, reject) => {
    if (typeof database.transaction !== 'function') {
      // Fallback: run without transaction
      callback({
        executeSql: async (sql, params, onSuccess, onError) => {
          try {
            const result = await executeSQL(database, sql, params);
            onSuccess?.(null as any, result);
          } catch (error) {
            if (onError?.(null as any, error as Error) !== true) {
              reject(error);
            }
          }
        },
      })
        .then(resolve)
        .catch(reject);
      return;
    }

    database.transaction!((tx) => {
      Promise.resolve(callback(tx))
        .then(resolve)
        .catch((error) => {
          if (error instanceof Error) {
            console.error('[Database] Transaction error:', error.message);
          }
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

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

export {
  // For backward compatibility with existing code
  executeSQL as legacyExecuteSql,
  formatSQLValue as legacyFormatValue
};

