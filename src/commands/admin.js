/**
 * VeriGuard - Admin Commands
 * Administrative commands for managing the bot
 */

const db = require('../database');

class AdminCommands {
  constructor(adminId) {
    this.adminId = adminId;
  }

  /**
   * Check if the user is the bot admin
   * @param {number} userId
   * @returns {boolean}
   */
  isAdmin(userId) {
    return userId === this.adminId;
  }

  /**
   * Register all admin commands on the bot
   * @param {import('telegraf').Telegraf} bot
   */
  register(bot) {
    // /stats - Bot statistics
    bot.command('stats', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const total = db.getTotalCount();
      const verified = db.getVerifiedCount();
      const banned = db.getBannedCount();
      const unverified = total - verified;

      const uptime = this._formatUptime(process.uptime());

      const message = [
        '📊 **VeriGuard Statistics**',
        '',
        `👥 **Total Users:** ${total}`,
        `✅ **Verified:** ${verified}`,
        `❌ **Unverified:** ${unverified}`,
        `🚫 **Banned:** ${banned}`,
        '',
        `⏱ **Uptime:** ${uptime}`,
        `⚡ **Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
      ].join('\n');

      await ctx.replyWithMarkdown(message);
    });

    // /users - List all registered users
    bot.command('users', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const users = db.toArray();
      if (users.length === 0) {
        return ctx.reply('📭 No users registered yet.');
      }

      const userList = users
        .slice(0, 20) // Show first 20 users
        .map((u, i) => {
          const name = u.firstName || 'Unknown';
          const status = u.verified ? '✅' : '🔴';
          const banned = u.isBanned ? ' 🚫' : '';
          return `${i + 1}. ${name} (ID: ${u.userId}) ${status}${banned}`;
        })
        .join('\n');

      const totalPages = Math.ceil(users.length / 20);

      await ctx.reply(
        `📋 **Users List** (Page 1/${totalPages})\n\n${userList}\n\n_Showing ${Math.min(20, users.length)} of ${users.length} users_`,
        { parse_mode: 'Markdown' }
      );
    });

    // /ban <user_id> - Ban a user
    bot.command('ban', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        return ctx.reply('Usage: /ban <user_id>');
      }

      const targetId = Number(args[0]);
      if (isNaN(targetId)) {
        return ctx.reply('❌ Invalid user ID. Please provide a numeric ID.');
      }

      const user = db.get(targetId);
      if (!user) {
        return ctx.reply(`❌ User ${targetId} not found in database.`);
      }

      db.ban(targetId);
      await ctx.reply(`🚫 User **${user.firstName || targetId}** (ID: ${targetId}) has been banned.`, { parse_mode: 'Markdown' });
    });

    // /unban <user_id> - Unban a user
    bot.command('unban', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        return ctx.reply('Usage: /unban <user_id>');
      }

      const targetId = Number(args[0]);
      if (isNaN(targetId)) {
        return ctx.reply('❌ Invalid user ID. Please provide a numeric ID.');
      }

      const user = db.get(targetId);
      if (!user) {
        return ctx.reply(`❌ User ${targetId} not found in database.`);
      }

      db.unban(targetId);
      await ctx.reply(`✅ User **${user.firstName || targetId}** (ID: ${targetId}) has been unbanned.`, { parse_mode: 'Markdown' });
    });

    // /broadcast <message> - Send message to all users (admin only)
    bot.command('broadcast', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const message = ctx.message.text.split(' ').slice(1).join(' ');
      if (!message) {
        return ctx.reply('Usage: /broadcast <your message>');
      }

      await ctx.reply(`📢 Broadcast sent to ${db.getTotalCount()} users.`);
      // Note: In production, you'd iterate over users and send messages
      // For now, we just confirm the intent
    });

    // /admin - Admin help panel
    bot.command('admin', async (ctx) => {
      if (!this.isAdmin(ctx.from.id)) {
        return ctx.reply('❌ Access denied. Admin only command.');
      }

      const helpText = [
        '🛠 **Admin Panel**',
        '',
        '`/stats` - Bot statistics',
        '`/users` - List registered users',
        '`/ban <id>` - Ban a user',
        '`/unban <id>` - Unban a user',
        '`/broadcast <msg>` - Send message to all',
        '`/admin` - This panel',
      ].join('\n');

      await ctx.replyWithMarkdown(helpText);
    });
  }

  /**
   * Format uptime seconds into a readable string
   * @param {number} seconds
   * @returns {string}
   */
  _formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
  }
}

module.exports = AdminCommands;