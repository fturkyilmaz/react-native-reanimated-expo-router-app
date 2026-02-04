// @ts-nocheck - Expo SQLite has complex types
import { Platform } from 'react-native';

// Dynamic import to avoid SSR issues
let SQLite: any = null;

const DB_NAME = 'cinesearch.db';

let db: any = null;
let isInitialized = false;
let useSyncAPI = false;

// Database version for migrations
export const CURRENT_DB_VERSION = 1;

// Load SQLite module
const loadSQLite = async () => {
  if (SQLite) return SQLite;
  try {
    SQLite = require('expo-sqlite');
    return SQLite;
  } catch (e) {
    console.error('Failed to load SQLite module:', e);
    return null;
  }
};

// Get database - ensures it's initialized
export const getDatabase = async (): Promise<any> => {
  if (db) return db;

  const sqlite = await loadSQLite();
  if (!sqlite) return null;

  try {
    // Try sync API first (openDatabaseSync) - preferred for React Native
    if (typeof sqlite.openDatabaseSync === 'function') {
      db = sqlite.openDatabaseSync(DB_NAME);
      useSyncAPI = true;
      console.log('[SQLite] Using sync API (openDatabaseSync)');
    } else if (typeof sqlite.openDatabase === 'function') {
      db = sqlite.openDatabase(DB_NAME);
      useSyncAPI = false;
      console.log('[SQLite] Using async API (openDatabase)');
    } else if (Platform.OS === 'web') {
      console.warn('[SQLite] Not supported on web');
      return null;
    } else {
      console.error('[SQLite] No SQLite API found:', Object.keys(sqlite));
      return null;
    }
    return db;
  } catch (e) {
    console.error('[SQLite] Failed to open database:', e);
    return null;
  }
};

// Get database version
export const getDatabaseVersion = async (): Promise<number> => {
  const database = await getDatabase();
  if (!database) return 0;

  if (useSyncAPI) {
    try {
      const result = database.execSync('PRAGMA user_version;');
      if (result && result.length > 0 && result[0].rows && result[0].rows.length > 0) {
        return result[0].rows[0].user_version;
      }
    } catch (e) {
      console.error('[SQLite] Error getting version (sync):', e);
    }
    return 0;
  } else {
    return new Promise((resolve) => {
      try {
        database.transaction((tx: any) => {
          tx.executeSql(
            'PRAGMA user_version;',
            [],
            (_: any, result: any) => {
              const rows = result.rows;
              if (rows.length > 0) {
                resolve(rows.item(0).user_version);
              } else {
                resolve(0);
              }
            },
            () => {
              resolve(0);
              return true;
            }
          );
        });
      } catch {
        resolve(0);
      }
    });
  }
};

// Initialize database with migrations
export const initializeDatabase = async (): Promise<boolean> => {
  if (isInitialized) return true;

  const currentVersion = await getDatabaseVersion();
  const database = await getDatabase();

  if (!database) {
    console.error('[SQLite] Database not available');
    return false;
  }

  // Drop existing tables to start fresh (for development)
  // In production, you'd want proper migration logic
  const dropTables = `
    DROP TABLE IF EXISTS movies;
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS watchlist;
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS users;
  `;

  // Create tables
  const createTables = `
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      genre_ids TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    );
    
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      user_id TEXT,
      added_at INTEGER DEFAULT (strftime('%s', 'now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    );
    
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      retry_count INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      avatar_url TEXT,
      token TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `;

  const dropStatements = dropTables.split(';').filter(s => s.trim());
  const createStatements = createTables.split(';').filter(s => s.trim());

  // Use Sync API
  if (useSyncAPI) {
    console.log('[SQLite] Running migrations with sync API');
    try {
      // Drop existing tables (to start fresh with correct schema)
      for (const statement of dropStatements) {
        try {
          database.execSync(statement.trim());
        } catch (e) {
          // Ignore errors
        }
      }

      // Create tables
      for (const statement of createStatements) {
        database.execSync(statement.trim());
      }

      if (currentVersion === 0) {
        database.execSync(`PRAGMA user_version = ${CURRENT_DB_VERSION};`);
      }

      isInitialized = true;
      console.log('[SQLite] Migrations completed (sync)');
      return true;
    } catch (error) {
      console.error('[SQLite] Migration error (sync):', error);
      return false;
    }
  }
  // Use Async API
  else {
    console.log('[SQLite] Running migrations with async API');
    return new Promise((resolve, reject) => {
      try {
        database.transaction((tx: any) => {
          // Drop existing tables
          for (const statement of dropStatements) {
            tx.executeSql(statement.trim(), [], () => { }, (err: any) => true);
          }

          // Create tables
          for (const statement of createStatements) {
            tx.executeSql(statement.trim(), [], () => { }, (err: any) => {
              console.error('[SQLite] Create table error:', err);
              return true;
            });
          }

          if (currentVersion === 0) {
            tx.executeSql(
              `PRAGMA user_version = ${CURRENT_DB_VERSION};`,
              [],
              () => { },
              () => true
            );
          }
        },
          (error: any) => {
            console.error('[SQLite] Migration error (async):', error);
            reject(error);
          },
          () => {
            isInitialized = true;
            console.log('[SQLite] Migrations completed (async)');
            resolve(true);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
};

export const deleteDatabase = async (): Promise<void> => {
  try {
    const sqlite = await loadSQLite();
    if (sqlite && typeof sqlite.deleteDatabase === 'function') {
      sqlite.deleteDatabase(DB_NAME);
    }
    db = null;
    isInitialized = false;
    useSyncAPI = false;
  } catch (e) {
    console.error('[SQLite] Failed to delete database:', e);
  }
};

// Database info for debugging
export const getDatabaseInfo = async (): Promise<{ name: string; version: number; initialized: boolean; api: string }> => {
  const version = await getDatabaseVersion();
  return {
    name: DB_NAME,
    version,
    initialized: isInitialized,
    api: useSyncAPI ? 'sync' : 'async',
  };
};
