import React from 'react';
import { Radar, RefreshCw, Bell, Rocket, ShieldCheck, FileText } from 'lucide-react';

export function Header({
  onRefresh,
  isRefreshing,
  rateLimit,
  isServerAuthed,
  onOpenSettings,
  onOpenNotifications,
  onOpenLaunches,
  onOpenTodo,
}) {
  const rateLimitPercent = rateLimit ? Math.round((rateLimit.remaining / rateLimit.limit) * 100) : 100;

  return (
    <header className="sticky top-0 z-40 bg-[#080b11]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 gap-3">

        {/* Left — Logo + User Switcher */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Logo icon */}
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
            <Radar className="w-4 h-4 animate-pulse" />
          </div>

          {/* Title stack */}
          <div className="hidden sm:flex flex-col justify-center leading-none">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider font-mono text-white leading-none whitespace-nowrap">
                WATCHTOWER
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-semibold border border-cyan-500/30 leading-none whitespace-nowrap">
                LIVE v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide mt-1 leading-none whitespace-nowrap">
              Portfolio Intelligence
            </p>
          </div>

        </div>

        {/* Right — All actions in one fixed-height row, no wrap */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Rate Limit Meter — hidden below lg */}
          <div
            className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 h-8 font-mono text-xs cursor-help"
            title={`${rateLimit?.remaining ?? 5000} / ${rateLimit?.limit ?? 5000} requests remaining`}
          >
            <span className="text-slate-400 text-[10px] whitespace-nowrap">Quota</span>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  rateLimitPercent < 20 ? 'bg-red-500' : rateLimitPercent < 50 ? 'bg-amber-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
            <span className="text-cyan-400 font-bold text-[10px] whitespace-nowrap">
              {rateLimit ? `${rateLimit.remaining}` : '5000'}
            </span>
          </div>

          {/* Secured badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-mono border transition-all bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60 whitespace-nowrap"
            title="Server-Authenticated — PAT secured server-side"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline font-medium">Secured</span>
          </button>

          {/* Launches */}
          <button
            onClick={onOpenLaunches}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-mono bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-all whitespace-nowrap"
          >
            <Rocket className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline font-medium">Launches</span>
          </button>

          {/* Alerts */}
          <button
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-mono bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-all whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline font-medium">Alerts</span>
          </button>

          {/* TODO Guide — text hidden below xl */}
          <button
            onClick={onOpenTodo}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all whitespace-nowrap"
            title="View Setup Guide"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden xl:inline font-medium">TODO Guide</span>
          </button>

          {/* Refresh — always visible, same height */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
            title="Refresh Live GitHub Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
