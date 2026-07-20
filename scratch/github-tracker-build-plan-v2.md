# GitHub Portfolio Tracker — Full Build Plan (v2, Full Feature Set)

## What this is
A self-updating system that tracks your entire GitHub portfolio (all current AND future repos automatically), tells you what changed, where the traffic came from, how each repo is trending, and gives you a weekly digest of what's actually working — so future launches (HN/Reddit/Dev.to/awesome-lists) can be measured, not guessed at.

Cost: **$0**. Everything below runs on free tiers (GitHub Actions, GitHub API, Discord/Telegram, Vercel/Netlify).

---

## Core principle: one data pipeline, many consumers

Build ONE script that fetches + processes everything, saves it to a snapshot file. Notifications and the dashboard both just read from that same snapshot — don't build the fetching logic twice.

```
[GitHub Actions cron, hourly]
        |
        v
[Fetch script]
   1. Get live repo list (dynamic — no hardcoding)
   2. Pull stats per repo
   3. Compute derived metrics (velocity, ratios, flags)
   4. Diff against last snapshot
   5. Save new snapshot + append to history log
   6. Send notifications if thresholds crossed
        |
        v
[Discord/Telegram]              [Dashboard reads snapshot + history]
```

---

## Part 1: Dynamic repo discovery (do this first, always)

- Call `GET /users/shlokkokk/repos?per_page=100` at the start of every run — returns your live, current repo list
- Any new repo pushed shows up in the very next run automatically, zero manual config
- Filter out forks of other people's repos if you don't want those tracked (`fork: false` in the API response)
- Optionally exclude specific repos via a small ignore-list in config (e.g. test repos, forks you don't care about)

---

## Part 2: Data to pull per repo

**Always available, live, no lag:**
- `stargazers_count`, `forks_count`, `watchers_count`, `open_issues_count`, `subscribers_count`
- `created_at`, `pushed_at`, `updated_at` — last activity timestamps
- `language` — primary language (for portfolio-level breakdowns)

**Traffic data (owner-only, 14-day rolling window, updates ~daily):**
- `GET /repos/{owner}/{repo}/traffic/views` — daily views + unique visitors
- `GET /repos/{owner}/{repo}/traffic/clones` — daily clone counts + unique cloners
- `GET /repos/{owner}/{repo}/traffic/popular/referrers` — **top traffic sources** (dev.to, news.ycombinator.com, google, t.co, github.com, etc.) with view + unique visitor counts
- `GET /repos/{owner}/{repo}/traffic/popular/paths` — which specific pages got hit (README vs a specific file vs releases)

**Engagement/quality signals:**
- `GET /repos/{owner}/{repo}/issues?state=open&creator=NOT_YOU` — issues opened by strangers (real engagement signal)
- `GET /repos/{owner}/{repo}/pulls?state=open` — external PRs
- Fork-to-star ratio = `forks_count / stargazers_count` (compute yourself, no endpoint needed)

**New follower tracking (account-level, not per-repo):**
- `GET /users/shlokkokk/followers` — compare count over time

---

## Part 3: Derived / computed metrics (the "top tier" layer)

These aren't API calls — they're math you do on top of the raw data, and they're what actually makes this useful instead of just a stats mirror.

1. **Star velocity** — stars gained in last 24h / last 7d, not just total. Total stars can be misleading (old repo with slow trickle vs new repo exploding). Velocity tells you what's hot *right now*.
2. **Milestone crossing** — flag and specially notify when any repo crosses 10 / 25 / 50 / 100 / 250 stars. Don't just fire generic "+1" every time.
3. **Trending flag** — if a repo's 24h star/view count is significantly above its own 30-day average, flag it as "trending" (simple version: today's count > 3x the daily average over the past month)
4. **Fork-to-star ratio** — high ratio = people actually cloning/using the code, not just bookmarking. Worth surfacing per repo.
5. **Time-to-first-star-after-launch** — if you log launch dates (see Part 5), compute how long after posting the first new star landed. Tells you which platforms convert fastest.
6. **Dead repo detector** — flag any repo with zero views, zero stars, zero activity in 30+ days. These are candidates to archive (like ReconMaster) or revisit.
7. **Language/tech breakdown** — % of total portfolio stars grouped by primary language — tells you what people actually respond to (e.g. "your React/TS projects get 3x the stars of your Python ones") which is genuinely useful for deciding what to build next.
8. **Best-performing referrer, portfolio-wide** — aggregate referrer data across ALL repos to find your single best distribution channel overall, not just per-repo.

---

## Part 4: Notifications (Discord webhook or Telegram bot, both free)

### Event-triggered notifications (real-time-ish, checked hourly)
```
⭐ ShellStack +3 stars (4 → 7) in the last hour
📈 Top referrer today: dev.to (142 views), news.ycombinator.com (58 views)
🔥 Trending: 3x your normal daily star rate
```

```
🎉 Milestone: Oculus just crossed 25 stars!
```

```
💀 Dead repo alert: "cyberforge-atlas" — 0 activity in 30+ days. Archive or revive?
```

### Weekly digest (Sunday night, one summary instead of constant pings)
```
📊 Week in review — July 14-20
Total new stars: 12 (up from 4 last week)
Best performer: ShellStack (+7 stars, 340 views)
Best referrer overall: dev.to (58% of all traffic this week)
New PRs from strangers: 1 (on Oculus)
Dead repos flagged: cyberforge-atlas, Sentinel
```

---

## Part 5: Launch correlation (measure what actually works)

- Keep a simple log (a JSON or even a markdown file you edit manually) of when/where you posted something:
  ```json
  { "date": "2026-07-19", "repo": "ShellStack", "platform": "Show HN" }
  { "date": "2026-07-19", "repo": "ShellStack", "platform": "Dev.to" }
  ```
- The script cross-references this against the referrer + star-velocity data for that repo in the days following
- Over time this answers, with actual data instead of guessing: "Does HN or Dev.to convert better for me?" "Does posting on weekday mornings beat midnight posts?"
- This log entry is the one piece of **manual input** — everything else is automatic. Takes 10 seconds per launch to log.

---

## Part 6: Dashboard (the visual, on-demand view)

### Layout
- **Header row**: total stars across portfolio, total views this week, biggest mover this week, current star velocity leader
- **Grid of repo cards** (one per repo, auto-populated from live repo list):
  - Name, current stars/forks, small sparkline (14-day view trend)
  - Top 2 referrer sources as small tags
  - Trending flag badge if applicable
  - Fork-to-star ratio
  - "Last activity X days ago"
- **Sort/filter options**: most active this week, most starred, trending now, needs attention (dead repos), by language
- **Language breakdown chart** — pie/bar of stars by primary language
- **Launch correlation view** — a simple timeline showing your logged launches as markers against each repo's star growth curve

### Build approach
- Frontend reads the same snapshot JSON the watcher already produces — don't re-fetch from GitHub live, just read your own processed data (faster, and doesn't burn API rate limit twice)
- Terminal/cyber aesthetic to match ShellStack and your profile README — dark background, neon accents, monospace font
- Host free on Vercel or Netlify

---

## Build Order (hand this to Antigravity as the execution sequence)

1. Create private repo `portfolio-tracker`
2. Write core fetch script (Node.js + `octokit`, or Python + `requests`) — start with just: dynamic repo list + basic stats (stars/forks/watchers) for ONE repo, confirm it works
3. Expand to loop over all repos dynamically
4. Add traffic/referrer endpoints
5. Add the derived metrics layer (velocity, ratios, trending flag, dead repo detector)
6. Add snapshot save/load + diffing logic
7. Add Discord webhook (or Telegram bot) — test with a dummy message first, then wire in real event-triggered messages
8. Add the weekly digest (separate scheduled run, e.g. Sunday 8pm cron)
9. Add the manual launch-log file + correlation logic
10. Wire everything into GitHub Actions with proper cron schedules (hourly for checks, weekly for digest)
11. Build the dashboard reading from the snapshot/history data
12. Polish UI to match your aesthetic

## Manual steps YOU do (not the AI)
- Create the Discord server + webhook URL (or Telegram bot via @BotFather) — 2 min one-time setup
- Generate a GitHub Personal Access Token with `repo` scope, add it as an Actions secret — 2 min
- Log launch dates/platforms in the launch-log file whenever you post something new — 10 sec each time
- Occasionally review the "dead repo" flags and decide archive vs revive

## Things to double-check as it's built
- Rate limits: 5,000 authenticated requests/hour — with ~20 repos checked hourly across ~5 endpoints each, you're using roughly 100/hour, nowhere near the limit even as your repo count grows
- Traffic/referrer data is owner-only and only goes back 14 days, refreshes roughly daily — this is a GitHub platform limit, not fixable
- Never commit the token in code — Actions secret or local `.env` (gitignored) only
- Once this is working, it's a genuinely good project to post about itself ("built a tool to track my own portfolio's growth") — a nice future Show HN/Dev.to candidate in its own right
