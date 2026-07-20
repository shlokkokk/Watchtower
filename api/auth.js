// /api/auth.js — Server-side authentication endpoint
// POST { password: string } → { token: string } | { error: string }
//
// Security properties:
//  - Password compared timing-safely against DASHBOARD_PASSWORD env var (never in bundle)
//  - Rate limited: 5 attempts per IP per 15 minutes (in-memory, good enough for personal dashboard)
//  - Returns a signed HMAC token (SESSION_SECRET never leaves server)
//  - No secrets ever reach the client JS bundle

import { timingSafeEqual } from 'crypto';
import { createToken } from './_utils.js';

// In-memory rate limiter (resets on cold start — acceptable for personal use)
const attemptLog = new Map(); // ip → [timestamp, ...]
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const prev = (attemptLog.get(ip) || []).filter(t => t > cutoff);
  if (prev.length >= MAX_ATTEMPTS) return true;
  prev.push(now);
  attemptLog.set(ip, prev);
  return false;
}

export default function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Extract client IP (Vercel sets x-forwarded-for)
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many failed attempts. Try again in 15 minutes.',
    });
  }

  const { password } = req.body || {};

  if (!password || typeof password !== 'string' || password.length > 256) {
    return res.status(400).json({ error: 'Password required.' });
  }

  const { DASHBOARD_PASSWORD, SESSION_SECRET } = process.env;

  if (!DASHBOARD_PASSWORD || !SESSION_SECRET) {
    // Misconfigured server — tell admin without leaking details
    console.error('[auth] Missing DASHBOARD_PASSWORD or SESSION_SECRET env vars');
    return res.status(500).json({ error: 'Server configuration error. Contact the dashboard owner.' });
  }

  // Timing-safe comparison — prevents timing oracle attacks
  let isMatch = false;
  try {
    const inputBuf = Buffer.alloc(256);
    const expectedBuf = Buffer.alloc(256);
    inputBuf.write(password.trim(), 'utf8');
    expectedBuf.write(DASHBOARD_PASSWORD.trim(), 'utf8');
    isMatch = timingSafeEqual(inputBuf, expectedBuf) && password.trim() === DASHBOARD_PASSWORD.trim();
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  // Issue signed token
  const token = createToken(SESSION_SECRET);
  return res.status(200).json({ token });
}
