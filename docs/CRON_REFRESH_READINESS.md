# 할인도사 Cron Refresh Readiness

Generated: npm run cron:refresh:doctor
Status: ready

## Summary

| Metric | Value |
| --- | --- |
| Endpoint | /api/cron/refresh |
| Benefits endpoint | /api/cron/benefits |
| Schedule | 0 18 * * * |
| Benefits schedule | 0 21 * * * |
| GitHub scheduler | */30 * * * * |
| Protected route | PASS |
| No-store route policy | PASS |
| Dry-run guard | PASS |
| refresh:all evidence | PASS |
| news:feed:live evidence | PASS |
| Live feed status | seed_launch_ready |
| Live feed configured URL | 0 |
| Live feed official benefits | 197 |
| refresh:benefits evidence | PASS |
| Free benefit events evidence | PASS |
| Free benefit visible active events | 188 |
| Free benefit source count | 148 |
| Free benefit host count | 109 |
| Health cron status | manual_refresh_ready |
| Actual cron report | not generated yet |
| Actual benefits cron report | not generated yet |

## Checks

| Check | Result | Detail |
| --- | --- | --- |
| cron no-store route policy | PASS | Cron refresh and benefits endpoints explicitly opt out of static rendering and fetch caching. |
| protected route | PASS | Cron endpoint requires CRON_SECRET, bearer/header secret, or admin token. |
| trusted origin guard | PASS | Cron refresh and benefits endpoints reject untrusted browser origins while allowing server cron calls. |
| sanitized process output | PASS | Cron process output is redacted before it can appear in API/report payloads. |
| dry-run guard | PASS | Dry-run path is smoke-tested and does not execute refresh scripts. |
| refresh execution | PASS | Cron route executes the same refresh:all pipeline as release QA. |
| live feed mode | PASS | Cron route supports an explicit mode=liveFeed dry-run and execution path for official feed operations. |
| benefits cron route | PASS | Dedicated cron benefits endpoint refreshes official free benefit events with the same auth guard. |
| vercel schedule | PASS | Vercel schedules /api/cron/refresh once daily for Hobby plan compatibility. |
| vercel benefits schedule | PASS | Vercel schedules /api/cron/benefits once daily for free-benefit-first operations. |
| github scheduled benefit refresh | PASS | GitHub Actions can call protected benefits refresh every 30 minutes and live feed refresh hourly when cron secrets are configured. |
| environment keys | PASS | .env.example documents cron secret and timeout knobs. |
| operations report | PASS | Cron operations layer exposes last-run status and report path. |
| benefits operations report | PASS | Cron operations layer exposes dedicated benefits cron status and event evidence. |
| health and admin surfaces | PASS | Health API and admin dashboard expose refresh and benefits cron readiness. |
| refresh-all evidence | PASS | refresh:all is healthy with 140 product deals and 197 official benefits. |
| live feed evidence | PASS | news:feed:live is seed_launch_ready with 197 official benefits and zero unsafe exposed links. |
| benefits refresh evidence | PASS | refresh:benefits is healthy with 4/4 passing steps. |
| free benefit event evidence | PASS | free benefit events expose 188 active events across 148 sources and 109 hosts. |
| health readiness status | PASS | Health readiness marks cron refresh as manual_refresh_ready. |
| runbook | PASS | RUNBOOK documents protected cron execution and report inspection. |

## Operation Notes

- 실제 배포 환경에서는 `CRON_SECRET` 설정 후 Vercel Cron이 `/api/cron/refresh`를 호출합니다.
- 무료혜택 우선 갱신은 Vercel Cron이 `/api/cron/benefits`를 별도로 호출하며, 같은 `CRON_SECRET` 보호를 사용합니다.
- 더 빠른 무료혜택 갱신은 GitHub Actions `Benefit Refresh Scheduler`가 `CRON_SECRET` 또는 `HALINDOSA_CRON_SECRET`이 있을 때 30분마다 `/api/cron/benefits`를 호출하고, 정각에는 `/api/cron/refresh?mode=liveFeed`도 호출합니다.
- `/api/health`는 `cronBenefitsStatus`, `cronBenefitsVisibleActiveEvents`, `cronBenefitsSourceCount`를 노출해 무료혜택 자동 갱신 상태를 별도로 확인합니다.
- `dryRun=true`는 리포트 상태만 확인하고 수집 스크립트를 실행하지 않습니다.
- 공식 API/RSS/제휴 JSON feed를 점검할 때는 `/api/cron/refresh?mode=liveFeed`를 명시 호출합니다. 기본 daily cron은 기존 `refresh:all` 경로를 유지합니다.
- `reports/cron-refresh.json`은 실제 실행 증거이므로 오래된 파일을 커밋해 출시 게이트를 흔들지 않습니다.
- 자동 실행 전에도 `reports/refresh-all.json`, `reports/news-feed-live-pipeline.json`과 이 readiness 리포트로 수동 갱신 기준을 확인합니다.
