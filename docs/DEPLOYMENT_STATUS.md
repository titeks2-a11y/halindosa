# Deployment Status

Generated: 2026-06-13T10:03:00+09:00

## Summary

- Status: pending_deploy
- Local branch: `codex/12h-product-ux-growth-hardening`
- Local commit: `70adb75f`
- origin/main: `70adb75f`
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

- 최신 코드 커밋은 CU 공식 1+1·2+1 행사상품, 세븐일레븐 공식 증정할인·멤버십 메뉴, LG U+ 공식 로밍 쿠폰 이벤트를 공식 무료혜택 소스 카탈로그에 추가하고 관련 운영 리포트를 갱신했습니다. GitHub `main`과 `codex/12h-product-ux-growth-hardening`에 push됐습니다.
- 최신 Preview 배포 `https://halindosa-cwyibd0pv-titeks2-3861s-projects.vercel.app`는 Ready 상태입니다.
- `npx vercel promote https://halindosa-cwyibd0pv-titeks2-3861s-projects.vercel.app --yes`는 Hobby 일일 배포 제한(`api-deployments-free-per-day`)으로 다시 실패했습니다.
- `npx vercel --prod --yes`도 같은 Hobby 일일 배포 제한(`api-deployments-free-per-day`)으로 실패했습니다.
- `npm run deploy:promote:latest`를 추가했습니다. 최신 Ready Preview 자동 선택, inspect, 현재 로컬 `HEAD`보다 오래된 Preview 승격 차단, promote, 운영 `/api/health` 확인을 수행하고 `reports/vercel-promote-latest.json`에 결과를 남깁니다.
- 현재 `npm run deploy:promote:latest` 실행 결과는 최신 커밋 `70adb75f`의 Preview `https://halindosa-gdvokqqxe-titeks2-3861s-projects.vercel.app` 선택과 stale guard 통과까지 성공했고, promote만 Vercel Hobby 일일 제한으로 `blocked_vercel_daily_limit` 상태입니다.
- Vercel Hobby 일일 배포 제한이 풀리면 `npx vercel deploy --prod --force --yes` 또는 위 최신 Preview promote를 다시 실행합니다.
- 더 간단하게는 제한 해제 후 `npm run deploy:promote:latest`만 실행합니다.
- `/api/health.deployment.shortCommit`이 최신 커밋과 같아질 때까지 운영 반영 완료로 보지 않습니다.
- 공식 feed URL이 아직 0개입니다. 운영 최신 배포와 별개로 실시간 외부 수집 전환은 Vercel env feed 연결이 필요합니다.
