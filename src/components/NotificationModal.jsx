import React, { useState } from 'react';
import { X, Bell, Send, CheckCircle2, AlertTriangle, ShieldCheck, Star, Flame, Skull, Lock } from 'lucide-react';
import { testDiscordWebhook, testTelegramWebhook } from '../services/notificationService';

export function NotificationModal({ onClose, topRepoName = 'Watchtower' }) {
  const [statusMsg, setStatusMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  const handleTestDiscord = async () => {
    setIsLoading(true);
    setActiveChannel('discord');
    setStatusMsg(null);
    const result = await testDiscordWebhook(topRepoName, 50);
    setIsLoading(false);
    setActiveChannel(null);
    setStatusMsg(result);
  };

  const handleTestTelegram = async () => {
    setIsLoading(true);
    setActiveChannel('telegram');
    setStatusMsg(null);
    const result = await testTelegramWebhook(topRepoName);
    setIsLoading(false);
    setActiveChannel(null);
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
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Server security badge */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 font-mono text-xs">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Webhooks & bot tokens are configured server-side — dispatched securely via <strong>/api/notify</strong></span>
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
              {statusMsg.success
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
              <span>{statusMsg.message || statusMsg.error}</span>
            </div>
          )}

          {/* Discord Test */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Option 1: Discord Notification
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Sends a test embed to your configured Discord webhook. The webhook URL is stored securely on the server — you never need to paste it here.
            </p>
            <button
              onClick={handleTestDiscord}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading && activeChannel === 'discord' ? 'Dispatching via server...' : 'Send Test Discord Notification'}
            </button>
          </div>

          {/* Telegram Test */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono uppercase text-purple-300 font-bold flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" /> Option 2: Telegram Notification
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Sends a test message to your configured Telegram bot. The bot token and chat ID are stored securely on the server.
            </p>
            <button
              onClick={handleTestTelegram}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-mono text-xs font-bold border border-purple-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading && activeChannel === 'telegram' ? 'Dispatching via server...' : 'Send Test Telegram Message'}
            </button>
          </div>

          {/* Alert Rules */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 font-sans text-xs text-slate-400 space-y-2">
            <p className="text-white font-mono font-bold">Automatic Alert Trigger Thresholds:</p>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong className="text-cyan-300 font-mono">Star Gain Alert:</strong> Fires whenever any repo receives +1 or more new stargazers.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span><strong className="text-purple-300 font-mono">Milestone Alert:</strong> Fires when any repo crosses 10, 25, 50, 100, or 250 stars.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong className="text-emerald-300 font-mono">Code Fork Alert:</strong> Fires when a developer clones & forks your repository.</span>
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
