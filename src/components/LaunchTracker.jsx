import React, { useState, useEffect } from 'react';
import { X, Rocket, Plus, ExternalLink, TrendingUp, Award, Calendar, ChevronDown, Eye, Heart, ArrowUp, MessageSquare, Trophy, Zap, BarChart3, Flame } from 'lucide-react';
import { computePlatformROI } from '../services/metrics';

function getPlatformTheme(platform, index) {
  const norm = platform?.toLowerCase() || '';
  if (norm.includes('reddit')) {
    return {
      gradient: 'from-orange-950/80 via-slate-950 to-red-950/50',
      border: 'border-orange-500/40 hover:border-orange-400',
      badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      glow: 'shadow-orange-950/20',
      accentColor: 'text-orange-400',
    };
  }
  if (norm.includes('dev.to') || norm.includes('devto')) {
    return {
      gradient: 'from-pink-950/80 via-slate-950 to-purple-950/50',
      border: 'border-pink-500/40 hover:border-pink-400',
      badgeBg: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
      glow: 'shadow-pink-950/20',
      accentColor: 'text-pink-400',
    };
  }
  if (norm.includes('hn') || norm.includes('hacker news')) {
    return {
      gradient: 'from-amber-950/80 via-slate-950 to-orange-950/50',
      border: 'border-amber-500/40 hover:border-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      glow: 'shadow-amber-950/20',
      accentColor: 'text-amber-400',
    };
  }
  if (norm.includes('product') || norm.includes('hunt')) {
    return {
      gradient: 'from-orange-950/80 via-slate-950 to-amber-950/50',
      border: 'border-orange-400/40 hover:border-orange-300',
      badgeBg: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
      glow: 'shadow-orange-950/20',
      accentColor: 'text-orange-400',
    };
  }
  if (norm.includes('twitter') || norm.includes('x')) {
    return {
      gradient: 'from-cyan-950/80 via-slate-950 to-blue-950/50',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      badgeBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      glow: 'shadow-cyan-950/20',
      accentColor: 'text-cyan-400',
    };
  }
  return {
    gradient: 'from-purple-950/80 via-slate-950 to-indigo-950/50',
    border: 'border-purple-500/40 hover:border-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    glow: 'shadow-purple-950/20',
    accentColor: 'text-purple-400',
  };
}

export function LaunchTracker({ launches = [], repos = [], onSaveLaunch, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    repo: repos[0]?.name || '',
    platform: 'Show HN',
    title: '',
    url: '',
    notes: '',
  });

  const [customPlatform, setCustomPlatform] = useState('');

  const platformOptions = ['Show HN', 'Dev.to', 'Reddit', 'ProductHunt', 'Twitter / X', 'Awesome List', 'Medium', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.repo || !formData.title) return;

    const finalPlatform = formData.platform === 'Other'
      ? (customPlatform.trim() || 'Other')
      : formData.platform;

    const newEntry = {
      id: `launch-${Date.now()}`,
      ...formData,
      platform: finalPlatform,
    };

    onSaveLaunch(newEntry);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      repo: repos[0]?.name || '',
      platform: 'Show HN',
      title: '',
      url: '',
      notes: '',
    });
    setCustomPlatform('');
  };

  const roiStats = computePlatformROI(launches, repos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-purple-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col">
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-neon-purple/20">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-mono text-white tracking-wide">Launch Impact & ROI Studio</h2>
                <p className="text-xs text-slate-400 font-mono">Live engagement telemetry & conversion ranking across distribution channels</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform ROI Leaderboard */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase text-purple-300 flex items-center gap-2 font-bold tracking-wider">
                <Trophy className="w-4 h-4 text-amber-400" /> Platform Conversion Leaderboard
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
                Ranked by Telemetry Index
              </span>
            </div>

            {roiStats.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-4 text-center">No launch data available for ROI calculation yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
                {roiStats.map((p, i) => {
                  const theme = getPlatformTheme(p.platform, i);
                  return (
                    <div
                      key={i}
                      className={`p-4.5 rounded-2xl bg-gradient-to-br ${theme.gradient} border ${theme.border} transition-all duration-300 flex flex-col justify-between gap-3 shadow-xl ${theme.glow} hover:-translate-y-0.5`}
                    >
                      {/* Card Header & Rank */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl ${theme.badgeBg} border text-xs font-bold font-mono tracking-wide`}>
                            {p.platform}
                          </span>
                          {i === 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" /> #1 TOP ROI
                            </span>
                          )}
                          {i === 1 && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[10px] font-bold">
                              #2 CONVERSION
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          {p.count} post{p.count > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Telemetry Data Grid Matrix */}
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <ArrowUp className="w-3 h-3 text-amber-400" /> Points / Post
                          </span>
                          <span className="text-sm font-bold text-amber-300 pt-0.5">
                            {p.avgPointsPerLaunch > 0 ? p.avgPointsPerLaunch : (p.totalPoints || 0)}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">({p.totalPoints || 0} tot)</span>
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <MessageSquare className="w-3 h-3 text-purple-400" /> Comments / Post
                          </span>
                          <span className="text-sm font-bold text-purple-300 pt-0.5">
                            {p.avgCommentsPerLaunch > 0 ? p.avgCommentsPerLaunch : (p.totalComments || 0)}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">({p.totalComments || 0} tot)</span>
                          </span>
                        </div>

                        {p.totalReactions > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Heart className="w-3 h-3 text-pink-400" /> Reactions / Post
                            </span>
                            <span className="text-sm font-bold text-pink-300 pt-0.5">
                              {p.avgReactionsPerLaunch}
                              <span className="text-[10px] text-slate-500 font-normal ml-1">({p.totalReactions} tot)</span>
                            </span>
                          </div>
                        )}

                        {p.totalViews > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Eye className="w-3 h-3 text-cyan-400" /> Views / Post
                            </span>
                            <span className="text-sm font-bold text-cyan-300 pt-0.5">
                              {p.avgViewsPerLaunch.toLocaleString()}
                              <span className="text-[10px] text-slate-500 font-normal ml-1">({p.totalViews.toLocaleString()} tot)</span>
                            </span>
                          </div>
                        )}

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-center col-span-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3 text-emerald-400" /> Star Impact Correlated
                          </span>
                          <span className="text-sm font-bold text-emerald-300 pt-0.5 flex items-center justify-between">
                            <span>+{p.avgStarsPerLaunch} stars / post</span>
                            <span className="text-[10px] text-slate-500 font-normal">Index Score: {p.engagementIndex}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Launch Logging Form */}
          <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-300 flex items-center gap-2 font-bold">
              <Plus className="w-4 h-4 text-cyan-400" /> Log New Launch / Post Event
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Repository</label>
                <div className="relative">
                  <select
                    value={formData.repo}
                    onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2 text-xs font-mono text-cyan-300 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    {repos.map((r) => (
                      <option key={r.id} value={r.name} className="bg-slate-900 text-slate-100 font-mono">
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Platform Channel</label>
                <div className="relative">
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2 text-xs font-mono text-purple-300 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {platformOptions.map((p) => (
                      <option key={p} value={p} className="bg-slate-900 text-slate-100 font-mono">
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Custom Platform Input when "Other" is selected */}
            {formData.platform === 'Other' && (
              <div className="font-mono text-xs animate-fade-in">
                <label className="block text-purple-300 mb-1 font-bold">Specify Custom Platform</label>
                <input
                  type="text"
                  placeholder="e.g. Substack, IndieHackers, LinkedIn, Discord..."
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Post Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Show HN: My Open Source Project"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Post URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://news.ycombinator.com/item?id=..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="font-mono text-xs">
              <label className="block text-slate-400 mb-1">Notes / Timing (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Posted at 9am EST on Tuesday. Reached frontpage #4."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-neon-purple/20"
            >
              Save Launch Log Entry
            </button>
          </form>

          {/* Logged Launch History & Auto-Discovered Launches */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-slate-300 flex items-center gap-2 font-bold">
                <Calendar className="w-4 h-4 text-cyan-400" /> Launches & Cross-Platform Posts ({launches.length})
              </h3>
            </div>
            {launches.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">No launch entries discovered or logged yet.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                {launches.map((l) => (
                  <div key={l.id || l.url} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 transition-all">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          {l.platform}
                        </span>
                        <span className="font-bold text-cyan-300">{l.repo}</span>
                        <span className="text-slate-300 font-medium">— {l.title}</span>
                      </div>

                      {/* Live Metric Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                        {l.views !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3 text-cyan-400" /> {l.views.toLocaleString()} views
                          </span>
                        )}
                        {l.reactions !== undefined && l.reactions > 0 && (
                          <span className="px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-500/20 font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3 text-pink-400" /> {l.reactions} reactions
                          </span>
                        )}
                        {l.points !== undefined && l.points > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
                            <ArrowUp className="w-3 h-3 text-amber-400" /> {l.points} points
                          </span>
                        )}
                        {l.comments !== undefined && l.comments > 0 && (
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-purple-400" /> {l.comments} comments
                          </span>
                        )}
                        {l.subreddit && (
                          <span className="px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-500/30 font-bold text-[10px]">
                            {l.subreddit}
                          </span>
                        )}
                        {l.upvoteRatio !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                            {Math.round(l.upvoteRatio * 100)}% Upvoted
                          </span>
                        )}
                        {l.id?.startsWith('devto-') || l.id?.startsWith('hn-') || l.id?.startsWith('reddit-') ? (
                          <span className="text-[10px] text-slate-500 italic">Auto-Discovered</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                      <span>{l.date}</span>
                      {l.url && (
                        <a href={l.url} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1">
                          Open Post <ExternalLink className="w-3 h-3 text-purple-400" />
                        </a>
                      )}
                    </div>
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
