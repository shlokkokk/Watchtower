import React from 'react';
import { Star, GitFork, AlertCircle, ExternalLink, Zap, Flame, Skull, Activity, ArrowUpRight, Eye } from 'lucide-react';

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

  const hasTrafficData = viewTrend.some(v => v > 0);

  // Render Mini Sparkline with Gradient Fill (SVG)
  const renderSparkline = () => {
    if (!hasTrafficData) return null;

    const max = Math.max(...viewTrend, 1);
    const width = 80;
    const height = 20;
    
    const points = viewTrend
      .map((val, idx) => {
        const x = (idx / (viewTrend.length - 1)) * width;
        const y = height - (val / max) * height;
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <div className="relative group/spark">
        <svg className="w-20 h-5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={`grad-${repo.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isTrending ? '#10b981' : '#00f0ff'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isTrending ? '#10b981' : '#00f0ff'} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#grad-${repo.id})`} />
          <polyline
            fill="none"
            stroke={isTrending ? '#10b981' : '#00f0ff'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
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
      <div>
        {/* Top Header Status Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800">
              {language}
            </span>
            {isTrending && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-emerald-400" /> Trending
              </span>
            )}
            {isDead && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Skull className="w-3 h-3 text-red-400" /> Inactive ({daysInactive}d)
              </span>
            )}
          </div>
          
          <a
            href={html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 p-1 transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectRepo(repo)}
          className="text-lg font-bold font-mono text-white group-hover:text-cyan-300 transition-colors cursor-pointer mb-2 truncate"
        >
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
          {description}
        </p>
      </div>

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

        {/* Stats Row & Inspect Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" /> {stargazers_count}
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
              className="flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95 shadow-neon-cyan/10"
              title="Inspect Analytics & Referrers"
            >
              <span>Inspect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
