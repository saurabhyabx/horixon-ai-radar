// Live alerts: after each run, push the best new stories to the community channels (Telegram now;
// WhatsApp / web push / app later read the same docs/data/alerts.json feed).
import path from 'node:path';
import { DATA_IN, DATA_OUT, SITE_URL, readJson, writeJson, log } from '../util.mjs';
import { diversify } from '../publish/site.mjs';
import { loadAds, pickAd, adHref } from '../pipeline/ads.mjs';
import { sendTelegram, telegramReady, tgEsc } from './telegram.mjs';

const STATE = path.join(DATA_IN, 'alerts-state.json');
const FEED = path.join(DATA_OUT, 'alerts.json');
const EMOJI = { models: '🧠', products: '🚀', industry: '🏛️', research: '📄', github: '⭐', founders: '💼' };
const LABEL = { models: 'Models', products: 'Products', industry: 'Industry', research: 'Research', github: 'GitHub', founders: 'Founders' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const link = (i) => (i.go ? `${SITE_URL}/${i.go}` : i.url);

export function formatStory(i, sponsor) {
  const lines = [
    `${EMOJI[i.category] || '✨'} <b>${tgEsc(LABEL[i.category] || 'AI')}</b> · ${tgEsc(i.source)} · score ${i.score}`,
    '',
    `<b>${tgEsc(i.title)}</b>`,
  ];
  const blurb = i.lang === 'zh' ? '' : i.why || i.summary; // skip untranslated Chinese text
  if (blurb) lines.push(tgEsc(blurb.length > 280 ? `${blurb.slice(0, 277)}…` : blurb));
  lines.push('', `🔗 <a href="${tgEsc(link(i))}">Read</a>`);
  if (sponsor) lines.push('', `— <i>${tgEsc(sponsor.label || 'Sponsored')}:</i> <b>${tgEsc(sponsor.title)}</b> · <a href="${tgEsc(`${SITE_URL}/${adHref(sponsor, 'telegram')}`)}">${tgEsc(sponsor.cta)}</a>`);
  return lines.join('\n');
}

export async function runAlerts(all, now = new Date()) {
  const cfg = await readJson(path.join(DATA_IN, 'alerts.json'), {});
  const minScore = cfg.minScore ?? 60, max = cfg.maxPerRun ?? 5, every = cfg.sponsorEvery ?? 4;
  const state = await readJson(STATE, { sent: [] });
  const sent = new Set(state.sent);
  const since = now.getTime() - 24 * 3600000;

  const picks = diversify(all.filter((i) => !sent.has(i.id) && i.score >= minScore && Date.parse(i.firstSeen) >= since)
    .sort((a, b) => b.score - a.score), 2).slice(0, max);
  if (!picks.length) { log('alerts: nothing new above threshold'); return { sent: 0 }; }

  const dry = process.env.HORIXON_ALERTS_DRYRUN === '1';
  const useTg = cfg.channels?.telegram !== false && telegramReady();
  if (!dry && !useTg) { log('alerts: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set, skipping channel posts (feed still updated)'); }

  const ads = await loadAds(now);
  const delivered = [];
  for (const [n, i] of picks.entries()) {
    const sponsor = every && (n + 1) % every === 0 ? pickAd(ads, 'telegram', { category: i.category }) : null;
    const msg = formatStory(i, sponsor);
    if (dry) { console.log(`\n----- telegram #${n + 1} -----\n${msg}`); delivered.push(i); continue; }
    if (useTg) {
      try { await sendTelegram(msg); }
      catch (e) {
        if (e.retryAfter) { await sleep((e.retryAfter + 1) * 1000); try { await sendTelegram(msg); } catch (e2) { log(`alerts: ${e2.message}`); continue; } }
        else { log(`alerts: ${e.message}`); continue; }
      }
      await sleep(1200);
    }
    delivered.push(i);
  }

  if (cfg.summary !== false && delivered.length > 1) {
    const sum = `📰 <b>${delivered.length} new AI stories</b> in this update.\nAll of today's news: <a href="${SITE_URL}/hot.html">Horixon hot list</a> · <a href="${SITE_URL}/daily.html">Daily digest</a>`;
    if (dry) console.log(`\n----- telegram summary -----\n${sum}`);
    else if (useTg) await sendTelegram(sum, { preview: false }).catch((e) => log(`alerts: ${e.message}`));
  }
  if (dry) { log(`alerts: dry run, ${delivered.length} messages printed, state not saved`); return { sent: 0, dryRun: delivered.length }; }

  // Record + publish the alerts feed (also used later by WhatsApp / push / app).
  const sentAt = now.toISOString();
  for (const i of delivered) sent.add(i.id);
  await writeJson(STATE, { updatedAt: sentAt, sent: [...sent].slice(-2000) });
  const feed = await readJson(FEED, { items: [] });
  const fresh = delivered.map((i) => ({ id: i.id, title: i.title, url: i.url, link: link(i), why: i.why || i.summary || '', source: i.source, category: i.category, score: i.score, sentAt, channels: useTg ? ['telegram'] : [] }));
  await writeJson(FEED, { updatedAt: sentAt, items: [...fresh, ...feed.items].slice(0, 100) });
  log(`alerts: ${delivered.length} published${useTg ? ' to Telegram' : ' to the alerts feed'}`);
  return { sent: delivered.length, telegram: useTg };
}
