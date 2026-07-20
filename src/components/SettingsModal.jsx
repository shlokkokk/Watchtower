import React from 'react';
import { X, Key, ShieldCheck, Download, FileSpreadsheet, Database, RefreshCw, Lock } from 'lucide-react';
import { exportDataAsJSON, exportReposAsCSV } from '../services/metrics';

export function SettingsModal({ onClose, snapshotData, rateLimit }) {
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
              <p className="text-xs text-slate-400 font-mono">Server-Authenticated • Export Portfolio Reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Auth Status */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Server-Side Authentication Active
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Your GitHub PAT, Discord webhook, and Telegram token are stored as <strong className="text-slate-200">server-only environment variables</strong> in Vercel. They are never exposed in the browser bundle or sent to your device. This session is authenticated with a signed HMAC token valid for 7 days.
            </p>
          </div>
        </div>

        {/* Live API Rate Limit Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-2">
          <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" /> Current API Rate Limit
          </h3>
          <div className="flex items-center justify-between pt-1 text-slate-300">
            <span>Quota Remaining:</span>
            <span className="font-bold text-cyan-300">
              {rateLimit ? `${rateLimit.remaining} / ${rateLimit.limit}` : '5000 / 5000'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Authentication Mode:</span>
            <span className={rateLimit?.isAuthenticated !== false ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {rateLimit?.isAuthenticated !== false ? 'Authenticated via Server PAT (5,000 req/hr)' : 'Public API (60 req/hr)'}
            </span>
          </div>
          {rateLimit?.reset && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Quota Resets:</span>
              <span>{new Date(rateLimit.reset).toLocaleTimeString()}</span>
            </div>
          )}
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
