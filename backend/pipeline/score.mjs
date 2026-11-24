// Horixon score 0-100: source weight, engagement, recency, coverage, first-party / pick boosts.
export function score(item, sources, now = Date.now()) {
  const weight = sources[item.sourceKey]?.weight ?? 0.7;
  const ageH = Math.max(0, (now - Date.parse(item.publishedAt)) / 3600000);
  const recency = Math.max(0, 1 - ageH / 72);              // 1 → 0 over 3 days
  const engagement = Math.min(1, (item.engagement || 0) / 100);
  const coverage = Math.min(1, (item.also?.length || 0) / 3);
  let s = 35 * engagement + 30 * recency + 15 * coverage + 20 * weight;
  if (item.badges.includes('first-party')) s += 6;
  if (item.badges.includes('radar-pick')) s += 8;
  return Math.max(1, Math.min(99, Math.round(s)));
}
