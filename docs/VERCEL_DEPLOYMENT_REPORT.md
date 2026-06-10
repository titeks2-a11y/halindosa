# Vercel Deployment Doctor

Generated: 2026-06-10T19:57:19.561Z

Status: BLOCKED

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `a7e87e3d`
- Working tree: 2 changed file(s): M docs/VERCEL_DEPLOYMENT_REPORT.md; M reports/vercel-deployment.json
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 28/29
- Root: 200
- Home API: 200
- Deals API: 200
- Freebies API: 200
- Health API: 200
- Deployed commit: (missing)
- Expected deploy commit: a7e87e3d
- Home API Request ID: 2e811e76-ebed-44be-9d43-a165819c6c57
- Deals API Request ID: 8debccff-a077-4cec-8d37-ba2eba0c6cef
- Freebies API Request ID: a4a224f0-b869-4cb2-9df4-428a11be3a2f
- /go redirect: 302
- Official benefit /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Freebies API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Cron refresh public guard: 401
- Cron benefits public guard: 401
- Canonical production API contracts: passed (2 origin(s))
- Home product deals checked: 8
- Home official benefits checked: 120
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
| PASS | home api official benefits | /api/home returned 120 official benefits/news deals. |
| PASS | home api realtime metadata | /api/home exposes cachePolicy=no-store and channel freshness metadata. |
| PASS | home api abuse guard | /api/home exposes requestId and rate-limit headers on the public deployment. |
| FAIL | deployment commit metadata | /api/home or /api/health must expose deployment.commit before production verification can prove the latest commit is live. |
| PASS | deployed commit matches expected | Expected a7e87e3d; public deployment reports . |
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
