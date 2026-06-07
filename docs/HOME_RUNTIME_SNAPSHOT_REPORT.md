# Home Runtime Snapshot Report

Generated: 2026-06-07T20:41:30.959Z
Status: PASS
Runtime marker: `halindosa-runtime-1780864886740`

## Summary

| Check | Result | Detail |
| --- | --- | --- |
| api no-store cache policy | PASS | no-store, no-cache, must-revalidate, proxy-revalidate |
| marker absent before refresh | PASS | 임시 마커를 쓰기 전에는 홈 API 검색 결과에 나타나지 않습니다. |
| marker visible after snapshot update | PASS | 서버 재시작 없이 refreshedDeals.json 변경이 /api/home에 즉시 반영됩니다. |
| marker removed after restore | PASS | 원본 스냅샷 복구 후 임시 항목이 홈 API에서 사라집니다. |

## Policy

- `data/refreshedDeals.json` must be read at request time, not frozen at build time.
- `/api/home` must return no-store headers and reflect a newly collected verified deal without restarting the app.
- The temporary marker is restored immediately after the test, so production seed data is not changed by this doctor.
