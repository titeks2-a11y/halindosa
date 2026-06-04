# 할인도사 12H Product UX Growth Start Audit

Generated: 2026-06-02
Branch: `codex/12h-product-ux-growth-hardening`
Base commit: `95addd7 docs: refresh release evidence`

## Baseline

| Metric | Value |
| --- | ---: |
| 총 상품 수 | 140 |
| active 상품 수 | 140 |
| excluded 상품 수 | 0 |
| 직접 구매/공식 혜택 링크 통과 | 140/140 |
| 상품 상세 URL | 109 |
| 공식 혜택/이벤트 URL | 31 |
| 검색/카테고리/메인/커뮤니티 의심 링크 | 0 |
| 판매처 도메인 수 | 48 |
| 기존 검색 테스트 키워드 수 | 43 |
| 홈 추천 검색어 수 | 34 |
| 이미지 실제 렌더링 커버리지 | 100% |
| 실제 상품 이미지 수 | 13 |
| 카테고리 fallback 이미지 상품 수 | 127 |
| release doctor | 131/131 PASS |

## Current Structure

- 데이터: `data/mockDeals.ts` + `data/verifiedPurchaseLinks.ts`
- 링크 검증: `scripts/verify-product-links.mjs`
- 검색: `lib/deals/search.ts`, `data/searchAliases.json`, `scripts/search-quality-doctor.mjs`
- 홈: `app/page.tsx`
- 상품 카드: `components/QuickDealCard.tsx`, `components/DealCard.tsx`, `components/LiveDealFeed.tsx`
- 외부 이동: `/go/[id]`, `/api/redirect/[id]`, `PurchaseConfirmSheet`, Capacitor Browser fallback
- 이미지 fallback: `public/deal-images/category-*.svg`, `data/mockDeals.ts` category fallback
- Android/Capacitor: `capacitor.config.*`, `android/`, `out` sync

## 12H Priority

1. 생활형 검색어를 100개 이상으로 확장하고 하네스 기준을 상향한다.
2. 무료혜택/쿠폰/이벤트 탐색이 일반 특가와 자연스럽게 구분되도록 검색/리포트를 강화한다.
3. 이미지 fallback과 브랜드 레드 적용 상태를 문서화하고, 운영 리스크를 명확히 남긴다.
4. 외부 링크 새 탭/앱 외부 브라우저 정책을 계속 자동 검증한다.
5. 홈/모바일 UX, 상세/카드 신뢰 요소, SEO/성능/Android 검증을 반복적으로 유지한다.
