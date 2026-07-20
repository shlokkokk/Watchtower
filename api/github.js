// /api/github.js — Server-side GitHub API proxy
// GET ?path=/users/shlokkokk&... with Authorization: Bearer <token>
// → proxies to GitHub API with GH_PAT added server-side
//
// Security: GH_PAT never reaches the client bundle. Only the HMAC session
// token (worthless without SESSION_SECRET) travels over the wire.

import { authenticateRequest } from './_utils.js';

// GitHub API base
const GH_BASE = 'https://api.github.com';

// Allowlist of path prefixes the proxy will forward — prevents SSRF
const ALLOWED_PREFIXES = [
  '/users/',
  '/repos/',
  '/search/repositories',
  '/rate_limit',
];

function isAllowedPath(path) {
  if (!path || typeof path !== 'string') return false;
  // Must start with / and match an allowed prefix
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { SESSION_SECRET, GH_PAT } = process.env;

  if (!SESSION_SECRET) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Validate session token
  const validToken = authenticateRequest(req, SESSION_SECRET);
  if (!validToken) {
    return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  }

  // Build GitHub API URL from query params
  const { path, ...rest } = req.query;

  if (!isAllowedPath(path)) {
    return res.status(400).json({ error: 'Invalid or disallowed GitHub API path.' });
  }

  const qs = new URLSearchParams(rest).toString();
  const ghUrl = `${GH_BASE}${path}${qs ? `?${qs}` : ''}`;

  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Watchtower-Dashboard/2.0',
    };
    if (GH_PAT) {
      headers['Authorization'] = `token ${GH_PAT}`;
    }

    const ghRes = await fetch(ghUrl, { headers });

    // Forward rate-limit headers to the client (values only, no auth headers)
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'x-ratelimit-used',
    ];
    rateLimitHeaders.forEach(h => {
      const v = ghRes.headers.get(h);
      if (v) res.setHeader(h, v);
    });
    // Tell client whether the server is using an authenticated PAT
    res.setHeader('x-wt-authenticated', GH_PAT ? 'true' : 'false');

    const data = await ghRes.json();
    return res.status(ghRes.status).json(data);
  } catch (err) {
    console.error('[github proxy] fetch error:', err.message);
    return res.status(502).json({ error: 'Failed to reach GitHub API.' });
  }
}
