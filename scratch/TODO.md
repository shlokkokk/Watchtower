# 🛠️ Watchtower — User Manual & Action Setup Checklist

This document contains everything you need to know to get 100% full owner-level metrics (traffic sources, view trends, clones, private repos, automatic Discord/Telegram alerts) working with **Watchtower**.

---

## 🔑 Step 1: Generate a GitHub Personal Access Token (PAT)
*(Required for 14-day traffic referrers, clone stats, path hits, and higher rate limits of 5,000 req/hr)*

1. Open GitHub: **Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic)** or navigate to: `https://github.com/settings/tokens`
2. Click **Generate new token (classic)**.
3. Set Note to: `Watchtower Portfolio Tracker`
4. Expiration: Choose **No expiration** (or 90 days).
5. Check the following scopes:
   - `repo` (Full control of private repositories — required for traffic referrers/views/clones)
   - `read:user` (Read user profile data)
6. Click **Generate token** and copy the string (starts with `ghp_` or `github_pat_`).

---

## 🔔 Step 2: Set up Discord or Telegram Notifications (Optional, Free)

### Option A: Discord Webhook (Recommended — Takes 1 minute)
1. Open Discord and go to your server settings -> **Integrations** -> **Webhooks**.
2. Click **New Webhook**.
3. Name it `Watchtower Sentinel` and select your alert channel (e.g. `#alerts`).
4. Click **Copy Webhook URL**.

### Option B: Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the prompts to get your **Bot API Token**.
3. Start a chat with your new bot and get your **Chat ID** (or use `@userinfobot` to find your ID).

---

## ⚡ Step 3: Configure Local Environment (`.env`)

Create a file named `.env` in the root of the project directory with your credentials:

```env
# Target GitHub Username to track
VITE_DEFAULT_USERNAME=shlokkokk

# GitHub PAT (for full traffic stats & high rate limits)
GH_PAT=ghp_your_personal_access_token_here
VITE_GH_PAT=ghp_your_personal_access_token_here

# Discord Webhook URL (for real-time milestone & trending alerts)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🤖 Step 4: Configure GitHub Actions for 24/7 Automated Hourly Tracking

To have GitHub automatically track your portfolio every hour and send alerts even when your computer is off:

1. Push your Watchtower code to a GitHub repository (e.g. `shlokkokk/Watchtower`).
2. Go to repository **Settings -> Secrets and variables -> Actions**.
3. Add the following Repository Secrets:
   - `GH_PAT`
   - `DISCORD_WEBHOOK_URL`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. The workflow in `.github/workflows/watchtower-cron.yml` will now automatically run every hour!

---

## 🚀 Step 5: How to Run Watchtower

### Run Live Interactive Dashboard
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Run Manual Snapshot & Webhook Check
```bash
npm run track
```
