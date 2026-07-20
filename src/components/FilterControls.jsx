import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, List, Flame, Zap, Clock, Skull, Star, Layers, ChevronDown, Crosshair, CornerDownRight } from 'lucide-react';

export function FilterControls({
  username,
  onUsernameChange,
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  availableLanguages = [],
  viewMode,
  onViewModeChange,
}) {
  const [inputUser, setInputUser] = useState(username);
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const handleTargetSubmit = (e) => {
    e.preventDefault();
    if (inputUser.trim() && inputUser.trim() !== username) {
      onUsernameChange(inputUser.trim());
    }
    setIsEditingTarget(false);
  };

  const statusOptions = [
    { id: 'ALL', label: 'All Repos', icon: Layers },
    { id: 'TRENDING', label: 'Trending', icon: Flame },
    { id: 'ACTIVE', label: 'Active', icon: Zap },
    { id: 'STALE', label: 'Stale', icon: Clock },
    { id: 'DEAD', label: 'Inactive', icon: Skull },
    { id: 'MILESTONE', label: 'Milestones', icon: Star },
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-6 space-y-4">

      {/* Target Bar — Inspecting @username */}
      <div className="flex items-center gap-3 pb-3.5 border-b border-slate-800/60">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-cyan-500" />
          <span className="uppercase tracking-widest text-[10px]">Inspecting</span>
        </div>

        {isEditingTarget ? (
          <form onSubmit={handleTargetSubmit} className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="flex items-center gap-2 bg-slate-950 border border-cyan-500/60 rounded-xl px-3 py-1.5 flex-1 focus-within:border-cyan-400 transition-all">
              <span className="text-cyan-500 font-mono text-xs">@</span>
              <input
                autoFocus
                type="text"
                value={inputUser}
                onChange={(e) => setInputUser(e.target.value)}
                onBlur={() => { if (!inputUser.trim()) setIsEditingTarget(false); }}
                placeholder="github username..."
                className="bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none flex-1"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 transition-all whitespace-nowrap"
            >
              <CornerDownRight className="w-3 h-3" />
              Inspect
            </button>
            <button
              type="button"
              onClick={() => { setInputUser(username); setIsEditingTarget(false); }}
              className="text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors px-2"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => { setInputUser(username); setIsEditingTarget(true); }}
            className="flex items-center gap-2 group"
            title="Click to inspect a different GitHub user"
          >
            <span className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              @{username}
            </span>
            <span className="text-[10px] font-mono text-slate-600 group-hover:text-cyan-500 transition-colors border border-slate-800 group-hover:border-cyan-500/40 rounded-md px-1.5 py-0.5">
              switch
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search repositories..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
          />
        </div>

        {/* Sort & View Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-300 relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="shrink-0">Sort:</span>
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer appearance-none pr-6 font-mono text-xs"
              >
                <option value="velocity" className="bg-slate-900">Star Velocity (24h)</option>
                <option value="stars" className="bg-slate-900">Total Stars</option>
                <option value="health" className="bg-slate-900">Health Index</option>
                <option value="views" className="bg-slate-900">14-Day Views</option>
                <option value="activity" className="bg-slate-900">Recent Activity</option>
                <option value="forks" className="bg-slate-900">Forks Count</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Status Pills & Language Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
        
        {/* Status Pills with Lucide Icons */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 max-w-full">
          {statusOptions.map((opt) => {
            const IconComp = opt.icon;
            const isSelected = selectedStatus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onStatusChange(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Language:</span>
          <div className="relative flex items-center">
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-cyan-300 rounded-lg pl-2.5 pr-7 py-1 appearance-none focus:outline-none cursor-pointer font-mono text-xs"
            >
              <option value="ALL">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang} className="bg-slate-900">
                  {lang}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

      </div>
    </div>
  );
}
