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
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID || '';
const IS_WEEKLY_RUN = process.argv.includes('--weekly');

const octokit = new Octokit({ auth: TOKEN || undefined });

// DEV.to Configuration
const DEVTO_USERNAME = process.env.DEVTO_USERNAME || USERNAME;
const DEVTO_API_KEY = process.env.DEVTO_API_KEY || '';

// URL Normalizer Helper
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Discover Hacker News stories linking to a repo
async function discoverHNLaunches(repos) {
  const discovered = [];
  for (const repo of repos) {
    const owner = repo.owner?.login || USERNAME;
    const repoName = repo.name;
    const query = `github.com/${owner}/${repoName}`;
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`;
    
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Watchtower/2.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.hits && data.hits.length > 0) {
        for (const hit of data.hits) {
          const hitText = `${hit.title || ''} ${hit.url || ''} ${hit.story_text || ''}`.toLowerCase();
          const targetMatch = `github.com/${owner.toLowerCase()}/${repoName.toLowerCase()}`;
          
          if (hitText.includes(targetMatch) || (hit.url && hit.url.toLowerCase().includes(repoName.toLowerCase()))) {
            const isShowHN = hit.title && hit.title.toLowerCase().includes('show hn');
            discovered.push({
              id: `hn-${hit.objectID}`,
              date: hit.created_at ? hit.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
              repo: repoName,
              platform: isShowHN ? 'Show HN' : 'Hacker News',
              title: hit.title,
              url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
              points: hit.points || 0,
              comments: hit.num_comments || 0,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Watchtower Tracker] HN Discovery Error for ${repoName}:`, err.message);
    }
  }
  return discovered;
}

// Discover Dev.to articles by username that link to the repo
async function discoverDevToLaunches(devtoUsername, repos, devtoApiKey = '') {
  let url = 'https://dev.to/api/articles';
  const headers = { 'User-Agent': 'Watchtower/2.0' };
  
  if (devtoApiKey) {
    url = 'https://dev.to/api/articles/me';
    headers['api-key'] = devtoApiKey;
  } else if (devtoUsername) {
    url = `https://dev.to/api/articles?username=${encodeURIComponent(devtoUsername)}`;
  } else {
    return [];
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const articles = await res.json();
    if (!Array.isArray(articles)) return [];
    
    const discovered = [];
    for (const art of articles) {
      const textToMatch = `${art.title || ''} ${art.description || ''} ${art.url || ''} ${art.canonical_url || ''} ${art.body_markdown || ''}`.toLowerCase();
      
      for (const repo of repos) {
        const repoNameLower = repo.name.toLowerCase();
        const ownerLower = (repo.owner?.login || USERNAME).toLowerCase();
        const explicitLinkMatch = textToMatch.includes(`github.com/${ownerLower}/${repoNameLower}`);
        const githubContextMatch = textToMatch.includes('github.com') && new RegExp(`\\b${repoNameLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(textToMatch);
        
        if (explicitLinkMatch || githubContextMatch) {
          discovered.push({
            id: `devto-${art.id}`,
            date: art.published_at ? art.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            repo: repo.name,
            platform: 'Dev.to',
            title: art.title,
            url: art.url,
            views: art.page_views_count || 0,
            reactions: art.public_reactions_count || 0,
            comments: art.comments_count || 0,
          });
        }
      }
    }
    return discovered;
  } catch (err) {
    console.error('[Watchtower Tracker] Dev.to Discovery Error:', err.message);
    return [];
  }
}

// Compute Milestone Projection
function getMilestoneProjection(repo, historyLog) {
  const currentStars = repo.stargazers_count;
  const milestoneSteps = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const nextMilestone = milestoneSteps.find(step => step > currentStars);
  
  if (!nextMilestone) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const validHistory = (historyLog || []).filter(h => h.repoStars && new Date(h.timestamp) >= sevenDaysAgo);
  let avgDailyStars = 0;
  
  if (validHistory.length > 0) {
    validHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const oldestEntry = validHistory[0];
    const oldestStars = oldestEntry.repoStars ? oldestEntry.repoStars[repo.name] : undefined;
    
    if (oldestStars !== undefined) {
      const daysDiff = (now - new Date(oldestEntry.timestamp)) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0.1) {
        const starDiff = currentStars - oldestStars;
        avgDailyStars = starDiff / daysDiff;
      }
    }
  }
  
  if (avgDailyStars <= 0 && repo.starVelocity24h > 0) {
    avgDailyStars = repo.starVelocity24h;
  }

  if (avgDailyStars <= 0) {
    return {
      nextMilestone,
      daysToMilestone: null,
      avgDailyStars: 0,
      formattedText: 'Steady pace'
    };
  }

  const daysToMilestone = (nextMilestone - currentStars) / avgDailyStars;
  const roundedDays = Math.ceil(daysToMilestone);

  if (roundedDays > 365) {
    return {
      nextMilestone,
      daysToMilestone: roundedDays,
      avgDailyStars: Number(avgDailyStars.toFixed(2)),
      formattedText: `> 1 year to ${nextMilestone} stars`
    };
  }

  return {
    nextMilestone,
    daysToMilestone: roundedDays,
    avgDailyStars: Number(avgDailyStars.toFixed(2)),
    formattedText: `~${roundedDays} days to ${nextMilestone} stars`
  };
}

let readmeCheckingDisabled = false;

// Get README.md Staleness Check
async function getReadmeStaleness(owner, repoName, pushedAt) {
  if (!TOKEN || readmeCheckingDisabled || !pushedAt) return { isStale: false };
  try {
    const res = await octokit.repos.listCommits({
      owner,
      repo: repoName,
      path: 'README.md',
      per_page: 1,
    });
    if (res.data && res.data.length > 0) {
      const lastCommitDate = new Date(res.data[0].commit.committer.date);
      const pushDate = new Date(pushedAt);
      if (isNaN(pushDate.getTime()) || isNaN(lastCommitDate.getTime())) return { isStale: false };
      
      const diffMs = pushDate - lastCommitDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffDays > 30) {
        return {
          isStale: true,
          daysSinceUpdate: Math.floor(diffDays),
          lastUpdated: lastCommitDate.toISOString().slice(0, 10)
        };
      }
    }
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      readmeCheckingDisabled = true;
    }
  }
  return { isStale: false };
}

// Compute Weekly Recommendation Line
function computeRecommendation(repo, latestViewsToday) {
  const views = repo.trafficViews14d || latestViewsToday || 0;
  const stars = repo.stargazers_count || 0;
  const velocity = repo.starVelocity24h || 0;
  const daysInactive = repo.daysInactive || 0;
  
  if (daysInactive >= 30 && stars < 15) {
    return "Repository is inactive for 30+ days. Consider archiving or scheduling a maintenance run.";
  }
  if (views > 30 && velocity === 0) {
    return "Receiving traffic but no stars. Consider reviewing the repository description and Topics to improve conversion.";
  }
  if (repo.isReadmeStale) {
    return "Code has been updated but README hasn't been touched in over 30 days. Recommend updating documentation.";
  }
  if (repo.launchesCount > 0 && velocity > 2) {
    return "Recent launch is converting well. Keep sharing updates and posts on successful platforms.";
  }
  if (velocity > 3) {
    return "Strong momentum! Excellent time to share on social channels or write a blog post.";
  }
  return "Status stable. Keep monitoring traffic and user engagement.";
}

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

  if (daysInactive < 7) score += 20;
  else if (daysInactive < 14) score += 10;
  else if (daysInactive > 30) score -= 25;

  const forkToStarRatio = repo.stargazers_count > 0 ? (repo.forks_count / repo.stargazers_count) : 0;
  if (forkToStarRatio > 0.2) score += 15;
  else if (forkToStarRatio > 0.1) score += 10;

  if (velocity24h > 3) score += 15;
  else if (velocity24h > 0) score += 5;

  if (views24h > 50) score += 10;
  else if (views24h > 10) score += 5;

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
  console.log(`\n[Watchtower Tracker] Running dynamic repository scan for target user: "${USERNAME}"`);
  console.log(`Token authentication: ${TOKEN ? 'Active (PAT Scope)' : 'Unauthenticated (Rate limit 60/hr)'}`);

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
    console.log(`Discovered ${allRepos.length} public/owned repositories dynamically.`);
  } catch (err) {
    if (err.status === 401) {
      console.warn('Token invalid (401). Retrying with public unauthenticated GitHub API...');
      try {
        const publicOctokit = new Octokit();
        const { data } = await publicOctokit.repos.listForUser({
          username: USERNAME,
          per_page: 100,
          sort: 'pushed',
          direction: 'desc',
        });
        allRepos = data.filter(r => !r.fork);
        console.log(`Discovered ${allRepos.length} public repositories dynamically (Public Mode).`);
      } catch (pubErr) {
        console.error(`Failed to fetch repositories for ${USERNAME}:`, pubErr.message);
        if (previousSnapshot) return;
      }
    } else {
      console.error(`Failed to fetch repositories for ${USERNAME}:`, err.message);
      if (previousSnapshot) return;
    }
  }

  // Fetch account level followers
  let followerCount = 0;
  try {
    const { data: userData } = await octokit.users.getByUsername({ username: USERNAME });
    followerCount = userData.followers || 0;
  } catch (err) {
    console.warn('Could not fetch follower count:', err.message);
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
  const starGainsToAlert = [];
  const forkGainsToAlert = [];

  // 1.5. Dynamic Launches/Posts Auto-Discovery
  console.log(`[Watchtower Tracker] Auto-discovering HN stories and Dev.to articles for ${allRepos.length} repositories...`);
  const discoveredHN = await discoverHNLaunches(allRepos);
  const discoveredDevTo = await discoverDevToLaunches(DEVTO_USERNAME, allRepos, DEVTO_API_KEY);
  console.log(`Auto-discovered: HN: ${discoveredHN.length} stories, Dev.to: ${discoveredDevTo.length} articles.`);

  // Merge discovered launches with manual ones
  const launchesMap = new Map();
  for (const launch of launches) {
    launchesMap.set(launch.url || launch.id || (launch.platform + '-' + launch.repo), launch);
  }

  const allDiscovered = [...discoveredHN, ...discoveredDevTo];
  for (const disc of allDiscovered) {
    const key = disc.url || disc.id;
    if (launchesMap.has(key)) {
      const existing = launchesMap.get(key);
      launchesMap.set(key, {
        ...existing,
        title: disc.title,
        points: disc.points !== undefined ? disc.points : existing.points,
        views: disc.views !== undefined ? disc.views : existing.views,
        reactions: disc.reactions !== undefined ? disc.reactions : existing.reactions,
        comments: disc.comments !== undefined ? disc.comments : existing.comments,
      });
    } else {
      launchesMap.set(key, disc);
    }
  }

  // Update stats of existing manual launches that have valid HN URLs but weren't in auto-discovered hits
  for (const [key, launch] of launchesMap.entries()) {
    if ((launch.platform === 'Show HN' || launch.platform === 'Hacker News') && launch.url && !launch.id?.startsWith('hn-')) {
      const match = launch.url.match(/id=(\d+)/);
      if (match) {
        const itemId = match[1];
        try {
          const hnRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`);
          if (hnRes.ok) {
            const item = await hnRes.json();
            launch.points = item.score || 0;
            launch.comments = item.descendants || 0;
            launch.title = item.title || launch.title;
          }
        } catch (err) {
          // ignore
        }
      }
    }
  }

  // Compare with previously saved launches to trigger real-time alerts for new posts or traction spikes
  const prevLaunchesMap = new Map();
  if (previousSnapshot) {
    launches.forEach(l => {
      const k = normalizeUrl(l.url) || l.id;
      if (k) prevLaunchesMap.set(k, l);
    });
  }

  const finalLaunches = Array.from(launchesMap.values());
  saveJson(launchesPath, finalLaunches);
  console.log(`Saved ${finalLaunches.length} total launches to ${launchesPath}`);

  const newLaunchesToAlert = [];
  const launchSpikesToAlert = [];

  // Baseline check: only alert for NEW posts if previousSnapshot had launches, avoiding cold-start spam
  const isBaselineSetup = !previousSnapshot || prevLaunchesMap.size === 0;

  if (!isBaselineSetup) {
    for (const launch of finalLaunches) {
      const key = normalizeUrl(launch.url) || launch.id;
      const prevLaunch = prevLaunchesMap.get(key);
      if (!prevLaunch) {
        newLaunchesToAlert.push(launch);
      } else {
        const pointsDiff = Math.max(0, (launch.points || 0) - (prevLaunch.points || 0));
        const viewsDiff = Math.max(0, (launch.views || 0) - (prevLaunch.views || 0));
        const reactionsDiff = Math.max(0, (launch.reactions || 0) - (prevLaunch.reactions || 0));
        const commentsDiff = Math.max(0, (launch.comments || 0) - (prevLaunch.comments || 0));

        if (pointsDiff >= 5 || viewsDiff >= 25 || reactionsDiff > 0 || commentsDiff > 0) {
          launchSpikesToAlert.push({
            launch,
            pointsDiff,
            viewsDiff,
            reactionsDiff,
            commentsDiff
          });
        }
      }
    }
  }

  for (const repo of allRepos) {
    const repoName = repo.name;
    const prev = prevRepoMap.get(repoName);
    
    const prevStars = prev ? prev.stargazers_count : repo.stargazers_count;
    const starDelta = repo.stargazers_count - prevStars;

    const prevForks = prev ? prev.forks_count : repo.forks_count;
    const forkDelta = repo.forks_count - prevForks;

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
        // Non-fatal
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
    const lang = repo.language || 'Code';
    languageStarsMap[lang] = (languageStarsMap[lang] || 0) + repo.stargazers_count;

    // Derived Metrics calculation
    const daysInactive = getDaysInactive(repo.pushed_at);
    const starVelocity24h = Math.max(0, starDelta);
    
    let viewTrend = prev?.viewTrend || [];
    const latestViewsToday = viewsData.views?.[viewsData.views.length - 1]?.count || 0;
    viewTrend = [...viewTrend.slice(-13), latestViewsToday];

    const healthScore = computeHealthScore(repo, latestViewsToday, starVelocity24h, daysInactive);
    const isDead = daysInactive >= 30 && repo.stargazers_count < 10 && latestViewsToday === 0;
    const isTrending = latestViewsToday > 50 || starVelocity24h >= 3;
    let topRefName = 'Direct / Organic';
    if (referrers.length > 0) {
      const best = referrers[0];
      const count = best.count || 0;
      topRefName = `${best.referrer} (${count} view${count === 1 ? '' : 's'})`;
    }

    // Collect Star Gain Event
    if (prev && starDelta > 0) {
      starGainsToAlert.push({
        repo: repoName,
        url: repo.html_url,
        language: lang,
        delta: starDelta,
        prevStars,
        currentStars: repo.stargazers_count,
        healthScore,
        topReferrer: topRefName,
        viewsToday: latestViewsToday,
      });
    }

    // Collect Fork Gain Event
    if (prev && forkDelta > 0) {
      forkGainsToAlert.push({
        repo: repoName,
        url: repo.html_url,
        language: lang,
        delta: forkDelta,
        prevForks,
        currentForks: repo.forks_count,
        healthScore,
        topReferrer: topRefName,
      });
    }

    // Milestone thresholds checking
    const milestoneSteps = [10, 25, 50, 100, 250, 500, 1000];
    for (const step of milestoneSteps) {
      if (prevStars < step && repo.stargazers_count >= step) {
        milestonesToAlert.push({
          repo: repoName,
          url: repo.html_url,
          milestone: step,
          currentStars: repo.stargazers_count,
          language: lang,
          healthScore,
          topReferrer: topRefName,
        });
      }
    }

    if (isTrending && (!prev || !prev.isTrending)) {
      trendingToAlert.push({
        repo: repoName,
        url: repo.html_url,
        velocity: starVelocity24h,
        views: latestViewsToday,
        language: lang,
        healthScore,
        topReferrer: topRefName,
      });
    }

    if (isDead) {
      deadReposDetected.push({ repo: repoName, daysInactive });
    }

    // Launch correlation matching for this repo
    const repoLaunches = finalLaunches.filter(l => l.repo?.toLowerCase() === repoName.toLowerCase());

    const readmeStaleness = await getReadmeStaleness(repo.owner?.login || USERNAME, repoName, repo.pushed_at);
    const milestoneProjection = getMilestoneProjection(repo, historyLog);

    const devtoViews = repoLaunches.filter(l => l.platform === 'Dev.to').reduce((sum, l) => sum + (l.views || 0), 0);
    const devtoReactions = repoLaunches.filter(l => l.platform === 'Dev.to').reduce((sum, l) => sum + (l.reactions || 0), 0);
    const devtoComments = repoLaunches.filter(l => l.platform === 'Dev.to').reduce((sum, l) => sum + (l.comments || 0), 0);
    const hnPoints = repoLaunches.filter(l => l.platform === 'Show HN' || l.platform === 'Hacker News').reduce((sum, l) => sum + (l.points || 0), 0);
    const hnComments = repoLaunches.filter(l => l.platform === 'Show HN' || l.platform === 'Hacker News').reduce((sum, l) => sum + (l.comments || 0), 0);

    const repoObjForRec = {
      name: repo.name,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      starVelocity24h,
      daysInactive,
      isReadmeStale: readmeStaleness.isStale,
      trafficViews14d: viewsData.count || 0,
      launchesCount: repoLaunches.length
    };
    const recommendation = computeRecommendation(repoObjForRec, latestViewsToday);

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
      isReadmeStale: readmeStaleness.isStale,
      readmeLastUpdated: readmeStaleness.lastUpdated,
      milestoneProjection,
      recommendation,
      crossPlatform: {
        devtoViews,
        devtoReactions,
        devtoComments,
        hnPoints,
        hnComments
      },

      // Traffic
      trafficViews14d: viewsData.count || 0,
      uniqueVisitors14d: viewsData.uniques || 0,
      trafficClones14d: clonesData.count || 0,
      viewTrend,
      topReferrers: referrers.slice(0, 5),
      popularPaths: popularPaths.slice(0, 5),
      launchesCount: repoLaunches.length,
      launches: repoLaunches,
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
  console.log(`Saved updated snapshot to: ${snapshotPath}`);

  // Append to history log
  const repoStars = {};
  processedRepos.forEach(r => {
    repoStars[r.name] = r.stargazers_count;
  });

  const newHistoryEntry = {
    timestamp: snapshotData.timestamp,
    totalStars,
    totalForks,
    totalViews14d,
    portfolioHealthAvg,
    topRepo: processedRepos[0]?.name || '',
    repoStars,
  };
  const updatedHistory = [...historyLog.slice(-180), newHistoryEntry];
  saveJson(historyPath, updatedHistory);

  // 6. Webhook Alerts Triggering (Rich Embeds for Discord & Rich Markdown for Telegram)
  
  // Star Gains
  for (const s of starGainsToAlert) {
    const embed = {
      title: `Star Gain Alert — ${s.repo}`,
      description: `**[${s.repo}](${s.url})** just received new stargazers!`,
      color: 0x00f0ff, // Neon Cyan
      fields: [
        { name: 'Stars Gained', value: `+${s.delta} star${s.delta > 1 ? 's' : ''} (${s.prevStars} → ${s.currentStars})`, inline: true },
        { name: 'Language', value: s.language, inline: true },
        { name: 'Health Index', value: `${s.healthScore}/100`, inline: true },
        { name: 'Top Referrer (14d)', value: s.topReferrer, inline: false },
      ],
      footer: { text: 'Watchtower • Portfolio Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`*STAR GAIN ALERT — ${s.repo}*\n\n*Gained:* +${s.delta} star${s.delta > 1 ? 's' : ''} (${s.prevStars} → ${s.currentStars})\n*Language:* ${s.language}\n*Health Score:* ${s.healthScore}/100\n*Top Referrer (14d):* ${s.topReferrer}\n*URL:* ${s.url}`);
  }

  // Fork Gains
  for (const f of forkGainsToAlert) {
    const embed = {
      title: `New Code Fork — ${f.repo}`,
      description: `Someone just cloned and forked **[${f.repo}](${f.url})**!`,
      color: 0x10b981, // Neon Emerald
      fields: [
        { name: 'Forks Count', value: `+${f.delta} fork (${f.prevForks} → ${f.currentForks})`, inline: true },
        { name: 'Language', value: f.language, inline: true },
        { name: 'Health Index', value: `${f.healthScore}/100`, inline: true },
        { name: 'Top Referrer (14d)', value: f.topReferrer, inline: false },
      ],
      footer: { text: 'Watchtower • Portfolio Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`*NEW CODE FORK — ${f.repo}*\n\n*Forks:* +${f.delta} fork (${f.prevForks} → ${f.currentForks})\n*Language:* ${f.language}\n*Health Score:* ${f.healthScore}/100\n*Top Referrer (14d):* ${f.topReferrer}\n*URL:* ${f.url}`);
  }

  // Milestones
  for (const m of milestonesToAlert) {
    const embed = {
      title: `Milestone Reached — ${m.repo}`,
      description: `**[${m.repo}](${m.url})** has officially crossed **${m.milestone} stars**!`,
      color: 0xa855f7, // Neon Purple
      fields: [
        { name: 'Total Stars', value: `${m.currentStars} stars`, inline: true },
        { name: 'Language', value: m.language, inline: true },
        { name: 'Health Index', value: `${m.healthScore}/100`, inline: true },
        { name: 'Traffic Source', value: m.topReferrer, inline: false },
      ],
      footer: { text: 'Watchtower • Portfolio Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`*MILESTONE REACHED — ${m.repo}*\n\n*Stars:* Reached ${m.milestone} stars!\n*Language:* ${m.language}\n*Health Score:* ${m.healthScore}/100\n*Traffic Source:* ${m.topReferrer}\n*URL:* ${m.url}`);
  }

  // Trending
  for (const t of trendingToAlert) {
    const embed = {
      title: `Trending Alert — ${t.repo}`,
      description: `**[${t.repo}](${t.url})** activity is spiking above baseline!`,
      color: 0xf59e0b, // Neon Amber
      fields: [
        { name: '24h Velocity', value: `+${t.velocity} stars`, inline: true },
        { name: 'Views Today', value: `${t.views} views`, inline: true },
        { name: 'Health Index', value: `${t.healthScore}/100`, inline: true },
        { name: 'Traffic Source', value: t.topReferrer, inline: false },
      ],
      footer: { text: 'Watchtower • Portfolio Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });
    await sendTelegramNotification(`*TRENDING ALERT — ${t.repo}*\n\n*24h Velocity:* +${t.velocity} stars\n*Views Today:* ${t.views} views\n*Health Score:* ${t.healthScore}/100\n*Traffic Source:* ${t.topReferrer}\n*URL:* ${t.url}`);
  }

  // Dead Repos
  for (const d of deadReposDetected) {
    if (!previousSnapshot || !prevRepoMap.get(d.repo)?.isDead) {
      const embed = {
        title: `Inactive Repo Flagged — ${d.repo}`,
        description: `**${d.repo}** has 0 views and 0 activity in over ${d.daysInactive} days. Candidate to archive or revive!`,
        color: 0xef4444, // Neon Red
        timestamp: new Date().toISOString(),
      };
      await sendDiscordNotification({ embeds: [embed] });
    }
  }

  // New Cross-Platform Post Discovered Alerts
  for (const l of newLaunchesToAlert) {
    const embed = {
      title: `Cross-Platform Post Detected — ${l.repo}`,
      description: `Watchtower auto-discovered a new post on **${l.platform}**: [${l.title}](${l.url})`,
      color: 0x8b5cf6,
      fields: [
        { name: 'Target Repository', value: l.repo, inline: true },
        { name: 'Platform', value: l.platform, inline: true },
        { name: 'Initial Stats', value: l.views !== undefined && l.views > 0 ? `${l.views} views, ${l.reactions || 0} reactions` : `${l.points || 0} points, ${l.comments || 0} comments`, inline: false },
      ],
      footer: { text: 'Watchtower • Cross-Platform Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });

    let tgMsg = `*CROSS-PLATFORM POST DETECTED — ${l.repo}*\n\n` +
      `*Platform:* ${l.platform}\n` +
      `*Title:* ${l.title}\n` +
      `*URL:* ${l.url}\n`;
    if (l.views !== undefined && l.views > 0) tgMsg += `*Stats:* ${l.views} views, ${l.reactions || 0} reactions, ${l.comments || 0} comments`;
    else tgMsg += `*Stats:* ${l.points || 0} points, ${l.comments || 0} comments`;
    
    await sendTelegramNotification(tgMsg);
  }

  // Cross-Platform Post Engagement & Traction Alerts
  for (const s of launchSpikesToAlert) {
    const l = s.launch;

    const deltas = [];
    if (s.reactionsDiff > 0) deltas.push(`+${s.reactionsDiff} new reaction${s.reactionsDiff > 1 ? 's' : ''} (${l.reactions} total)`);
    if (s.commentsDiff > 0) deltas.push(`+${s.commentsDiff} new comment${s.commentsDiff > 1 ? 's' : ''} (${l.comments} total)`);
    if (s.pointsDiff >= 5) deltas.push(`+${s.pointsDiff} points (${l.points} total)`);
    if (s.viewsDiff >= 25) deltas.push(`+${s.viewsDiff} views (${l.views} total)`);

    const deltaText = deltas.join(', ') || 'Activity update';

    const embed = {
      title: `Post Engagement Alert — ${l.repo}`,
      description: `New engagement on **${l.platform}**: [${l.title}](${l.url})`,
      color: 0xec4899,
      fields: [
        { name: 'Platform', value: l.platform, inline: true },
        { name: 'Target Repo', value: l.repo, inline: true },
        { name: 'Activity Delta', value: deltaText, inline: false },
      ],
      footer: { text: 'Watchtower • Cross-Platform Intelligence' },
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [embed] });

    let tgMsg = `*POST ENGAGEMENT ALERT — ${l.repo}*\n\n` +
      `*Platform:* ${l.platform}\n` +
      `*Title:* ${l.title}\n` +
      `*Activity:* ${deltaText}\n` +
      `*URL:* ${l.url}`;
    
    await sendTelegramNotification(tgMsg);
  }

  // Weekly Summary Digest
  if (IS_WEEKLY_RUN) {
    console.log('Generating Weekly Digest Notification...');
    const topPerformer = [...processedRepos].sort((a, b) => b.starVelocity24h - a.starVelocity24h)[0];
    const topRef = topReferrersList[0]?.name || 'Direct / Organic';

    const totalHNPoints = finalLaunches.filter(l => l.platform === 'Show HN' || l.platform === 'Hacker News').reduce((sum, l) => sum + (l.points || 0), 0);
    const totalDevToViews = finalLaunches.filter(l => l.platform === 'Dev.to').reduce((sum, l) => sum + (l.views || 0), 0);
    const staleReadmes = processedRepos.filter(r => r.isReadmeStale);
    const activeRecs = processedRepos.filter(r => r.recommendation && r.recommendation !== "Status stable. Keep monitoring traffic and user engagement.");

    const fields = [
      { name: 'Total Stars', value: `${totalStars}`, inline: true },
      { name: 'Total Views (14d)', value: `${totalViews14d}`, inline: true },
      { name: 'Health Index', value: `${portfolioHealthAvg}/100`, inline: true },
      { name: 'Top Performer', value: topPerformer ? `${topPerformer.name} (+${topPerformer.starVelocity24h} stars)` : 'N/A', inline: false },
      { name: 'Top Traffic Source', value: topRef, inline: true },
      { name: 'Inactive Repos Flagged', value: `${deadReposDetected.length}`, inline: true },
    ];

    if (totalHNPoints > 0 || totalDevToViews > 0) {
      fields.push({
        name: 'Cross-Platform Metrics',
        value: `Hacker News: ${totalHNPoints} points\nDev.to: ${totalDevToViews} views`,
        inline: false
      });
    }

    if (staleReadmes.length > 0) {
      fields.push({
        name: 'Stale Documentation Warnings',
        value: staleReadmes.map(r => `${r.name} (stale since: ${r.readmeLastUpdated || 'unknown'})`).join('\n'),
        inline: false
      });
    }

    if (activeRecs.length > 0) {
      fields.push({
        name: 'Weekly Action Items',
        value: activeRecs.map(r => `${r.name}: ${r.recommendation}`).join('\n'),
        inline: false
      });
    }

    const weeklyEmbed = {
      title: `Watchtower Weekly Digest — ${USERNAME}`,
      description: `Here is your portfolio performance breakdown for the past week:`,
      color: 0xa855f7,
      fields,
      timestamp: new Date().toISOString(),
    };
    await sendDiscordNotification({ embeds: [weeklyEmbed] });

    let telegramMsg = `*WATCHTOWER WEEKLY DIGEST*\n\n*Total Stars:* ${totalStars}\n*Views (14d):* ${totalViews14d}\n*Health Index:* ${portfolioHealthAvg}/100\n*Top Performer:* ${topPerformer?.name || 'N/A'}\n*Top Traffic Source:* ${topRef}`;

    if (totalHNPoints > 0 || totalDevToViews > 0) {
      telegramMsg += `\n\n*Cross-Platform Metrics*\n- Hacker News: ${totalHNPoints} points\n- Dev.to: ${totalDevToViews} views`;
    }

    if (staleReadmes.length > 0) {
      telegramMsg += `\n\n*Stale Documentation Warnings*\n` + staleReadmes.map(r => `- ${r.name} (stale since: ${r.readmeLastUpdated || 'unknown'})`).join('\n');
    }

    if (activeRecs.length > 0) {
      telegramMsg += `\n\n*Weekly Action Items*\n` + activeRecs.map(r => `- ${r.name}: ${r.recommendation}`).join('\n');
    }

    await sendTelegramNotification(telegramMsg);
  }

  console.log('[Watchtower Tracker] Scanning and update process complete!\n');
}

runTracker().catch(err => {
  console.error('[Fatal Error in Watchtower Tracker]', err);
  process.exit(1);
});
