# 할인도사 Mobile UX Regression Report

Generated: 2026-06-02T16:06:18.499Z
Status: PASS

## Static Mobile Gates

| Check | Result | Detail |
| --- | --- | --- |
| mobile shell width and safe area | PASS | 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다. |
| bottom nav compactness | PASS | 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다. |
| compact search | PASS | 검색창은 짧은 placeholder, 40px 모바일 높이, 결과 수, 추천 검색어를 유지합니다. |
| single home search entry | PASS | 모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다. |
| home first screen budget | PASS | 초기 렌더 12개 제한과 상세 필터 접힘 구조가 유지됩니다. |
| category rail compactness | PASS | 핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다. |
| filter rail consolidation | PASS | 쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다. |
| quick card scanability | PASS | compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다. |
| live row compact actions | PASS | 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다. |
| toast does not cover bottom nav | PASS | 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다. |

## Scope

- 360~430px 모바일 화면에서 첫 화면 정보 밀도를 유지하기 위한 정적 회귀 테스트입니다.
- 실제 Playwright 스크린샷을 대체하지는 않지만, 하단 탭 겹침, 과한 검색 영역, 긴 카드, CTA 터치 영역, 토스트 위치 회귀를 빠르게 잡습니다.
- 홈 검색창 중복, 카테고리 칩 rail, 필터 chip rail, 하위 화면 보조 검색 compact 기준도 함께 검사합니다.
- Playwright 도입 전까지 `npm run test:mobile-ux`와 `npm run harness`가 모바일 UX 안전망 역할을 합니다.
