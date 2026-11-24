/* Horixon front end: shell, feed rendering, digests, forms. No build step. */
(() => {
  const C = window.HORIXON || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const BASE = document.documentElement.dataset.base || '';
  const page = document.body.dataset.page;
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const getJson = async (p) => { const r = await fetch(BASE + p, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); return r.json(); };

  /* ---------- icons ---------- */
  const I = {
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 3 2-1-3 0-5 0-7Z"/>',
    paper: '<path d="M4 4h12v16H6a2 2 0 0 1-2-2V4Z"/><path d="M16 8h4v10a2 2 0 0 1-2 2M8 8h4M8 12h4M8 16h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    tag: '<path d="M20 12 12 20l-9-9V3h8l9 9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8Zm0 0c2-4 6-4 6-1.5S15 8 12 8Z"/>',
    crown: '<path d="m3 7 4 4 5-6 5 6 4-4-2 12H5L3 7Z"/>',
    megaphone: '<path d="M3 10v4h3l7 5V5L6 10H3ZM17 8a5 5 0 0 1 0 8M19.5 5.5a9 9 0 0 1 0 13"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>', rocket: '<path d="M5 15c-1 1-2 5-2 5s4-1 5-2M14 4c4 0 6 2 6 6l-7 7-6-6 7-7ZM15 9h.01"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------- shell ---------- */
  const NAV = [
    ['Content', [['index.html', 'Featured', 'spark'], ['all.html', 'All AI news', 'list'], ['hot.html', 'Hot list', 'flame'], ['daily.html', 'Daily digest', 'paper'], ['weekly.html', 'Weekly', 'cal'], ['topics.html', 'Topics', 'tag'], ['saved.html', 'Saved', 'star']]],
    ['Grow with Horixon', [['newsletter.html', 'Free newsletter', 'mail'], ['templates.html', 'Free templates', 'gift'], ['pro.html', 'Horixon Pro', 'crown']]],
    ['More', [['advertise.html', 'Advertise', 'megaphone'], ['agent.html', 'RSS & API', 'plug'], ['about.html', 'About', 'info']]],
  ];
  const here = (location.pathname.split('/').pop() || 'index.html');
  function shell() {
    const side = $('#side');
    if (side) side.innerHTML = `
      <a class="brand" href="${BASE}index.html"><span class="brand-mark">H</span><span><span class="brand-name">${esc(C.siteName || 'Horixon')}</span><span class="brand-tag">${esc(C.tagline || '')}</span></span></a>
      ${NAV.map(([label, links]) => `<div class="nav-group"><div class="nav-label">${label}</div><nav class="nav">${links.map(([href, t, ic]) => `<a href="${BASE}${href}"${href === here ? ' aria-current="page"' : ''}>${icon(ic)}${t}</a>`).join('')}</nav></div>`).join('')}
      <div class="side-cta"><b>The Horixon Weekly</b>The 10 AI stories that matter, every Monday.<div style="margin-top:10px"><a class="btn" href="${BASE}newsletter.html">Subscribe free</a></div>${C.telegramUrl ? `<div style="margin-top:8px"><a href="${esc(C.telegramUrl)}" target="_blank" rel="noopener">Live alerts on Telegram →</a></div>` : ''}</div>`;
    const bottom = $('#bottom');
    if (bottom) bottom.innerHTML = [['index.html', 'Featured', 'spark'], ['all.html', 'All', 'list'], ['hot.html', 'Hot', 'flame'], ['daily.html', 'Daily', 'paper'], ['newsletter.html', 'Weekly', 'mail']]
      .map(([href, t, ic]) => `<a href="${BASE}${href}"${href === here ? ' aria-current="page"' : ''}>${icon(ic)}${t}</a>`).join('');
    $$('[data-theme-toggle]').forEach((b) => {
      const sync = () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; b.innerHTML = icon(dark ? 'sun' : 'moon'); b.setAttribute('aria-label', dark ? 'Light theme' : 'Dark theme'); };
      sync();
      b.addEventListener('click', () => { const dark = !(document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; store.set('hx-theme', dark ? 'dark' : 'light'); sync(); });
    });
    const foot = $('#foot');
    if (foot) foot.innerHTML = `<span>© ${new Date().getFullYear()} Horixon</span><a href="${BASE}about.html">About</a><a href="${BASE}agent.html">RSS & API</a><a href="${BASE}about.html#sources">Sources & credits</a><a href="${BASE}advertise.html">Advertise</a>${C.telegramUrl ? `<a href="${esc(C.telegramUrl)}" target="_blank" rel="noopener">Telegram</a>` : ''}`;
  }

  /* ---------- formatting ---------- */
  const CAT = { models: 'Models', products: 'Products', industry: 'Industry', research: 'Research', github: 'GitHub', founders: 'Founders' };
  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function dayLabel(iso) {
    const d = new Date(iso), t = new Date(); const k = (x) => x.toDateString();
    if (k(d) === k(t)) return 'Today';
    const y = new Date(t); y.setDate(t.getDate() - 1); if (k(d) === k(y)) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
  const readSet = new Set(store.get('hx-read', []));
  const saved = store.get('hx-saved', {});
  const markRead = (id) => { readSet.add(id); store.set('hx-read', [...readSet].slice(-2000)); };
  const outHref = (i) => (i.go ? BASE + i.go : i.url);

  function card(i, { showDate = false } = {}) {
    const badges = [
      i.badges?.includes('radar-pick') && '<span class="badge pick">Radar pick</span>',
      i.badges?.includes('first-party') && '<span class="badge fp">First-party</span>',
      i.badges?.includes('launch') && '<span class="badge launch">Launch</span>',
      i.category && `<span class="badge cat">${CAT[i.category] || i.category}</span>`,
    ].filter(Boolean).join('');
    const isSaved = !!saved[i.id];
    return `<article class="card${readSet.has(i.id) ? ' read' : ''}" data-id="${esc(i.id)}">
      <div class="meta"><span class="time">${showDate ? new Date(i.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' : ''}${time(i.publishedAt)}</span><span class="src">${esc(i.source)}</span>${badges}<span class="score" title="Horixon score">${i.score}</span></div>
      <h3><a href="${esc(outHref(i))}" target="_blank" rel="noopener" data-out>${esc(i.title)}</a></h3>
      ${i.summary ? `<p>${esc(i.summary)}</p>` : ''}
      ${i.why ? `<p class="why"><b>Why it matters:</b> ${esc(i.why)}</p>` : ''}
      <div class="card-foot">
        <a href="${esc(outHref(i))}" target="_blank" rel="noopener" data-out>Original ${icon('ext').replace('<svg', '<svg width="13" height="13"')}</a>
        ${(i.extraLinks || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
        ${i.also?.length ? `<span class="muted" title="${esc(i.also.map((a) => a.source).join(', '))}">Also covered by ${i.also.length} more</span>` : ''}
        ${i.sourceUrl && i.sourceUrl !== i.url ? `<a href="${esc(i.sourceUrl)}" target="_blank" rel="noopener">via ${esc(i.source)}</a>` : ''}
        <button class="star" data-star aria-pressed="${isSaved}">${isSaved ? '★ Saved' : '☆ Save'}</button>
        ${i.lang === 'zh' ? '<span class="lang-note">Original in Chinese</span>' : ''}
      </div></article>`;
  }

  /* ---------- ads / CTA engine ---------- */
  let ADS = null;
  async function loadAds() { if (!ADS) ADS = (await getJson('data/ads.json').catch(() => ({ ads: [] }))).ads || []; return ADS; }
  const adUrl = (ad, placement) => BASE + (ad.href ? ad.href : `go/?to=${encodeURIComponent(`ad-${ad.id}-${placement}`)}`);
  // Weighted rotation; paid ads that target the category win over house ads.
  function pickAd(placement, { category, n = 0, paidOnly = false } = {}) {
    const fit = (ADS || []).filter((a) => (a.placements || []).includes(placement));
    const paid = fit.filter((a) => a.type !== 'house');
    const targeted = paid.filter((a) => !a.categories?.length || !category || category === 'all' || a.categories.includes(category));
    const pool = targeted.length ? targeted : paid.length ? paid : paidOnly ? [] : fit;
    if (!pool.length) return null;
    const slots = pool.flatMap((a) => Array(Math.max(1, a.weight || 1)).fill(a));
    return slots[n % slots.length];
  }
  function promo(ad, placement) {
    if (!ad) return '';
    const paid = ad.type !== 'house';
    return `<aside class="promo${paid ? ' paid' : ''}" data-ad="${esc(ad.id)}" data-placement="${placement}"><div><div class="label">${esc(ad.label || (paid ? 'Sponsored' : 'Horixon'))}</div><h3>${esc(ad.title)}</h3><p>${esc(ad.text)}</p></div><a class="btn" href="${esc(adUrl(ad, placement))}"${paid ? ' rel="sponsored noopener" target="_blank"' : ''}>${esc(ad.cta)}</a></aside>`;
  }
  function track(name, props = {}) {
    try { if (typeof window.plausible === 'function') window.plausible(name, { props }); } catch { /* ignore */ }
    try { if (typeof window.gtag === 'function') window.gtag('event', name, props); } catch { /* ignore */ }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ad] a'); if (!a) return;
    const box = a.closest('[data-ad]');
    track('ad_click', { ad: box.dataset.ad, placement: box.dataset.placement, page });
  });
  async function fillRail() {
    const rail = $('.rail'); if (!rail) return;
    await loadAds();
    const ad = pickAd('rail', { paidOnly: true, n: Math.floor(Date.now() / 3.6e6) });
    if (ad) rail.insertAdjacentHTML('afterbegin', promo(ad, 'rail').replace('class="promo', 'class="promo rail-ad'));
  }

  function bindCards(root, items) {
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    root.addEventListener('click', (e) => {
      const el = e.target.closest('.card'); if (!el) return;
      const id = el.dataset.id;
      if (e.target.closest('[data-out]')) { markRead(id); el.classList.add('read'); }
      const star = e.target.closest('[data-star]');
      if (star) {
        if (saved[id]) delete saved[id]; else saved[id] = byId[id];
        store.set('hx-saved', saved);
        const on = !!saved[id]; star.setAttribute('aria-pressed', on); star.textContent = on ? '★ Saved' : '☆ Save';
      }
    });
  }

  /* ---------- feed pages ---------- */
  async function feedPage({ featured }) {
    const root = $('#feed'), tabs = $('#tabs'), q = $('#q'), unread = $('#unread');
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'all';
    const topic = params.get('topic');
    let data;
    try { data = await getJson('data/latest.json'); } catch { root.innerHTML = '<div class="empty">News is loading for the first time. Run the daily job, then refresh.</div>'; return; }
    await loadAds();
    let items = data.items;
    if (featured) { const cut = items.map((i) => i.score).sort((a, b) => b - a)[Math.min(items.length - 1, 80)] || 0; items = items.filter((i) => i.score >= cut); }
    tabs.innerHTML = [['all', 'All'], ...data.categories.map((c) => [c.key, c.label])].map(([k, l]) => `<button class="tab" role="tab" data-cat="${k}" aria-selected="${k === cat}">${l}</button>`).join('');
    const stamp = $('#stamp'); if (stamp) stamp.textContent = `Updated ${new Date(data.generatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
    let limit = 60;
    function render() {
      const term = (q?.value || '').trim().toLowerCase();
      let list = items.filter((i) => (cat === 'all' || i.category === cat) && (!topic || i.tags?.includes(topic)) && (!unread?.checked || !readSet.has(i.id)) && (!term || `${i.title} ${i.summary} ${i.source}`.toLowerCase().includes(term)));
      const total = list.length; list = list.slice(0, limit);
      if (!list.length) { root.innerHTML = '<div class="empty">No stories match. Try another tab or clear the search.</div>'; return; }
      let html = '', day = '', n = 0;
      const every = C.sponsorEvery || 8;
      const counts = {}; list.forEach((i) => { const d = dayLabel(i.publishedAt); counts[d] = (counts[d] || 0) + 1; });
      for (const i of list) {
        const d = dayLabel(i.publishedAt);
        if (d !== day) { if (day) html += '</div>'; day = d; html += `<div class="day-head"><h2>${d}</h2><span>${counts[d]} stories</span></div><div class="feed">`; }
        html += card(i); n++;
        if (n % every === 0) html += promo(pickAd('feed', { category: cat === 'all' ? i.category : cat, n: n / every - 1 }), 'feed');
      }
      html += '</div>';
      if (total > limit) html += `<button class="btn ghost more" id="more">Show more (${total - limit})</button>`;
      root.innerHTML = html;
      $('#more')?.addEventListener('click', () => { limit += 60; render(); });
    }
    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; $$('.tab', tabs).forEach((t) => t.setAttribute('aria-selected', t === b)); const u = new URL(location); cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat); history.replaceState(null, '', u); limit = 60; render(); });
    q?.addEventListener('input', () => { limit = 60; render(); });
    if (unread) { unread.checked = store.get('hx-unread', false); unread.addEventListener('change', () => { store.set('hx-unread', unread.checked); render(); }); }
    bindCards(root, data.items);
    render();
    if (topic) { const h = $('#topic-note'); if (h) h.innerHTML = `Topic: <b>#${esc(topic)}</b> · <a href="${location.pathname.split('/').pop()}">clear</a>`; }
    hotStrip();
  }

  async function hotStrip() {
    const el = $('#hot-strip'); if (!el) return;
    try {
      const { items } = await getJson('data/hot.json');
      el.innerHTML = `<h2>${icon('flame').replace('<svg', '<svg width="16" height="16" style="color:var(--hot)"')} Hot right now <a href="${BASE}hot.html">Full list →</a></h2>
        <ol class="hot-list">${items.slice(0, 8).map((i) => `<li><a href="${esc(outHref(i))}" target="_blank" rel="noopener" title="${esc(i.title)}">${esc(i.title)}</a><span class="heat">${i.score}</span></li>`).join('')}</ol>`;
    } catch { el.remove(); }
  }

  async function liveAlerts(root) {
    try {
      const { items = [], updatedAt } = await getJson('data/alerts.json');
      if (!items.length) return;
      const tg = C.telegramUrl ? ` · <a href="${esc(C.telegramUrl)}" target="_blank" rel="noopener">Get these on Telegram</a>` : '';
      root.insertAdjacentHTML('beforebegin', `<section class="panel live" style="margin-bottom:18px"><h3><span class="live-dot"></span> Live alerts</h3><p>Last sent ${new Date(updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}${tg}</p>
        <ul>${items.slice(0, 8).map((a) => `<li><span class="muted">${new Date(a.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> <a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.title)}</a></li>`).join('')}</ul></section>`);
    } catch { /* no alerts yet */ }
  }

  async function hotPage() {
    const root = $('#feed');
    liveAlerts(root);
    try {
      const { items, generatedAt } = await getJson('data/hot.json');
      $('#stamp').textContent = `Last 48 hours · updated ${new Date(generatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
      root.innerHTML = `<div class="feed">${items.map((i) => card(i, { showDate: true })).join('')}</div>`;
      bindCards(root, items);
    } catch { root.innerHTML = '<div class="empty">No hot list yet.</div>'; }
  }

  /* ---------- daily ---------- */
  async function dailyPage() {
    const root = $('#daily'), arch = $('#archive');
    let index = [];
    try { index = await getJson('data/daily/index.json'); } catch { root.innerHTML = '<div class="empty">The first daily digest appears after the first daily run.</div>'; return; }
    const date = new URLSearchParams(location.search).get('date') || index[0]?.date;
    arch.innerHTML = `<h3>Past issues</h3><ul class="archive">${index.slice(0, 40).map((d) => `<li><span>#${d.issue} · ${d.date.slice(5)}</span><a href="?date=${d.date}" title="${esc(d.headline)}"${d.date === date ? ' style="color:var(--accent);font-weight:600"' : ''}>${esc(d.headline)}</a></li>`).join('')}</ul>`;
    await loadAds();
    let d;
    try { d = await getJson(`data/daily/${date}.json`); } catch { root.innerHTML = '<div class="empty">Issue not found.</div>'; return; }
    const nice = new Date(`${d.date}T12:00:00Z`).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const secs = Object.entries(d.sections).filter(([, v]) => v.length);
    const pos = index.findIndex((x) => x.date === d.date);
    const prev = index[pos + 1], next = index[pos - 1];
    root.innerHTML = `
      <header class="daily-head"><div class="issue">Horixon Daily · Issue #${d.issue}</div><h1>${nice}</h1>
        <div class="stats"><div><b>${d.stats.stories}</b>stories</div><div><b>${d.stats.sources}</b>sources</div><div><b>${d.stats.firstParty}</b>first-party</div><div><b>~${d.stats.readMinutes} min</b>read</div></div></header>
      <nav class="toc">${secs.map(([k, v]) => `<a class="chip" href="#s-${k}">${CAT[k]} · ${v.length}</a>`).join('')}<a class="chip" href="${BASE}d/${d.date}.html">Shareable page</a></nav>
      <h2 class="day-head"><span style="font:700 17px var(--serif);color:var(--text)">Lead story</span></h2>
      <div class="feed">${card(d.lead, { showDate: true }).replace('class="card', 'class="card lead-card')}</div>
      <div class="day-head"><h2>Today's highlights</h2></div><div class="feed">${d.highlights.map((i) => card(i, { showDate: true })).join('')}</div>
      <div style="margin-top:14px">${promo(pickAd('daily', { n: d.issue }), 'daily')}</div>
      ${secs.map(([k, v]) => `<div class="day-head" id="s-${k}"><h2>${CAT[k]}</h2><span>${v.length}</span></div><div class="feed">${v.map((i) => card(i, { showDate: true })).join('')}</div>`).join('')}
      <div class="cta-box"><h2>Get the weekly in your inbox</h2><p>Not checking every day? The 10 stories that matter arrive every Monday. Free.</p>${formHtml('daily-footer')}</div>
      <p style="display:flex;justify-content:space-between">${prev ? `<a href="?date=${prev.date}">← #${prev.issue} ${prev.date}</a>` : '<span></span>'}${next ? `<a href="?date=${next.date}">#${next.issue} ${next.date} →</a>` : ''}</p>`;
    bindCards(root, [d.lead, ...d.highlights, ...secs.flatMap(([, v]) => v)]);
    bindForms(root);
  }

  async function weeklyPage() {
    const root = $('#weekly');
    let index = [];
    try { index = await getJson('data/weekly/index.json'); } catch { root.innerHTML = '<div class="empty">The first weekly digest is published on Monday. <a href="newsletter.html">Subscribe</a> to get it by email.</div>'; return; }
    const wk = new URLSearchParams(location.search).get('week') || index[0]?.week;
    const d = await getJson(`data/weekly/${wk}.json`).catch(() => null);
    if (!d) { root.innerHTML = '<div class="empty">Week not found.</div>'; return; }
    root.innerHTML = `<header class="daily-head"><div class="issue">Horixon Weekly · ${d.week}</div><h1>The ${d.top.length} AI stories that mattered this week</h1><div class="stats"><div><b>${d.total}</b>stories tracked</div></div></header>
      <div class="feed">${d.top.map((i) => card(i, { showDate: true })).join('')}</div>
      ${d.github.length ? `<div class="day-head"><h2>GitHub this week</h2></div><div class="feed">${d.github.map((i) => card(i, { showDate: true })).join('')}</div>` : ''}
      <div class="cta-box"><h2>Get this in your inbox every Monday</h2><p>Free. One email a week. Unsubscribe anytime.</p>${formHtml('weekly-page')}</div>
      <div class="panel"><h3>Past weeks</h3><ul>${index.map((w) => `<li><a href="?week=${w.week}">${w.week} — ${esc(w.headline)}</a></li>`).join('')}</ul></div>`;
    bindCards(root, [...d.top, ...d.github]);
    bindForms(root);
  }

  async function topicsPage() {
    const root = $('#topics');
    try {
      const { topics } = await getJson('data/topics.json');
      root.innerHTML = `<div class="chips" style="gap:10px">${topics.map((t) => `<a class="chip" style="font-size:15px;padding:7px 14px" href="all.html?topic=${encodeURIComponent(t.tag)}">#${esc(t.tag)} <span class="muted">${t.count}</span></a>`).join('')}</div>`;
    } catch { root.innerHTML = '<div class="empty">No topics yet.</div>'; }
  }

  function savedPage() {
    const root = $('#feed');
    const items = Object.values(saved).filter(Boolean);
    root.innerHTML = items.length ? `<div class="feed">${items.map((i) => card(i, { showDate: true })).join('')}</div>` : '<div class="empty">Nothing saved yet. Tap ☆ Save on any story. Saved stories stay in this browser.</div>';
    bindCards(root, items);
  }

  /* ---------- forms (newsletter + lead magnet) ---------- */
  function formHtml(source, { cta = 'Subscribe free', list = 'weekly' } = {}) {
    return `<form class="subscribe-form" data-subscribe data-source="${source}" data-list="${list}" novalidate>
      <div class="subscribe"><label class="sr" for="em-${source}">Email</label><input id="em-${source}" type="email" name="email" placeholder="you@company.com" autocomplete="email" required><button class="btn" type="submit">${cta}</button></div>
      <div class="form-msg" role="status"></div></form>`;
  }
  function bindForms(root = document) {
    $$('[data-form-slot]', root).forEach((slot) => { slot.outerHTML = formHtml(slot.dataset.formSlot, { cta: slot.dataset.cta, list: slot.dataset.list }); });
    $$('form[data-subscribe]', root).forEach((f) => {
      if (f.dataset.bound) return; f.dataset.bound = '1';
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('.form-msg', f), email = f.email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.className = 'form-msg err'; msg.textContent = 'Please enter a valid email.'; return; }
        const btn = $('button', f); btn.disabled = true;
        const fd = new FormData(); fd.append('email', email); fd.append('source', f.dataset.source); fd.append('list', f.dataset.list || 'weekly');
        try {
          if (C.newsletterEndpoint) await fetch(C.newsletterEndpoint, { method: 'POST', body: fd, mode: 'no-cors' });
          store.set('hx-subscribed', true);
          msg.className = 'form-msg ok';
          msg.textContent = C.newsletterEndpoint ? "You're in. Check your inbox to confirm." : "You're in (demo mode: set newsletterEndpoint in assets/config.js to collect emails).";
          f.dispatchEvent(new CustomEvent('subscribed', { bubbles: true }));
          f.reset();
        } catch { msg.className = 'form-msg err'; msg.textContent = 'Something went wrong. Please try again.'; }
        btn.disabled = false;
      });
    });
  }

  function templatesPage() {
    const grid = $('#tpl-grid'); if (!grid) return;
    const unlocked = store.get('hx-subscribed', false);
    grid.innerHTML = (C.templates || []).map((t) => `<div class="tpl"><div class="tpl-ico">${icon(t.icon)}</div><h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p>
      <a class="btn ${unlocked ? '' : 'ghost'}" data-tpl href="${unlocked ? BASE + esc(t.file) : '#get'}" ${unlocked ? 'download' : ''}>${unlocked ? 'Download' : 'Unlock free'}</a></div>`).join('');
    document.addEventListener('subscribed', () => {
      $$('[data-tpl]', grid).forEach((a, n) => { const t = C.templates[n]; a.href = BASE + t.file; a.setAttribute('download', ''); a.textContent = 'Download'; a.classList.remove('ghost'); });
      const ok = $('#unlocked'); if (ok) ok.hidden = false;
    });
    if (unlocked) { const ok = $('#unlocked'); if (ok) ok.hidden = false; }
  }

  function proPage() {
    $$('[data-price]').forEach((el) => { el.firstChild.textContent = C[el.dataset.price] || el.firstChild.textContent; });
    $$('[data-checkout]').forEach((a) => { const url = C[a.dataset.checkout]; if (url) { a.href = url; } else { a.href = '#waitlist'; } });
  }

  /* ---------- affiliate redirect ---------- */
  async function goPage() {
    const slug = new URLSearchParams(location.search).get('to');
    const msg = $('#go-msg');
    try {
      const list = await getJson('data/affiliates.json');
      const a = list.find((x) => x.slug === slug);
      if (!a || !/^https?:\/\//.test(a.target)) throw new Error('unknown');
      const clicks = store.get('hx-go', {}); clicks[slug] = (clicks[slug] || 0) + 1; store.set('hx-go', clicks);
      track(a.kind === 'ad' ? 'ad_redirect' : 'affiliate_click', { partner: a.partner, slug, placement: a.placement || '', campaign: a.campaign || '' });
      msg.innerHTML = `Taking you to <b>${esc(a.partner)}</b>… <a href="${esc(a.target)}" rel="sponsored noopener">Continue</a>`;
      location.replace(a.target);
    } catch { msg.innerHTML = `Link not found. <a href="${BASE}index.html">Back to Horixon</a>`; }
  }

  async function advertisePage() {
    const [latest, health] = await Promise.all([getJson('data/latest.json').catch(() => null), getJson('data/health.json').catch(() => null)]);
    const set = (id, v) => { const el = $(id); if (el && v != null) el.textContent = v; };
    if (latest) {
      set('#st-week', latest.count);
      set('#st-day', Math.round(latest.count / 7));
      set('#st-sources', new Set(latest.items.map((i) => i.source)).size);
      const cats = {}; latest.items.forEach((i) => { cats[i.category] = (cats[i.category] || 0) + 1; });
      const el = $('#st-cats'); if (el) el.innerHTML = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip">${CAT[k] || k} · ${v}</span>`).join('');
    }
    if (health) set('#st-updated', new Date(health.generatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }));
  }

  /* ---------- analytics (optional, privacy-friendly) ---------- */
  if (C.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    const sc = document.createElement('script'); sc.defer = true; sc.dataset.domain = C.plausibleDomain; sc.src = 'https://plausible.io/js/script.js'; document.head.appendChild(sc);
  }

  /* ---------- boot ---------- */
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { const q = $('#q'); if (q) { e.preventDefault(); q.focus(); } } });
  shell();
  bindForms();
  fillRail();
  const routes = { featured: () => feedPage({ featured: true }), all: () => feedPage({ featured: false }), hot: hotPage, daily: dailyPage, weekly: weeklyPage, topics: topicsPage, saved: savedPage, templates: templatesPage, pro: proPage, go: goPage, advertise: advertisePage, home: hotStrip };
  routes[page]?.();
})();
