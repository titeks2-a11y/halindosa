# PR Draft: Commercial Harness Hardening

## Summary

할인도사 앱에 상용 출시용 자동 하네스를 추가했습니다. 기존 QA를 유지하면서 UI 규칙, SEO 규칙, 정적 성능 예산, 전체 harness 실행 리포트를 생성할 수 있게 했습니다.

## Problem

- QA 명령은 많았지만 한 번에 실행하고 결과를 문서화하는 상위 루프가 부족했습니다.
- 모바일 홈/하단 탭/구매 링크 새 탭 정책이 회귀돼도 빠르게 잡아내기 어려웠습니다.
- 상품 상세 SEO는 metadata는 있었지만 구조화 데이터가 부족했습니다.

## Solution

- `npm run harness` 추가.
- `npm run test:ui`, `npm run test:seo`, `npm run test:perf`, `npm run test:search` 추가.
- 상품 상세 페이지에 Product JSON-LD 추가.
- 홈 초기 피드 렌더 수를 12개로 제한하는 상수 추가.
- `docs/HARNESS_AUDIT.md`, `docs/HARNESS_REPORT.md`, `docs/PERFORMANCE_REPORT.md` 생성 흐름 추가.

## Test Plan

```bash
npm run lint
npm run verify:links
npm run test:search
npm run test:ui
npm run test:seo
npm run test:perf
npm run build
npm run release:doctor
npm run harness
```

## Rollback

- package scripts에서 `test:*`와 `harness` 연결을 제거한다.
- 추가된 `scripts/test-*.mjs`, `scripts/harness.mjs`를 제거한다.
- 상품 상세 JSON-LD는 SEO 보강이므로 문제가 있을 때만 제거한다.

## Risks

- Lighthouse 실측은 아직 배포 URL에서 실행해야 한다.
- UI 스크린샷 비교는 Playwright 설치 후 별도 자동화가 필요하다.
