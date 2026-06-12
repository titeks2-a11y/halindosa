# Vercel Deployment Doctor

Generated: 2026-06-12T22:34:49.317Z

Status: PASS

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `3c4e60fe`
- Working tree: 1 changed file(s): M docs/DEPLOYMENT_STATUS.md
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 34/34
- Root: 200
- Home API: 200
- Deals API: 200
- Freebies API: 200
- Health API: 200
- Deployed commit: 6eb18829
- Expected deploy commit: (not enforced)
- Home API Request ID: 676c25ec-49b2-404d-a441-2f632aea6c4b
- Deals API Request ID: 5017f0d1-d09f-4d2e-b530-7e3deda095a4
- Freebies API Request ID: 99558c6c-3dd6-4b4c-b063-a27ed52c832d
- /go redirect: 302
- Official benefit /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Freebies API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`
- Cron refresh public guard: 401
- Cron benefits public guard: 401
- Canonical production API contracts: passed (2 origin(s))
- Root free-benefit visible render: passed
- Root official benefit links: 41
- Root claim-condition label types: 8
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
| PASS | root free benefit visible render | Production homepage renders real free-benefit cards without a hidden streamed shell or sticky loading fallback. |
| PASS | root free benefit hero | Production homepage renders the free-benefit-first hero with 41 official benefit links. |
| PASS | root free benefit claim badges | Production homepage renders visible verification time and claim-condition labels: 쿠폰 받기, 무료 혜택, 샘플 신청, 무료체험, 기프티콘, 포인트 적립, 가입 혜택, 조건 확인. |
| PASS | home api status | /api/home returned 200 JSON with ok=true. |
| PASS | home api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | home api deals | /api/home returned 8 deals. |
| PASS | home api official benefits | /api/home returned 160 official benefits/news deals. |
| PASS | home api realtime metadata | /api/home exposes cachePolicy=no-store and channel freshness metadata. |
| PASS | home api abuse guard | /api/home exposes requestId and rate-limit headers on the public deployment. |
| PASS | health homepage render guard | /api/health confirms the homepage visible-render guard is active in the deployed runtime. |
| PASS | health claim-ready benefit ranking | /api/health confirms claim-ready free-benefit quality: 117 claim-ready, 140 instant, 23 top easy-claim, 23 top instant, 9 top types, 188 recently checked, score averages Q100/F92/O100/U43/R66. |
| PASS | health free benefit source activation | /api/health confirms official free-benefit source activation is seed_ready, checks 10/10, 12 recommended lanes. |
| PASS | deployment commit metadata | Public APIs expose deployed commit 6eb18829. |
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
