# Vercel Deployment Doctor

Generated: 2026-06-09T18:10:39.192Z

Status: BLOCKED

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `8d30962f`
- Working tree: 84 changed file(s): M DEVICE_QA_REPORT.md; M EXTERNAL_LINK_REPORT.md; M HARNESS_REPORT.md; M IMAGE_QUALITY_REPORT.md; M KNOWN_ISSUES.md; M LINK_VERIFICATION_REPORT.md; M LINK_VERIFICATION_RESULT.json; M PERFORMANCE_REPORT.md; ... +76 more
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 24/27
- Root: 200
- Home API: 200
- Deals API: 200
- Freebies API: 200
- Home API Request ID: (missing)
- Deals API Request ID: (missing)
- Freebies API Request ID: 55861f70-bb5f-452d-974a-0dedb3566f57
- /go redirect: 302
- Official benefit /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Freebies API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Cron refresh public guard: 401
- Cron benefits public guard: 401
- Canonical production API contracts: blocked (2 origin(s))
- Home product deals checked: 8
- Home official benefits checked: 8
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
| PASS | home api official benefits | /api/home returned 8 official benefits/news deals. |
| PASS | home api realtime metadata | /api/home exposes cachePolicy=no-store and channel freshness metadata. |
| FAIL | home api abuse guard | /api/home is not serving the latest requestId/rate-limit contract; production may be stale. |
| PASS | home product exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less product deal leaked from /api/home. |
| PASS | home official benefit exposure policy | No invalid, hidden, stale, search, homepage, community, low-quality, or image-less official benefit leaked from /api/home. |
| PASS | deals api status | /api/deals returned 8 verified deals. |
| FAIL | deals api abuse guard | /api/deals is not serving the latest requestId/rate-limit contract; production may be stale. |
| PASS | deals publishable policy | No search, homepage, community, sold-out, low-quality, image-less, or non-publishable deal leaked from /api/deals. |
| PASS | freebies api status | /api/freebies returned 200 JSON with ok=true. |
| PASS | freebies api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | freebies api data | /api/freebies returned 12 freebie cards and 12 event cards. |
| PASS | freebies api realtime metadata | /api/freebies exposes cachePolicy=no-store, freshness label, and next refresh metadata. |
| PASS | freebies api abuse guard | /api/freebies exposes requestId and rate-limit headers on the public deployment. |
| PASS | freebies publishable policy | No search, homepage, community, expired, hidden, low-quality, image-less, or non-publishable free benefit leaked from /api/freebies. |
| PASS | freebies consumer-first default policy | Default /api/freebies response excludes public/policy benefits unless explicitly requested. |
| FAIL | canonical production api contracts | At least one production origin is stale or missing requestId/rate-limit headers: https://halindosa.com, https://www.halindosa.com |
| PASS | cron refresh public guard | /api/cron/refresh rejects unauthenticated dry-run probes on the public deployment. |
| PASS | cron benefits public guard | /api/cron/benefits rejects unauthenticated dry-run probes on the public deployment. |
| PASS | go redirect status | /go/d014 reached an external destination after 2 hop(s). |
| PASS | go redirect destination | Destination host=www.coupang.com |
| PASS | official benefit redirect status | /go/news/news-dunkin-monthly-combo-coupon reached an external official destination after 2 hop(s). |
| PASS | official benefit redirect destination | Destination host=www.dunkindonuts.co.kr |

## Required Fix If Blocked

If `/api/home` is missing `requestId`, `X-Request-Id`, or `X-RateLimit-Remaining`, the public domain is serving an older deployment even if GitHub Actions reported a green deploy. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to `npm run build`, leave Output Directory empty, configure production environment variables, and redeploy `main`.
