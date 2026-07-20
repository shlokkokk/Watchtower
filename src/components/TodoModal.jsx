import React from 'react';
import { X, FileText, CheckSquare, Key, Bell, Shield, Terminal } from 'lucide-react';

export function TodoModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-amber-500/10 p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white">Watchtower Setup Guide (TODO.md)</h2>
              <p className="text-xs text-slate-400 font-mono">Manual action checklist for GitHub PAT & Discord setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: PAT Token */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm">
            <Key className="w-4 h-4 text-cyan-400" /> Step 1: Generate a GitHub Personal Access Token (PAT)
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            1. Open <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-cyan-400 underline">GitHub Developer Settings -&gt; Tokens (classic)</a>.<br/>
            2. Click <strong>Generate new token (classic)</strong>.<br/>
            3. Set Note to <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">Watchtower</code>.<br/>
            4. Select scopes: <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded font-mono">repo</code> (Full control for traffic referrers/views) and <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded font-mono">read:user</code>.<br/>
            5. Copy the token and paste it into Watchtower Settings!
          </p>
        </div>

        {/* Step 2: Discord Webhook */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-sm">
            <Bell className="w-4 h-4 text-purple-400" /> Step 2: Create a Discord Server Webhook (Optional)
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            1. Go to your Discord server -&gt; <strong>Server Settings -&gt; Integrations -&gt; Webhooks</strong>.<br/>
            2. Click <strong>New Webhook</strong>, name it <code className="text-purple-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">Watchtower Sentinel</code>.<br/>
            3. Select your alert channel and click <strong>Copy Webhook URL</strong>.<br/>
            4. Test it directly in the <strong>Alerts Modal</strong>!
          </p>
        </div>

        {/* Step 3: GitHub Actions Secrets */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-sm">
            <Shield className="w-4 h-4 text-emerald-400" /> Step 3: Configure GitHub Actions Secrets
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            To enable automatic 24/7 background tracking every hour on GitHub:<br/>
            1. Push Watchtower code to a GitHub repo.<br/>
            2. Go to <strong>Settings -&gt; Secrets and variables -&gt; Actions</strong>.<br/>
            3. Add Secrets: <code className="text-emerald-300 font-mono">GH_PAT</code> and <code className="text-emerald-300 font-mono">DISCORD_WEBHOOK_URL</code>.<br/>
            4. The automated cron workflow in <code className="text-emerald-300 font-mono">.github/workflows/watchtower-cron.yml</code> will run automatically!
          </p>
        </div>

        {/* Step 4: CLI Command */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-sm">
            <Terminal className="w-4 h-4 text-amber-400" /> Step 4: Run Manual Scan Locally
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300">
            npm run track
          </div>
        </div>

      </div>
    </div>
  );
}
