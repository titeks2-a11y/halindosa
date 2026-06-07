# Vercel Deployment Doctor

Generated: 2026-06-07T15:24:00.756Z

Status: PASS

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `7c59d8a5`
- Working tree: clean
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 9/9
- Root: 200
- Home API: 200
- Deals API: 200
- /go redirect: 302
- Home API Cache-Control: `no-store, no-cache, must-revalidate, proxy-revalidate`

## Checks

| Result | Check | Detail |
| --- | --- | --- |
| PASS | root page | 200 HTML response from https://halindosa.com. |
| PASS | home api status | /api/home returned 200 JSON with ok=true. |
| PASS | home api no-store | Cache-Control=no-store, no-cache, must-revalidate, proxy-revalidate |
| PASS | home api deals | /api/home returned 3 deals. |
| PASS | home api official benefits | /api/home returned 8 official benefits/news deals. |
| PASS | deals api status | /api/deals returned 3 verified deals. |
| PASS | deals publishable policy | No search, homepage, community, sold-out, or non-publishable deal leaked from /api/deals. |
| PASS | go redirect status | /go/d014 reached an external destination after 2 hop(s). |
| PASS | go redirect destination | Destination host=www.coupang.com |

## Required Fix If Blocked

If `/api/home` returns 404 while the root page returns 200, the public domain is serving an older/static deployment. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to `npm run build`, leave Output Directory empty, configure production environment variables, and redeploy `main`.
