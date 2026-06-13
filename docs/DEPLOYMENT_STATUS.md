# Deployment Status

Generated: 2026-06-13T01:24:50.928Z

## Summary

- Status: pending_deploy
- Local branch: `codex/12h-product-ux-growth-hardening`
- Local commit: `4385b5fd`
- origin/main: `4385b5fd`
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

## Latest Preview Promotion

| Status | Selected Preview | Local HEAD | Preview created | Production before | Production after |
| --- | --- | --- | --- | --- | --- |
| blocked_vercel_daily_limit | https://halindosa-gdvokqqxe-titeks2-3861s-projects.vercel.app | `70adb75f` | 2026-06-13T01:14:38.000Z | `6eb18829` | `6eb18829` |

Next action: Vercel Hobby 일일 배포 제한이 풀리면 같은 명령을 다시 실행하세요.


## Next Actions

- GitHub Actions Vercel Production Deploy가 끝났는지 확인합니다.
- Vercel Hobby 일일 배포 제한이 풀리면 `npx vercel deploy --prod --force --yes`를 다시 실행합니다.
- `/api/health.deployment.shortCommit`이 최신 커밋과 같아질 때까지 운영 반영 완료로 보지 않습니다.
- 공식 feed URL이 아직 0개입니다. 운영 최신 배포와 별개로 실시간 외부 수집 전환은 Vercel env feed 연결이 필요합니다.
