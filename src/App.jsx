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
import { PasswordGate } from './components/PasswordGate';
import { fetchLivePortfolio, currentRateLimit, getInitialRateLimit } from './services/githubApi';
import { filterAndSortRepos } from './services/metrics';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

// SECURITY ARCHITECTURE:
// All secrets (GH_PAT, DISCORD_WEBHOOK_URL, TELEGRAM_*) live in Vercel server env vars ONLY.
// The frontend holds only a signed HMAC session token (worthless without SESSION_SECRET).
// No secret of any kind is ever bundled into the client JS.
// Only VITE_DEFAULT_USERNAME (a public GitHub username) is allowed as a VITE_ prefixed env var.

export default function App() {
  // Public username — safe as a VITE_ env var (it's a public GitHub handle)
  const [username, setUsername] = useState(
    () => localStorage.getItem('wt_username') || import.meta.env.VITE_DEFAULT_USERNAME || 'shlokkokk'
  );

  // Session token — set by PasswordGate after login. Used to gate live-refresh.
  const [sessionReady, setSessionReady] = useState(
    () => Boolean(localStorage.getItem('wt_session_token'))
  );

  // Data state
  const [snapshotData, setSnapshotData] = useState(null);
  const [launches, setLaunches] = useState([]);
  const [historyLog, setHistoryLog] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [rateLimit, setRateLimit] = useState(getInitialRateLimit);

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

  // Initial Load from JSON Snapshots (fast, no auth needed — public data)
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
          setSnapshotData(await snapRes.value.json());
        }
        if (launchRes.status === 'fulfilled' && launchRes.value.ok) {
          setLaunches(await launchRes.value.json());
        }
        if (histRes.status === 'fulfilled' && histRes.value.ok) {
          setHistoryLog(await histRes.value.json());
        }
      } catch (err) {
        console.warn('Snapshot load error:', err);
      } finally {
        setIsLoading(false);
        // Only live-refresh if a valid session token is already present.
        // If user is logging in fresh, the PasswordGate onSessionToken callback triggers this instead.
        if (localStorage.getItem('wt_session_token')) {
          handleLiveRefresh(username);
        }
      }
    }
    loadInitialData();

    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => handleLiveRefresh(username), 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Live Refresh — calls /api/github proxy (session token added by githubApi.js automatically)
  const handleLiveRefresh = async (targetUser = username) => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const liveData = await fetchLivePortfolio(targetUser, snapshotData);
      setSnapshotData(liveData);
      setRateLimit(currentRateLimit);
      setUsername(targetUser);
      localStorage.setItem('wt_username', targetUser);

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
      // If the proxy returns 401, the session expired — gate will re-appear on next page load
      setErrorMessage(err.message || 'Failed to fetch live GitHub data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Called by PasswordGate when a fresh login succeeds
  const handleSessionReady = () => {
    setSessionReady(true);
    handleLiveRefresh(username);
  };

  const handleSaveLaunch = (newLaunch) => {
    const updated = [newLaunch, ...launches];
    setLaunches(updated);
    localStorage.setItem('wt_launches', JSON.stringify(updated));
  };

  // Repos list
  const repos = snapshotData?.repos || [];

  // Combine launches from state + snapshotData repos embedded launches
  const allCombinedLaunches = React.useMemo(() => {
    const fromSnapshot = repos.flatMap(r => r.launches || []);
    const map = new Map();
    [...launches, ...fromSnapshot].forEach(l => {
      if (l && (l.url || l.id)) {
        map.set(l.url || l.id, l);
      }
    });
    return Array.from(map.values());
  }, [launches, repos]);

  const filteredRepos = filterAndSortRepos(repos, {
    searchQuery,
    language: selectedLanguage,
    status: selectedStatus,
    sortBy,
  });

  const availableLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));

  return (
    <PasswordGate onSessionToken={handleSessionReady}>
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">

      {/* Top Header Navigation */}
      <Header
        onRefresh={() => handleLiveRefresh(username)}
        isRefreshing={isRefreshing}
        rateLimit={rateLimit}
        isServerAuthed={true}
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
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shrink-0"
            >
              Dismiss
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
              username={username}
              onUsernameChange={(newUser) => handleLiveRefresh(newUser)}
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
              onAddLaunch={() => setShowLaunchModal(true)}
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
          <span>Target: <strong className="text-cyan-300">{username}</strong> • Server-Authenticated • Zero Secrets in Bundle</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedRepo && (
        <RepoDetailModal
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
          launches={allCombinedLaunches}
          onAddLaunch={() => setShowLaunchModal(true)}
        />
      )}

      {showLaunchModal && (
        <LaunchTracker
          launches={allCombinedLaunches}
          repos={repos}
          onSaveLaunch={handleSaveLaunch}
          onClose={() => setShowLaunchModal(false)}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          onClose={() => setShowNotificationModal(false)}
          topRepoName={snapshotData?.repos?.[0]?.name || 'Watchtower'}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          snapshotData={snapshotData}
          rateLimit={rateLimit}
        />
      )}

      {showTodoModal && (
        <TodoModal onClose={() => setShowTodoModal(false)} />
      )}

    </div>
    </PasswordGate>
  );
}
