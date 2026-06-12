# Vercel Deployment Doctor

Generated: 2026-06-12T02:48:13.397Z

Status: PASS

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `66c34b90`
- Working tree: clean
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 28/28
- Root: 200
- Home API: 200
- Deals API: 200
- Freebies API: 200
- Health API: 200
- Deployed commit: 66c34b90
- Expected deploy commit: (not enforced)
- Home API Request ID: 4c7cf304-4b63-41db-a260-7ccbfde0832a
- Deals API Request ID: b25a0706-e38b-4f7e-939d-96f46adde2a6
- Freebies API Request ID: 3e535d29-e001-49bd-9435-a6190787a3ab
- /go redirect: 302
- Official benefit /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Freebies API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Cron refresh public guard: 401
- Cron benefits public guard: 401
- Canonical production API contracts: passed (2 origin(s))
- Home product deals checked: 8
- Home official benefits checked: 160
- Freebies checked: 12
- Freebie events checked: 12
- Public/policy freebies in default response: 0

## Checks

| Result | Check | Detail |
| --- | --- | --- |
| PASS | root page | 200 HTML response from https://halindosa.com. |
| PASS | root security headers | Production HTML response includes CSP, HSTS, frame, MIME, referrer, and permissions headers. |
| PASS | home api status | /api/home returned 200 JSON with ok=true. |
| PASS | home api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | home api deals | /api/home returned 8 deals. |
| PASS | home api official benefits | /api/home returned 160 official benefits/news deals. |
| PASS | home api realtime metadata | /api/home exposes cachePolicy=no-store and channel freshness metadata. |
| PASS | home api abuse guard | /api/home exposes requestId and rate-limit headers on the public deployment. |
| PASS | deployment commit metadata | Public APIs expose deployed commit 66c34b90. |
| PASS | home product exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less product deal leaked from /api/home. |
| PASS | home official benefit exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less official benefit leaked from /api/home. |
| PASS | deals api status | /api/deals returned 8 verified deals. |
| PASS | deals api abuse guard | /api/deals exposes requestId and rate-limit headers on the public deployment. |
| PASS | deals publishable policy | No search, homepage, community, sold-out, low-quality, image-less, or non-publishable deal leaked from /api/deals. |
| PASS | freebies api status | /api/freebies returned 200 JSON with ok=true. |
| PASS | freebies api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | freebies api data | /api/freebies returned 12 freebie cards and 12 event cards. |
| PASS | freebies api realtime metadata | /api/freebies exposes cachePolicy=no-store, freshness label, and next refresh metadata. |
| PASS | freebies api abuse guard | /api/freebies exposes requestId and rate-limit headers on the public deployment. |
| PASS | freebies publishable policy | No search, homepage, community, expired, hidden, low-quality, image-less, or non-publishable free benefit leaked from /api/freebies. |
| PASS | freebies consumer-first default policy | Default /api/freebies response excludes public/policy benefits unless explicitly requested. |
| PASS | canonical production api contracts | Apex/www production APIs expose requestId, rate-limit headers, and no-store responses on 2 origin(s). |
| PASS | cron refresh public guard | /api/cron/refresh rejects unauthenticated dry-run probes on the public deployment with 401. |
| PASS | cron benefits public guard | /api/cron/benefits rejects unauthenticated dry-run probes on the public deployment with 401. |
| PASS | go redirect status | /go/d014 reached an external destination after 2 hop(s). |
| PASS | go redirect destination | Destination host=www.coupang.com |
| PASS | official benefit redirect status | /go/news/news-dunkin-monthly-combo-coupon reached an external official destination after 2 hop(s). |
| PASS | official benefit redirect destination | Destination host=www.dunkindonuts.co.kr |

## Required Fix If Blocked

If `/api/home` is missing `requestId`, `X-Request-Id`, or `X-RateLimit-Remaining`, the public domain is serving an older deployment even if GitHub Actions reported a green deploy. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to `npm run build`, leave Output Directory empty, configure production environment variables, and redeploy `main`.
