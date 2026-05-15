/**
 * VeriGuard - Database Module
 * In-memory storage with PostgreSQL-ready schema structure
 * Drop-in replace with a real DB adapter following the same interface
 */

class UserDatabase {
  constructor() {
    /**
     * In-memory user store
     * In production, swap this with PostgreSQL via pg or an ORM like Sequelize/Prisma
     *
     * PostgreSQL Schema SQL:
     *
     * CREATE TABLE users (
     *   id BIGSERIAL PRIMARY KEY,
     *   user_id BIGINT UNIQUE NOT NULL,
     *   first_name TEXT,
     *   username TEXT,
     *   verified BOOLEAN DEFAULT FALSE,
     *   verification_attempts INTEGER DEFAULT 0,
     *   captcha_answer INTEGER,
     *   verified_at TIMESTAMPTZ,
     *   joined_at TIMESTAMPTZ DEFAULT NOW(),
     *   last_active TIMESTAMPTZ DEFAULT NOW(),
     *   is_banned BOOLEAN DEFAULT FALSE,
     *   language TEXT DEFAULT 'en'
     * );
     *
     * CREATE INDEX idx_users_verified ON users(verified);
     * CREATE INDEX idx_users_joined ON users(joined_at);
     */
    this.users = new Map();
  }

  /**
   * Create or update a user
   * @param {number} userId - Telegram user ID
   * @param {object} data - User data to store
   * @returns {object} - The stored user object
   */
  set(userId, data) {
    const existing = this.users.get(userId) || {};
    const user = {
      ...existing,
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, user);
    return user;
  }

  /**
   * Get a user by their Telegram ID
   * @param {number} userId
   * @returns {object|undefined}
   */
  get(userId) {
    return this.users.get(userId);
  }

  /**
   * Delete a user from the store
   * @param {number} userId
   * @returns {boolean}
   */
  delete(userId) {
    return this.users.delete(userId);
  }

  /**
   * Check if a user exists
   * @param {number} userId
   * @returns {boolean}
   */
  has(userId) {
    return this.users.has(userId);
  }

  /**
   * Get all users
   * @returns {Map}
   */
  getAll() {
    return this.users;
  }

  /**
   * Get the total number of users
   * @returns {number}
   */
  getTotalCount() {
    return this.users.size;
  }

  /**
   * Get count of verified users
   * @returns {number}
   */
  getVerifiedCount() {
    let count = 0;
    for (const user of this.users.values()) {
      if (user.verified) count++;
    }
    return count;
  }

  /**
   * Get count of banned users
   * @returns {number}
   */
  getBannedCount() {
    let count = 0;
    for (const user of this.users.values()) {
      if (user.isBanned) count++;
    }
    return count;
  }

  /**
   * Get all users as an array (for admin exports)
   * @returns {Array}
   */
  toArray() {
    return Array.from(this.users.values());
  }

  /**
   * Mark user as verified
   * @param {number} userId
   */
  verify(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.verified = true;
      user.verifiedAt = new Date().toISOString();
    }
  }

  /**
   * Ban a user
   * @param {number} userId
   */
  ban(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.isBanned = true;
      user.bannedAt = new Date().toISOString();
    }
  }

  /**
   * Unban a user
   * @param {number} userId
   */
  unban(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.isBanned = false;
      user.bannedAt = null;
    }
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.users.clear();
  }
}

// Singleton instance
const db = new UserDatabase();

module.exports = db;