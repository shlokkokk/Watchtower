// Notification service — proxies Discord and Telegram through /api/notify
// Webhook URLs and bot tokens are server-side secrets; never in this file.

const SESSION_KEY = 'wt_session_token';

function authHeaders() {
  const token = localStorage.getItem(SESSION_KEY) || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Send a test Discord notification via the server-side proxy.
 * @param {string} repoName - The repo to mention in the test embed
 * @param {number} milestone - The star milestone to announce
 */
export async function testDiscordWebhook(repoName = 'Portfolio Repo', milestone = 50) {
  const payload = {
    username: 'Watchtower Sentinel',
    avatar_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radar.svg',
    embeds: [
      {
        title: 'Watchtower Test Alert — Milestone Reached',
        description: `**[${repoName}](https://github.com/${repoName})** has crossed **${milestone} stars**!\n\n*This is a live test notification from your Watchtower Dashboard.*`,
        color: 0x00f0ff,
        fields: [
          { name: 'Velocity (24h)', value: '+7 stars', inline: true },
          { name: 'Views Today', value: '210 views', inline: true },
          { name: 'Top Referrer', value: 'dev.to', inline: true },
        ],
        footer: { text: 'Watchtower • Portfolio Intelligence' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ channel: 'discord', payload }),
    });

    if (res.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      return { success: false, message: 'Session expired. Please refresh and log in again.' };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

/**
 * Send a test Telegram notification via the server-side proxy.
 * @param {string} repoName - The repo to mention
 */
export async function testTelegramWebhook(repoName = 'Portfolio Repo') {
  const payload = {
    text: `*WATCHTOWER ALERT*\n\nYour Telegram integration is active!\n\n*Repo:* ${repoName}\n*Status:* Integration Connected Successfully`,
  };

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ channel: 'telegram', payload }),
    });

    if (res.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      return { success: false, message: 'Session expired. Please refresh and log in again.' };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}
