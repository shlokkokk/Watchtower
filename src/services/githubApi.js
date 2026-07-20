// Browser GitHub API Client with Rate-Limit tracking and fallback support

export let currentRateLimit = {
  limit: 60,
  remaining: 60,
  reset: null,
  isAuthenticated: false,
};

export async function fetchLivePortfolio(username, token = '') {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // 1. Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    updateRateLimit(userRes.headers, Boolean(token));

    if (!userRes.ok) {
      if (userRes.status === 403) {
        throw new Error(`GitHub Rate Limit Exceeded. ${token ? 'Token limit reached' : 'Add a GitHub PAT in Settings to get 5,000 requests/hr'}.`);
      }
      if (userRes.status === 404) {
        throw new Error(`GitHub user "${username}" was not found.`);
      }
      throw new Error(`GitHub API Error (${userRes.status}): ${userRes.statusText}`);
    }

    const userData = await userRes.json();

    // 2. Fetch repos list
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed&direction=desc`, { headers });
    updateRateLimit(reposRes.headers, Boolean(token));

    if (!reposRes.ok) {
      throw new Error(`Failed to fetch repositories for ${username}.`);
    }

    const rawRepos = await reposRes.json();
    const repos = rawRepos.filter(r => !r.fork);

    // Transform raw repos into Watchtower schema
    const processedRepos = repos.map(repo => {
      const daysInactive = getDaysInactive(repo.pushed_at);
      const starVelocity24h = 0;
      const forkToStarRatio = repo.stargazers_count > 0 ? Number((repo.forks_count / repo.stargazers_count).toFixed(2)) : 0;
      const isDead = daysInactive >= 30 && repo.stargazers_count < 10;
      const isTrending = repo.stargazers_count > 25;

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
        starVelocity24h,
        forkToStarRatio,
        daysInactive,
        healthScore: calculateHealthScore(repo, daysInactive),
        isTrending,
        isDead,
        trafficViews14d: 0,
        uniqueVisitors14d: 0,
        trafficClones14d: 0,
        viewTrend: [0, 0, 0, 0, 0, 0, 0],
        topReferrers: [],
        popularPaths: [],
        launchesCount: 0
      };
    });

    const totalStars = processedRepos.reduce((a, r) => a + r.stargazers_count, 0);
    const totalForks = processedRepos.reduce((a, r) => a + r.forks_count, 0);
    const totalOpenIssues = processedRepos.reduce((a, r) => a + r.open_issues_count, 0);

    // Language aggregation
    const langMap = {};
    processedRepos.forEach(r => {
      langMap[r.language] = (langMap[r.language] || 0) + r.stargazers_count;
    });

    const languageBreakdown = Object.entries(langMap)
      .map(([language, stars]) => ({
        language,
        stars,
        percentage: totalStars > 0 ? Number(((stars / totalStars) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.stars - a.stars);

    const portfolioHealthAvg = processedRepos.length > 0
      ? Math.round(processedRepos.reduce((a, r) => a + r.healthScore, 0) / processedRepos.length)
      : 0;

    return {
      timestamp: new Date().toISOString(),
      username: userData.login,
      avatar_url: userData.avatar_url,
      summary: {
        totalRepos: processedRepos.length,
        totalStars,
        totalForks,
        totalOpenIssues,
        totalViews14d: 0,
        totalClones14d: 0,
        followerCount: userData.followers || 0,
        portfolioHealthAvg,
        velocityLeader: processedRepos[0] ? { name: processedRepos[0].name, velocity: 0 } : null,
        topReferrerOverall: null,
        trendingCount: processedRepos.filter(r => r.isTrending).length,
        deadCount: processedRepos.filter(r => r.isDead).length
      },
      languageBreakdown,
      repos: processedRepos,
      rateLimit: { ...currentRateLimit }
    };
  } catch (err) {
    console.error('[GitHub API Live Fetch Error]', err);
    throw err;
  }
}

function updateRateLimit(headers, isAuthenticated) {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (limit && remaining) {
    currentRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: reset ? new Date(parseInt(reset, 10) * 1000) : null,
      isAuthenticated,
    };
  }
}

function getDaysInactive(pushedAt) {
  if (!pushedAt) return 999;
  const diffTime = Math.abs(new Date() - new Date(pushedAt));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function calculateHealthScore(repo, daysInactive) {
  let score = 60;
  if (daysInactive < 7) score += 20;
  else if (daysInactive > 30) score -= 30;
  if (repo.stargazers_count > 10) score += 15;
  if (repo.forks_count > 2) score += 10;
  return Math.min(100, Math.max(0, score));
}
