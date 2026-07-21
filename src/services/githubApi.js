// Browser GitHub API Client — proxies all calls through /api/github
// GH_PAT is added server-side and NEVER reaches this file or the browser bundle.

const SESSION_KEY = 'wt_session_token';

function getSessionToken() {
  return localStorage.getItem(SESSION_KEY) || '';
}

function authHeaders() {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getInitialRateLimit() {
  return {
    limit: 5000,
    remaining: 5000,
    reset: null,
    // Server always uses PAT if configured — we start optimistic
    isAuthenticated: true,
  };
}

export let currentRateLimit = getInitialRateLimit();

/**
 * Makes an authenticated request through the Watchtower GitHub proxy.
 * @param {string} path - GitHub API path e.g. "/users/shlokkokk"
 * @param {Record<string,string>} params - Additional query params
 */
async function proxyGitHub(path, params = {}) {
  const qs = new URLSearchParams({ path, ...params }).toString();
  const res = await fetch(`/api/github?${qs}`, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  });

  // Update rate-limit state from proxy-forwarded headers
  updateRateLimit(res.headers);

  if (res.status === 401) {
    // Session expired — clear token so PasswordGate re-appears
    localStorage.removeItem(SESSION_KEY);
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const status = res.status;
    if (status === 403) {
      throw new Error('GitHub Rate Limit Exceeded. The server-side PAT quota may be full.');
    }
    if (status === 404) {
      throw new Error(body.message || `GitHub user not found.`);
    }
    throw new Error(body.error || body.message || `GitHub API Error (${status})`);
  }

  return res.json();
}

export async function fetchLivePortfolio(username, existingSnapshot = null) {
  try {
    // 1. User profile
    const userData = await proxyGitHub(`/users/${encodeURIComponent(username)}`);

    // 2. Repos list
    const rawRepos = await proxyGitHub(`/users/${encodeURIComponent(username)}/repos`, {
      per_page: '100',
      sort: 'pushed',
      direction: 'desc',
    });

    const repos = Array.isArray(rawRepos) ? rawRepos.filter(r => !r.fork) : [];

    // Transform raw repos into Watchtower schema
    const processedRepos = repos.map(repo => {
      const daysInactive = getDaysInactive(repo.pushed_at);
      const forkToStarRatio = repo.stargazers_count > 0
        ? Number((repo.forks_count / repo.stargazers_count).toFixed(2))
        : 0;
      const isDead = daysInactive >= 30 && repo.stargazers_count < 10;
      const isTrending = repo.stargazers_count > 25;

      const existingRepo = existingSnapshot?.repos?.find(r => r.name === repo.name);

      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description || 'No description provided.',
        language: repo.language || 'Unspecified',
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        watchers_count: repo.watchers_count,
        open_issues_count: repo.open_issues_count,
        pushed_at: repo.pushed_at,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        starVelocity24h: existingRepo ? existingRepo.starVelocity24h : 0,
        forkToStarRatio,
        daysInactive,
        healthScore: calculateHealthScore(repo, daysInactive),
        isTrending: existingRepo ? existingRepo.isTrending : isTrending,
        isDead: existingRepo ? existingRepo.isDead : isDead,
        isReadmeStale: existingRepo ? existingRepo.isReadmeStale : false,
        readmeLastUpdated: existingRepo ? existingRepo.readmeLastUpdated : null,
        milestoneProjection: existingRepo ? existingRepo.milestoneProjection : null,
        recommendation: existingRepo ? existingRepo.recommendation : 'Status stable. Keep monitoring traffic and user engagement.',
        crossPlatform: existingRepo ? existingRepo.crossPlatform : {
          devtoViews: 0,
          devtoReactions: 0,
          devtoComments: 0,
          hnPoints: 0,
          hnComments: 0
        },
        trafficViews14d: existingRepo ? existingRepo.trafficViews14d : 0,
        uniqueVisitors14d: existingRepo ? existingRepo.uniqueVisitors14d : 0,
        trafficClones14d: existingRepo ? existingRepo.trafficClones14d : 0,
        viewTrend: existingRepo ? existingRepo.viewTrend : [0, 0, 0, 0, 0, 0, 0],
        topReferrers: existingRepo ? existingRepo.topReferrers : [],
        popularPaths: existingRepo ? existingRepo.popularPaths : [],
        launchesCount: existingRepo ? existingRepo.launchesCount : 0,
        launches: existingRepo ? existingRepo.launches : [],
      };
    });

    const totalStars = processedRepos.reduce((a, r) => a + r.stargazers_count, 0);
    const totalForks = processedRepos.reduce((a, r) => a + r.forks_count, 0);
    const totalOpenIssues = processedRepos.reduce((a, r) => a + r.open_issues_count, 0);

    const langMap = {};
    processedRepos.forEach(r => {
      langMap[r.language] = (langMap[r.language] || 0) + r.stargazers_count;
    });

    const languageBreakdown = Object.entries(langMap)
      .map(([language, stars]) => ({
        language,
        stars,
        percentage: totalStars > 0 ? Number(((stars / totalStars) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.stars - a.stars);

    const portfolioHealthAvg = processedRepos.length > 0
      ? Math.round(processedRepos.reduce((a, r) => a + r.healthScore, 0) / processedRepos.length)
      : 0;

    const totalViews14d = existingSnapshot?.summary?.totalViews14d || 0;
    const totalClones14d = existingSnapshot?.summary?.totalClones14d || 0;
    const velocityLeader = existingSnapshot?.summary?.velocityLeader || (processedRepos[0] ? { name: processedRepos[0].name, velocity: 0 } : null);
    const topReferrerOverall = existingSnapshot?.summary?.topReferrerOverall || null;

    return {
      timestamp: new Date().toISOString(),
      username: userData.login,
      avatar_url: userData.avatar_url,
      summary: {
        totalRepos: processedRepos.length,
        totalStars,
        totalForks,
        totalOpenIssues,
        totalViews14d,
        totalClones14d,
        followerCount: userData.followers || 0,
        portfolioHealthAvg,
        velocityLeader,
        topReferrerOverall,
        trendingCount: processedRepos.filter(r => r.isTrending).length,
        deadCount: processedRepos.filter(r => r.isDead).length,
      },
      languageBreakdown,
      repos: processedRepos,
      rateLimit: { ...currentRateLimit },
    };
  } catch (err) {
    console.error('[GitHub Proxy Fetch Error]', err);
    throw err;
  }
}

function updateRateLimit(headers) {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const isAuth = headers.get('x-wt-authenticated') === 'true';

  if (limit && remaining) {
    currentRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: reset ? new Date(parseInt(reset, 10) * 1000) : null,
      isAuthenticated: isAuth,
    };
  }
}

function getDaysInactive(pushedAt) {
  if (!pushedAt) return 999;
  return Math.floor(Math.abs(new Date() - new Date(pushedAt)) / (1000 * 60 * 60 * 24));
}

function calculateHealthScore(repo, daysInactive) {
  let score = 60;
  if (daysInactive < 7) score += 20;
  else if (daysInactive > 30) score -= 30;
  if (repo.stargazers_count > 10) score += 15;
  if (repo.forks_count > 2) score += 10;
  return Math.min(100, Math.max(0, score));
}
