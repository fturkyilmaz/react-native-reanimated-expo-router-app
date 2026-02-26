/**
 * UserService - User database operations
 *
 * Handles CRUD operations for the users table.
 * Provides user data persistence for authentication.
 */

import { getDatabase } from "@/db/database";
import { logger } from "@/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  token: string;
}

export interface UserWithTimestamps extends User {
  updated_at: number;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const UserService = {
  /**
   * Upsert a user (insert or update)
   */
  upsert: async (user: User): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) {
      logger.auth.error("Database not available");
      return false;
    }

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO users (id, email, name, phone, bio, avatar, token, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
            [
              user.id,
              user.email,
              user.name,
              user.phone || null,
              user.bio || null,
              user.avatar || null,
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
      logger.auth.error("User upsert exception", { userId: user.id, error });
      return false;
    }
  },

  /**
   * Get current user (most recently updated)
   */
  getCurrentUser: async (): Promise<User | null> => {
    const db = await getDatabase();
    if (!db) return null;

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
          tx.executeSql(
            "SELECT * FROM users ORDER BY updated_at DESC LIMIT 1",
            [],
            (_, result) => {
              if (result.rows.length > 0) {
                const user = result.rows.item(0) as UserWithTimestamps;
                const { updated_at, ...userWithoutTimestamp } = user;
                resolve(userWithoutTimestamp);
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

  /**
   * Get user by ID
   */
  getById: async (userId: string): Promise<User | null> => {
    const db = await getDatabase();
    if (!db) return null;

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
          tx.executeSql(
            "SELECT * FROM users WHERE id = ?",
            [userId],
            (_, result) => {
              if (result.rows.length > 0) {
                const user = result.rows.item(0) as UserWithTimestamps;
                const { updated_at, ...userWithoutTimestamp } = user;
                resolve(userWithoutTimestamp);
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
      logger.auth.error("Get user by ID failed", { userId, error });
      return null;
    }
  },

  /**
   * Get user by email
   */
  getByEmail: async (email: string): Promise<User | null> => {
    const db = await getDatabase();
    if (!db) return null;

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
          tx.executeSql(
            "SELECT * FROM users WHERE email = ?",
            [email],
            (_, result) => {
              if (result.rows.length > 0) {
                const user = result.rows.item(0) as UserWithTimestamps;
                const { updated_at, ...userWithoutTimestamp } = user;
                resolve(userWithoutTimestamp);
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
      logger.auth.error("Get user by email failed", { email, error });
      return null;
    }
  },

  /**
   * Delete user by ID
   */
  delete: async (userId: string): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) return false;

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
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

  /**
   * Update user fields
   */
  update: async (
    userId: string,
    updates: Partial<Omit<User, "id" | "email" | "token">>,
  ): Promise<boolean> => {
    const db = await getDatabase();
    if (!db) return false;

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(updates.avatar || null);
    }
    if (updates.phone !== undefined) {
      fields.push("phone = ?");
      values.push(updates.phone || null);
    }
    if (updates.bio !== undefined) {
      fields.push("bio = ?");
      values.push(updates.bio || null);
    }

    if (fields.length === 0) {
      return true;
    }

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(userId);

    try {
      return new Promise((resolve) => {
        db.transaction!((tx) => {
          tx.executeSql(
            `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
            values,
            (_, result) => {
              logger.auth.info("User updated", { userId, fields });
              resolve(result.rowsAffected > 0);
            },
            (_, error) => {
              logger.auth.error("User update failed", { userId, error });
              resolve(false);
              return true;
            },
          );
        });
      });
    } catch (error) {
      logger.auth.error("User update exception", { userId, error });
      return false;
    }
  },
};
