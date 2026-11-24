# Horixon — Product Positioning

> **Horixon is the AI news hub that turns explorers into builders.**
> We meet people where AI attention already flows (news, launches, GitHub, research), keep them with a weekly inbox habit, and convert the serious ones into paying daily readers and partner customers.

## Who it is for

| Segment | What they want | Where they already are |
|---|---|---|
| **Explorers** (curious professionals, students, PMs) | "What happened in AI today, in 3 minutes?" | Google, Hacker News, X, Product Hunt, newsletters |
| **Builders** (founders, indie hackers, engineers) | New tools, models, repos, and templates they can use this week | GitHub trending, Hugging Face, launch sites |
| **Buyers** (teams choosing AI tools) | Shortlists and trusted recommendations | Review sites, search, peers |

## The funnel: four doors + one engine

```
  ONLINE TRAFFIC (search, social, HN, GitHub)
            │   SEO + AEO (sitemap, JSON-LD, llms.txt, RSS)
            ▼
 ┌─────────────────────────────┐
 │ 1 REACH  AI Trend & Media   │  horixon / all / hot / daily
 │   channel (news hub)        │  ← sponsor + CTA slots
 └────────────┬────────────────┘
              │ "Get the free template"   "Get the weekly"
              ▼                              ▼
 ┌─────────────────────────┐   ┌──────────────────────────────┐
 │ 2 CAPTURE Free template │──▶│ 3 INBOX Free weekly newsletter│  ← sponsorships
 │   lead magnet           │   │   (for people who don't visit)│
 └─────────────────────────┘   └──────────────┬───────────────┘
                                              │ upsell
                                              ▼
                               ┌──────────────────────────────┐
                               │ 4 CONVERT Paid daily report  │  ← subscriptions
                               └──────────────────────────────┘

  ENGINE under every door: Affiliate link manager (/go/?to=slug)
  Every outbound product/tool link can earn a reward when a reader
  becomes a customer on the partner platform.
```

### 1 · Reach — AI Trend & Media channel
- A sourcing channel that collects AI news from other portals and lists it on Horixon (title, short summary, why it matters, link to original).
- Sources today: AI Product Radar daily picks, Hacker News, GitHub trending/releases, Hugging Face, Product Hunt, curated RSS of AI portals (`data/feeds.json`, the seed of the "20 best channels").
- Runs daily on GitHub Actions; publishes to GitHub Pages. No server to manage.
- Traffic tactics: SEO (per-day pages, sitemap), AEO (JSON-LD, `llms.txt`, open JSON API, RSS), shareable daily digest.
- Monetisation: sponsor/CTA slots in the feed (`data/sponsors.json`) that send hot, intent-rich visitors to partners.

### 2 · Capture — Free template lead magnet
- Landing page → email gate → template download (`/templates.html`).
- Every template is an onboarding moment: the thank-you step offers the weekly newsletter.

### 3 · Inbox — Free weekly newsletter
- Goes to people who are not visiting the site. Auto-drafted every Monday from the week's top items (`newsletter/YYYY-Www.html`), editor polishes and sends.
- A sample of the curation, with a teaser of what the paid daily includes.
- Monetisation: one sponsor slot per issue once the audience fits.

### 4 · Convert — Paid daily report (Horixon Pro)
- Daily, deeper curation: research papers explained, founder & startup resources, GitHub daily trends, trend briefs.
- Monthly or annual subscription; premium add-ons (deep-dive research, founder kits, trend briefs).

### Engine — Affiliate link manager
- `data/affiliates.json` maps partner domains to affiliate URLs; the pipeline rewrites matching outbound links to `/go/?to=<slug>`.
- Applies to news links, template links, newsletter links, and sponsor CTAs, so every referral backlink supports the affiliate engine.

### Ads & CTA engine (how ads come in)
News brings traffic; sponsor CTAs send that intent-rich traffic to platforms that pay for it.
- **Inventory:** in-feed cards (every 8 stories, category-targeted), sidebar slot, daily digest slot, weekly newsletter sponsor block, Telegram sponsor line, affiliate links.
- **Booking:** one row in `data/ads.json` per campaign (title, line, CTA, URL, placements, categories, dates, weight). It switches on and off by date automatically.
- **Proof for advertisers:** every click goes through `/go/` with UTM tags (`utm_source=horixon`, `utm_medium=<placement>`, `utm_campaign=<id>`), plus optional Plausible events on Horixon's side.
- **Sales page:** `/advertise.html` with live audience signals (stories per day/week, sources, category mix), placements, prices and an enquiry form.
- **Fallback:** empty slots show house CTAs (Weekly, Templates, Pro), so every slot still grows the list or revenue.

## Distribution: real-time channels
| Channel | Status | How |
|---|---|---|
| Website live alerts | Live | "Live alerts" box on the Hot list, refreshed every 4 hours |
| Telegram channel | Built, needs bot token | Bot posts best new stories every 4 hours (score ≥ 60, max 5) |
| WhatsApp Channel / groups | Later | No official posting API for Channels or groups; post manually from `alerts.json`, or use WhatsApp Cloud API broadcasts to opted-in users (paid per message, needs Meta business verification) |
| Web push | Later | OneSignal (free tier) reading `alerts.json` |
| Mobile app + in-app notifications | Later | App reads `latest.json` + `alerts.json`; push via Firebase Cloud Messaging |

## Free weekly vs paid daily

| | Free weekly | Pro daily |
|---|---|---|
| Frequency | Monday | Every morning |
| Items | Top ~10 of the week | Full ranked list + deep picks |
| Research explained | Headline only | Yes |
| Founder & startup resources | 1 teaser | Full section |
| GitHub trends | Top 3 | Daily trend board |
| Trend briefs | — | Weekly brief |
| Sponsors | 1 slot | Light / none |

## Revenue streams
1. Subscriptions to the daily report (monthly / annual).
2. Upsell free weekly → paid daily.
3. Sponsorships in the feed, weekly, and daily.
4. Affiliate commissions from `/go/` links.
5. Premium add-ons: deeper research, founder resources, trend briefs.

## Open decisions
- [ ] Subscription price (monthly / annual).
- [ ] Target niche and ideal customer (e.g. "AI tools for founders" vs "AI for PMs").
- [ ] Newsletters to benchmark (format, acquisition, positioning, paid or free).
- [ ] What exactly the daily report includes beyond the weekly.
- [ ] Who curates, and how many minutes per day.
- [ ] Newsletter tool (Beehiiv / Substack / Buttondown / ConvertKit) — set `newsletterEndpoint` in `docs/assets/config.js`.
- [ ] Payment tool (Stripe / Lemon Squeezy / newsletter-native).
- [ ] Curate the 20 best channels into `data/feeds.json`.
- [ ] Sign affiliate programs and fill `data/affiliates.json`.
- [ ] Ask BENZEMA216 for permission/licence to reuse AI Product Radar picks (repo has no licence today).

## Content & sourcing rules
- Store only title, link, and a short summary per item; always credit and link the original.
- Any source can be switched off in `data/sources.json`.
- aihot.news is a structural reference only; its terms require written permission for commercial redistribution, so it is not ingested.
