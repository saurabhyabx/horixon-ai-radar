// RSS feeds, sitemap, llms.txt and static SEO pages for each daily issue.
import path from 'node:path';
import { DOCS, DATA_OUT, SITE_URL, readJson, writeText, escXml } from '../util.mjs';
import { CATEGORIES } from '../pipeline/categorize.mjs';

const PAGES = ['', 'all.html', 'hot.html', 'daily.html', 'weekly.html', 'topics.html', 'newsletter.html', 'templates.html', 'pro.html', 'agent.html', 'about.html', 'advertise.html'];

function rss(title, link, desc, items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${escXml(title)}</title><link>${escXml(link)}</link><description>${escXml(desc)}</description>
<atom:link href="${escXml(link)}" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.map((i) => `<item><title>${escXml(i.title)}</title><link>${escXml(i.link)}</link><guid isPermaLink="false">${escXml(i.guid)}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${escXml(i.desc)}</description>${i.category ? `<category>${escXml(i.category)}</category>` : ''}</item>`).join('\n')}
</channel></rss>`;
}

const toRss = (i) => ({ title: i.title, link: i.url, guid: i.id, date: i.publishedAt, desc: [i.summary, i.why && `Why it matters: ${i.why}`, `Source: ${i.source}`].filter(Boolean).join(' — '), category: i.category });

export async function writeFeeds() {
  const latest = await readJson(path.join(DATA_OUT, 'latest.json'), { items: [] });
  const items = latest.items.slice().sort((a, b) => b.score - a.score).slice(0, 50).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  await writeText(path.join(DOCS, 'feed.xml'), rss('Horixon — AI news hub', `${SITE_URL}/feed.xml`, 'Top AI launches, models, research and GitHub trends.', items.map(toRss)));
  for (const c of CATEGORIES) {
    const ci = latest.items.filter((i) => i.category === c.key).slice(0, 40);
    await writeText(path.join(DOCS, 'feed', 'category', `${c.key}.xml`), rss(`Horixon — ${c.label}`, `${SITE_URL}/feed/category/${c.key}.xml`, `${c.label} stories from Horixon.`, ci.map(toRss)));
  }
  const dailies = await readJson(path.join(DATA_OUT, 'daily', 'index.json'), []);
  await writeText(path.join(DOCS, 'feed', 'daily.xml'), rss('Horixon Daily', `${SITE_URL}/feed/daily.xml`, 'The Horixon daily AI digest.', dailies.slice(0, 30).map((d) => ({ title: `Horixon Daily #${d.issue} — ${d.headline}`, link: `${SITE_URL}/d/${d.date}.html`, guid: `daily-${d.date}`, date: `${d.date}T08:00:00Z`, desc: `${d.count} stories. Lead: ${d.headline}` }))));
  const weeklies = await readJson(path.join(DATA_OUT, 'weekly', 'index.json'), []);
  await writeText(path.join(DOCS, 'feed', 'weekly.xml'), rss('Horixon Weekly', `${SITE_URL}/feed/weekly.xml`, 'The Horixon weekly AI digest.', weeklies.slice(0, 12).map((w) => ({ title: `Horixon Weekly ${w.week} — ${w.headline}`, link: `${SITE_URL}/weekly.html?week=${w.week}`, guid: `weekly-${w.week}`, date: new Date().toISOString(), desc: `${w.count} stories this week.` }))));

  for (const d of dailies.slice(0, 60)) {
    const digest = await readJson(path.join(DATA_OUT, 'daily', `${d.date}.json`));
    if (digest) await writeText(path.join(DOCS, 'd', `${d.date}.html`), dailyPage(digest));
  }

  const urls = [...PAGES.map((p) => `${SITE_URL}/${p}`), ...dailies.slice(0, 365).map((d) => `${SITE_URL}/d/${d.date}.html`)];
  await writeText(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${escXml(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
  await writeText(path.join(DOCS, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await writeText(path.join(DOCS, 'llms.txt'), `# Horixon — AI news hub\n\n> Daily curated AI news: launches, models, research, GitHub trends and founder resources. Updated every day by an automated pipeline with editorial ranking.\n\n## Machine-readable\n- [Latest items (JSON)](${SITE_URL}/data/latest.json)\n- [Hot list (JSON)](${SITE_URL}/data/hot.json)\n- [Daily digests index (JSON)](${SITE_URL}/data/daily/index.json)\n- [RSS: top stories](${SITE_URL}/feed.xml)\n- [RSS: daily digest](${SITE_URL}/feed/daily.xml)\n\n## Recent daily digests\n${dailies.slice(0, 14).map((d) => `- [${d.date}: ${d.headline}](${SITE_URL}/d/${d.date}.html)`).join('\n')}\n`);
}

function dailyPage(d) {
  const cat = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
  const card = (i) => `<article class="card"><div class="meta"><span>${escXml(i.source)}</span><span class="score">${i.score}</span></div>
<h3><a href="${escXml(i.go ? `../${i.go}` : i.url)}" rel="noopener" target="_blank">${escXml(i.title)}</a></h3>
${i.summary ? `<p>${escXml(i.summary)}</p>` : ''}${i.why ? `<p class="why"><b>Why it matters:</b> ${escXml(i.why)}</p>` : ''}</article>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Horixon Daily ${d.date}`, itemListElement: [d.lead, ...d.highlights].filter(Boolean).map((i, n) => ({ '@type': 'ListItem', position: n + 1, url: i.url, name: i.title })) };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Horixon Daily #${d.issue} · ${d.date} — ${escXml(d.lead.title)}</title>
<meta name="description" content="${escXml(`${d.stats.stories} AI stories on ${d.date}. Lead: ${d.lead.title}`)}">
<link rel="canonical" href="${SITE_URL}/d/${d.date}.html"><link rel="stylesheet" href="../assets/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body class="static"><main class="static-wrap">
<p><a href="../index.html">← Horixon</a> · <a href="../daily.html?date=${d.date}">Interactive view</a></p>
<h1>Horixon Daily #${d.issue} · ${d.date}</h1>
<p class="muted">${d.stats.stories} stories · ${d.stats.sources} sources · ~${d.stats.readMinutes} min read</p>
<h2>Lead story</h2>${card(d.lead)}
<h2>Today's highlights</h2>${d.highlights.map(card).join('')}
${Object.entries(d.sections).filter(([, v]) => v.length).map(([k, v]) => `<h2>${cat(k)}</h2>${v.map(card).join('')}`).join('')}
<section class="cta-box"><h2>Get the weekly in your inbox</h2><p>The 10 AI stories that matter, every Monday. Free.</p><a class="btn" href="../newsletter.html">Subscribe free</a></section>
</main></body></html>`;
}
