# 🤖 VeriGuard — Telegram Verification Bot

Advanced welcome bot with captcha verification, PostgreSQL-ready storage, admin commands, and rate limiting.

---

## 📱 Step-by-Step Setup

### Step 1: Get Your Bot Token

1. Open **Telegram** on your phone or desktop
2. Search for [`@BotFather`](https://t.me/BotFather) (official Telegram bot)
3. Send `/newbot`
4. Follow the prompts:
   - Choose a **name** for your bot (e.g., `VeriGuard`)
   - Choose a **username** (must end in `bot`, e.g., `VeriGuardBot`)
5. BotFather will reply with a token like:
   ```
   1234567890:ABCdefGHIJklmNOPqrStuVWXyz-abc123def45
   ```
   **Save this token** — you'll put it in your `.env` file.

### Step 2: Get Your Admin User ID

You need your personal Telegram User ID so the bot knows who the admin is.

> **Three ways to get it:**

| Method | Bot to search | What to do |
|--------|--------------|------------|
| ⭐ **Easiest** | [`@userinfobot`](https://t.me/userinfobot) | Send any message → it replies with your ID |
| ✅ Simple | [`@getmyid_bot`](https://t.me/getmyid_bot) | Send `/start` → it shows your ID |
| 🔧 Advanced | [`@JsonDumpBot`](https://t.me/JsonDumpBot) | Forward any message → it shows JSON with `"id": 123456789` |

Your ID will be a number like `123456789` or `987654321`. Save it.

### Step 3: Configure the Bot

```bash
# Navigate to the project
cd veriguard-bot

# Copy the example environment file
cp .env.example .env

# Open .env in your editor
nano .env   # or: code .env, vim .env, etc.
```

Edit the `.env` file with your values:

```env
BOT_TOKEN=1234567890:ABCdefGHIJklmNOPqrStuVWXyz-abc123def45   # from Step 1
ADMIN_USER_ID=123456789                                         # from Step 2
WEBHOOK_SECRET=makeUpAnyRandomStringHere                        # you choose this
PORT=8080                                                       # keeps default
```

### Step 4: Run the Bot

```bash
# Development mode (polling — works on your local machine)
npm start
```

You should see:
```
📡 Starting in polling mode...
🤖 VeriGuard is running with long polling!
──────────────────────────────
  VeriGuard v2.0.0
  👥 Users: 0
  ✅ Verified: 0
──────────────────────────────
```

### Step 5: Test It

1. Open Telegram
2. Search for your bot's username (the one you chose in Step 1)
3. Send `/start`
4. You'll get a math captcha — solve it!
5. You're verified 🎉

---

## 📋 Available Commands

### 👤 User Commands

| Command | Description |
|---------|-------------|
| `/start` | Start verification (solves a math captcha) |
| `/help` | Show help information |
| `/status` | Check your verification status |
| `/about` | Info about VeriGuard |

### 🛠️ Admin Commands

_(Only the user whose ID matches `ADMIN_USER_ID` can use these)_

| Command | Description |
|---------|-------------|
| `/stats` | Bot statistics (users, verified, uptime, memory) |
| `/users` | List registered users |
| `/ban <id>` | Ban a user by their Telegram ID |
| `/unban <id>` | Unban a user |
| `/broadcast <msg>` | Send a message to all users |
| `/admin` | Show admin command panel |

---

## 🚀 Deploy to Production (Railway)

The bot is production-ready with webhook support:

```bash
# On Railway, just set these environment variables:
# BOT_TOKEN, ADMIN_USER_ID, WEBHOOK_SECRET
# Railway provides RAILWAY_PUBLIC_DOMAIN automatically
```

No code changes needed — the bot auto-detects if it should use webhook (production) or polling (development).

---

## 🏗️ Project Architecture

```
src/
├── index.js          # Main entry: bot setup, captcha handler, health server
├── captcha.js        # Math captcha engine (3 difficulty levels)
├── database.js       # In-memory DB with PostgreSQL schema ready
├── commands/
│   ├── admin.js      # Admin-only commands
│   └── user.js       # Public user commands
└── middleware/
    └── rateLimit.js  # Rate limiting for spam protection
```

---

## 📊 Health Check

When deployed, visit `https://your-bot-domain.com/` to see live stats:

```json
{
  "status": "ok",
  "bot": "VeriGuard",
  "version": "2.0.0",
  "users": { "total": 42, "verified": 38, "banned": 0 }
}
```

---

## 🛡️ Features

- ✅ Captcha-style math verification (3 difficulties)
- ✅ Admin notification on new user verification
- ✅ Rate limiting (prevents brute-force captcha solving)
- ✅ PostgreSQL-ready structure (SQL schema included in `database.js`)
- ✅ 3 attempts max, then reset
- ✅ Helpful hints ("Try a smaller/larger number")
- ✅ Webhook + polling mode auto-detection
- ✅ Graceful shutdown
- ✅ Health check endpoint

---

## 📄 License

MIT