// Webhook Dispatcher for Discord and Telegram (Browser & Node friendly)

export async function testDiscordWebhook(webhookUrl, repoName = 'ShellStack', milestone = 50) {
  if (!webhookUrl) {
    return { success: false, message: 'Please enter a valid Discord Webhook URL first.' };
  }

  const payload = {
    username: 'Watchtower Sentinel',
    avatar_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radar.svg',
    embeds: [
      {
        title: '🎉 Watchtower Test Alert — Milestone Reached!',
        description: `**[${repoName}](https://github.com)** has officially crossed **${milestone} stars**! ⭐\n\n*This is a live test notification sent directly from your Watchtower Dashboard.*`,
        color: 0x00f0ff, // Neon Cyan
        fields: [
          { name: '🔥 Velocity (24h)', value: '+7 stars', inline: true },
          { name: '👁️ Views Today', value: '210 views', inline: true },
          { name: '🔗 Top Referrer', value: 'dev.to', inline: true },
        ],
        footer: {
          text: 'Watchtower • Portfolio Intelligence',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 204) {
      return { success: true, message: 'Discord test notification delivered successfully!' };
    } else {
      const errorText = await res.text();
      return { success: false, message: `Discord Webhook Error (${res.status}): ${errorText}` };
    }
  } catch (err) {
    return { success: false, message: `Network Error: ${err.message}` };
  }
}

export async function testTelegramWebhook(botToken, chatId) {
  if (!botToken || !chatId) {
    return { success: false, message: 'Please provide both Telegram Bot Token and Chat ID.' };
  }

  const text = `🎉 *Watchtower Test Alert*\n\nYour Telegram bot integration is active!\n\n*Repo:* ShellStack\n*Stars:* 34 ⭐\n*Status:* 🔥 Trending on Dev.to`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'Telegram test message delivered!' };
    } else {
      return { success: false, message: `Telegram API Error: ${data.description}` };
    }
  } catch (err) {
    return { success: false, message: `Network Error: ${err.message}` };
  }
}
