// Helper utilities for Launch ROI calculation, filtering, sorting, and data export

export function computePlatformROI(launches = [], repos = []) {
  const repoMap = new Map(repos.map(r => [r.name.toLowerCase(), r]));
  const platformStats = {};

  launches.forEach(launch => {
    const platform = launch.platform || 'Unknown';
    if (!platformStats[platform]) {
      platformStats[platform] = { platform, count: 0, totalStarsGained: 0, totalViews: 0 };
    }
    platformStats[platform].count += 1;

    const repo = repoMap.get(launch.repo?.toLowerCase());
    if (repo) {
      platformStats[platform].totalStarsGained += repo.starVelocity24h || 0;
    }
    const launchViews = (launch.views !== undefined && launch.views !== null) ? launch.views : (repo?.trafficViews14d || 0);
    platformStats[platform].totalViews += launchViews;
  });

  return Object.values(platformStats).map(p => ({
    ...p,
    avgStarsPerLaunch: Number((p.totalStarsGained / p.count).toFixed(1)),
    avgViewsPerLaunch: Math.round(p.totalViews / p.count),
  })).sort((a, b) => b.totalStarsGained - a.totalStarsGained);
}

export function filterAndSortRepos(repos = [], { searchQuery, language, status, sortBy }) {
  let result = [...repos];

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q))
    );
  }

  // Language filter
  if (language && language !== 'ALL') {
    result = result.filter(r => r.language === language);
  }

  // Status filter
  if (status && status !== 'ALL') {
    if (status === 'TRENDING') result = result.filter(r => r.isTrending);
    if (status === 'ACTIVE') result = result.filter(r => !r.isDead && r.daysInactive <= 14);
    if (status === 'STALE') result = result.filter(r => r.daysInactive > 14 && r.daysInactive < 30);
    if (status === 'README_STALE') result = result.filter(r => r.isReadmeStale);
    if (status === 'DEAD') result = result.filter(r => r.isDead);
    if (status === 'MILESTONE') result = result.filter(r => r.stargazers_count >= 10);
  }

  // Sorting
  result.sort((a, b) => {
    if (sortBy === 'velocity') return (b.starVelocity24h || 0) - (a.starVelocity24h || 0);
    if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sortBy === 'reach') return ((b.trafficViews14d || 0) + (b.crossPlatform?.devtoViews || 0) + (b.crossPlatform?.hnPoints || 0)) - ((a.trafficViews14d || 0) + (a.crossPlatform?.devtoViews || 0) + (a.crossPlatform?.hnPoints || 0));
    if (sortBy === 'health') return (b.healthScore || 0) - (a.healthScore || 0);
    if (sortBy === 'activity') return (a.daysInactive || 0) - (b.daysInactive || 0);
    if (sortBy === 'forks') return b.forks_count - a.forks_count;
    if (sortBy === 'views') return (b.trafficViews14d || 0) - (a.trafficViews14d || 0);
    return 0;
  });

  return result;
}

export function exportDataAsJSON(data, filename = 'watchtower-snapshot.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportReposAsCSV(repos = []) {
  const headers = ['Repository', 'Language', 'Stars', 'Forks', 'Open Issues', '24h Velocity', 'Health Score', 'Days Inactive', '14d Views', 'Trending', 'Dead'];
  const rows = repos.map(r => [
    `"${r.name}"`,
    `"${r.language}"`,
    r.stargazers_count,
    r.forks_count,
    r.open_issues_count,
    r.starVelocity24h || 0,
    r.healthScore || 0,
    r.daysInactive || 0,
    r.trafficViews14d || 0,
    r.isTrending ? 'Yes' : 'No',
    r.isDead ? 'Yes' : 'No'
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `watchtower-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
