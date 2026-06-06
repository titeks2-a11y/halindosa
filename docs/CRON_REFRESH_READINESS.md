# 할인도사 Cron Refresh Readiness

Generated: npm run cron:refresh:doctor
Status: ready

## Summary

| Metric | Value |
| --- | --- |
| Endpoint | /api/cron/refresh |
| Schedule | 0 */6 * * * |
| Protected route | PASS |
| Dry-run guard | PASS |
| refresh:all evidence | PASS |
| news:feed:live evidence | PASS |
| Live feed status | seed_launch_ready |
| Live feed configured URL | 0 |
| Live feed official benefits | 78 |
| Health cron status | manual_refresh_ready |
| Actual cron report | not generated yet |

## Checks

| Check | Result | Detail |
| --- | --- | --- |
| protected route | PASS | Cron endpoint requires CRON_SECRET, bearer/header secret, or admin token. |
| dry-run guard | PASS | Dry-run path is smoke-tested and does not execute refresh scripts. |
| refresh execution | PASS | Cron route executes the same refresh:all pipeline as release QA. |
| live feed mode | PASS | Cron route supports an explicit mode=liveFeed dry-run and execution path for official feed operations. |
| vercel schedule | PASS | Vercel schedules /api/cron/refresh every 6 hours. |
| environment keys | PASS | .env.example documents cron secret and timeout knobs. |
| operations report | PASS | Cron operations layer exposes last-run status and report path. |
| health and admin surfaces | PASS | Health API and admin dashboard expose cron readiness. |
| refresh-all evidence | PASS | refresh:all is healthy with 140 product deals and 78 official benefits. |
| live feed evidence | PASS | news:feed:live is seed_launch_ready with 78 official benefits and zero unsafe exposed links. |
| health readiness status | PASS | Health readiness marks cron refresh as manual_refresh_ready. |
| runbook | PASS | RUNBOOK documents protected cron execution and report inspection. |

## Operation Notes

- 실제 배포 환경에서는 `CRON_SECRET` 설정 후 Vercel Cron이 `/api/cron/refresh`를 호출합니다.
- `dryRun=true`는 리포트 상태만 확인하고 수집 스크립트를 실행하지 않습니다.
- 공식 API/RSS/제휴 JSON feed를 점검할 때는 `/api/cron/refresh?mode=liveFeed`를 명시 호출합니다. 기본 6시간 cron은 기존 `refresh:all` 경로를 유지합니다.
- `reports/cron-refresh.json`은 실제 실행 증거이므로 오래된 파일을 커밋해 출시 게이트를 흔들지 않습니다.
- 자동 실행 전에도 `reports/refresh-all.json`, `reports/news-feed-live-pipeline.json`과 이 readiness 리포트로 수동 갱신 기준을 확인합니다.
