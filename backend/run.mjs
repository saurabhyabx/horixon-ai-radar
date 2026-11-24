#!/usr/bin/env node
// Horixon daily system entry point.
//   node backend/run.mjs daily   collect → normalise → dedupe → categorise → score → enrich → publish
//   node backend/run.mjs weekly  build the weekly digest + newsletter draft from the store
//   node backend/run.mjs feeds   rebuild feeds/sitemap/static daily pages only
//   node backend/run.mjs dev     daily without LLM enrichment (fast local run)
//   node backend/run.mjs alerts  push new top stories to Telegram from the current store (HORIXON_ALERTS_DRYRUN=1 to preview)
import path from 'node:path';
import { DATA_IN, ROOT, readJson, writeJson, isoDay, log } from './util.mjs';
import radarPicks from './sources/radarPicks.mjs';
import hn from './sources/hn.mjs';
import github from './sources/github.mjs';
import huggingface from './sources/huggingface.mjs';
import producthunt from './sources/producthunt.mjs';
import rss from './sources/rss.mjs';
import { normalize } from './pipeline/normalize.mjs';
import { dedupe } from './pipeline/dedupe.mjs';
import { categorize, tagsFor } from './pipeline/categorize.mjs';
import { score } from './pipeline/score.mjs';
import { applyAffiliate } from './pipeline/affiliate.mjs';
import { enrich } from './pipeline/enrich.mjs';
import { updateStore, writeSite, writeDaily, STORE } from './publish/site.mjs';
import { writeWeekly } from './publish/digest.mjs';
import { writeFeeds } from './publish/feeds.mjs';
import { runAlerts } from './notify/alerts.mjs';

const SOURCES = { radarPicks, hn, github, huggingface, producthunt, rss };

async function collect(cfg) {
  const health = { sources: {} };
  const raw = [];
  await Promise.all(Object.entries(SOURCES).map(async ([key, fn]) => {
    const c = cfg[key] || {};
    if (c.enabled === false) { health.sources[key] = { status: 'disabled', count: 0 }; return; }
    const t0 = Date.now();
    try {
      const items = await fn(c);
      raw.push(...items);
      health.sources[key] = { status: items.skipped ? 'skipped' : items.length ? 'ok' : 'empty', count: items.length, ms: Date.now() - t0, ...(items.skipped ? { note: items.skipped } : {}), ...(items.errors?.length ? { errors: items.errors } : {}) };
    } catch (e) {
      health.sources[key] = { status: 'error', count: 0, ms: Date.now() - t0, error: e.message };
    }
    log(`${key}: ${health.sources[key].status} (${health.sources[key].count})`);
  }));
  return { raw, health };
}

async function daily({ llm = true, alerts: sendAlerts = true } = {}) {
  const now = new Date();
  const cfg = await readJson(path.join(DATA_IN, 'sources.json'), {});
  const keywords = await readJson(path.join(DATA_IN, 'keywords.json'), {});
  const affiliates = await readJson(path.join(DATA_IN, 'affiliates.json'), []);

  const { raw, health } = await collect(cfg);
  let items = dedupe(raw.filter((r) => r?.title && r?.url).map(normalize));
  if (llm) health.enrich = await enrich(items);
  items = items.map((it) => {
    it.category = categorize(it, keywords);
    it.tags = tagsFor(it);
    it.score = score(it, cfg, now.getTime());
    return applyAffiliate(it, affiliates);
  });
  health.collected = raw.length;
  health.afterDedupe = items.length;

  const all = await updateStore(items, now);
  const counts = await writeSite(all, health, now);
  const digest = await writeDaily(all, isoDay(now));
  await writeFeeds();
  if (sendAlerts) health.alerts = await runAlerts(all, now).catch((e) => ({ error: e.message }));
  await writeJson(path.join(ROOT, 'reports', 'source-health', `${isoDay(now)}.json`), health);
  log(`published: ${counts.latest} latest, ${counts.hot} hot, daily #${digest?.issue ?? '-'} (${digest?.stats.stories ?? 0} stories)`);
  if (!items.length) { log('no items collected — check network / sources'); process.exitCode = 1; }
}

async function weekly() {
  const store = await readJson(STORE, { items: [] });
  const d = await writeWeekly(store.items);
  await writeFeeds();
  log(`weekly ${d.week}: ${d.top.length} top items → newsletter/${d.week}.html`);
}

const cmd = process.argv[2] || 'daily';
async function alerts() { const store = await readJson(STORE, { items: [] }); await runAlerts(store.items); }

const run = { daily: () => daily(), dev: () => daily({ llm: false, alerts: false }), weekly, alerts, feeds: writeFeeds }[cmd];
if (!run) { console.error(`Unknown command "${cmd}". Use daily | dev | weekly | alerts | feeds`); process.exit(2); }
run().catch((e) => { console.error(e); process.exit(1); });
