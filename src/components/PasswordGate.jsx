import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Radar, Loader2 } from 'lucide-react';

const SESSION_TOKEN_KEY = 'wt_session_token';

/** Check if a stored token looks structurally valid (format: wt1:{ts}:{hex}) */
function isTokenFormatValid(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3 || parts[0] !== 'wt1') return false;
  const expiry = parseInt(parts[1], 10);
  return !isNaN(expiry) && Date.now() < expiry;
}

export function PasswordGate({ children, onSessionToken }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // On mount: check localStorage for an existing valid token
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);
    if (isTokenFormatValid(stored)) {
      // Resume existing session — App.jsx already checks localStorage on mount
      // so no need to call onSessionToken here (avoids double live-refresh)
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || isChecking) return;

    setIsChecking(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        onSessionToken?.(data.token);
        setIsAuthenticated(true);
      } else if (res.status === 429) {
        setError('Too many attempts. Please wait 15 minutes and try again.');
        setPassword('');
        triggerShake();
      } else if (res.status === 401) {
        setError('Incorrect password. Try again.');
        setPassword('');
        triggerShake();
        inputRef.current?.focus();
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
        setPassword('');
        triggerShake();
      }
    } catch {
      setError('Cannot reach server. Check your connection and try again.');
    } finally {
      setIsChecking(false);
    }
  };

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  if (isAuthenticated) return children;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Gate card */}
      <div
        style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}
        className="relative w-full max-w-sm"
      >
        {/* Glow border */}
        <div
          className="absolute -inset-px rounded-2xl opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.5), rgba(168,85,247,0.5), rgba(0,240,255,0.2))',
          }}
        />
        <div className="relative rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00f0ff20, #a855f720)', border: '1px solid rgba(0,240,255,0.3)' }}
            >
              <Radar size={32} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-mono">Watchtower</h1>
            <p className="text-slate-400 text-sm mt-1">Portfolio Intelligence Dashboard</p>
          </div>

          {/* Lock label */}
          <div className="flex items-center gap-2 mb-5">
            <Lock size={14} className="text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Access Required</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter dashboard password"
                className="w-full bg-slate-800/80 border rounded-xl px-4 py-3 pr-11 text-white text-sm font-mono placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2"
                style={{
                  borderColor: error ? 'rgba(239,68,68,0.6)' : 'rgba(100,116,139,0.4)',
                  '--tw-ring-color': 'rgba(0,240,255,0.4)',
                }}
                disabled={isChecking}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-xs font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!password.trim() || isChecking}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold font-mono transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: password.trim() && !isChecking
                  ? 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.15))'
                  : 'rgba(30,41,59,0.8)',
                border: password.trim() && !isChecking
                  ? '1px solid rgba(0,240,255,0.5)'
                  : '1px solid rgba(100,116,139,0.3)',
                color: password.trim() && !isChecking ? '#00f0ff' : '#64748b',
              }}
            >
              {isChecking ? (
                <><Loader2 size={15} className="animate-spin" /> Verifying...</>
              ) : (
                <><Lock size={15} /> Unlock Dashboard</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6 font-mono">
            Session persists for 7 days per browser
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
