<div align="center">

# 🛰️ WATCHTOWER

### GitHub Portfolio Intelligence & Autonomous Alert Engine

[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/shlokkokk/Watchtower/watchtower-cron.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&color=00f0ff)](https://github.com/shlokkokk/Watchtower/actions)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<p align="center">
  A self-hostable, self-updating GitHub portfolio command center. Tracks your entire repository ecosystem live, calculates star velocity, detects trending &amp; dead repos, visualizes traffic analytics, and dispatches real-time alerts to Discord &amp; Telegram — all behind a server-authenticated, zero-secret-in-bundle architecture.
</p>

[Features](#-features) • [Architecture](#-architecture) • [Security Model](#-security-model) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Tech Stack](#-tech-stack)

</div>

---

## ⚡ Features

### 1. Live Repository Intelligence
- **100% Dynamic Discovery** — pulls all repos live via GitHub API. New repos appear automatically on the next scan, zero hardcoding.
- **Star Velocity (24h)** — measures current momentum, not just static totals.
- **Portfolio Health Index (0–100)** — algorithmic score combining push frequency, traffic, fork-to-star ratio, and issue response.
- **Trending Radar** — flags repos with 24-hour view or star spikes > 3× baseline.
- **Dead Repo Radar** — identifies repos with 0 views and 0 activity for 30+ days.
- **Milestone Detection** — detects when any repo crosses 10 / 25 / 50 / 100 / 250 stars with confetti celebrations.

### 2. Traffic Analytics & Referrer Attribution
- **Top Referral Channels** — tracks incoming traffic from `dev.to`, `news.ycombinator.com`, `reddit.com`, `t.co`, `google.com` and more with view & unique visitor breakdowns.
- **14-Day Rolling Analytics** — clone counts, popular paths (`README.md` vs source files), and 7-day sparkline trends.
- **Language Breakdown** — visual star distribution across all languages in your portfolio.

### 3. Target Switcher — Inspect Any GitHub User
- Built into the filter bar: type any GitHub username and instantly load their portfolio into the dashboard.
- Useful for competitor research, open-source discovery, or just curiosity.

### 4. Launch Attribution & ROI Studio
- **Multi-Platform Logger** — record post events on Show HN, Dev.to, Reddit, ProductHunt, Twitter/X, Substack, LinkedIn, Discord, or any custom channel.
- **Platform ROI Matrix** — computes average stars and views per distribution channel to surface your highest-converting platforms.

### 5. Autonomous Webhook Alert Engine (24/7)
Alerts fire automatically via GitHub Actions cron every hour — no browser required:

| Alert | Trigger |
|---|---|
| ⭐ Star Gain | Any repo receives a new star |
| 🏆 Milestone | Repo crosses 10 / 25 / 50 / 100 / 250 stars |
| 🍴 Fork Alert | Repo gets a new fork |
| 🔥 Trending | 24h views or stars spike > 3× baseline |
| 💀 Dead Repo | 0 views + 0 activity for 30+ days |
| 📊 Weekly Digest | Full Sunday evening portfolio recap |

Notifications delivered to **Discord** (rich embeds) and/or **Telegram** (Markdown messages).

### 6. Dashboard UX
- **Password-gated access** — HMAC-signed 7-day sessions per browser
- **Real-time rate limit meter** — live `Quota: 4981/5000` display
- **Auto-refresh every 5 minutes** — background data updates without page reload
- **Grid & Table views** — switchable repo layout
- **Filter & sort** — by status (Trending / Active / Stale / Inactive / Milestones), language, star velocity, health score, forks, views, activity
- **Export** — download full snapshot as JSON or repos as CSV
- **Crash-proof fallback** — always shows cached `snapshot.json` data if the live API is unavailable

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions (Hourly Cron)               │
│                                                             │
│   scripts/track.js                                          │
│   ├── Fetch all repos dynamically (GH_PAT)                  │
│   ├── Pull traffic: referrers, views, clones                │
│   ├── Compute velocity, health score, derived flags         │
│   ├── Diff against history.json                             │
│   ├── Write snapshot.json + append history.json             │
│   ├── Commit & push to repo                                 │
│   └── Dispatch Discord embeds + Telegram messages           │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
 Discord #alerts          React Dashboard (Vercel)
 Telegram Bot             ├── /api/auth     (password gate)
                          ├── /api/github   (GitHub proxy)
                          └── /api/notify   (webhook proxy)
```

**Data flow for the dashboard:**
1. On first load → reads `public/data/snapshot.json` instantly (no auth needed)
2. Password gate → `POST /api/auth` → server verifies → issues signed HMAC token
3. Token stored in `localStorage` for 7 days
4. Live refresh → `GET /api/github?path=/users/...` → server adds GH_PAT → proxies GitHub API
5. Test alerts → `POST /api/notify` → server dispatches to Discord/Telegram

---

## 🔐 Security Model

> **Zero secrets in the browser bundle.** All credentials live exclusively on the Vercel server.

| What | Where | How |
|---|---|---|
| `GH_PAT` | Vercel env var (server-only) | Added by `/api/github` proxy — never reaches browser |
| `DISCORD_WEBHOOK_URL` | Vercel env var (server-only) | Added by `/api/notify` proxy |
| `TELEGRAM_BOT_TOKEN` | Vercel env var (server-only) | Added by `/api/notify` proxy |
| `DASHBOARD_PASSWORD` | Vercel env var (server-only) | Compared timing-safely in `/api/auth` |
| `SESSION_SECRET` | Vercel env var (server-only) | Signs HMAC tokens — never leaves server |
| Session Token | Browser `localStorage` | Signed `wt1:{expiry}:{hmac}` — worthless without SESSION_SECRET |

**Bypass-resistant by design:**
- Password verified server-side with `timingSafeEqual` (no client-side hash to brute-force)
- Rate limited: 5 attempts per IP per 15 minutes
- SSRF-protected: `/api/github` only forwards requests matching an allowlist of GitHub API paths
- Session tokens expire after 7 days and cannot be forged without `SESSION_SECRET`

---

## 🛠️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/shlokkokk/Watchtower.git
cd Watchtower
npm install
```

### 2. Environment Setup

For **local development**, create a `.env.local` file (never committed):

```env
# Public — safe as VITE_ prefix (it's a public GitHub username)
VITE_DEFAULT_USERNAME=your_github_username
```

> **Note:** The `/api/*` serverless functions (auth, github proxy, notify) require Vercel to run. For local dev, the dashboard loads `snapshot.json` data without live API calls.

To **run the tracking script manually**:

```bash
# Requires GH_PAT, DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID in your shell env
npm run track
```

### 3. Run Locally

```bash
npm run dev        # Start dashboard at http://localhost:5173
npm run build      # Production build
npm run track      # Run cron script manually
```

---

## ☁️ Deployment

### Step 1 — GitHub Actions Secrets (for hourly cron alerts)

Go to **Repository → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `GH_PAT` | GitHub Personal Access Token (repo + read:user scopes) |
| `DISCORD_WEBHOOK_URL` | Your Discord channel webhook URL |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Your Telegram chat/channel ID |

The workflow in `.github/workflows/watchtower-cron.yml` runs every hour automatically.

### Step 2 — Vercel Deployment (dashboard)

1. Import the repository on [vercel.com](https://vercel.com)
2. In **Settings → Environment Variables**, add the following (all set to **Production**):

| Variable | Value | Notes |
|---|---|---|
| `VITE_DEFAULT_USERNAME` | `your_github_username` | Only public VITE_ var allowed |
| `DASHBOARD_PASSWORD` | Your chosen password | Plain text, compared server-side |
| `SESSION_SECRET` | 32-byte random hex | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GH_PAT` | Your GitHub PAT | No `VITE_` prefix — server only |
| `DISCORD_WEBHOOK_URL` | Your Discord webhook | No `VITE_` prefix — server only |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | No `VITE_` prefix — server only |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | No `VITE_` prefix — server only |

> ⚠️ **Do NOT add `VITE_GH_PAT`, `VITE_DISCORD_WEBHOOK_URL`, or `VITE_TELEGRAM_*`** — these would expose your secrets in the public JS bundle.

3. Click **Deploy**. After deployment, open your Vercel URL → password gate appears → enter your `DASHBOARD_PASSWORD` → done.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS, Lucide Icons |
| Charts | Recharts, Custom SVG sparklines |
| Animations | Canvas Confetti, CSS transitions |
| API Layer | Vercel Serverless Functions (Node.js) |
| Auth | HMAC-SHA256 session tokens, `timingSafeEqual` |
| Automation | GitHub Actions, Cron Workflows |
| Data | Octokit REST, Native Fetch, JSON snapshots |
| Hosting | Vercel (frontend + API), GitHub Pages (optional) |

---

## 📁 Project Structure

```
Watchtower/
├── api/                        # Vercel serverless functions (server-side only)
│   ├── _utils.js               # HMAC token creation & verification
│   ├── auth.js                 # POST /api/auth — password gate
│   ├── github.js               # GET /api/github — GitHub API proxy
│   └── notify.js               # POST /api/notify — Discord/Telegram proxy
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar
│   │   ├── FilterControls.jsx  # Search, filters, target switcher
│   │   ├── MetricCards.jsx     # KPI summary widgets
│   │   ├── RepoGrid.jsx        # Repository card grid & table
│   │   ├── RepoDetailModal.jsx # Per-repo deep analytics
│   │   ├── AnalyticsCharts.jsx # Language & referrer charts
│   │   ├── LaunchTracker.jsx   # Launch ROI studio
│   │   ├── NotificationModal.jsx # Webhook test playground
│   │   ├── SettingsModal.jsx   # Settings & data export
│   │   ├── PasswordGate.jsx    # Auth gate — POSTs to /api/auth
│   │   └── TodoModal.jsx       # Setup guide
│   ├── services/
│   │   ├── githubApi.js        # Client → /api/github proxy
│   │   ├── notificationService.js # Client → /api/notify proxy
│   │   └── metrics.js          # Filter, sort, export utilities
│   └── App.jsx                 # Root app, state orchestration
├── scripts/
│   └── track.js                # Node.js cron script (GitHub Actions)
├── public/data/
│   ├── snapshot.json           # Latest portfolio snapshot (auto-generated)
│   ├── history.json            # Star/view history log (auto-generated)
│   └── launches.json           # Launch attribution data
├── .github/workflows/
│   └── watchtower-cron.yml     # Hourly GitHub Actions workflow
└── vercel.json                 # SPA routing config
```

---

<div align="center">

Built for developers who want full visibility into their GitHub portfolio · Zero secrets in the bundle · 100% self-updating

</div>
