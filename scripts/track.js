import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from '@octokit/rest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Config & Environment Variables
const USERNAME = process.env.GH_USERNAME || process.env.VITE_DEFAULT_USERNAME || 'shlokkokk';
const TOKEN = process.env.GH_PAT || process.env.VITE_GH_PAT || process.env.GITHUB_TOKEN || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const IS_WEEKLY_RUN = process.argv.includes('--weekly');

const octokit = new Octokit({ auth: TOKEN || undefined });

// Helper to load JSON safely
function loadJson(filepath, fallback) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch (err) {
    console.warn(`[Watchtower Tracker] Failed to parse ${filepath}, using fallback:`, err.message);
  }
  return fallback;
}

// Helper to save JSON safely
function saveJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

// Compute Portfolio Health Score (0 - 100)
function computeHealthScore(repo, views24h, velocity24h, daysInactive) {
  let score = 50; // base score

  // Activity points
  if (daysInactive < 7) score += 20;
  else if (daysInactive < 14) score += 10;
  else if (daysInactive > 30) score -= 25;

  // Star ratio
  const forkToStarRatio = repo.stargazers_count > 0 ? (repo.forks_count / repo.stargazers_count) : 0;
  if (forkToStarRatio > 0.2) score += 15;
  else if (forkToStarRatio > 0.1) score += 10;

  // Velocity bonus
  if (velocity24h > 3) score += 15;
  else if (velocity24h > 0) score += 5;

  // Views bonus
  if (views24h > 50) score += 10;
  else if (views24h > 10) score += 5;

  // Issues penalty/bonus
  if (repo.open_issues_count === 0 && repo.stargazers_count > 5) score += 5;

  return Math.min(100, Math.max(0, score));
}

// Calculate Days Inactive
function getDaysInactive(pushedAt) {
  if (!pushedAt) return 999;
  const diffTime = Math.abs(new Date() - new Date(pushedAt));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Webhook Sender (Discord Embeds)
async function sendDiscordNotification(payload) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[Discord Webhook Error] ${res.status} ${res.statusText}`);
    } else {
      console.log(`[Discord Notification Sent] ${payload.embeds?.[0]?.title || 'Alert'}`);
    }
  } catch (err) {
    console.error('[Discord Webhook Error]', err.message);
  }
}

// Webhook Sender (Telegram)
async function sendTelegramNotification(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
    });
    if (!res.ok) console.error(`[Telegram Error] ${res.status}`);
  } catch (err) {
    console.error('[Telegram Error]', err.message);
  }
}

async function runTracker() {
  console.log(`\n📡 [Watchtower Tracker] Running dynamic repository scan for target user: "${USERNAME}"`);
  console.log(`🔑 Token authentication: ${TOKEN ? 'Active (PAT Scope)' : 'Unauthenticated (Rate limit 60/hr)'}`);

  const snapshotPath = path.join(DATA_DIR, 'snapshot.json');
  const historyPath = path.join(DATA_DIR, 'history.json');
  const launchesPath = path.join(DATA_DIR, 'launches.json');

  const previousSnapshot = loadJson(snapshotPath, null);
  const historyLog = loadJson(historyPath, []);
  const launches = loadJson(launchesPath, []);

  // 1. Dynamic Repo Discovery
  let allRepos = [];
  try {
    const { data } = await octokit.repos.listForUser({
      username: USERNAME,
      per_page: 100,
      sort: 'pushed',
      direction: 'desc',
    });
    allRepos = data.filter(r => !r.fork);
    console.log(`✅ Discovered ${allRepos.length} public/owned repositories dynamically.`);
  } catch (err) {
    if (err.status === 401) {
      console.warn('⚠️ Token invalid (401). Retrying with public unauthenticated GitHub API...');
      try {
        const publicOctokit = new Octokit();
        const { data } = await publicOctokit.repos.listForUser({
          username: USERNAME,
          per_page: 100,
          sort: 'pushed',
          direction: 'desc',
        });
        allRepos = data.filter(r => !r.fork);
        console.log(`✅ Discovered ${allRepos.length} public repositories dynamically (Public Mode).`);
      } catch (pubErr) {
        console.error(`❌ Failed to fetch repositories for ${USERNAME}:`, pubErr.message);
        if (previousSnapshot) {
          console.log('⚠️ Using previous snapshot due to fetch error.');
          return;
        }
      }
    } else {
      console.error(`❌ Failed to fetch repositories for ${USERNAME}:`, err.message);
      if (previousSnapshot) {
        console.log('⚠️ Using previous snapshot due to fetch error.');
        return;
      }
    }
  }

  // Fetch account level followers
  let followerCount = 0;
  try {
    const { data: userData } = await octokit.users.getByUsername({ username: USERNAME });
    followerCount = userData.followers || 0;
  } catch (err) {
    console.warn('⚠️ Could not fetch follower count:', err.message);
  }

  const prevRepoMap = new Map();
  if (previousSnapshot && previousSnapshot.repos) {
    previousSnapshot.repos.forEach(r => prevRepoMap.set(r.name, r));
  }

  const processedRepos = [];
  let totalStars = 0;
  let totalForks = 0;
  let totalOpenIssues = 0;
  let totalViews14d = 0;
  let totalClones14d = 0;
  const referrerAggregator = {};
  const languageStarsMap = {};

  const milestonesToAlert = [];
  const trendingToAlert = [];
  const deadReposDetected = [];

  for (const repo of allRepos) {
    const repoName = repo.name;
    const prev = prevRepoMap.get(repoName);
    const prevStars = prev ? prev.stargazers_count : repo.stargazers_count;
    const starDelta = repo.stargazers_count - prevStars;

    // Traffic data (Owner only with PAT)
    let viewsData = { count: 0, uniques: 0, views: [] };
    let clonesData = { count: 0, uniques: 0, clones: [] };
    let referrers = [];
    let popularPaths = [];

    if (TOKEN) {
      try {
        const [viewsRes, clonesRes, refRes, pathsRes] = await Promise.allSettled([
          octokit.repos.getViews({ owner: USERNAME, repo: repoName }),
          octokit.repos.getClones({ owner: USERNAME, repo: repoName }),
          octokit.repos.getTopReferrers({ owner: USERNAME, repo: repoName }),
          octokit.repos.getTopPaths({ owner: USERNAME, repo: repoName }),
        ]);

        if (viewsRes.status === 'fulfilled') viewsData = viewsRes.value.data;
        if (clonesRes.status === 'fulfilled') clonesData = clonesRes.value.data;
        if (refRes.status === 'fulfilled') referrers = refRes.value.data || [];
        if (pathsRes.status === 'fulfilled') popularPaths = pathsRes.value.data || [];
      } catch (err) {
        // Non-fatal if missing permission on specific repo
      }
    }

    // Accumulate aggregate traffic
    totalViews14d += viewsData.count || 0;
    totalClones14d += clonesData.count || 0;
    totalStars += repo.stargazers_count;
    totalForks += repo.forks_count;
    totalOpenIssues += repo.open_issues_count;

    // Referrer aggregation
    referrers.forEach(ref => {
      if (!referrerAggregator[ref.referrer]) {
        referrerAggregator[ref.referrer] = { count: 0, uniques: 0 };
      }
      referrerAggregator[ref.referrer].count += ref.count;
      referrerAggregator[ref.referrer].uniques += ref.uniques;
    });

    // Language star breakdown
    const lang = repo.language || 'Other';
    languageStarsMap[lang] = (languageStarsMap[lang] || 0) + repo.stargazers_count;

    // Derived Metrics calculation
    const daysInactive = getDaysInactive(repo.pushed_at);
    const starVelocity24h = Math.max(0, starDelta);
    
    // Sparkline history data from previous snapshots if available
    let viewTrend = prev?.viewTrend || [];
    const latestViewsToday = viewsData.views?.[viewsData.views.length - 1]?.count || 0;
    viewTrend = [...viewTrend.slice(-13), latestViewsToday];

    // Compute Health & Flags
    const healthScore = computeHealthScore(repo, latestViewsToday, starVelocity24h, daysInactive);
    const isDead = daysInactive >= 30 && repo.stargazers_count < 10 && latestViewsToday === 0;
    const isTrending = latestViewsToday > 50 || starVelocity24h >= 3;
    const forkToStarRatio = repo.stargazers_count > 0 ? Number((repo.forks_count / repo.stargazers_count).toFixed(2)) : 0;

    // Milestone thresholds checking
    const milestoneSteps = [10, 25, 50, 100, 250, 500, 1000];
    for (const step of milestoneSteps) {
      if (prevStars < step && repo.stargazers_count >= step) {
        milestonesToAlert.push({ repo: repoName, milestone: step, currentStars: repo.stargazers_count });
      }
    }

    if (isTrending && (!prev || !prev.isTrending)) {
      trendingToAlert.push({ repo: repoName, velocity: starVelocity24h, views: latestViewsToday });
    }

    if (isDead) {
      deadReposDetected.push({ repo: repoName, daysInactive });
    }

    // Launch correlation matching for this repo
    const repoLaunches = launches.filter(l => l.repo?.toLowerCase() === repoName.toLowerCase());

    processedRepos.push({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      language: repo.language || 'Unspecified',
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      open_issues_count: repo.open_issues_count,
      pushed_at: repo.pushed_at,
      updated_at: repo.updated_at,
      created_at: repo.created_at,

      // Derived fields
      starVelocity24h,
      forkToStarRatio,
      daysInactive,
      healthScore,
      isTrending,
      isDead,

      // Traffic
      trafficViews14d: viewsData.count || 0,
      uniqueVisitors14d: viewsData.uniques || 0,
      trafficClones14d: clonesData.count || 0,
      viewTrend,
      topReferrers: referrers.slice(0, 5),
      popularPaths: popularPaths.slice(0, 5),
      launchesCount: repoLaunches.length,
    });
  }

  // Top overall referrer
  const topReferrersList = Object.entries(referrerAggregator)
    .map(([name, stat]) => ({ name, count: stat.count, uniques: stat.uniques }))
    .sort((a, b) => b.count - a.count);

  // Velocity Leader
  const velocityLeader = [...processedRepos].sort((a, b) => b.starVelocity24h - a.starVelocity24h)[0];

  // Portfolio Health Average
  const portfolioHealthAvg = processedRepos.length > 0
    ? Math.round(processedRepos.reduce((acc, r) => acc + r.healthScore, 0) / processedRepos.length)
    : 0;

  // Language Breakdown
  const languageBreakdown = Object.entries(languageStarsMap)
    .map(([lang, count]) => ({
      language: lang,
      stars: count,
      percentage: totalStars > 0 ? Number(((count / totalStars) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.stars - a.stars);

  const snapshotData = {
    timestamp: new Date().toISOString(),
    username: USERNAME,
    summary: {
      totalRepos: processedRepos.length,
      totalStars,
      totalForks,
      totalOpenIssues,
      totalViews14d,
      totalClones14d,
      followerCount,
      portfolioHealthAvg,
      velocityLeader: velocityLeader ? { name: velocityLeader.name, velocity: velocityLeader.starVelocity24h } : null,
      topReferrerOverall: topReferrersList[0] || null,
      trendingCount: processedRepos.filter(r => r.isTrending).length,
      deadCount: processedRepos.filter(r => r.isDead).length,
    },
    languageBreakdown,
    topReferrers: topReferrersList.slice(0, 10),
    repos: processedRepos,
  };

  // Save current snapshot
  saveJson(snapshotPath, snapshotData);
  console.log(`💾 Saved updated snapshot to: ${snapshotPath}`);

  // Append to history log
  const newHistoryEntry = {
    timestamp: snapshotData.timestamp,
    totalStars,
    totalForks,
    totalViews14d,
    portfolioHealthAvg,
    topRepo: processedRepos[0]?.name || '',
  };
  const updatedHistory = [...historyLog.slice(-180), newHistoryEntry];
  saveJson(historyPath, updatedHistory);

  // 6. Webhook Alerts Triggering
  // Milestones
  for (const m of milestonesToAlert) {
    const embed = {
      title: `Milestone Crossed!`,
      description: `**[${m.repo}](https://github.com/${USERNAME}/${m.repo})** just reached **${m.milestone} stars**! (Current: ${m.currentStars} stars)`,
      color: 0x00f0ff,
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`Milestone Crossed! \n\nRepo: *${m.repo}*\nReached: *${m.milestone} stars*!`);
  }

  // Trending
  for (const t of trendingToAlert) {
    const embed = {
      title: `Repo Trending Alert!`,
      description: `**[${t.repo}](https://github.com/${USERNAME}/${t.repo})** is blowing up! Gained +${t.velocity} stars in 24h with ${t.views} views.`,
      color: 0x10b981,
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`Trending Alert! \n\nRepo: *${t.repo}*\n+${t.velocity} stars in 24h! Views: ${t.views}`);
  }

  // Dead Repos
  for (const d of deadReposDetected) {
    if (!previousSnapshot || !prevRepoMap.get(d.repo)?.isDead) {
      const embed = {
        title: `Inactive Repo Flagged`,
        description: `**${d.repo}** has 0 views and 0 activity in over ${d.daysInactive} days. Candidate to archive or revive!`,
        color: 0xef4444,
        timestamp: new Date().toISOString(),
      };
      await sendDiscordNotification({ embeds: [embed] });
    }
  }

  // Weekly Summary Digest
  if (IS_WEEKLY_RUN) {
    console.log('Generating Weekly Digest Notification...');
    const topPerformer = [...processedRepos].sort((a, b) => b.starVelocity24h - a.starVelocity24h)[0];
    const topRef = topReferrersList[0]?.name || 'Direct / None';
    const weeklyEmbed = {
      title: `Watchtower Weekly Digest — ${USERNAME}`,
      description: `Here is your portfolio performance breakdown for the past week:`,
      color: 0xa855f7,
      fields: [
        { name: 'Total Stars', value: `${totalStars}`, inline: true },
        { name: 'Total Views (14d)', value: `${totalViews14d}`, inline: true },
        { name: 'Health Index', value: `${portfolioHealthAvg}/100`, inline: true },
        { name: 'Top Performer', value: topPerformer ? `${topPerformer.name} (+${topPerformer.starVelocity24h} stars)` : 'N/A', inline: false },
        { name: 'Top Traffic Source', value: topRef, inline: true },
        { name: 'Inactive Repos Flagged', value: `${deadReposDetected.length}`, inline: true },
      ],
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [weeklyEmbed] });
    await sendTelegramNotification(`Watchtower Weekly Digest\n\nTotal Stars: ${totalStars}\nViews (14d): ${totalViews14d}\nHealth Score: ${portfolioHealthAvg}/100\nTop Performer: ${topPerformer?.name || 'N/A'}`);
  }

  console.log('✨ [Watchtower Tracker] Scanning and update process complete!\n');
}

runTracker().catch(err => {
  console.error('💥 Fatal error in Watchtower Tracker:', err);
  process.exit(1);
});
