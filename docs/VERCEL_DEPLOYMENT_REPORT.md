# Vercel Deployment Doctor

Generated: 2026-06-07T16:29:40.643Z

Status: PASS

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `29225fd3`
- Working tree: clean
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 14/14
- Root: 200
- Home API: 200
- Deals API: 200
- /go redirect: 302
- Official benefit /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Home product deals checked: 8
- Home official benefits checked: 8

## Checks

| Result | Check | Detail |
| --- | --- | --- |
| PASS | root page | 200 HTML response from https://halindosa.com. |
| PASS | home api status | /api/home returned 200 JSON with ok=true. |
| PASS | home api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | home api deals | /api/home returned 8 deals. |
| PASS | home api official benefits | /api/home returned 8 official benefits/news deals. |
| PASS | home api realtime metadata | /api/home exposes cachePolicy=no-store and channel freshness metadata. |
| PASS | home product exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less product deal leaked from /api/home. |
| PASS | home official benefit exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less official benefit leaked from /api/home. |
| PASS | deals api status | /api/deals returned 8 verified deals. |
| PASS | deals publishable policy | No search, homepage, community, sold-out, low-quality, image-less, or non-publishable deal leaked from /api/deals. |
| PASS | go redirect status | /go/d014 reached an external destination after 2 hop(s). |
| PASS | go redirect destination | Destination host=www.coupang.com |
| PASS | official benefit redirect status | /go/news/news-gs25-drinking-festa-2026 reached an external official destination after 2 hop(s). |
| PASS | official benefit redirect destination | Destination host=gs25.gsretail.com |

## Required Fix If Blocked

If `/api/home` returns 404 while the root page returns 200, the public domain is serving an older/static deployment. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to `npm run build`, leave Output Directory empty, configure production environment variables, and redeploy `main`.
