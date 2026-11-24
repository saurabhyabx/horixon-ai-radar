// Minimal RSS 2.0 / Atom reader for the curated channel list in data/feeds.json.
import path from 'node:path';
import { http, stripHtml, decode, readJson, DATA_IN } from '../util.mjs';

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1] : '';
};
const atomLink = (xml) => {
  const alt = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return alt ? decode(alt[1]) : '';
};

export function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => ({
    title: stripHtml(tag(b, 'title')),
    url: stripHtml(tag(b, 'link')) || atomLink(b),
    summary: stripHtml(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')),
    publishedAt: stripHtml(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date')),
  })).filter((x) => x.title && /^https?:\/\//.test(x.url));
}

export default async function rss(cfg = {}) {
  const feeds = await readJson(path.join(DATA_IN, 'feeds.json'), []);
  const cutoff = Date.now() - 3 * 86400000;
  const results = await Promise.allSettled(feeds.map(async (f) => {
    const xml = await http(f.url, { as: 'text', timeout: 12000, headers: { accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    return parseFeed(xml).slice(0, f.limit ?? cfg.perFeed ?? 8).map((x, i) => {
      const t = Date.parse(x.publishedAt);
      return {
        ...x,
        publishedAt: Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString(),
        source: f.name,
        sourceKey: 'rss',
        sourceUrl: f.url,
        engagement: Math.max(0, 40 - i * 4),
        badges: f.firstParty ? ['first-party'] : [],
        hint: f.research ? 'research' : undefined,
      };
    }).filter((x) => Date.parse(x.publishedAt) >= cutoff);
  }));
  const items = [], errors = [];
  results.forEach((r, i) => (r.status === 'fulfilled' ? items.push(...r.value) : errors.push(`${feeds[i].name}: ${r.reason?.message || r.reason}`)));
  items.errors = errors;
  return items;
}
