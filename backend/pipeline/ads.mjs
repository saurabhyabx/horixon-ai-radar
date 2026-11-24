// Ads / CTA engine: active ads, tracked redirects, and placement picking.
// data/ads.json rows: {id, type: paid|affiliate|house, label, title, text, cta, url? | href?,
//                      placements[], categories[]?, start?, end?, weight?, enabled?}
import path from 'node:path';
import { DATA_IN, readJson, isoDay } from '../util.mjs';

export const PLACEMENTS = ['feed', 'rail', 'daily', 'newsletter', 'telegram'];

export async function loadAds(now = new Date()) {
  const day = isoDay(now);
  const ads = await readJson(path.join(DATA_IN, 'ads.json'), []);
  return ads.filter((a) => a && a.id && a.enabled !== false && (!a.start || a.start <= day) && (!a.end || a.end >= day));
}

// Tracked link for an ad in a placement. External ads go through /go/ with UTM tags.
export const adSlug = (ad, placement) => `ad-${ad.id}-${placement}`;
export function adHref(ad, placement) {
  if (ad.href) return ad.href; // house ad: internal page
  return `go/?to=${encodeURIComponent(adSlug(ad, placement))}`;
}

function withUtm(url, ad, placement) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'horixon');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', placement);
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', ad.id);
    return u.toString();
  } catch { return null; }
}

// Redirect rows for /go/ (one per external ad × placement) in the affiliates format.
export function adRedirects(ads) {
  const rows = [];
  for (const ad of ads) {
    if (!ad.url) continue;
    for (const p of ad.placements || PLACEMENTS) {
      const target = withUtm(ad.url, ad, p);
      if (target) rows.push({ slug: adSlug(ad, p), target, partner: ad.advertiser || ad.title, kind: 'ad', placement: p, campaign: ad.id });
    }
  }
  return rows;
}

// Weighted pick for a placement; paid/affiliate ads matching the category win over house ads.
export function pickAd(ads, placement, { category, seed = Math.random() } = {}) {
  const fit = ads.filter((a) => (a.placements || PLACEMENTS).includes(placement));
  const paid = fit.filter((a) => a.type !== 'house');
  const targeted = paid.filter((a) => !a.categories?.length || !category || a.categories.includes(category));
  const pool = targeted.length ? targeted : paid.length ? paid : fit;
  if (!pool.length) return null;
  const total = pool.reduce((s, a) => s + (a.weight || 1), 0);
  let r = seed * total;
  for (const a of pool) { r -= a.weight || 1; if (r <= 0) return a; }
  return pool[pool.length - 1];
}

// Public shape for the site (no internal notes).
export const publicAd = ({ note, enabled, ...a }) => a;
