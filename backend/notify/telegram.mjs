// Telegram Bot API sender. Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (e.g. "@horixon_ai" or "-100…").
export const telegramReady = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

export const tgEsc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function sendTelegram(html, { preview = true } = {}) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: !preview },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    const err = new Error(`Telegram ${res.status}: ${body.description || 'send failed'}`);
    err.retryAfter = body.parameters?.retry_after;
    throw err;
  }
  return body.result?.message_id;
}
