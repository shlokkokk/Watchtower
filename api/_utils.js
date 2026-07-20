// Shared HMAC token utilities for all /api/* routes.
// This file is prefixed with _ so Vercel does NOT deploy it as an endpoint.

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_PREFIX = 'wt1';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a signed session token.
 * Format: wt1:{expiry_ms}:{hmac_hex}
 */
export function createToken(sessionSecret) {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${TOKEN_PREFIX}:${expiry}`;
  const sig = createHmac('sha256', sessionSecret).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/**
 * Verifies a session token. Returns true if valid and not expired.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyToken(token, sessionSecret) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split(':');
  // Expected: [prefix, expiry, sig] = 3 parts
  if (parts.length !== 3) return false;

  const [prefix, expiryStr, sig] = parts;
  if (prefix !== TOKEN_PREFIX) return false;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  const payload = `${prefix}:${expiryStr}`;
  const expectedSig = createHmac('sha256', sessionSecret).update(payload).digest('hex');

  // Timing-safe comparison
  const sigBuf = Buffer.from(sig.padEnd(64, '0').slice(0, 64));
  const expBuf = Buffer.from(expectedSig.padEnd(64, '0').slice(0, 64));
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  // Re-check the full sig length after confirming buffers match to avoid length oracle
  return sig.length === expectedSig.length;
}

/**
 * Extracts and verifies the Bearer token from an Authorization header.
 * Returns the token string if valid, null otherwise.
 */
export function authenticateRequest(req, sessionSecret) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(token, sessionSecret) ? token : null;
}
