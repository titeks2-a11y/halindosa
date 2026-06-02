# 할인도사 Mobile UX Regression Report

Generated: 2026-06-02T15:15:22.306Z
Status: PASS

## Static Mobile Gates

| Check | Result | Detail |
| --- | --- | --- |
| mobile shell width and safe area | PASS | 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다. |
| bottom nav compactness | PASS | 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다. |
| compact search | PASS | 검색창은 짧은 placeholder, 40px 모바일 높이, 결과 수, 추천 검색어를 유지합니다. |
| home first screen budget | PASS | 초기 렌더 12개 제한과 상세 필터 접힘 구조가 유지됩니다. |
| quick card scanability | PASS | compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다. |
| live row compact actions | PASS | 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다. |
| toast does not cover bottom nav | PASS | 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다. |

## Scope

- 360~430px 모바일 화면에서 첫 화면 정보 밀도를 유지하기 위한 정적 회귀 테스트입니다.
- 실제 Playwright 스크린샷을 대체하지는 않지만, 하단 탭 겹침, 과한 검색 영역, 긴 카드, CTA 터치 영역, 토스트 위치 회귀를 빠르게 잡습니다.
- Playwright 도입 전까지 `npm run test:mobile-ux`와 `npm run harness`가 모바일 UX 안전망 역할을 합니다.
