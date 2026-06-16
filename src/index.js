/**
 * VeriGuard 🤖
 * Advanced Telegram Welcome Bot with captcha verification
 *
 * Features:
 * - Math captcha verification for new users
 * - PostgreSQL-ready database structure
 * - Rate limiting protection
 * - Admin commands (stats, ban, users, broadcast)
 * - Health check endpoint
 * - Webhook-ready for production deployment
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

const db = require('./database');
const rateLimiter = require('./middleware/rateLimit');
const AdminCommands = require('./commands/admin');
const UserCommands = require('./commands/user');

// -------------------- Configuration --------------------

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_ID = Number(process.env.ADMIN_USER_ID);
const PORT = Number(process.env.PORT) || 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required. Set it in your .env file.');
  process.exit(1);
}

if (!ADMIN_USER_ID) {
  console.warn('⚠️  ADMIN_USER_ID not set. Admin commands will be disabled.');
}

// -------------------- Bot Initialization --------------------

const bot = new Telegraf(BOT_TOKEN);
const adminCommands = new AdminCommands(ADMIN_USER_ID);
const userCommands = new UserCommands();

// Maximum captcha attempts before reset
const MAX_CAPTCHA_ATTEMPTS = 3;

// -------------------- Middleware Registration --------------------

// Apply rate limiting on text messages (captcha attempts)
bot.use(rateLimiter.textLimit());

// -------------------- Command Registration --------------------

// Register user commands
userCommands.register(bot);

// Register admin commands (only if admin ID is set)
if (ADMIN_USER_ID) {
  adminCommands.register(bot);
}

// -------------------- Captcha Verification Handler --------------------

bot.on('text', async (ctx) => {
  // Ignore commands (they start with /)
  if (ctx.message.text.startsWith('/')) return;

  const userId = ctx.from.id;
  const user = db.get(userId);

  // If user not in DB or already verified, ignore
  if (!user) {
    return ctx.reply('Send /start to begin verification.');
  }

  if (user.verified) {
    return; // Silent ignore for verified users
  }

  if (user.isBanned) {
    return ctx.reply('🚫 You are banned from using this bot.');
  }

  const userAnswer = Number(ctx.message.text);

  // Validate that the answer is a number
  if (isNaN(userAnswer)) {
    return ctx.reply('❌ Please reply with a number only.');
  }

  const captchaAnswer = user.captchaAnswer;

  if (userAnswer === captchaAnswer) {
    // ✅ Correct answer - verify user
    db.verify(userId);
    rateLimiter.reset(userId);

    await ctx.replyWithMarkdown(
      '✅ **Verification Passed!** 🎉\n\n' +
      'You are now a verified member of the community.\n' +
      'Use /help to see available commands.'
    );

    // Notify admin about new verified user
    if (ADMIN_USER_ID) {
      try {
        await bot.telegram.sendMessage(
          ADMIN_USER_ID,
          `✅ New verification!\n👤 ${user.firstName} (@${user.username || 'N/A'}) (ID: ${userId})`
        );
      } catch (err) {
        // Silently fail - admin notification is not critical
      }
    }
  } else {
    // ❌ Wrong answer - increment attempts
    const attempts = (user.attempts || 0) + 1;
    db.set(userId, { attempts });

    if (attempts >= MAX_CAPTCHA_ATTEMPTS) {
      // Too many failed attempts - delete user data
      db.delete(userId);
      rateLimiter.reset(userId);

      await ctx.replyWithMarkdown(
        '❌ **Too many failed attempts.**\n\n' +
        'You have been reset. Send /start to try again.'
      );
    } else {
      const remainingAttempts = MAX_CAPTCHA_ATTEMPTS - attempts;
      const hint = userAnswer > captchaAnswer
        ? 'Try a smaller number.'
        : 'Try a larger number.';

      await ctx.reply(
        `❌ Wrong answer. ${hint}\n` +
        `Attempts remaining: ${remainingAttempts}`
      );
    }
  }
});

// -------------------- Error Handling --------------------

bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('An unexpected error occurred. Please try again later.').catch(() => {});
});

// -------------------- Health Check Server --------------------

const app = express();

// Parse JSON bodies for webhook
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'VeriGuard',
    version: '2.0.0',
    uptime: process.uptime(),
    users: {
      total: db.getTotalCount(),
      verified: db.getVerifiedCount(),
      banned: db.getBannedCount(),
    },
    memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
    timestamp: new Date().toISOString(),
  });
});

// -------------------- Launch --------------------

async function launchBot() {
  try {
    if (PUBLIC_DOMAIN) {
      // 🌐 Webhook mode (production - Railway, Render, etc.)
      console.log(`🌐 Starting webhook server on port ${PORT}...`);

      // Set the Telegram webhook
      const webhookUrl = `https://${PUBLIC_DOMAIN}/webhook`;
      await bot.telegram.setWebhook(webhookUrl, {
        secret_token: WEBHOOK_SECRET,
      });

      // Register the webhook callback as Express middleware
      app.post('/webhook', bot.webhookCallback('/webhook', {
        secretToken: WEBHOOK_SECRET,
      }));

      console.log(`✅ Webhook set to: ${webhookUrl}`);

      // Start Express server
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log('🤖 VeriGuard is running with webhook!');
      });
    } else {
      // 📡 Polling mode (development)
      console.log('📡 Starting in polling mode...');
      await bot.launch();
      console.log('🤖 VeriGuard is running with long polling!');
    }

    console.log('──────────────────────────────');
    console.log('  VeriGuard v2.0.0');
    console.log(`  👥 Users: ${db.getTotalCount()}`);
    console.log(`  ✅ Verified: ${db.getVerifiedCount()}`);
    console.log('──────────────────────────────');
  } catch (err) {
    console.error('❌ Failed to launch bot:', err);
    process.exit(1);
  }
}

// -------------------- Graceful Shutdown --------------------

process.once('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// -------------------- Start --------------------

launchBot();