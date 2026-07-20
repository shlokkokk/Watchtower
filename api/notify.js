// /api/notify.js — Server-side notification proxy
// POST { channel: 'discord'|'telegram', payload: {...} } with Authorization: Bearer <token>
// → dispatches to Discord webhook or Telegram bot server-side
//
// Security: DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID are
// server-only env vars. They never appear in the client JS bundle.

import { authenticateRequest } from './_utils.js';

const ALLOWED_CHANNELS = ['discord', 'telegram'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { SESSION_SECRET, DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!SESSION_SECRET) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Validate session token
  const validToken = authenticateRequest(req, SESSION_SECRET);
  if (!validToken) {
    return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  }

  const { channel, payload } = req.body || {};

  if (!channel || !ALLOWED_CHANNELS.includes(channel)) {
    return res.status(400).json({ error: `Invalid channel. Must be one of: ${ALLOWED_CHANNELS.join(', ')}` });
  }

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Payload must be a JSON object.' });
  }

  try {
    if (channel === 'discord') {
      if (!DISCORD_WEBHOOK_URL) {
        return res.status(503).json({ error: 'Discord webhook not configured on server.' });
      }

      const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (discordRes.ok || discordRes.status === 204) {
        return res.status(200).json({ success: true, message: 'Discord notification delivered!' });
      }
      const errText = await discordRes.text();
      return res.status(discordRes.status).json({ success: false, message: `Discord Error (${discordRes.status}): ${errText}` });
    }

    if (channel === 'telegram') {
      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return res.status(503).json({ error: 'Telegram bot not configured on server.' });
      }

      const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const tgBody = {
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: 'Markdown',
        ...payload,
      };

      const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgBody),
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        return res.status(200).json({ success: true, message: 'Telegram message delivered!' });
      }
      return res.status(400).json({ success: false, message: `Telegram Error: ${tgData.description}` });
    }
  } catch (err) {
    console.error('[notify proxy] error:', err.message);
    return res.status(502).json({ error: 'Failed to dispatch notification.' });
  }
}
