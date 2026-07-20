import React, { useState } from 'react';
import { X, Key, ShieldCheck, Download, FileSpreadsheet, Database, RefreshCw } from 'lucide-react';
import { exportDataAsJSON, exportReposAsCSV } from '../services/metrics';

export function SettingsModal({ onClose, patToken, onSavePAT, snapshotData, rateLimit }) {
  const [inputToken, setInputToken] = useState(patToken || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSavePAT(inputToken.trim());
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10 p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white">Watchtower Settings & Data Export</h2>
              <p className="text-xs text-slate-400 font-mono">Manage API Token & Export Portfolio Reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Success Notification */}
        {savedMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Personal Access Token saved to LocalStorage!</span>
          </div>
        )}

        {/* PAT Token Configuration Form */}
        <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> GitHub Personal Access Token (PAT)
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              patToken ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-amber-950 text-amber-300 border-amber-500/30'
            }`}>
              {patToken ? 'Token Saved' : 'Unauthenticated'}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Enter your GitHub Personal Access Token to unlock 14-day traffic referrers, view/clone analytics, and increase your rate limit from 60 to 5,000 requests/hour.
          </p>

          <input
            type="password"
            placeholder="ghp_your_token_here..."
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-neon-cyan/20"
          >
            Save Token in Browser
          </button>
        </form>

        {/* Live API Rate Limit Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-2">
          <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" /> Current API Rate Limit Counter
          </h3>
          <div className="flex items-center justify-between pt-1 text-slate-300">
            <span>Quota Remaining:</span>
            <span className="font-bold text-cyan-300">{rateLimit ? `${rateLimit.remaining} / ${rateLimit.limit}` : '60 / 60'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Authentication Status:</span>
            <span className={rateLimit?.isAuthenticated ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {rateLimit?.isAuthenticated ? 'Authenticated (5,000 req/hr)' : 'Public (60 req/hr)'}
            </span>
          </div>
        </div>

        {/* Data Export Options */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" /> Export Portfolio Analytics Data
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Download your processed portfolio snapshots or raw repository stats anytime.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <button
              onClick={() => exportDataAsJSON(snapshotData, `watchtower-${snapshotData?.username || 'portfolio'}.json`)}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex items-center justify-center gap-2 transition-all"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              Download Snapshot (JSON)
            </button>
            <button
              onClick={() => exportReposAsCSV(snapshotData?.repos || [])}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 flex items-center justify-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Download Portfolio (CSV)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
