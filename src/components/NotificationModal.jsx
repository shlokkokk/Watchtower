import React, { useState } from 'react';
import { X, Bell, Send, CheckCircle2, AlertTriangle, ShieldCheck, Star, Flame, Skull } from 'lucide-react';
import { testDiscordWebhook, testTelegramWebhook } from '../services/notificationService';

export function NotificationModal({ onClose, discordUrl, onSaveDiscordUrl, topRepoName = 'Watchtower' }) {
  const [urlInput, setUrlInput] = useState(discordUrl || '');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const [statusMsg, setStatusMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestDiscord = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    const result = await testDiscordWebhook(urlInput, topRepoName, 50);
    setIsLoading(false);
    setStatusMsg(result);
    if (result.success) {
      onSaveDiscordUrl(urlInput);
    }
  };

  const handleTestTelegram = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    const result = await testTelegramWebhook(telegramToken, telegramChatId, topRepoName);
    setIsLoading(false);
    setStatusMsg(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col">
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white">Alerts & Webhook Playground</h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Real-time Discord & Telegram event notification engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Status */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
              statusMsg.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {statusMsg.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{statusMsg.message}</span>
          </div>
        )}

        {/* Discord Setup */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Option 1: Discord Webhook Integration
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Recommended (1-Min Setup)
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Paste your Discord Server Webhook URL below to send instant milestone, trending, and weekly digest alerts.
          </p>

          <div className="space-y-2">
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleTestDiscord}
              disabled={isLoading || !urlInput.trim()}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'Dispatching Test Embed...' : 'Send Test Discord Notification'}
            </button>
          </div>
        </div>

        {/* Telegram Setup */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase text-purple-300 font-bold flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-400" /> Option 2: Telegram Bot Integration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Bot Token</label>
              <input
                type="text"
                placeholder="123456789:ABCdef..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Chat ID</label>
              <input
                type="text"
                placeholder="-100123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleTestTelegram}
            disabled={isLoading || !telegramToken || !telegramChatId}
            className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-mono text-xs font-bold border border-purple-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {isLoading ? 'Dispatching Telegram...' : 'Send Test Telegram Message'}
          </button>
        </div>

        {/* Alert Rules Explanation */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 font-sans text-xs text-slate-400 space-y-2">
          <p className="text-white font-mono font-bold">Automatic Alert Trigger Thresholds:</p>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong className="text-cyan-300 font-mono">Star Gain Alert:</strong> Fires whenever any repo receives +1 or +2 new stargazers.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span><strong className="text-purple-300 font-mono">Milestone Alert:</strong> Fires when any repo crosses 10, 25, 50, 100, or 250 stars.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong className="text-emerald-300 font-mono">Code Fork Alert:</strong> Fires when a developer clones & forked your repository.</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong className="text-amber-300 font-mono">Trending Flag:</strong> Fires when daily views &gt; 50 or 24h stars &gt; 3x baseline.</span>
          </div>
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-400 shrink-0" />
            <span><strong className="text-red-300 font-mono">Dead Repo Alert:</strong> Fires when a repo has 0 views and 0 activity in 30+ days.</span>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
