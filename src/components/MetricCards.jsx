import React from 'react';
import { Star, Eye, Zap, Activity, Skull, TrendingUp, GitFork, Users, Flame } from 'lucide-react';

export function MetricCards({ summary, username }) {
  if (!summary) return null;

  const {
    totalStars = 0,
    totalForks = 0,
    totalViews14d = 0,
    followerCount = 0,
    portfolioHealthAvg = 0,
    velocityLeader,
    topReferrerOverall,
    trendingCount = 0,
    deadCount = 0,
    totalRepos = 0,
  } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      
      {/* 1. Total Stars */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-glass">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Stars</span>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Star className="w-4 h-4 fill-amber-400/20" />
          </div>
        </div>
        <div className="text-3xl font-extrabold font-mono text-white tracking-tight mb-2">
          {totalStars}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3 text-cyan-400" /> {totalForks} forks</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" /> {followerCount} followers</span>
        </div>
      </div>

      {/* 2. Total Views */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-glass">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">14-Day Views</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold font-mono text-white tracking-tight mb-2">
          {totalViews14d.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400 font-mono truncate">
          Top Referrer: <span className="text-cyan-300 font-bold">{topReferrerOverall?.name || 'Direct'}</span>
        </div>
      </div>

      {/* 3. Star Velocity Leader */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-glass">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Velocity Leader</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight truncate mb-2">
          {velocityLeader ? velocityLeader.name : 'N/A'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{velocityLeader?.velocity || 0} stars today</span>
        </div>
      </div>

      {/* 4. Portfolio Health Score */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-glass">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Health Index</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-extrabold font-mono text-white">{portfolioHealthAvg}</span>
          <span className="text-xs font-mono text-slate-400">/ 100</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              portfolioHealthAvg > 80 ? 'bg-emerald-400 shadow-neon-green' : portfolioHealthAvg > 60 ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
            style={{ width: `${portfolioHealthAvg}%` }}
          />
        </div>
      </div>

      {/* 5. Repos Overview (Trending & Dead) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-glass">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Portfolio Status</span>
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold font-mono text-white tracking-tight mb-2">
          {totalRepos} <span className="text-xs text-slate-400 font-normal">repos</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Flame className="w-3 h-3 text-emerald-400" /> {trendingCount} Trending
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${deadCount > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>
            <Skull className="w-3 h-3 text-red-400" /> {deadCount} Inactive
          </span>
        </div>
      </div>

    </div>
  );
}
