# 할인도사 Mobile UX Regression Report

Generated: npm run test:mobile-ux
Status: PASS

## Static Mobile Gates

| Check | Result | Detail |
| --- | --- | --- |
| mobile shell width and safe area | PASS | 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다. |
| bottom nav compactness | PASS | 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다. |
| compact search | PASS | 검색창은 짧은 placeholder, 40px 모바일 높이, 결과 수, 추천 검색어를 유지합니다. |
| single home search entry | PASS | 모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다. |
| home first screen budget | PASS | 초기 렌더 12개 제한, 더보기 확장, 심화 혜택/상세 필터 지연 렌더링, 상단 특가 스냅 레일과 스크롤 신호가 유지됩니다. |
| category rail compactness | PASS | 핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다. |
| filter rail consolidation | PASS | 쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다. |
| quick card scanability | PASS | compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다. |
| live row compact actions | PASS | 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다. |
| mobile official benefit quick list | PASS | 공식 혜택은 모바일에서 빠른 목록을 먼저 보여주고 상세 탐색 패널은 넓은 화면으로 분리합니다. |
| mobile live benefit strip | PASS | 모바일 첫 화면에서 검증된 공식 무료혜택 4개를 2열 compact grid로 보여주며 invalid/search/community 링크를 제외합니다. |
| toast does not cover bottom nav | PASS | 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다. |

## Scope

- 360~430px 모바일 화면에서 첫 화면 정보 밀도를 유지하기 위한 정적 회귀 테스트입니다.
- 실제 Playwright 스크린샷을 대체하지는 않지만, 하단 탭 겹침, 과한 검색 영역, 긴 카드, CTA 터치 영역, 토스트 위치 회귀를 빠르게 잡습니다.
- 홈 검색창 중복, 카테고리 칩 rail, 필터 chip rail, 하위 화면 보조 검색 compact 기준도 함께 검사합니다.
- 상품 그리드는 모바일 초기 DOM을 줄이기 위해 12개 먼저 렌더링하고, 더보기로 12개씩 확장하는 구조를 검사합니다.
- 심화 혜택 루틴은 첫 화면 인터랙티브 요소 수를 줄이기 위해 사용자가 더보기를 누른 뒤 렌더링하는 구조를 검사합니다.
- 데스크톱 상세 필터와 결과 분석 패널도 기본 DOM에 올리지 않고 사용자가 펼친 뒤 렌더링하는 구조를 검사합니다.
- 상단 "오늘 바로 볼 특가" 레일은 손가락 스크롤이 어중간하게 멈추지 않도록 snap-x/snap-start 구조와 오른쪽 fade/넘기기 신호를 검사합니다.
- 모바일 공식 혜택 strip은 2열 compact grid로 검증 혜택 4개를 바로 보여주고, 구매/신청 이동은 `/go/news/[id]` 새 탭 경로를 유지합니다.
- Playwright 도입 전까지 `npm run test:mobile-ux`와 `npm run harness`가 모바일 UX 안전망 역할을 합니다.
