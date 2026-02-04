// @ts-nocheck
import { getDatabase } from '../db/database';

// Movie CRUD operations
export const MovieService = {
    upsert: async (movie) => {
        const db = await getDatabase();
        if (!db) return null;

        const sql = `INSERT OR REPLACE INTO movies (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
                 VALUES (${movie.id}, '${movie.title.replace(/'/g, "''")}', '${(movie.overview || '').replace(/'/g, "''")}', '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movie.release_date || ''}', ${movie.vote_average || 0}, '${JSON.stringify(movie.genre_ids || [])}', strftime('%s', 'now'))`;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(sql);
                return true;
            } catch (e) {
                console.error('[MovieService] Error upserting (sync):', e);
                return null;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `INSERT OR REPLACE INTO movies (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
                        [movie.id, movie.title, movie.overview, movie.poster_path, movie.backdrop_path, movie.release_date, movie.vote_average, JSON.stringify(movie.genre_ids || [])],
                        (_, result) => resolve(result),
                        (_, error) => {
                            console.error('[MovieService] Error upserting:', error);
                            resolve(null);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getById: async (id) => {
        const db = await getDatabase();
        if (!db) return null;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM movies WHERE id = ${id}`);
                if (result && result.length > 0 && result[0].rows && result[0].rows.length > 0) {
                    const movie = result[0].rows[0];
                    try {
                        movie.genre_ids = JSON.parse(movie.genre_ids || '[]');
                    } catch { }
                    return movie;
                }
                return null;
            } catch (e) {
                console.error('[MovieService] Error getting by ID (sync):', e);
                return null;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        'SELECT * FROM movies WHERE id = ?',
                        [id],
                        (_, result) => {
                            const rows = result.rows;
                            if (rows.length > 0) {
                                const movie = rows.item(0);
                                try {
                                    movie.genre_ids = JSON.parse(movie.genre_ids || '[]');
                                } catch { }
                                resolve(movie);
                            } else {
                                resolve(null);
                            }
                        },
                        (_, error) => {
                            console.error('[MovieService] Error getting by ID:', error);
                            resolve(null);
                            return true;
                        }
                    );
                });
            });
        }
    },

    search: async (query, limit = 20) => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM movies WHERE title LIKE '%${query.replace(/'/g, "''")}%' ORDER BY vote_average DESC LIMIT ${limit}`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows.map((movie: any) => {
                        try {
                            movie.genre_ids = JSON.parse(movie.genre_ids || '[]');
                        } catch { }
                        return movie;
                    });
                }
                return [];
            } catch (e) {
                console.error('[MovieService] Error searching (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM movies WHERE title LIKE ? ORDER BY vote_average DESC LIMIT ?`,
                        [`%${query}%`, limit],
                        (_, result) => {
                            const movies = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                const movie = result.rows.item(i);
                                try {
                                    movie.genre_ids = JSON.parse(movie.genre_ids || '[]');
                                } catch { }
                                movies.push(movie);
                            }
                            resolve(movies);
                        },
                        (_, error) => {
                            console.error('[MovieService] Error searching:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },
};

// Favorites operations
export const FavoritesService = {
    add: async (movieId, userId = 'local') => {
        const db = await getDatabase();
        if (!db) return false;

        // First ensure movie exists
        await MovieService.upsert({ id: movieId, title: '', overview: '', poster_path: null, backdrop_path: null, release_date: '', vote_average: 0, genre_ids: [] });

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`INSERT INTO favorites (movie_id, user_id, synced) VALUES (${movieId}, '${userId}', 0)`);
                return true;
            } catch (e) {
                console.error('[FavoritesService] Error adding (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `INSERT INTO favorites (movie_id, user_id, synced) VALUES (?, ?, 0)`,
                        [movieId, userId],
                        (_, result) => resolve(result.insertId > 0),
                        (_, error) => {
                            console.error('[FavoritesService] Error adding:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    remove: async (movieId) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`DELETE FROM favorites WHERE movie_id = ${movieId}`);
                return true;
            } catch (e) {
                console.error('[FavoritesService] Error removing (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `DELETE FROM favorites WHERE movie_id = ?`,
                        [movieId],
                        (_, result) => resolve(result.rowsAffected > 0),
                        (_, error) => {
                            console.error('[FavoritesService] Error removing:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getAll: async (userId = 'local') => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT m.*, f.id as favorite_id, f.created_at as added_at FROM movies m INNER JOIN favorites f ON m.id = f.movie_id WHERE f.user_id = '${userId}' ORDER BY f.created_at DESC`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows.map((row: any) => {
                        try {
                            row.genre_ids = JSON.parse(row.genre_ids || '[]');
                        } catch { }
                        return row;
                    });
                }
                return [];
            } catch (e) {
                console.error('[FavoritesService] Error getting all (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT m.*, f.id as favorite_id, f.created_at as added_at FROM movies m INNER JOIN favorites f ON m.id = f.movie_id WHERE f.user_id = ? ORDER BY f.created_at DESC`,
                        [userId],
                        (_, result) => {
                            const movies = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                const row = result.rows.item(i);
                                try {
                                    row.genre_ids = JSON.parse(row.genre_ids || '[]');
                                } catch { }
                                movies.push(row);
                            }
                            resolve(movies);
                        },
                        (_, error) => {
                            console.error('[FavoritesService] Error getting all:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },

    isFavorite: async (movieId, userId = 'local') => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT id FROM favorites WHERE movie_id = ${movieId} AND user_id = '${userId}'`);
                return result && result.length > 0 && result[0].rows && result[0].rows.length > 0;
            } catch (e) {
                console.error('[FavoritesService] Error checking (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT id FROM favorites WHERE movie_id = ? AND user_id = ?`,
                        [movieId, userId],
                        (_, result) => resolve(result.rows.length > 0),
                        (_, error) => {
                            console.error('[FavoritesService] Error checking:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getUnsynced: async () => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM favorites WHERE synced = 0`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows;
                }
                return [];
            } catch (e) {
                console.error('[FavoritesService] Error getting unsynced (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM favorites WHERE synced = 0`,
                        [],
                        (_, result) => {
                            const items = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                items.push(result.rows.item(i));
                            }
                            resolve(items);
                        },
                        (_, error) => {
                            console.error('[FavoritesService] Error getting unsynced:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },

    markSynced: async (id) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`UPDATE favorites SET synced = 1 WHERE id = ${id}`);
                return true;
            } catch (e) {
                console.error('[FavoritesService] Error marking synced (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `UPDATE favorites SET synced = 1 WHERE id = ?`,
                        [id],
                        (_, result) => resolve(result.rowsAffected > 0),
                        () => resolve(false)
                    );
                });
            });
        }
    },
};

// Watchlist operations
export const WatchlistService = {
    add: async (movieId, userId = 'local') => {
        const db = await getDatabase();
        if (!db) return false;

        await MovieService.upsert({ id: movieId, title: '', overview: '', poster_path: null, backdrop_path: null, release_date: '', vote_average: 0, genre_ids: [] });

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`INSERT INTO watchlist (movie_id, user_id, synced) VALUES (${movieId}, '${userId}', 0)`);
                return true;
            } catch (e) {
                console.error('[WatchlistService] Error adding (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `INSERT INTO watchlist (movie_id, user_id, synced) VALUES (?, ?, 0)`,
                        [movieId, userId],
                        (_, result) => resolve(result.insertId > 0),
                        (_, error) => {
                            console.error('[WatchlistService] Error adding:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    remove: async (movieId) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`DELETE FROM watchlist WHERE movie_id = ${movieId}`);
                return true;
            } catch (e) {
                console.error('[WatchlistService] Error removing (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `DELETE FROM watchlist WHERE movie_id = ?`,
                        [movieId],
                        (_, result) => resolve(result.rowsAffected > 0),
                        (_, error) => {
                            console.error('[WatchlistService] Error removing:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getAll: async (userId = 'local') => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT m.*, w.id as watchlist_id, w.added_at FROM movies m INNER JOIN watchlist w ON m.id = w.movie_id WHERE w.user_id = '${userId}' ORDER BY w.added_at DESC`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows.map((row: any) => {
                        try {
                            row.genre_ids = JSON.parse(row.genre_ids || '[]');
                        } catch { }
                        return row;
                    });
                }
                return [];
            } catch (e) {
                console.error('[WatchlistService] Error getting all (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT m.*, w.id as watchlist_id, w.added_at FROM movies m INNER JOIN watchlist w ON m.id = w.movie_id WHERE w.user_id = ? ORDER BY w.added_at DESC`,
                        [userId],
                        (_, result) => {
                            const movies = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                const row = result.rows.item(i);
                                try {
                                    row.genre_ids = JSON.parse(row.genre_ids || '[]');
                                } catch { }
                                movies.push(row);
                            }
                            resolve(movies);
                        },
                        (_, error) => {
                            console.error('[WatchlistService] Error getting all:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },

    isInWatchlist: async (movieId, userId = 'local') => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT id FROM watchlist WHERE movie_id = ${movieId} AND user_id = '${userId}'`);
                return result && result.length > 0 && result[0].rows && result[0].rows.length > 0;
            } catch (e) {
                console.error('[WatchlistService] Error checking (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT id FROM watchlist WHERE movie_id = ? AND user_id = ?`,
                        [movieId, userId],
                        (_, result) => resolve(result.rows.length > 0),
                        (_, error) => {
                            console.error('[WatchlistService] Error checking:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getUnsynced: async () => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM watchlist WHERE synced = 0`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows;
                }
                return [];
            } catch (e) {
                console.error('[WatchlistService] Error getting unsynced (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM watchlist WHERE synced = 0`,
                        [],
                        (_, result) => {
                            const items = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                items.push(result.rows.item(i));
                            }
                            resolve(items);
                        },
                        (_, error) => {
                            console.error('[WatchlistService] Error getting unsynced:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },

    markSynced: async (id) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`UPDATE watchlist SET synced = 1 WHERE id = ${id}`);
                return true;
            } catch (e) {
                console.error('[WatchlistService] Error marking synced (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `UPDATE watchlist SET synced = 1 WHERE id = ?`,
                        [id],
                        (_, result) => resolve(result.rowsAffected > 0),
                        () => resolve(false)
                    );
                });
            });
        }
    },
};

// User operations
export const UserService = {
    upsert: async (user) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`INSERT OR REPLACE INTO users (id, email, name, avatar_url, token, updated_at) VALUES ('${user.id}', '${user.email}', '${(user.name || '').replace(/'/g, "''")}', '${user.avatar_url || ''}', '${user.token}', strftime('%s', 'now'))`);
                return true;
            } catch (e) {
                console.error('[UserService] Error upserting (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `INSERT OR REPLACE INTO users (id, email, name, avatar_url, token, updated_at) VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))`,
                        [user.id, user.email, user.name, user.avatar_url, user.token],
                        () => resolve(true),
                        (_, error) => {
                            console.error('[UserService] Error upserting:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getById: async (id) => {
        const db = await getDatabase();
        if (!db) return null;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM users WHERE id = '${id}'`);
                if (result && result.length > 0 && result[0].rows && result[0].rows.length > 0) {
                    return result[0].rows[0];
                }
                return null;
            } catch (e) {
                console.error('[UserService] Error getting by ID (sync):', e);
                return null;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM users WHERE id = ?`,
                        [id],
                        (_, result) => {
                            const row = result.rows.item(0);
                            resolve(row || null);
                        },
                        (_, error) => {
                            console.error('[UserService] Error getting by ID:', error);
                            resolve(null);
                            return true;
                        }
                    );
                });
            });
        }
    },

    delete: async (id) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`DELETE FROM users WHERE id = '${id}'`);
                return true;
            } catch (e) {
                console.error('[UserService] Error deleting (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `DELETE FROM users WHERE id = ?`,
                        [id],
                        () => resolve(true),
                        () => resolve(false)
                    );
                });
            });
        }
    },

    getCurrentUser: async () => {
        const db = await getDatabase();
        if (!db) return null;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM users ORDER BY updated_at DESC LIMIT 1`);
                if (result && result.length > 0 && result[0].rows && result[0].rows.length > 0) {
                    return result[0].rows[0];
                }
                return null;
            } catch (e) {
                console.error('[UserService] Error getting current user (sync):', e);
                return null;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM users ORDER BY updated_at DESC LIMIT 1`,
                        [],
                        (_, result) => {
                            const row = result.rows.item(0);
                            resolve(row || null);
                        },
                        (_, error) => {
                            console.error('[UserService] Error getting current user:', error);
                            resolve(null);
                            return true;
                        }
                    );
                });
            });
        }
    },
};

// Sync queue operations
export const SyncQueueService = {
    add: async (tableName, recordId, action) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`INSERT INTO sync_queue (table_name, record_id, action) VALUES ('${tableName}', ${recordId}, '${action}')`);
                return true;
            } catch (e) {
                console.error('[SyncQueueService] Error adding (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `INSERT INTO sync_queue (table_name, record_id, action) VALUES (?, ?, ?)`,
                        [tableName, recordId, action],
                        () => resolve(true),
                        (_, error) => {
                            console.error('[SyncQueueService] Error adding:', error);
                            resolve(false);
                            return true;
                        }
                    );
                });
            });
        }
    },

    getAll: async () => {
        const db = await getDatabase();
        if (!db) return [];

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                const result = db.execSync(`SELECT * FROM sync_queue ORDER BY created_at ASC`);
                if (result && result.length > 0 && result[0].rows) {
                    return result[0].rows;
                }
                return [];
            } catch (e) {
                console.error('[SyncQueueService] Error getting all (sync):', e);
                return [];
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `SELECT * FROM sync_queue ORDER BY created_at ASC`,
                        [],
                        (_, result) => {
                            const items = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                items.push(result.rows.item(i));
                            }
                            resolve(items);
                        },
                        (_, error) => {
                            console.error('[SyncQueueService] Error getting all:', error);
                            resolve([]);
                            return true;
                        }
                    );
                });
            });
        }
    },

    remove: async (id) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`DELETE FROM sync_queue WHERE id = ${id}`);
                return true;
            } catch (e) {
                console.error('[SyncQueueService] Error removing (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `DELETE FROM sync_queue WHERE id = ?`,
                        [id],
                        () => resolve(true),
                        () => resolve(false)
                    );
                });
            });
        }
    },

    incrementRetry: async (id) => {
        const db = await getDatabase();
        if (!db) return false;

        const isSync = typeof db.execSync === 'function';

        if (isSync) {
            try {
                db.execSync(`UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ${id}`);
                return true;
            } catch (e) {
                console.error('[SyncQueueService] Error incrementing retry (sync):', e);
                return false;
            }
        } else {
            return new Promise((resolve) => {
                db.transaction((tx) => {
                    tx.executeSql(
                        `UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`,
                        [id],
                        (_, result) => resolve(result.rowsAffected > 0),
                        () => resolve(false)
                    );
                });
            });
        }
    },
};

export const LocalDBService = {
    MovieService,
    FavoritesService,
    WatchlistService,
    UserService,
    SyncQueueService,
};
