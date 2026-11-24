// AI Product Radar (github.com/BENZEMA216/ai-product-radar) daily picks.
// Files: picks/YYYY-MM-DD.json -> [{product, link, phLink?, did, who, why, tip?}]
import { http, isoDay, daysAgo } from '../util.mjs';

const BASE = 'https://raw.githubusercontent.com/BENZEMA216/ai-product-radar/main/picks/';

export default async function radarPicks(cfg = {}) {
  const days = cfg.days ?? 7;
  const items = [];
  for (let i = 0; i < days; i++) {
    const day = isoDay(daysAgo(i));
    let picks;
    try { picks = await http(`${BASE}${day}.json`, { timeout: 10000 }); } catch { continue; }
    if (!Array.isArray(picks)) continue;
    picks.forEach((p, rank) => {
      if (!p?.product || !p?.link) return;
      items.push({
        title: p.product,
        url: p.link,
        source: 'AI Product Radar',
        sourceKey: 'radarPicks',
        sourceUrl: `https://github.com/BENZEMA216/ai-product-radar/blob/main/picks/${day}.json`,
        summary: p.did || '',
        why: p.why || '',
        audience: p.who || '',
        extraLinks: p.phLink ? [{ label: 'Product Hunt', url: p.phLink }] : [],
        publishedAt: `${day}T08:00:00Z`,
        engagement: Math.max(0, 10 - rank) * 10,
        badges: ['radar-pick'],
      });
    });
  }
  return items;
}
