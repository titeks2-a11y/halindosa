# 할인도사 Brand UI Report

Generated: 2026-06-02

## Brand Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--brand-red` / `dossa.red` | `#ff173f` | 핵심 CTA, 할인율, active 상태 |
| `--brand-red-bright` / `dossa.bright` | `#ff2a4f` | 강조 배지, focus, hover |
| `--brand-red-deep` / `dossa.deep` | `#e0002a` | 강한 가격/브랜드 강조 |
| `--brand-red-soft` / `dossa.soft` | `#fff1f4` | 카드 내부 연한 배경 |
| `--brand-red-tint` / `dossa.tint` | `#ffe4ea` | 배지/선택 칩 배경 |

## Applied Areas

- 홈 검색/필터, 상품 카드 CTA, 할인율 배지, 검증 링크 배지에 밝은 레드 계열을 사용한다.
- 하단 탭 active 상태는 레드 계열로 브랜드 인지를 유지한다.
- 상품 이미지 fallback은 레드/오렌지 계열 SVG로 통일하되 카테고리별 아이콘을 다르게 제공한다.
- 과한 전체 배경 레드 사용은 피하고 흰색 카드/연한 회색 배경 위에 레드를 포인트로 사용한다.

## Mobile Notes

- 주요 버튼은 최소 40px 이상 터치 영역을 유지한다.
- 검색창은 한 줄 placeholder와 compact chip 중심으로 모바일 첫 화면을 차지하지 않게 유지한다.
- 카드 hover 효과는 데스크톱용 보조 효과이며 모바일 기본 탐색은 버튼/링크 터치 영역 중심이다.

## Remaining Design Risks

- 실제 상품 이미지 비중이 낮아 일부 상품은 카테고리 대표 이미지로 보인다.
- 배포 URL 기준 실제 기기 스크린샷에서 레드 대비와 이미지 선명도를 추가 확인해야 한다.
