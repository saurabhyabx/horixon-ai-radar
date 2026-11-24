# Horixon — AI news hub

The AI news hub that turns explorers into builders. A daily system that collects AI news from launch sites, labs, GitHub, Hugging Face and AI portals, ranks it, explains why it matters, and publishes a static site on **GitHub Pages**. The whole backend runs on **GitHub Actions**; there is no server to manage.

Product positioning, funnel and open decisions: [POSITIONING.md](POSITIONING.md).

## How it works

```
GitHub Actions (daily 01:15 UTC)
  backend/run.mjs daily
    sources/     AI Product Radar picks · Hacker News · GitHub · Hugging Face · Product Hunt · 19 RSS feeds
    pipeline/    normalize → dedupe ("also covered by") → enrich (Claude, optional) → categorize → score → affiliate links
    publish/     docs/data/*.json · daily digest · RSS · sitemap · llms.txt · static /d/<date>.html pages
  commit → GitHub Pages redeploys docs/
Mondays: backend/run.mjs weekly → weekly digest + newsletter draft in newsletter/YYYY-Www.{html,md}
```

| Path | What it is |
|---|---|
| `docs/` | The website (GitHub Pages root). Plain HTML/CSS/JS, no build step. |
| `docs/assets/config.js` | Site settings: newsletter endpoint, Pro checkout links, prices, lead-magnet templates. |
| `docs/data/` | Generated JSON "API" (`latest`, `hot`, `daily/`, `weekly/`, `topics`, `health`). `store.json` is the rolling 30-day database. |
| `data/sources.json` | Turn sources on/off and set their ranking weight. |
| `data/feeds.json` | Curated RSS channels (the "20 best channels" list). |
| `data/affiliates.json` | Affiliate link manager: partner domain → `/go/?to=<slug>` redirect. |
| `data/sponsors.json` | In-feed sponsor / CTA cards. |
| `newsletter/` | Weekly newsletter drafts (email-ready HTML + Markdown) to paste into your email tool. |
| `reports/source-health/` | Per-day collection report (counts and errors per source). |

## Run locally

```powershell
npm install
```
```powershell
node backend/run.mjs dev
```
```powershell
node backend/serve.mjs
```
Then open http://127.0.0.1:8787. `dev` skips the Claude step; `daily` runs it when `ANTHROPIC_API_KEY` is set.

## Deploy on GitHub

1. Create a repo (e.g. `horixon-ai-radar`) and push this folder to `main`.
2. **Settings → Pages**: Source "Deploy from a branch", branch `main`, folder `/docs`.
3. **Settings → Actions → General → Workflow permissions**: "Read and write".
4. **Settings → Secrets and variables → Actions**:
   - Variable `HORIXON_SITE_URL` = your Pages URL (e.g. `https://<user>.github.io/horixon-ai-radar`).
   - Secret `ANTHROPIC_API_KEY` (optional): translates the Chinese AI Product Radar picks to English and writes "why it matters" lines, using Claude Haiku 5.5 (override with `HORIXON_MODEL`).
   - Secret `PRODUCT_HUNT_TOKEN` (optional): enables Product Hunt.
5. **Actions → Daily radar → Run workflow** once to publish immediately.

## Monetisation hooks

- **Newsletter & lead magnet**: set `newsletterEndpoint` in `docs/assets/config.js` to your email tool's form endpoint. Until then forms run in demo mode.
- **Pro**: set `proCheckoutMonthly` / `proCheckoutAnnual` (e.g. Stripe Payment Links) and prices in `config.js`.
- **Affiliates**: add `{slug, domain, target, partner}` rows to `data/affiliates.json`; matching outbound links are rewritten to `/go/?to=slug` on the next run.
- **Sponsors**: edit `data/sponsors.json` (cards appear every `sponsorEvery` stories).

## Content rules

Horixon stores only a title, a short summary and a link per story, and always links the original. AI Product Radar picks (github.com/BENZEMA216/ai-product-radar) are credited as "Radar pick"; that repo has no licence, so ask its author before commercial use, or set `radarPicks.enabled` to `false`. aihot.news was used as a layout reference only and is not ingested (its terms require permission for redistribution).
