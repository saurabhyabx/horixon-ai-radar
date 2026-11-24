// Merge duplicates (same URL or near-identical titles) into one story with "also covered by".
const STOP = new Set('the a an and or of to in on for with by is are from at as its it this that new how why what launches launch introducing ai'.split(' '));
const tokens = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9㐀-鿿 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0; for (const x of a) if (b.has(x)) n++;
  return n / (a.size + b.size - n);
}

export function dedupe(items) {
  const byUrl = new Map();
  for (const it of items) {
    const prev = byUrl.get(it.url);
    if (!prev) { byUrl.set(it.url, { ...it, also: [] }); continue; }
    mergeInto(prev, it);
  }
  const list = [...byUrl.values()].sort((a, b) => b.engagement - a.engagement);
  const out = [];
  for (const it of list) {
    const tk = tokens(it.title);
    const match = out.find((o) => o._tk && jaccard(o._tk, tk) >= 0.6);
    if (match) mergeInto(match, it);
    else out.push(Object.assign(it, { _tk: tk }));
  }
  return out.map(({ _tk, ...rest }) => rest);
}

function mergeInto(primary, dup) {
  if (dup.source !== primary.source && !primary.also.some((a) => a.source === dup.source)) {
    primary.also.push({ source: dup.source, url: dup.sourceUrl || dup.url });
  }
  primary.engagement = Math.max(primary.engagement, dup.engagement);
  primary.badges = [...new Set([...primary.badges, ...dup.badges])];
  if (!primary.summary && dup.summary) primary.summary = dup.summary;
  if (!primary.why && dup.why) primary.why = dup.why;
  primary.extraLinks = [...primary.extraLinks, ...(dup.extraLinks || [])];
}
