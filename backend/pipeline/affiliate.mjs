// Affiliate link engine: route outbound links whose domain has a partner program through /go/?to=<slug>.
export function affiliateFor(url, affiliates) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  return affiliates.find((a) => a.domain && (host === a.domain || host.endsWith(`.${a.domain}`))) || null;
}

export function applyAffiliate(item, affiliates) {
  const a = affiliateFor(item.url, affiliates);
  if (a) { item.go = `go/?to=${encodeURIComponent(a.slug)}`; item.partner = a.partner; }
  return item;
}
