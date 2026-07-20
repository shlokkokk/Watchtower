import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FilterControls } from './components/FilterControls';
import { RepoGrid } from './components/RepoGrid';
import { RepoDetailModal } from './components/RepoDetailModal';
import { LaunchTracker } from './components/LaunchTracker';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { NotificationModal } from './components/NotificationModal';
import { SettingsModal } from './components/SettingsModal';
import { TodoModal } from './components/TodoModal';
import { fetchLivePortfolio, currentRateLimit, getInitialRateLimit } from './services/githubApi';
import { filterAndSortRepos } from './services/metrics';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // State
  const [username, setUsername] = useState(() => localStorage.getItem('wt_username') || import.meta.env.VITE_DEFAULT_USERNAME || 'shlokkokk');
  const [patToken, setPatToken] = useState(() => localStorage.getItem('wt_pat') || import.meta.env.VITE_GH_PAT || '');
  const [discordUrl, setDiscordUrl] = useState(() => localStorage.getItem('wt_discord_url') || import.meta.env.VITE_DISCORD_WEBHOOK_URL || '');

  const [snapshotData, setSnapshotData] = useState(null);
  const [launches, setLaunches] = useState([]);
  const [historyLog, setHistoryLog] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [rateLimit, setRateLimit] = useState(() => getInitialRateLimit(localStorage.getItem('wt_pat') || import.meta.env.VITE_GH_PAT || ''));

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('velocity');
  const [viewMode, setViewMode] = useState('grid');

  // Modals
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);

  // Initial Load from JSON Snapshots
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [snapRes, launchRes, histRes] = await Promise.allSettled([
          fetch('/data/snapshot.json'),
          fetch('/data/launches.json'),
          fetch('/data/history.json'),
        ]);

        if (snapRes.status === 'fulfilled' && snapRes.value.ok) {
          const snapData = await snapRes.value.json();
          setSnapshotData(snapData);
        }

        if (launchRes.status === 'fulfilled' && launchRes.value.ok) {
          const lData = await launchRes.value.json();
          setLaunches(lData);
        }

        if (histRes.status === 'fulfilled' && histRes.value.ok) {
          const hData = await histRes.value.json();
          setHistoryLog(hData);
        }
      } catch (err) {
        console.warn('Fallback snapshot error:', err);
      } finally {
        setIsLoading(false);
        // Auto live refresh from GitHub API on mount
        handleLiveRefresh(username);
      }
    }
    loadInitialData();

    // Auto-refresh every 5 minutes in background
    const intervalId = setInterval(() => {
      handleLiveRefresh(username);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Live Refresh Trigger
  const handleLiveRefresh = async (targetUser = username) => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const liveData = await fetchLivePortfolio(targetUser, patToken);
      setSnapshotData(liveData);
      setRateLimit(currentRateLimit);
      setUsername(targetUser);
      localStorage.setItem('wt_username', targetUser);

      // Check if any repo crossed milestone -> trigger celebration!
      const topTrending = liveData.repos.find(r => r.isTrending);
      if (topTrending) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#10b981', '#a855f7'],
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch live GitHub data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Save PAT to state & LocalStorage
  const handleSavePAT = (token) => {
    setPatToken(token);
    localStorage.setItem('wt_pat', token);
    if (token) {
      handleLiveRefresh(username);
    }
  };

  // Save Discord URL
  const handleSaveDiscordUrl = (url) => {
    setDiscordUrl(url);
    localStorage.setItem('wt_discord_url', url);
  };

  // Save New Launch Entry
  const handleSaveLaunch = (newLaunch) => {
    const updated = [newLaunch, ...launches];
    setLaunches(updated);
    // Persist in localStorage as local fallback
    localStorage.setItem('wt_launches', JSON.stringify(updated));
  };

  // Repos list
  const repos = snapshotData?.repos || [];
  const filteredRepos = filterAndSortRepos(repos, {
    searchQuery,
    language: selectedLanguage,
    status: selectedStatus,
    sortBy,
  });

  const availableLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <Header
        username={username}
        onUsernameChange={(newUser) => handleLiveRefresh(newUser)}
        onRefresh={() => handleLiveRefresh(username)}
        isRefreshing={isRefreshing}
        rateLimit={rateLimit}
        hasPAT={Boolean(patToken)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenLaunches={() => setShowLaunchModal(true)}
        onOpenTodo={() => setShowTodoModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 font-mono text-xs flex items-start justify-between gap-4 shadow-neon-amber/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-amber-300 font-bold mb-0.5">Live Fetch Alert:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shrink-0"
            >
              Add PAT Token
            </button>
          </div>
        )}

        {/* Initial Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-mono">
            <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
            <p className="text-sm">Initializing Watchtower Sentinel telemetry...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Widgets */}
            <MetricCards summary={snapshotData?.summary} username={username} />

            {/* Filter & Sort Controls */}
            <FilterControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              availableLanguages={availableLanguages}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Repositories Matrix */}
            <RepoGrid
              repos={filteredRepos}
              viewMode={viewMode}
              onSelectRepo={(repo) => setSelectedRepo(repo)}
              onAddLaunch={(repoName) => setShowLaunchModal(true)}
            />

            {/* Analytics Visualizer Charts */}
            <AnalyticsCharts
              languageBreakdown={snapshotData?.languageBreakdown || []}
              topReferrers={snapshotData?.topReferrers || []}
              historyLog={historyLog}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Watchtower Portfolio Tracker & Intelligence Command</span>
          </div>
          <span>Target: <strong className="text-cyan-300">{username}</strong> • 100% Dynamic API & Webhooks</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedRepo && (
        <RepoDetailModal
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
          launches={launches}
          onAddLaunch={() => setShowLaunchModal(true)}
        />
      )}

      {showLaunchModal && (
        <LaunchTracker
          launches={launches}
          repos={repos}
          onSaveLaunch={handleSaveLaunch}
          onClose={() => setShowLaunchModal(false)}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          onClose={() => setShowNotificationModal(false)}
          discordUrl={discordUrl}
          onSaveDiscordUrl={handleSaveDiscordUrl}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          patToken={patToken}
          onSavePAT={handleSavePAT}
          snapshotData={snapshotData}
          rateLimit={rateLimit}
        />
      )}

      {showTodoModal && (
        <TodoModal onClose={() => setShowTodoModal(false)} />
      )}

    </div>
  );
}
