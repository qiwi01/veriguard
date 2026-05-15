/**
 * VeriGuard - Rate Limiting Middleware
 * Basic rate limiting to prevent spam and brute-force captcha attempts
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 10 * 1000; // 10 seconds default
    this.maxAttempts = options.maxAttempts || 5;
    this.maxCommandCalls = options.maxCommandCalls || 10;
    this.attempts = new Map();
  }

  /**
   * Middleware: Check if user is rate limited for text messages (captcha attempts)
   */
  textLimit() {
    return (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId) return next();

      const now = Date.now();
      const userAttempts = this.attempts.get(userId) || { count: 0, resetAt: now + this.windowMs };

      // Reset if window expired
      if (now > userAttempts.resetAt) {
        userAttempts.count = 0;
        userAttempts.resetAt = now + this.windowMs;
      }

      userAttempts.count++;

      if (userAttempts.count > this.maxAttempts) {
        const retryAfter = Math.ceil((userAttempts.resetAt - now) / 1000);
        return ctx.reply(
          `⏳ Too many requests. Please wait ${retryAfter} seconds before trying again.`
        );
      }

      this.attempts.set(userId, userAttempts);
      return next();
    };
  }

  /**
   * Middleware: Check if user is rate limited for command usage
   */
  commandLimit() {
    return (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId) return next();

      const now = Date.now();
      const key = `cmd:${userId}`;
      const userAttempts = this.attempts.get(key) || { count: 0, resetAt: now + this.windowMs };

      if (now > userAttempts.resetAt) {
        userAttempts.count = 0;
        userAttempts.resetAt = now + this.windowMs;
      }

      userAttempts.count++;

      if (userAttempts.count > this.maxCommandCalls) {
        const retryAfter = Math.ceil((userAttempts.resetAt - now) / 1000);
        return ctx.reply(
          `⏳ Command spam detected. Wait ${retryAfter}s.`
        );
      }

      this.attempts.set(key, userAttempts);
      return next();
    };
  }

  /**
   * Get the number of attempts remaining for a user
   * @param {number} userId
   * @returns {number}
   */
  getRemainingAttempts(userId) {
    const now = Date.now();
    const data = this.attempts.get(userId);
    if (!data || now > data.resetAt) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - data.count);
  }

  /**
   * Reset rate limit for a specific user
   * @param {number} userId
   */
  reset(userId) {
    this.attempts.delete(userId);
    this.attempts.delete(`cmd:${userId}`);
  }
}

module.exports = new RateLimiter();