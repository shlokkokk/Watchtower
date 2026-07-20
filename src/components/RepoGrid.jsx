import React from 'react';
import { RepoCard } from './RepoCard';
import { Star, GitFork, AlertCircle, ArrowUpRight, BarChart2, Flame, Skull } from 'lucide-react';

export function RepoGrid({ repos = [], viewMode = 'grid', onSelectRepo, onAddLaunch }) {
  if (repos.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center my-8">
        <AlertCircle className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
        <h3 className="text-lg font-mono font-bold text-white mb-1">No repositories match filters</h3>
        <p className="text-xs text-slate-400 font-mono">Try adjusting your search query, status selector, or language dropdown.</p>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden mb-8 shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Repository</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4 text-right">Stars</th>
                <th className="py-3.5 px-4 text-right">24h Velocity</th>
                <th className="py-3.5 px-4 text-right">14d Views</th>
                <th className="py-3.5 px-4 text-right">Forks</th>
                <th className="py-3.5 px-4 text-center">Health</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {repos.map((repo) => (
                <tr key={repo.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4 font-bold text-white group-hover:text-cyan-300">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectRepo(repo)}>
                      <span>{repo.name}</span>
                    </div>
                    {repo.description && (
                      <p className="text-[11px] font-sans font-normal text-slate-400 line-clamp-1 max-w-xs mt-0.5">{repo.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-cyan-300 text-[10px]">
                      {repo.language}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-300">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" /> {repo.stargazers_count}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {repo.starVelocity24h > 0 ? (
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        +{repo.starVelocity24h}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-300">
                    {(repo.trafficViews14d || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {repo.forks_count}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      repo.healthScore >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-950 text-cyan-300'
                    }`}>
                      {repo.healthScore}/100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {repo.isTrending ? (
                      <span className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <Flame className="w-3 h-3 text-emerald-400" /> Trending
                      </span>
                    ) : repo.isDead ? (
                      <span className="flex items-center justify-center gap-1 text-[10px] text-red-400">
                        <Skull className="w-3 h-3 text-red-400" /> Inactive
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Active</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectRepo(repo)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 transition-all"
                        title="Inspect Analytics"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onSelectRepo={onSelectRepo} onAddLaunch={onAddLaunch} />
      ))}
    </div>
  );
}
