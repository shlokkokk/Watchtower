import React, { useState } from 'react';
import { X, Rocket, Plus, ExternalLink, TrendingUp, Award, Calendar } from 'lucide-react';
import { computePlatformROI } from '../services/metrics';

export function LaunchTracker({ launches = [], repos = [], onSaveLaunch, onClose }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    repo: repos[0]?.name || '',
    platform: 'Show HN',
    title: '',
    url: '',
    notes: '',
  });

  const platformOptions = ['Show HN', 'Dev.to', 'Reddit', 'ProductHunt', 'Twitter / X', 'Awesome List', 'Medium', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.repo || !formData.title) return;

    const newEntry = {
      id: `launch-${Date.now()}`,
      ...formData,
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
  };

  const roiStats = computePlatformROI(launches, repos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-purple-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/10 p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white">Launch Impact & ROI Studio</h2>
              <p className="text-xs text-slate-400 font-mono">Correlate posts on HN/Reddit/Dev.to with star velocity deltas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform ROI Leaderboard */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-xs font-mono uppercase text-purple-300 mb-3 flex items-center gap-2 font-bold">
            <Award className="w-4 h-4 text-purple-400" /> Platform Conversion Leaderboard
          </h3>
          {roiStats.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono py-2">No launch data available for ROI calculation yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {roiStats.map((p, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{p.platform}</span>
                    <span className="text-[10px] text-purple-400">{p.count} posts</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 mt-2">
                    <span className="text-emerald-400 font-bold">~{p.avgStarsPerLaunch} stars / post</span>
                    <span className="text-cyan-300">~{p.avgViewsPerLaunch} views</span>
                  </div>
                </div>
              ))}
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
              <select
                value={formData.repo}
                onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-purple-500"
                required
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.name} className="bg-slate-900">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Platform Channel</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-300 focus:outline-none focus:border-purple-500"
              >
                {platformOptions.map((p) => (
                  <option key={p} value={p} className="bg-slate-900">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-xs font-mono">Notes / Timing (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Posted at 9am EST on Tuesday. Reached frontpage #4."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-neon-purple/30"
          >
            Save Launch Log Entry
          </button>
        </form>

        {/* Existing Launch Timeline */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Historical Launch Log
          </h3>
          {launches.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono py-4 text-center">No launches logged yet.</p>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {launches.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px]">
                        {item.platform}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
                        {item.repo}
                      </span>
                      <span className="text-slate-500 text-[10px]">{item.date}</span>
                    </div>
                    <p className="font-bold text-white text-sm">{item.title}</p>
                    {item.notes && <p className="text-slate-400 font-sans text-xs mt-1">{item.notes}</p>}
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all self-start sm:self-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
