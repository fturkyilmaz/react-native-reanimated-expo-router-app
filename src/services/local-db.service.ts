// @ts-nocheck
import { getDatabase } from '../db/database';

// Movie CRUD operations
export const MovieService = {
    upsert: async (movie) => {
        console.log('[DEBUG-MovieService] upsert called for movie.id:', movie.id);
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-MovieService] Database not available');
            return null;
        }

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `INSERT OR REPLACE INTO movies (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
                    [movie.id, movie.title, movie.overview, movie.poster_path, movie.backdrop_path, movie.release_date, movie.vote_average, JSON.stringify(movie.genre_ids || [])],
                    (_, result) => {
                        console.log('[DEBUG-MovieService] upsert success, insertId:', result.insertId);
                        resolve(result);
                    },
                    (_, error) => {
                        console.error('[DEBUG-MovieService] Error upserting:', error);
                        resolve(null);
                        return true;
                    }
                );
            });
        });
    },

    getById: async (id) => {
        const db = await getDatabase();
        if (!db) return null;

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
                        console.error('[DEBUG-MovieService] Error getting by ID:', error);
                        resolve(null);
                        return true;
                    }
                );
            });
        });
    },

    search: async (query, limit = 20) => {
        const db = await getDatabase();
        if (!db) return [];

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
                        console.error('[DEBUG-MovieService] Error searching:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },
};

// Favorites operations
export const FavoritesService = {
    add: async (movieId, userId = 'local', isOnline = true) => {
        console.log('[DEBUG-FavoritesService] add called for movieId:', movieId, 'userId:', userId);
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-FavoritesService] Database not available');
            return false;
        }

        // First ensure movie exists in movies table
        const movieExists = await MovieService.getById(movieId);
        console.log('[DEBUG-FavoritesService] movieExists:', !!movieExists);
        if (!movieExists) {
            await MovieService.upsert({
                id: movieId,
                title: `Movie ${movieId}`,
                overview: '',
                poster_path: null,
                backdrop_path: null,
                release_date: '',
                vote_average: 0,
                genre_ids: []
            });
        }

        // Check if already favorite
        const alreadyFavorite = await FavoritesService.isFavorite(movieId, userId);
        console.log('[DEBUG-FavoritesService] alreadyFavorite:', alreadyFavorite);
        if (alreadyFavorite) {
            console.log('[DEBUG-FavoritesService] Movie already in favorites');
            return true;
        }

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `INSERT INTO favorites (movie_id, user_id, synced) VALUES (?, ?, ?)`,
                    [movieId, userId, isOnline ? 1 : 0],
                    (_, result) => {
                        console.log('[DEBUG-FavoritesService] add success, insertId:', result.insertId);
                        resolve(result.insertId > 0);
                    },
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error adding:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    remove: async (movieId, isOnline = true) => {
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `DELETE FROM favorites WHERE movie_id = ?`,
                    [movieId],
                    (_, result) => resolve(result.rowsAffected > 0),
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error removing:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    getAll: async (userId = 'local') => {
        console.log('[DEBUG-FavoritesService] getAll called for userId:', userId);
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-FavoritesService] Database not available');
            return [];
        }

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
                        console.log('[DEBUG-FavoritesService] getAll success, count:', movies.length);
                        resolve(movies);
                    },
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error getting all:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },

    isFavorite: async (movieId, userId = 'local') => {
        console.log('[DEBUG-FavoritesService] isFavorite called for movieId:', movieId, 'userId:', userId);
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT id FROM favorites WHERE movie_id = ? AND user_id = ?`,
                    [movieId, userId],
                    (_, result) => {
                        const isFav = result.rows.length > 0;
                        console.log('[DEBUG-FavoritesService] isFavorite result:', isFav, 'rows:', result.rows.length);
                        resolve(isFav);
                    },
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error checking:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    getUnsynced: async () => {
        const db = await getDatabase();
        if (!db) return [];

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT * FROM favorites WHERE synced = 0`,
                    [],
                    (_, result) => {
                        const rows = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            rows.push(result.rows.item(i));
                        }
                        resolve(rows);
                    },
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error getting unsynced:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },

    markAsSynced: async (movieId) => {
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `UPDATE favorites SET synced = 1 WHERE movie_id = ?`,
                    [movieId],
                    (_, result) => resolve(result.rowsAffected > 0),
                    (_, error) => {
                        console.error('[DEBUG-FavoritesService] Error marking as synced:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },
};

// Watchlist operations
export const WatchlistService = {
    add: async (movieId, userId = 'local', isOnline = true) => {
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-WatchlistService] Database not available');
            return false;
        }

        const movieExists = await MovieService.getById(movieId);
        if (!movieExists) {
            await MovieService.upsert({
                id: movieId,
                title: `Movie ${movieId}`,
                overview: '',
                poster_path: null,
                backdrop_path: null,
                release_date: '',
                vote_average: 0,
                genre_ids: [],
            });
        }

        const alreadyInWatchlist = await WatchlistService.isInWatchlist(movieId, userId);
        if (alreadyInWatchlist) {
            return true;
        }

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `INSERT INTO watchlist (movie_id, user_id, synced) VALUES (?, ?, ?)`,
                    [movieId, userId, isOnline ? 1 : 0],
                    (_, result) => resolve(result.insertId > 0),
                    (_, error) => {
                        console.error('[DEBUG-WatchlistService] Error adding:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    remove: async (movieId, isOnline = true) => {
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `DELETE FROM watchlist WHERE movie_id = ?`,
                    [movieId],
                    (_, result) => resolve(result.rowsAffected > 0),
                    (_, error) => {
                        console.error('[DEBUG-WatchlistService] Error removing:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    getAll: async (userId = 'local') => {
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-WatchlistService] Database not available');
            return [];
        }

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT m.*, w.id as watchlist_id, w.created_at as added_at FROM movies m INNER JOIN watchlist w ON m.id = w.movie_id WHERE w.user_id = ? ORDER BY w.created_at DESC`,
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
                        console.error('[DEBUG-WatchlistService] Error getting all:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },

    isInWatchlist: async (movieId, userId = 'local') => {
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT id FROM watchlist WHERE movie_id = ? AND user_id = ?`,
                    [movieId, userId],
                    (_, result) => resolve(result.rows.length > 0),
                    (_, error) => {
                        console.error('[DEBUG-WatchlistService] Error checking:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    getUnsynced: async () => {
        const db = await getDatabase();
        if (!db) return [];

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT * FROM watchlist WHERE synced = 0`,
                    [],
                    (_, result) => {
                        const rows = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            rows.push(result.rows.item(i));
                        }
                        resolve(rows);
                    },
                    (_, error) => {
                        console.error('[DEBUG-WatchlistService] Error getting unsynced:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },

    markAsSynced: async (movieId) => {
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `UPDATE watchlist SET synced = 1 WHERE movie_id = ?`,
                    [movieId],
                    (_, result) => resolve(result.rowsAffected > 0),
                    (_, error) => {
                        console.error('[DEBUG-WatchlistService] Error marking as synced:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },
};

// Sync Queue operations
export const SyncQueueService = {
    add: async (type, movieId, operation) => {
        const db = await getDatabase();
        if (!db) return;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `INSERT INTO sync_queue (type, movie_id, operation, created_at) VALUES (?, ?, ?, strftime('%s', 'now'))`,
                    [type, movieId, operation],
                    (_, result) => resolve(result.insertId > 0),
                    (_, error) => {
                        console.error('[DEBUG-SyncQueueService] Error adding:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    remove: async (id) => {
        const db = await getDatabase();
        if (!db) return;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `DELETE FROM sync_queue WHERE id = ?`,
                    [id],
                    (_, result) => resolve(result.rowsAffected > 0),
                    (_, error) => {
                        console.error('[DEBUG-SyncQueueService] Error removing:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    getAll: async () => {
        const db = await getDatabase();
        if (!db) return [];

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `SELECT * FROM sync_queue ORDER BY created_at ASC`,
                    [],
                    (_, result) => {
                        const rows = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            rows.push(result.rows.item(i));
                        }
                        resolve(rows);
                    },
                    (_, error) => {
                        console.error('[DEBUG-SyncQueueService] Error getting all:', error);
                        resolve([]);
                        return true;
                    }
                );
            });
        });
    },

    clear: async () => {
        const db = await getDatabase();
        if (!db) return;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `DELETE FROM sync_queue`,
                    [],
                    (_, result) => resolve(true),
                    (_, error) => {
                        console.error('[DEBUG-SyncQueueService] Error clearing:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },
};

// User operations
interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    token: string;
}

export const UserService = {
    upsert: async (user: User) => {
        console.log('[DEBUG-UserService] upsert called for user.id:', user.id);
        const db = await getDatabase();
        if (!db) {
            console.error('[DEBUG-UserService] Database not available');
            return null;
        }

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    `INSERT OR REPLACE INTO users (id, email, name, avatar, phone, bio, token, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
                    [user.id, user.email, user.name, user.avatar || null, user.phone || null, user.bio || null, user.token],
                    (_, result) => {
                        console.log('[DEBUG-UserService] upsert success, insertId:', result.insertId);
                        resolve(result);
                    },
                    (_, error) => {
                        console.error('[DEBUG-UserService] Error upserting:', error);
                        resolve(null);
                        return true;
                    }
                );
            });
        });
    },

    getById: async (id: string) => {
        console.log('[DEBUG-UserService] getById called for id:', id);
        const db = await getDatabase();
        if (!db) return null;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM users WHERE id = ?',
                    [id],
                    (_, result) => {
                        const rows = result.rows;
                        if (rows.length > 0) {
                            const user = rows.item(0);
                            console.log('[DEBUG-UserService] getById success, user:', user?.email);
                            resolve(user);
                        } else {
                            console.log('[DEBUG-UserService] getById user not found');
                            resolve(null);
                        }
                    },
                    (_, error) => {
                        console.error('[DEBUG-UserService] Error getting by ID:', error);
                        resolve(null);
                        return true;
                    }
                );
            });
        });
    },

    getCurrent: async () => {
        console.log('[DEBUG-UserService] getCurrent called');
        const db = await getDatabase();
        if (!db) return null;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM users ORDER BY updated_at DESC LIMIT 1',
                    [],
                    (_, result) => {
                        const rows = result.rows;
                        if (rows.length > 0) {
                            const user = rows.item(0);
                            console.log('[DEBUG-UserService] getCurrent success, user:', user?.email);
                            resolve(user);
                        } else {
                            console.log('[DEBUG-UserService] getCurrent no user found');
                            resolve(null);
                        }
                    },
                    (_, error) => {
                        console.error('[DEBUG-UserService] Error getting current user:', error);
                        resolve(null);
                        return true;
                    }
                );
            });
        });
    },

    delete: async (id: string) => {
        console.log('[DEBUG-UserService] delete called for id:', id);
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    'DELETE FROM users WHERE id = ?',
                    [id],
                    (_, result) => {
                        console.log('[DEBUG-UserService] delete success, rowsAffected:', result.rowsAffected);
                        resolve(result.rowsAffected > 0);
                    },
                    (_, error) => {
                        console.error('[DEBUG-UserService] Error deleting:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },

    clear: async () => {
        console.log('[DEBUG-UserService] clear called');
        const db = await getDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            db.transaction((tx) => {
                tx.executeSql(
                    'DELETE FROM users',
                    [],
                    (_, result) => {
                        console.log('[DEBUG-UserService] clear success');
                        resolve(true);
                    },
                    (_, error) => {
                        console.error('[DEBUG-UserService] Error clearing:', error);
                        resolve(false);
                        return true;
                    }
                );
            });
        });
    },
};
