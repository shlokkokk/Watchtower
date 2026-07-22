import React, { useEffect } from 'react';
import { X, Star, GitFork, Eye, Globe, ExternalLink, Activity, ArrowUpRight, FileText, Rocket } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export function RepoDetailModal({ repo, onClose, launches = [], onAddLaunch }) {
  useEffect(() => {
    if (repo) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [repo]);

  if (!repo) return null;

  const {
    name,
    full_name,
    description,
    language,
    stargazers_count,
    forks_count,
    open_issues_count,
    html_url,
    pushed_at,
    starVelocity24h = 0,
    healthScore = 50,
    isReadmeStale,
    readmeLastUpdated,
    milestoneProjection,
    recommendation,
    crossPlatform,
    launches: embeddedLaunches = [],
    trafficViews14d = 0,
    uniqueVisitors14d = 0,
    trafficClones14d = 0,
    topReferrers = [],
    popularPaths = [],
    viewTrend = [],
  } = repo;

  // Format chart data for 7-day trend
  const chartData = viewTrend.map((v, i) => ({
    day: `Day ${i + 1}`,
    views: v,
  }));

  // Combine parent launches state with embedded snapshot launches (filtering out duplicates by ID or URL)
  const allLaunchesRaw = [...launches.filter(l => l.repo?.toLowerCase() === name.toLowerCase()), ...embeddedLaunches];
  const launchesMap = new Map();
  allLaunchesRaw.forEach(l => launchesMap.set(l.url || l.id, l));
  const repoLaunches = Array.from(launchesMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col">
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {language}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Health: {healthScore}/100
                </span>
                {starVelocity24h > 0 && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
                    +{starVelocity24h} stars in 24h
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-3">
                {name}
                <a
                  href={html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-400 p-1 transition-colors"
                  title="View on GitHub"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </a>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">{full_name}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description & KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Stars</span>
              <p className="text-lg font-bold font-mono text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-300/30" /> {stargazers_count}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">14d Views</span>
              <p className="text-lg font-bold font-mono text-cyan-300 flex items-center justify-center gap-1 mt-0.5">
                <Eye className="w-4 h-4" /> {trafficViews14d.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Forks</span>
              <p className="text-lg font-bold font-mono text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <GitFork className="w-4 h-4" /> {forks_count}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">14d Clones</span>
              <p className="text-lg font-bold font-mono text-purple-300 mt-0.5">
                {trafficClones14d}
              </p>
            </div>
          </div>

          {/* Action Recommendation & Intelligence Insights */}
          {recommendation && (
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-bold mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Action Recommendation</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans">{recommendation}</p>
            </div>
          )}

          {/* Milestone Projection & README Alert */}
          {(milestoneProjection || isReadmeStale) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {milestoneProjection && (
                <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Milestone</span>
                    <span className="text-sm font-bold text-cyan-300">{milestoneProjection.nextMilestone} Stars</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    {milestoneProjection.formattedText}
                  </span>
                </div>
              )}

              {isReadmeStale && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Documentation Warning</span>
                    <span className="text-xs font-bold text-amber-200">README May Be Stale</span>
                  </div>
                  <span className="text-[11px] text-amber-300 font-sans">
                    {readmeLastUpdated ? `Last updated ${readmeLastUpdated}` : 'No recent updates'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* View Trend Area Chart */}
          {chartData.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Daily Traffic Trend (Views)
              </h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#viewGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Referrers & Popular Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Referrers */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Top Referrers (Traffic Sources)
              </h3>
              {topReferrers.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono py-4 text-center">No referrer data available yet.</p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {topReferrers.map((ref, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="font-bold text-cyan-300">{ref.referrer || ref.name}</span>
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>{ref.count} views</span>
                        <span className="text-slate-500">({ref.uniques} uniques)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Paths */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Popular Page Paths
              </h3>
              {popularPaths.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono py-4 text-center">No path data available yet.</p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {popularPaths.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-300 truncate max-w-[180px]">{p.path}</span>
                      <span className="text-cyan-300 font-bold">{p.count} hits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Launch History */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-400" /> Associated Launches & Posts
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onAddLaunch(name);
                }}
                className="text-xs font-mono px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
              >
                + Log New Launch
              </button>
            </div>

            {repoLaunches.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-3 text-center">No launches logged for this repository yet.</p>
            ) : (
              <div className="space-y-2">
                {repoLaunches.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          {l.platform}
                        </span>
                        <span className="font-bold text-white">{l.title}</span>
                      </div>
                      {l.notes && <p className="text-[11px] text-slate-400 mt-1 font-sans">{l.notes}</p>}
                    </div>
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">{l.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
