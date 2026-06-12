# Deployment Status

Generated: 2026-06-13T08:12:00+09:00

## Summary

- Status: pending_deploy
- Local branch: `codex/12h-product-ux-growth-hardening`
- Local commit: `ecf8b00f`
- origin/main: `ecf8b00f`
- Deployed commits: `6eb18829`
- Latest commit live: no
- Android app update: Android 앱은 https://www.halindosa.com 운영 웹을 로드하므로, Vercel Production이 최신 커밋을 서빙할 때 앱 화면도 함께 바뀝니다. 이번 상태 점검은 네이티브 설정을 바꾸지 않으므로 새 AAB 업로드는 필요 없습니다.
- Free benefit feed mode: seed_fallback_only
- Configured official feed URLs: 0
- External feed items: 0

## Production Health

| Origin | HTTP | OK | Deployed commit | Free benefits | Fresh | Feed mode | Feed URLs | External items | Collection lanes |
| --- | ---: | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| https://www.halindosa.com | 200 | yes | `6eb18829` | 197 | yes | seed_launch_ready | 0 | 0 | ready |
| https://halindosa.com | 200 | yes | `6eb18829` | 197 | yes | seed_launch_ready | 0 | 0 | ready |

## Next Actions

- 최신 Preview 배포 `https://halindosa-k7n46jo3o-titeks2-3861s-projects.vercel.app`는 Ready 상태이나 Vercel Deployment Protection으로 외부 HTTP 확인은 401입니다.
- `npx vercel promote https://halindosa-k7n46jo3o-titeks2-3861s-projects.vercel.app --yes`는 Hobby 일일 배포 제한(`api-deployments-free-per-day`)으로 실패했습니다.
- Vercel Hobby 일일 배포 제한이 풀리면 `npx vercel deploy --prod --force --yes` 또는 위 Preview promote를 다시 실행합니다.
- `/api/health.deployment.shortCommit`이 최신 커밋과 같아질 때까지 운영 반영 완료로 보지 않습니다.
- 공식 feed URL이 아직 0개입니다. 운영 최신 배포와 별개로 실시간 외부 수집 전환은 Vercel env feed 연결이 필요합니다.
