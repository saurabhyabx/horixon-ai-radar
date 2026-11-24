// Write the site's JSON "API" under docs/data/ from the rolling store.
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { DATA_OUT, DATA_IN, readJson, writeJson, isoDay } from '../util.mjs';
import { CATEGORIES } from '../pipeline/categorize.mjs';

export const STORE = path.join(DATA_OUT, 'store.json');
const KEEP_DAYS = 30;

// Merge today's run into the rolling store, keeping firstSeen and best score.
export async function updateStore(items, now = new Date()) {
  const store = await readJson(STORE, { items: [] });
  const map = new Map(store.items.map((i) => [i.id, i]));
  const nowIso = now.toISOString();
  for (const it of items) {
    const prev = map.get(it.id);
    map.set(it.id, prev ? { ...prev, ...it, firstSeen: prev.firstSeen, score: Math.max(prev.score, it.score), lastSeen: nowIso } : { ...it, firstSeen: nowIso, lastSeen: nowIso });
  }
  const cutoff = now.getTime() - KEEP_DAYS * 86400000;
  const kept = [...map.values()].filter((i) => Date.parse(i.firstSeen) >= cutoff)
    .sort((a, b) => Date.parse(b.firstSeen) - Date.parse(a.firstSeen) || b.score - a.score);
  await writeJson(STORE, { updatedAt: nowIso, items: kept });
  return kept;
}

const pub = ({ hint, engagement, lastSeen, ...rest }) => rest; // trim internal fields

// Keep lists varied: at most `cap` items per source in the head of a ranked list.
export function diversify(list, cap = 2) {
  const seen = {}, head = [], tail = [];
  for (const i of list) ((seen[i.source] = (seen[i.source] || 0) + 1) <= cap ? head : tail).push(i);
  return [...head, ...tail];
}

export async function writeSite(all, health, now = new Date()) {
  const week = now.getTime() - 7 * 86400000;
  const recent = all.filter((i) => Date.parse(i.firstSeen) >= week);
  const latest = recent.slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 400).map(pub);
  await writeJson(path.join(DATA_OUT, 'latest.json'), { generatedAt: now.toISOString(), categories: CATEGORIES, count: latest.length, items: latest });

  const hotCut = now.getTime() - 48 * 3600000;
  const hot = diversify(all.filter((i) => Date.parse(i.publishedAt) >= hotCut).sort((a, b) => b.score - a.score), 3).slice(0, 30).map(pub);
  await writeJson(path.join(DATA_OUT, 'hot.json'), { generatedAt: now.toISOString(), items: hot });

  // topics: tag -> count over 7 days
  const topics = {};
  for (const i of recent) for (const t of i.tags || []) topics[t] = (topics[t] || 0) + 1;
  await writeJson(path.join(DATA_OUT, 'topics.json'), { generatedAt: now.toISOString(), topics: Object.entries(topics).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count })) });

  await writeJson(path.join(DATA_OUT, 'health.json'), { generatedAt: now.toISOString(), ...health });
  await writeJson(path.join(DATA_OUT, 'affiliates.json'), (await readJson(path.join(DATA_IN, 'affiliates.json'), [])).map(({ slug, target, partner }) => ({ slug, target, partner })));
  await writeJson(path.join(DATA_OUT, 'sponsors.json'), await readJson(path.join(DATA_IN, 'sponsors.json'), []));
  return { latest: latest.length, hot: hot.length };
}

// Daily digest: items first seen on `day` (UTC), ranked, grouped into sections.
export async function writeDaily(all, day = isoDay()) {
  const items = diversify(all.filter((i) => isoDay(i.firstSeen) === day).sort((a, b) => b.score - a.score), 2);
  if (!items.length) return null;
  const top = items.slice(0, 60).map(pub);
  const sections = {};
  for (const c of CATEGORIES) sections[c.key] = top.filter((i) => i.category === c.key).slice(0, 10);
  const index = await readJson(path.join(DATA_OUT, 'daily', 'index.json'), []);
  const existing = index.find((d) => d.date === day);
  const issue = existing?.issue ?? (index.reduce((m, d) => Math.max(m, d.issue), 0) + 1);
  const digest = {
    date: day,
    issue,
    generatedAt: new Date().toISOString(),
    stats: {
      stories: items.length,
      sources: new Set(items.map((i) => i.source)).size,
      firstParty: items.filter((i) => i.badges.includes('first-party')).length,
      readMinutes: Math.max(3, Math.round(top.length * 0.35)),
    },
    lead: top[0],
    highlights: top.slice(1, 4),
    sections,
  };
  await writeJson(path.join(DATA_OUT, 'daily', `${day}.json`), digest);
  const next = [{ date: day, issue, headline: digest.lead.title, count: items.length }, ...index.filter((d) => d.date !== day)]
    .sort((a, b) => b.date.localeCompare(a.date));
  await writeJson(path.join(DATA_OUT, 'daily', 'index.json'), next);
  return digest;
}

export async function listDailies() {
  try { return (await readdir(path.join(DATA_OUT, 'daily'))).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse(); }
  catch { return []; }
}
