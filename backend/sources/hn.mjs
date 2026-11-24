// Hacker News via Algolia search API: AI stories with a points floor.
import { http } from '../util.mjs';

const QUERIES = ['AI', 'LLM', 'GPT', 'Claude', 'Gemini', 'AI agent', 'open source model', 'MCP'];

export default async function hn(cfg = {}) {
  const since = Math.floor(Date.now() / 1000) - 2 * 86400;
  const min = cfg.minPoints ?? 40;
  const seen = new Map();
  for (const q of QUERIES) {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=30&numericFilters=created_at_i>${since},points>${min}`;
    try {
      const { hits = [] } = await http(url);
      for (const h of hits) if (!seen.has(h.objectID)) seen.set(h.objectID, h);
    } catch { /* keep going */ }
  }
  return [...seen.values()].map((h) => ({
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: 'Hacker News',
    sourceKey: 'hn',
    sourceUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
    summary: '',
    publishedAt: h.created_at,
    engagement: Math.min(100, Math.round((h.points || 0) / 5 + (h.num_comments || 0) / 10)),
    meta: { points: h.points, comments: h.num_comments },
    badges: /^(show|launch) hn/i.test(h.title) ? ['launch'] : [],
  }));
}
