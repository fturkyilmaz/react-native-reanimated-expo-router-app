// @ts-nocheck - Expo SQLite has complex types
import { Platform } from 'react-native';

// Dynamic import to avoid SSR issues
let SQLiteModule: any = null;

const DB_NAME = 'cinesearch.db';

let db: any = null;
let isInitialized = false;
let useSyncAPI = false;

// Database version for migrations
export const CURRENT_DB_VERSION = 1;

// Load SQLite module - expo-sqlite exports functions as named exports
const loadSQLite = async () => {
  if (SQLiteModule) return SQLiteModule;
  try {
    const expoSQLite = require('expo-sqlite');
    // Newer versions of expo-sqlite export functions as named exports
    SQLiteModule = {
      openDatabase: expoSQLite.openDatabaseAsync || expoSQLite.openDatabaseSync || expoSQLite.openDatabase,
      openDatabaseSync: expoSQLite.openDatabaseSync,
      openDatabaseAsync: expoSQLite.openDatabaseAsync,
    };
    console.log('[SQLite] Loaded module, available APIs:', Object.keys(expoSQLite));
    return SQLiteModule;
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
    // Prefer sync API when available (avoids missing transaction in async API)
    if (typeof sqlite.openDatabaseSync === 'function') {
      db = sqlite.openDatabaseSync(DB_NAME);
      useSyncAPI = true;
      console.log('[SQLite] Using sync API (openDatabaseSync)');

      // Polyfill transaction for code paths expecting it
      if (typeof db.transaction !== 'function' && typeof db.execSync === 'function') {
        db.transaction = (callback: any) => {
          const tx = {
            executeSql: (sql: string, params: any[] = [], onSuccess?: any, onError?: any) => {
              try {
                const interpolated = sql.replace(/\?/g, () => {
                  const value = params.shift();
                  if (value === null || value === undefined) return 'NULL';
                  if (typeof value === 'number') return `${value}`;
                  return `'${String(value).replace(/'/g, "''")}'`;
                });
                const result = db.execSync(interpolated);
                const first = Array.isArray(result) ? result[0] : result;
                const rawRows = first?.rows ?? [];
                const rowsArray = Array.isArray(rawRows) ? rawRows : [];
                const isWrite = /^\s*(insert|update|delete)/i.test(sql);
                const normalized = {
                  ...first,
                  insertId: isWrite ? 1 : first?.insertId,
                  rowsAffected: isWrite ? 1 : first?.rowsAffected,
                  rows: {
                    length: rowsArray.length,
                    item: (i: number) => rowsArray[i],
                  },
                };
                onSuccess && onSuccess(tx, normalized);
              } catch (e) {
                if (onError) {
                  onError(tx, e);
                }
              }
            },
          };
          callback(tx);
        };
      }
    } else if (typeof sqlite.openDatabaseAsync === 'function') {
      db = await sqlite.openDatabaseAsync(DB_NAME);
      useSyncAPI = false;
      console.log('[SQLite] Using async API (openDatabaseAsync)');

      if (typeof db.transaction !== 'function' && typeof db.execAsync === 'function') {
        db.transaction = (callback: any) => {
          const tx = {
            executeSql: async (sql: string, params: any[] = [], onSuccess?: any, onError?: any) => {
              try {
                const interpolated = sql.replace(/\?/g, () => {
                  const value = params.shift();
                  if (value === null || value === undefined) return 'NULL';
                  if (typeof value === 'number') return `${value}`;
                  return `'${String(value).replace(/'/g, "''")}'`;
                });
                const result = await db.execAsync(interpolated);
                const first = Array.isArray(result) ? result[0] : result;
                const rawRows = first?.rows ?? [];
                const rowsArray = Array.isArray(rawRows) ? rawRows : [];
                const isWrite = /^\s*(insert|update|delete)/i.test(sql);
                const normalized = {
                  ...first,
                  insertId: isWrite ? 1 : first?.insertId,
                  rowsAffected: isWrite ? 1 : first?.rowsAffected,
                  rows: {
                    length: rowsArray.length,
                    item: (i: number) => rowsArray[i],
                  },
                };
                onSuccess && onSuccess(tx, normalized);
              } catch (e) {
                if (onError) {
                  onError(tx, e);
                }
              }
            },
          };
          callback(tx);
        };
      }
    } else if (typeof sqlite.openDatabase === 'function') {
      db = sqlite.openDatabase(DB_NAME);
      useSyncAPI = false;
      console.log('[SQLite] Using async API (openDatabase)');
    } else if (Platform.OS === 'web') {
      console.warn('[SQLite] Not supported on web');
      return null;
    } else {
      console.error('[SQLite] No SQLite API found');
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
    try {
      if (typeof database.getFirstAsync === 'function') {
        const row = await database.getFirstAsync('PRAGMA user_version;');
        return row?.user_version ?? 0;
      }
      if (typeof database.execAsync === 'function') {
        const result = await database.execAsync('PRAGMA user_version;');
        if (result && result[0]?.rows?.length) {
          return result[0].rows[0].user_version ?? 0;
        }
      }
      return await new Promise((resolve) => {
        database.transaction((tx: any) => {
          tx.executeSql(
            'PRAGMA user_version;',
            [],
            (_, result) => {
              if (result.rows.length > 0) {
                resolve(result.rows.item(0).user_version);
              } else {
                resolve(0);
              }
            },
            (_, error) => {
              console.error('[SQLite] Error getting version:', error);
              resolve(0);
              return true;
            }
          );
        });
      });
    } catch (e) {
      console.error('[SQLite] Error getting version (async):', e);
      return 0;
    }
  }
};

// Initialize database with schema
export const initializeDatabase = async (): Promise<void> => {
  const database = await getDatabase();
  if (!database) {
    console.error('[SQLite] Cannot initialize - database not available');
    return;
  }

  if (isInitialized) {
    console.log('[SQLite] Database already initialized');
    return;
  }

  const version = await getDatabaseVersion();
  console.log('[SQLite] Current database version:', version);

  try {
    if (useSyncAPI) {
      database.execSync(`
        PRAGMA user_version = ${CURRENT_DB_VERSION};
        
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          overview TEXT,
          poster_path TEXT,
          backdrop_path TEXT,
          release_date TEXT,
          vote_average REAL DEFAULT 0,
          genre_ids TEXT,
          updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          movie_id INTEGER NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'local',
          synced INTEGER DEFAULT 1,
          created_at INTEGER,
          UNIQUE(movie_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS watchlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          movie_id INTEGER NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'local',
          synced INTEGER DEFAULT 1,
          created_at INTEGER,
          UNIQUE(movie_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          movie_id INTEGER NOT NULL,
          operation TEXT NOT NULL,
          created_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          phone TEXT,
          bio TEXT,
          token TEXT NOT NULL,
          updated_at INTEGER
        );
      `);
      console.log('[SQLite] Migrations completed (sync)');
    } else {
      const statements = [
        `PRAGMA user_version = ${CURRENT_DB_VERSION};`,
        `CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          overview TEXT,
          poster_path TEXT,
          backdrop_path TEXT,
          release_date TEXT,
          vote_average REAL DEFAULT 0,
          genre_ids TEXT,
          updated_at INTEGER
        );`,
        `CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          movie_id INTEGER NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'local',
          synced INTEGER DEFAULT 1,
          created_at INTEGER,
          UNIQUE(movie_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS watchlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          movie_id INTEGER NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'local',
          synced INTEGER DEFAULT 1,
          created_at INTEGER,
          UNIQUE(movie_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          movie_id INTEGER NOT NULL,
          operation TEXT NOT NULL,
          created_at INTEGER
        );`,
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          phone TEXT,
          bio TEXT,
          token TEXT NOT NULL,
          updated_at INTEGER
        )`,
      ];

      if (typeof database.execAsync === 'function') {
        for (const stmt of statements) {
          await database.execAsync(stmt);
        }
        console.log('[SQLite] Migrations completed (execAsync)');
        isInitialized = true;
        return;
      }

      return new Promise((resolve) => {
        database.transaction((tx: any) => {
          statements.forEach((stmt) => tx.executeSql(stmt));
        }, (error: any) => {
          console.error('[SQLite] Transaction error:', error);
          isInitialized = false;
          resolve();
        }, () => {
          console.log('[SQLite] Migrations completed');
          isInitialized = true;
          resolve();
        });
      });
    }
    isInitialized = true;
  } catch (e) {
    console.error('[SQLite] Migration error:', e);
    isInitialized = false;
  }
};

// Reset database (useful for testing)
export const resetDatabase = async (): Promise<void> => {
  db = null;
  isInitialized = false;
  SQLiteModule = null;
  console.log('[SQLite] Database reset');
};
