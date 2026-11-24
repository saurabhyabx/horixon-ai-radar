// Weekly digest + newsletter draft (email-safe HTML and Markdown) for the free weekly.
import path from 'node:path';
import { ROOT, DATA_OUT, SITE_URL, readJson, writeJson, writeText, isoWeek, escXml } from '../util.mjs';
import { CATEGORIES } from '../pipeline/categorize.mjs';
import { diversify } from './site.mjs';
import { loadAds, pickAd, adHref } from '../pipeline/ads.mjs';

const link = (i) => (i.go ? `${SITE_URL}/${i.go}` : i.url);

export async function writeWeekly(all, now = new Date()) {
  const week = isoWeek(now);
  const since = now.getTime() - 7 * 86400000;
  const items = all.filter((i) => Date.parse(i.firstSeen) >= since).sort((a, b) => b.score - a.score);
  const ranked = diversify(items, 2);
  const top = ranked.slice(0, 10);
  const github = items.filter((i) => i.category === 'github').slice(0, 3);
  const founders = items.filter((i) => i.category === 'founders')[0];
  const ad = pickAd(await loadAds(now), 'newsletter', { seed: 0 });
  const sponsor = ad ? { label: ad.label || 'Sponsored', title: ad.title, text: ad.text, cta: ad.cta, href: `${SITE_URL}/${adHref(ad, 'newsletter')}`, house: ad.type === 'house' } : null;
  const digest = { week, generatedAt: now.toISOString(), total: items.length, top, github, founders: founders || null, sponsor };
  await writeJson(path.join(DATA_OUT, 'weekly', `${week}.json`), digest);
  const index = await readJson(path.join(DATA_OUT, 'weekly', 'index.json'), []);
  await writeJson(path.join(DATA_OUT, 'weekly', 'index.json'), [{ week, headline: top[0]?.title || '', count: items.length }, ...index.filter((w) => w.week !== week)]);

  await writeText(path.join(ROOT, 'newsletter', `${week}.md`), markdown(digest));
  await writeText(path.join(ROOT, 'newsletter', `${week}.html`), emailHtml(digest));
  return digest;
}

function markdown(d) {
  const cat = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
  const lines = [
    `# The Horixon Weekly — ${d.week}`, '',
    `${d.total} AI stories tracked this week. Here are the 10 that matter.`, '',
    ...d.top.flatMap((i, n) => [`**${n + 1}. [${i.title}](${link(i)})** · _${cat(i.category)} · ${i.source}_`, i.summary || '', i.why ? `> Why it matters: ${i.why}` : '', '']),
    '## GitHub this week', ...d.github.map((i) => `- [${i.title}](${link(i)})`), '',
    d.founders ? `## For founders\n[${d.founders.title}](${link(d.founders)}) — ${d.founders.summary}\n` : '',
    '---', `**Want this every morning, with research explained and the full GitHub trend board?** [Horixon Pro](${SITE_URL}/pro.html)`, '',
    d.sponsor ? `**${d.sponsor.label}: ${d.sponsor.title}** — ${d.sponsor.text} [${d.sponsor.cta}](${d.sponsor.href})` : '',
    `_Advertise to AI builders: ${SITE_URL}/advertise.html_`,
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

function emailHtml(d) {
  const row = (i, n) => `
  <tr><td style="padding:14px 0;border-bottom:1px solid #e7e5e4">
    <div style="font:12px/1.4 Arial,sans-serif;color:#78716c">${n + 1} · ${escXml(i.source)} · Score ${i.score}</div>
    <a href="${escXml(link(i))}" style="font:bold 17px/1.35 Georgia,serif;color:#1c1917;text-decoration:none">${escXml(i.title)}</a>
    <p style="margin:6px 0 0;font:14px/1.55 Arial,sans-serif;color:#44403c">${escXml(i.summary || '')}</p>
    ${i.why ? `<p style="margin:6px 0 0;font:13px/1.5 Arial,sans-serif;color:#0f766e"><b>Why it matters:</b> ${escXml(i.why)}</p>` : ''}
  </td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Horixon Weekly ${d.week}</title></head>
<body style="margin:0;background:#f5f5f4"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;padding:28px">
<tr><td><div style="font:bold 13px Arial,sans-serif;letter-spacing:.08em;color:#0f766e">HORIXON WEEKLY · ${d.week}</div>
<h1 style="font:bold 26px/1.25 Georgia,serif;color:#1c1917;margin:8px 0">The 10 AI stories that mattered this week</h1>
<p style="font:14px/1.5 Arial,sans-serif;color:#57534e;margin:0 0 8px">${d.total} stories tracked. Curated for builders and founders.</p></td></tr>
${d.top.map(row).join('')}
<tr><td style="padding:20px 0 6px"><div style="font:bold 15px Arial,sans-serif;color:#1c1917">GitHub this week</div>
${d.github.map((i) => `<div style="font:14px/1.6 Arial,sans-serif"><a style="color:#0f766e" href="${escXml(link(i))}">${escXml(i.title)}</a></div>`).join('')}</td></tr>
<tr><td style="padding:20px;background:#f0fdfa;border-radius:10px;font:14px/1.55 Arial,sans-serif;color:#134e4a">
<b>Get this every morning.</b> Horixon Pro is the daily report: research explained, founder resources, and the full GitHub trend board.
<br><a href="${SITE_URL}/pro.html" style="display:inline-block;margin-top:10px;background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Try Horixon Pro</a></td></tr>
${d.sponsor ? `<tr><td style="padding:16px 0 0"><div style="border:1px solid #e7e5e4;border-radius:10px;padding:16px;font:14px/1.5 Arial,sans-serif;color:#44403c"><div style="font:bold 11px Arial,sans-serif;letter-spacing:.08em;color:#a8a29e;text-transform:uppercase">${escXml(d.sponsor.label)}</div><b style="color:#1c1917">${escXml(d.sponsor.title)}</b><br>${escXml(d.sponsor.text)}<br><a href="${escXml(d.sponsor.href)}" style="color:#0f766e;font-weight:bold">${escXml(d.sponsor.cta)} →</a></div></td></tr>` : ''}
<tr><td style="padding-top:18px;font:12px Arial,sans-serif;color:#a8a29e"><a href="${SITE_URL}/advertise.html" style="color:#a8a29e">Advertise to AI builders</a> · <a href="${SITE_URL}" style="color:#a8a29e">Read on the web</a></td></tr>
</table></td></tr></table></body></html>`;
}
