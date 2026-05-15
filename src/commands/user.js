/**
 * VeriGuard - User Commands
 * Commands available to all users
 */

const db = require('../database');
const captchaEngine = require('../captcha');

class UserCommands {
  /**
   * Register all user commands on the bot
   * @param {import('telegraf').Telegraf} bot
   */
  register(bot) {
    // /start - Start verification process
    bot.command('start', async (ctx) => {
      const userId = ctx.from.id;
      const firstName = ctx.from.first_name || 'User';
      const username = ctx.from.username;

      // Store user info in database
      db.set(userId, {
        firstName,
        username,
        verified: false,
        attempts: 0,
        joinedAt: new Date().toISOString(),
      });

      const captcha = captchaEngine.generate('easy');

      // Update captcha answer in DB
      db.set(userId, { captchaAnswer: captcha.answer, attempts: 0 });

      const welcomeMessage = [
        `👋 **Welcome to VeriGuard, ${firstName}!**`,
        '',
        'This bot protects our community from spam bots.',
        'To continue, please solve this simple verification:',
        '',
        `🔢 **${captcha.question} = ?**`,
        '',
        '_You have 3 attempts to answer correctly._',
        'Reply with the number only.',
      ].join('\n');

      await ctx.replyWithMarkdown(welcomeMessage);
    });

    // /help - Show available commands
    bot.command('help', async (ctx) => {
      const helpMessage = [
        'ℹ️ **VeriGuard Commands**',
        '',
        '`/start` - Start verification',
        '`/status` - Check verification status',
        '`/help` - Show this help message',
        '`/about` - About this bot',
        '',
        '**How it works:**',
        '1. Start a chat with the bot',
        '2. Send /start to begin verification',
        '3. Solve the math captcha',
        '4. You\'re verified! 🎉',
      ].join('\n');

      await ctx.replyWithMarkdown(helpMessage);
    });

    // /status - Check verification status
    bot.command('status', async (ctx) => {
      const user = db.get(ctx.from.id);

      if (!user) {
        return ctx.reply('🔴 **Not Registered**\n\nSend /start to begin verification.');
      }

      if (user.isBanned) {
        return ctx.reply('🚫 **Banned**\n\nYou have been banned from using this bot.');
      }

      if (user.verified) {
        const verifiedAt = user.verifiedAt
          ? new Date(user.verifiedAt).toLocaleString()
          : 'Unknown';
        return ctx.replyWithMarkdown(
          `✅ **Verified User**\n\n` +
          `🆔 ID: \`${user.userId}\`\n` +
          `📅 Verified: ${verifiedAt}`
        );
      }

      return ctx.replyWithMarkdown(
        '🔴 **Not Verified**\n\n' +
        'Send /start to begin the verification process.'
      );
    });

    // /about - Information about the bot
    bot.command('about', async (ctx) => {
      const aboutMessage = [
        '🤖 **VeriGuard Bot**',
        '',
        'Advanced Telegram verification bot protecting communities from spam.',
        '',
        '✨ **Features:**',
        '• Captcha-style math verification',
        '• PostgreSQL-ready database architecture',
        '• Rate limiting protection',
        '• Admin management commands',
        '• Statistics & analytics',
        '',
        '🛠 **Version:** 2.0.0',
        '⚡ **Powered by:** Telegraf.js',
      ].join('\n');

      await ctx.replyWithMarkdown(aboutMessage);
    });
  }
}

module.exports = UserCommands;