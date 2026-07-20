import React from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, List, Flame, Zap, Clock, Skull, Star, Layers } from 'lucide-react';

export function FilterControls({
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
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="velocity" className="bg-slate-900">Star Velocity (24h)</option>
              <option value="stars" className="bg-slate-900 font-mono">Total Stars</option>
              <option value="health" className="bg-slate-900">Health Index</option>
              <option value="views" className="bg-slate-900">14-Day Views</option>
              <option value="activity" className="bg-slate-900">Recent Activity</option>
              <option value="forks" className="bg-slate-900">Forks Count</option>
            </select>
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {statusOptions.map((opt) => {
            const IconComp = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onStatusChange(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  selectedStatus === opt.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                    : 'bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-cyan-300 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="ALL">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang} className="bg-slate-900">
                {lang}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
