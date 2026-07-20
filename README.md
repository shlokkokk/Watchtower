<div align="center">

# 🛰️ WATCHTOWER

### High-Performance GitHub Portfolio Intelligence & Autonomous Telemetry Engine

[![GitHub Actions Status](https://img.shields.io/github/actions/workflow/status/shlokkokk/Watchtower/watchtower-cron.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&color=00f0ff)](https://github.com/shlokkokk/Watchtower/actions)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<p align="center">
  A self-updating portfolio command center that tracks your entire GitHub ecosystem dynamically, discovers traffic referrers, calculates star velocity, detects trending/inactive repos, and dispatches real-time alerts to Discord & Telegram.
</p>

[Live Demo](#-quick-start) • [Core Principles](#-architecture--data-pipeline) • [Features](#-key-features) • [Deployment](#-cloud-deployment-github-actions--vercel)

</div>

---

## ⚡ Key Features

### 1. 100% Dynamic Repository Discovery
- **Zero Hardcoding**: Dynamically pulls all current AND future repositories live via `GET /users/{username}/repos`. Any new repository pushed appears in the next scan automatically.
- **Live Target Switcher**: Inspect your own portfolio or test against *any* public GitHub username or organization live in the web app.

### 2. Traffic Analytics & Referrer Attribution
- **Top Referral Channels**: Analyzes top incoming traffic sources (`dev.to`, `news.ycombinator.com`, `t.co`, `reddit.com`, `google.com`) with view and unique visitor breakdowns.
- **Clones & Popular Paths**: Tracks 14-day rolling clone counts and top page hits (e.g. `README.md` vs source files).

### 3. Derived Portfolio Intelligence
- **Star Velocity (24h / 7d)**: Measures current growth rate rather than static star totals.
- **Portfolio Health Index (0–100)**: Algorithmic rating combining maintenance frequency, traffic volume, fork-to-star ratio, and issue response times.
- **Milestone Detection**: Automatically detects when any repository crosses 10, 25, 50, 100, 250+ stars and triggers celebratory confetti animations.
- **Trending Radar**: Flags repositories with 24-hour view & star spikes &gt; 3x baseline.
- **Dead Repo Radar**: Identifies inactive repositories (0 views, 0 activity in 30+ days) so candidates can be archived or revived.

### 4. Launch Attribution & ROI Studio
- **Launch Logger**: Log posts on **Show HN**, **Dev.to**, **Reddit**, **ProductHunt**, and **Twitter/X**.
- **Platform ROI Matrix**: Computes average stars and views delivered per channel to systematically determine your highest-converting distribution channels.

### 5. 24/7 Autonomous Webhook Alert Engine
- **Discord & Telegram Integration**: Automated cloud scan via GitHub Actions dispatching contextual embeds:
  - **Star Gain Alert**: `Star Gain Alert — Oculus (+2 stars)`
  - **Code Fork Alert**: `New Code Fork — ShellStack (+1 fork)`
  - **Milestone Alert**: `Milestone Reached — Oculus (25 stars)`
  - **Trending Alert**: `Trending Alert — ShellStack`
  - **Weekly Review Digest**: Comprehensive Sunday evening recap report.

### 6. Resilient Error Handling & Quota Meter
- **Quota Protection**: Displays real-time `x-ratelimit-remaining` counter and reset timer.
- **Fallback Data Layer**: Gracefully transitions to cached snapshots if unauthenticated or rate-limited so the application **never crashes**.

---

## 📐 Architecture & Data Pipeline

```
[GitHub Actions Cron (Hourly)]
          |
          v
  [scripts/track.js]
    1. Fetch live repos dynamically
    2. Pull traffic referrers, views & clones
    3. Compute velocity, health score & derived flags
    4. Diff against history log
    5. Save snapshot.json + append history.json
    6. Dispatch Discord & Telegram Webhooks
          |
          +-----------------------------+
          |                             |
          v                             v
[Discord #alerts & Telegram]    [React Web Dashboard]
 (Instant Notifications)      (Instant 50ms Cache Load + Live API Override)
```

---

## 🛠️ Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/shlokkokk/Watchtower.git
cd Watchtower

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Target GitHub Username
VITE_DEFAULT_USERNAME=shlokkokk
GH_USERNAME=shlokkokk

# Personal Access Token (for owner traffic stats & 5,000 req/hr rate limit)
GH_PAT=ghp_your_personal_access_token_here
VITE_GH_PAT=ghp_your_personal_access_token_here

# Discord Webhook URL (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url

# Telegram Bot Credentials (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Run Locally

```bash
# Start Web App Dashboard
npm run dev

# Run Manual Scan & Webhook Check
npm run track

# Build Production Bundle
npm run build
```

---

## ☁️ Cloud Deployment (GitHub Actions & Vercel)

### 24/7 Automated Hourly Tracking (GitHub Actions)
Add the following Secrets under your GitHub repository **Settings -> Secrets and variables -> Actions**:
- `GH_PAT`
- `DISCORD_WEBHOOK_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

The workflow in `.github/workflows/watchtower-cron.yml` will automatically run every hour and dispatch alerts!

### Hosting the Web Dashboard (Vercel)
1. Import your `Watchtower` repository on [Vercel](https://vercel.com).
2. Add environment variables: `VITE_DEFAULT_USERNAME`, `VITE_GH_PAT`, `VITE_DISCORD_WEBHOOK_URL`.
3. Click **Deploy** for a free live URL.

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti.
- **Backend / Pipeline**: Node.js, Octokit REST API, Native Fetch.
- **Automation**: GitHub Actions, Cron Workflows.
