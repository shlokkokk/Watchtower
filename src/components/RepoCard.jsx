import React from 'react';
import { Star, GitFork, AlertCircle, ExternalLink, Zap, Flame, Skull, Activity, ArrowUpRight, BarChart2 } from 'lucide-react';

export function RepoCard({ repo, onSelectRepo, onAddLaunch }) {
  const {
    name,
    description,
    language,
    stargazers_count,
    forks_count,
    open_issues_count,
    html_url,
    starVelocity24h = 0,
    healthScore = 50,
    isTrending,
    isDead,
    daysInactive,
    viewTrend = [],
    topReferrers = [],
    trafficViews14d = 0,
  } = repo;

  // Render Mini Sparkline (SVG)
  const renderSparkline = () => {
    if (!viewTrend || viewTrend.length === 0) return null;
    const max = Math.max(...viewTrend, 1);
    const width = 100;
    const height = 24;
    const points = viewTrend
      .map((val, idx) => {
        const x = (idx / (viewTrend.length - 1)) * width;
        const y = height - (val / max) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-24 h-6 overflow-visible">
        <polyline
          fill="none"
          stroke={isTrending ? '#10b981' : '#00f0ff'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-md border rounded-2xl p-5 relative flex flex-col justify-between group transition-all shadow-glass hover:-translate-y-1 ${
        isTrending
          ? 'border-emerald-500/40 hover:border-emerald-400 shadow-neon-green/20'
          : isDead
          ? 'border-red-900/50 hover:border-red-500/40 opacity-75'
          : 'border-slate-800/80 hover:border-cyan-500/50 hover:shadow-neon-cyan/20'
      }`}
    >
      {/* Top Bar: Language & Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
            {language}
          </span>
          <div className="flex items-center gap-1.5">
            {isTrending && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                <Flame className="w-3 h-3 text-emerald-400" /> Trending
              </span>
            )}
            {isDead && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                <Skull className="w-3 h-3 text-red-400" /> Inactive
              </span>
            )}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                healthScore >= 80
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : healthScore >= 60
                  ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
              title="Watchtower Health Index"
            >
              Health {healthScore}/100
            </span>
          </div>
        </div>

        {/* Title & External Link */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            onClick={() => onSelectRepo(repo)}
            className="text-lg font-bold font-mono text-white group-hover:text-cyan-300 cursor-pointer transition-colors line-clamp-1"
          >
            {name}
          </h3>
          <a
            href={html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 p-1 transition-colors"
            title="Open on GitHub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed min-h-[2.25rem]">
          {description || 'No repository description available.'}
        </p>
      </div>

      {/* Bottom Section: Metrics & Sparkline */}
      <div>
        
        {/* Referrer Tags */}
        {topReferrers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-[10px] font-mono text-slate-500">Traffic:</span>
            {topReferrers.slice(0, 2).map((ref, idx) => (
              <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                {ref.referrer || ref.name}
              </span>
            ))}
          </div>
        )}

        {/* Sparkline & Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400/30" /> {stargazers_count}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" /> {forks_count}
            </span>
            {starVelocity24h > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <Zap className="w-3 h-3" />+{starVelocity24h}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {renderSparkline()}
            <button
              onClick={() => onSelectRepo(repo)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-all"
              title="Inspect Analytics & Referrers"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
