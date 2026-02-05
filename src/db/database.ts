// @ts-nocheck
import { Platform } from 'react-native';

let SQLiteModule: any = null;

const DB_NAME = 'cinesearch.db';
export const CURRENT_DB_VERSION = 2;

let db: any = null;
let isInitialized = false;
let useSyncAPI = false;

/* -------------------------------------------------- */
/* LOAD SQLITE                                        */
/* -------------------------------------------------- */
const loadSQLite = async () => {
  if (SQLiteModule) return SQLiteModule;

  const expoSQLite = require('expo-sqlite');
  SQLiteModule = {
    openDatabaseSync: expoSQLite.openDatabaseSync,
    openDatabaseAsync: expoSQLite.openDatabaseAsync,
    openDatabase: expoSQLite.openDatabase,
  };

  console.log('[SQLite] Loaded:', Object.keys(expoSQLite));
  return SQLiteModule;
};

/* -------------------------------------------------- */
/* OPEN DATABASE                                      */
/* -------------------------------------------------- */
export const getDatabase = async (): Promise<any> => {
  if (db) return db;

  const sqlite = await loadSQLite();
  if (!sqlite) return null;

  try {
    /* -------------------- SYNC API -------------------- */
    if (typeof sqlite.openDatabaseSync === 'function') {
      db = sqlite.openDatabaseSync(DB_NAME);
      useSyncAPI = true;
      console.log('[SQLite] Using sync API (openDatabaseSync)');

      // 🔧 TRANSACTION POLYFILL (CRITICAL)
      if (typeof db.transaction !== 'function') {
        db.transaction = (callback: any) => {
          const tx = {
            executeSql: (
              sql: string,
              params: any[] = [],
              onSuccess?: any,
              onError?: any
            ) => {
              try {
                const interpolated = sql.replace(/\?/g, () => {
                  const value = params.shift();
                  if (value === null || value === undefined) return 'NULL';
                  if (typeof value === 'number') return `${value}`;
                  return `'${String(value).replace(/'/g, "''")}'`;
                });

                const result = db.execSync(interpolated);
                const first = Array.isArray(result) ? result[0] : result;
                const rowsArray = first?.rows ?? [];

                onSuccess?.(tx, {
                  rows: {
                    length: rowsArray.length,
                    item: (i: number) => rowsArray[i],
                  },
                  rowsAffected: first?.rowsAffected ?? 0,
                  insertId: first?.insertId,
                });
              } catch (e) {
                onError?.(tx, e);
              }
            },
          };

          callback(tx);
        };

        console.log('[SQLite] transaction polyfilled (sync)');
      }

      return db;
    }

    /* -------------------- ASYNC API -------------------- */
    if (typeof sqlite.openDatabaseAsync === 'function') {
      db = await sqlite.openDatabaseAsync(DB_NAME);
      useSyncAPI = false;
      console.log('[SQLite] Using async API (openDatabaseAsync)');

      if (typeof db.transaction !== 'function' && typeof db.execAsync === 'function') {
        db.transaction = (callback: any) => {
          const tx = {
            executeSql: async (
              sql: string,
              params: any[] = [],
              onSuccess?: any,
              onError?: any
            ) => {
              try {
                const interpolated = sql.replace(/\?/g, () => {
                  const value = params.shift();
                  if (value === null || value === undefined) return 'NULL';
                  if (typeof value === 'number') return `${value}`;
                  return `'${String(value).replace(/'/g, "''")}'`;
                });

                const result = await db.execAsync(interpolated);
                const first = Array.isArray(result) ? result[0] : result;
                const rowsArray = first?.rows ?? [];

                onSuccess?.(tx, {
                  rows: {
                    length: rowsArray.length,
                    item: (i: number) => rowsArray[i],
                  },
                  rowsAffected: first?.rowsAffected ?? 0,
                  insertId: first?.insertId,
                });
              } catch (e) {
                onError?.(tx, e);
              }
            },
          };

          callback(tx);
        };

        console.log('[SQLite] transaction polyfilled (async)');
      }

      return db;
    }

    /* -------------------- LEGACY API -------------------- */
    if (typeof sqlite.openDatabase === 'function') {
      db = sqlite.openDatabase(DB_NAME);
      useSyncAPI = false;
      console.log('[SQLite] Using legacy API');
      return db;
    }

    /* -------------------- WEB -------------------- */
    if (Platform.OS === 'web') {
      console.warn('[SQLite] SQLite not supported on web');
      return null;
    }

    throw new Error('[SQLite] No compatible SQLite API found');
  } catch (e) {
    console.error('[SQLite] Failed to open database:', e);
    return null;
  }
};


/* -------------------------------------------------- */
/* GET VERSION                                        */
/* -------------------------------------------------- */
const getDatabaseVersion = async (): Promise<number> => {
  const database = await getDatabase();
  if (!database) return 0;

  try {
    if (useSyncAPI) {
      const r = database.execSync('PRAGMA user_version;');
      return r?.[0]?.rows?.[0]?.user_version ?? 0;
    }

    if (database.getFirstAsync) {
      const row = await database.getFirstAsync('PRAGMA user_version;');
      return row?.user_version ?? 0;
    }

    return await new Promise((resolve) => {
      database.transaction((tx) => {
        tx.executeSql(
          'PRAGMA user_version;',
          [],
          (_, r) => resolve(r.rows.item(0)?.user_version ?? 0),
          () => resolve(0)
        );
      });
    });
  } catch {
    return 0;
  }
};

/* -------------------------------------------------- */
/* EXEC HELPER                                        */
/* -------------------------------------------------- */
const exec = async (database: any, sql: string) => {
  if (useSyncAPI) {
    database.execSync(sql);
  } else if (database.execAsync) {
    await database.execAsync(sql);
  } else {
    await new Promise<void>((resolve, reject) => {
      database.transaction((tx) => {
        tx.executeSql(sql, [], () => resolve(), (_, e) => reject(e));
      });
    });
  }
};

/* -------------------------------------------------- */
/* MIGRATIONS                                        */
/* -------------------------------------------------- */
const migrate = async (database: any, fromVersion: number) => {
  console.log('[SQLite] Migrating from', fromVersion);

  // v0 → v1
  if (fromVersion < 1) {
    await exec(database, `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        bio TEXT,
        token TEXT NOT NULL,
        updated_at INTEGER
      );
    `);
  }

  // v1 → v2 (avatar EKLENİR)
  if (fromVersion < 2) {
    try {
      await exec(database, `ALTER TABLE users ADD COLUMN avatar TEXT;`);
    } catch {
      // column exists → ignore
    }
  }

  await exec(database, `PRAGMA user_version = ${CURRENT_DB_VERSION};`);
};

/* -------------------------------------------------- */
/* INITIALIZE                                        */
/* -------------------------------------------------- */
export const initializeDatabase = async () => {
  if (isInitialized) return;

  const database = await getDatabase();
  if (!database) return;

  const version = await getDatabaseVersion();
  console.log('[SQLite] Version:', version);

  await migrate(database, version);

  isInitialized = true;
  console.log('[SQLite] Ready');
};

/* -------------------------------------------------- */
/* RESET (DEV)                                       */
/* -------------------------------------------------- */
export const resetDatabase = async () => {
  db = null;
  SQLiteModule = null;
  isInitialized = false;
  console.log('[SQLite] Reset');
};
