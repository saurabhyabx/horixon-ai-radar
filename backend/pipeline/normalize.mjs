// Normalise raw source items into the Horixon item schema.
import { sha, clip, stripHtml, hasCJK } from '../util.mjs';

const TRACKING = /^(utm_|ref$|ref_src$|fbclid$|gclid$|mc_cid$|mc_eid$|source$)/i;

export function canonicalUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    url.hostname = url.hostname.replace(/^www\./, '');
    for (const k of [...url.searchParams.keys()]) if (TRACKING.test(k)) url.searchParams.delete(k);
    let s = url.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch { return u; }
}

export function normalize(raw) {
  const url = canonicalUrl(raw.url);
  const title = clip(stripHtml(raw.title), 180);
  const summary = clip(stripHtml(raw.summary || ''), 320);
  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  return {
    id: sha(url),
    title,
    url,
    domain,
    source: raw.source,
    sourceKey: raw.sourceKey,
    sourceUrl: raw.sourceUrl || url,
    summary,
    why: clip(stripHtml(raw.why || ''), 240),
    audience: clip(stripHtml(raw.audience || ''), 160),
    extraLinks: raw.extraLinks || [],
    publishedAt: raw.publishedAt || new Date().toISOString(),
    engagement: raw.engagement ?? 0,
    meta: raw.meta || {},
    badges: [...new Set(raw.badges || [])],
    hint: raw.hint,
    lang: hasCJK(`${title} ${summary}`) ? 'zh' : 'en',
  };
}
