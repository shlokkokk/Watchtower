import React, { useState } from 'react';
import { Radar, RefreshCw, Key, Bell, Rocket, ShieldCheck, ShieldAlert, FileText, UserCheck, Activity } from 'lucide-react';

export function Header({
  username,
  onUsernameChange,
  onRefresh,
  isRefreshing,
  rateLimit,
  hasPAT,
  onOpenSettings,
  onOpenNotifications,
  onOpenLaunches,
  onOpenTodo,
}) {
  const [inputUser, setInputUser] = useState(username);

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (inputUser.trim() && inputUser !== username) {
      onUsernameChange(inputUser.trim());
    }
  };

  const rateLimitPercent = rateLimit ? Math.round((rateLimit.remaining / rateLimit.limit) * 100) : 100;

  return (
    <header className="sticky top-0 z-40 bg-[#080b11]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Branding & User Switcher */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-neon-cyan group-hover:scale-105 transition-all flex items-center justify-center shrink-0">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-wider font-mono text-white leading-none">
                  WATCHTOWER
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-semibold border border-cyan-500/30 leading-none">
                  LIVE v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans tracking-wide mt-1.5 leading-none">
                GitHub Portfolio Intelligence & Analytics
              </p>
            </div>
          </div>

          {/* User Input Switcher Form */}
          <form onSubmit={handleUserSubmit} className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-cyan-500/60 transition-all">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={inputUser}
              onChange={(e) => setInputUser(e.target.value)}
              placeholder="GitHub username..."
              className="bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none w-28 md:w-36"
            />
            <button
              type="submit"
              className="text-[10px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2 py-1 rounded-md transition-all border border-cyan-500/30"
            >
              Inspect
            </button>
          </form>

        </div>

        {/* Right Actions & Status Bar */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          
          {/* Rate Limit Meter */}
          <div
            className="hidden lg:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs cursor-help"
            title={`${rateLimit?.remaining ?? 5000} API requests remaining out of ${rateLimit?.limit ?? 5000} this hour`}
          >
            <span className="text-slate-400 text-[11px]">Quota Left:</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  rateLimitPercent < 20 ? 'bg-red-500' : rateLimitPercent < 50 ? 'bg-amber-500' : 'bg-cyan-400 shadow-neon-cyan'
                }`}
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
            <span className={hasPAT ? 'text-cyan-400 font-bold text-[11px]' : 'text-slate-300 text-[11px]'}>
              {rateLimit ? `${rateLimit.remaining}/${rateLimit.limit}` : '5000/5000'}
            </span>
          </div>

          {/* PAT Status Badge */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
              hasPAT
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60 shadow-neon-amber'
            }`}
            title={hasPAT ? 'PAT Token Active (5,000 req/hr + Traffic)' : 'Unauthenticated (Click to add PAT)'}
          >
            {hasPAT ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline font-medium">{hasPAT ? 'PAT Active' : 'Add PAT'}</span>
          </button>

          {/* Launch Studio Button */}
          <button
            onClick={onOpenLaunches}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 hover:border-purple-400 transition-all"
          >
            <Rocket className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">Launches</span>
          </button>

          {/* Webhook Alerts Button */}
          <button
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Alerts</span>
          </button>

          {/* TODO Setup Guide */}
          <button
            onClick={onOpenTodo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
            title="View User Action Setup Guide (TODO.md)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">TODO Guide</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all"
            title="Refresh Live GitHub Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
