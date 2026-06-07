# Vercel Deployment Doctor

Generated: 2026-06-07T13:17:38.740Z

Status: BLOCKED

## Target

- Origin: `https://halindosa.com`
- Branch: `codex/12h-product-ux-growth-hardening`
- Commit: `279f86af`
- Working tree: M MOBILE_UX_REPORT.md;  M docs/VERCEL_DEPLOYMENT_REPORT.md;  M reports/vercel-deployment.json
- Vercel project linked locally: no
- Vercel token present in shell: no

## Summary

- Checks: 4/9
- Root: 200
- Home API: 404
- Deals API: 200
- /go redirect: 302
- Home API Cache-Control: `public, max-age=0, must-revalidate`

## Checks

| Result | Check | Detail |
| --- | --- | --- |
| PASS | root page | 200 HTML response from https://halindosa.com. |
| FAIL | home api status | /api/home should return 200 JSON; got 404. |
| FAIL | home api no-store | /api/home should include no-store Cache-Control; got "public, max-age=0, must-revalidate". |
| FAIL | home api deals | /api/home did not return visible deals. |
| FAIL | home api official benefits | /api/home did not return visible official benefits/news deals. |
| PASS | deals api status | /api/deals returned 3 verified deals. |
| FAIL | deals publishable policy | 3 invalid deal(s) leaked from /api/deals. |
| PASS | go redirect status | /go/d014 reached an external destination after 2 hop(s). |
| PASS | go redirect destination | Destination host=www.coupang.com |

## Required Fix If Blocked

If `/api/home` returns 404 while the root page returns 200, the public domain is serving an older/static deployment. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to `npm run build`, leave Output Directory empty, configure production environment variables, and redeploy `main`.
