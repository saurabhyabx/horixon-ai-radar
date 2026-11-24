// Optional LLM enrichment with Claude: translate non-English items to English and write a
// one-line "why it matters" for top items that lack one. Skipped when no API key is set.
// Results are cached by item id in data/enrich-cache.json so each item is paid for once.
import path from 'node:path';
import { readJson, writeJson, DATA_IN, log } from '../util.mjs';

const CACHE = path.join(DATA_IN, 'enrich-cache.json');
const MODEL = process.env.HORIXON_MODEL || 'claude-haiku-5-5';
const BATCH = 15;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'summary', 'why'],
        properties: { id: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' }, why: { type: 'string' } },
      },
    },
  },
};

const SYSTEM = `You edit an English AI news hub for founders, builders and product people.
For each item: give an English title (keep product names as-is), a plain 1-2 sentence English summary of what it is or what happened (max 45 words), and "why": one sentence on why a builder should care (max 25 words).
Use only facts in the input. No hype words. Return every id you were given.`;

export async function enrich(items, { limit = 60 } = {}) {
  const cache = await readJson(CACHE, {});
  const apply = () => items.forEach((it) => {
    const c = cache[it.id];
    if (c) { it.title = c.title || it.title; it.summary = c.summary || it.summary; it.why = c.why || it.why; it.lang = 'en'; it.enriched = true; }
  });
  apply();

  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  if (!hasKey) { log('enrich: no ANTHROPIC_API_KEY, skipping (raw text kept)'); return { skipped: true }; }

  const todo = items.filter((it) => !cache[it.id] && (it.lang !== 'en' || !it.why)).slice(0, limit);
  if (!todo.length) return { enriched: 0 };

  let Anthropic;
  try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); }
  catch { log('enrich: @anthropic-ai/sdk not installed (run npm install), skipping'); return { skipped: true }; }
  const client = new Anthropic();

  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH).map((it) => ({ id: it.id, title: it.title, summary: it.summary, why: it.why, source: it.source }));
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(batch) }],
      });
      if (res.stop_reason === 'refusal') { log('enrich: batch refused, skipping'); continue; }
      const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const { items: out = [] } = JSON.parse(text);
      for (const o of out) if (o?.id) { cache[o.id] = { title: o.title, summary: o.summary, why: o.why }; done++; }
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) { log('enrich: rate limited, stopping early'); break; }
      if (e instanceof Anthropic.AuthenticationError) { log('enrich: invalid API key, skipping'); break; }
      log(`enrich: batch failed: ${e.message}`);
    }
  }
  // keep cache bounded
  const keys = Object.keys(cache);
  if (keys.length > 3000) for (const k of keys.slice(0, keys.length - 3000)) delete cache[k];
  await writeJson(CACHE, cache);
  apply();
  log(`enrich: ${done} items enriched with ${MODEL}`);
  return { enriched: done };
}
