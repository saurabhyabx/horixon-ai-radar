// GitHub: fast-rising new AI repos (search API) as a "trending" proxy.
import { http, isoDay, daysAgo } from '../util.mjs';

export default async function github() {
  const headers = { accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const since = isoDay(daysAgo(7));
  const topics = ['llm', 'ai-agents', 'generative-ai', 'mcp', 'rag'];
  const seen = new Map();
  for (const t of topics) {
    const q = encodeURIComponent(`topic:${t} created:>${since}`);
    try {
      const { items = [] } = await http(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`, { headers });
      for (const r of items) seen.set(r.full_name, r);
    } catch { /* rate limit etc. */ }
  }
  return [...seen.values()].filter((r) => r.stargazers_count >= 30).map((r) => ({
    title: `${r.full_name}${r.description ? ` — ${r.description.slice(0, 100)}` : ''}`,
    url: r.html_url,
    source: 'GitHub',
    sourceKey: 'github',
    sourceUrl: r.html_url,
    summary: r.description || '',
    publishedAt: r.created_at,
    engagement: Math.min(100, Math.round(r.stargazers_count / 20)),
    meta: { stars: r.stargazers_count, language: r.language },
    hint: 'github',
    badges: ['open-source'],
  }));
}
