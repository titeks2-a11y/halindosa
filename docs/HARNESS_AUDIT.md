# 할인도사 Harness Audit

Updated: 2026-06-02

## Current App Structure

- Framework: Next.js App Router, TypeScript, Tailwind CSS, Capacitor Android/iOS shell.
- Shell: `components/AppShell.tsx` wraps mobile header, desktop navigation, page content, and bottom tabs.
- Primary pages: `/`, `/popular`, `/categories`, `/mypage`, `/deals/[id]`, `/go/[id]`, `/privacy`, `/terms`.
- Core APIs: `/api/deals`, `/api/deals/[id]`, `/api/health`, `/api/metrics`, `/api/track`, `/api/reports`.
- Android packaging: `capacitor.config.ts`, `android/`, `ios/`, `npm run build:android`, `npm run cap:sync`.

## Key Components

- Search and filters: `components/SearchBar.tsx`, `components/CategoryTabs.tsx`, `components/SortSelect.tsx`.
- Deal UI: `components/DealCard.tsx`, `components/QuickDealCard.tsx`, `components/LiveDealFeed.tsx`, `components/FeaturedDealSections.tsx`.
- Trust and purchase flow: `components/DealTrustBadge.tsx`, `components/PurchaseConfirmSheet.tsx`, `components/PurchaseLinkOverview.tsx`, `app/go/[id]/route.ts`.
- Navigation: `components/MobileHeader.tsx`, `components/TopNavigation.tsx`, `components/BottomNavigation.tsx`.

## Data Sources

- Default source: `data/mockDeals.ts`.
- Verified purchase overrides: `data/verifiedPurchaseLinks.ts`.
- Provider structure: `lib/deals/providers/mockProvider.ts`, `stagingProvider.ts`, `productionProvider.ts`.
- Normalization and validation: `lib/deals/normalizer.ts`, `lib/deals/linkValidator.ts`, `lib/deals/quality.ts`, `lib/deals/search.ts`.

## Deal Data Policy

User-facing default lists must prefer:

- `purchaseLinkVerified === true`
- `linkStatus === "verified"`
- `finalPurchaseUrl` exists
- URL is http/https
- no community/blog/news/search/main-page link as the purchase destination

Search result and fallback-only links can remain in internal data, but should not dominate the default home feed.

## Search Logic

- Search supports title, brand, mall, category, tags, benefit keywords, and Korean alias matching.
- Existing quality gate: `scripts/search-quality-doctor.mjs`.
- Harness alias coverage is connected through `npm run test:search`.

## Link Validation Logic

- Existing strict checker: `scripts/verify-product-links.mjs`.
- Blocks community hosts, placeholders, search/category pages, mall homepages, and weak evidence.
- Product detail and official event pages are accepted.
- Required operational command: `npm run verify:links`.

## Routing Structure

- Internal detail route: `/deals/[id]`.
- Purchase tracking route: `/go/[id]`.
- Redirect and tracking APIs are separated from source URLs to keep affiliate/click logging extensible.

## Bottom Tabs

Final mobile tabs:

- 홈
- 인기
- 카테고리
- 마이

무료혜택, 알림, 찜은 standalone bottom tab으로 복귀하지 않는다. 해당 기능은 카테고리/마이 내부로 둔다.

## SEO Metadata Status

- Root metadata exists in `app/layout.tsx`.
- Sitemap and robots routes exist.
- Product detail page generates metadata and now includes Product structured data.
- Additional live Lighthouse validation is still needed on the deployed URL.

## Current Test Scripts

- `npm run lint`
- `npm run build`
- `npm run verify:links`
- `npm run test:search`
- `npm run test:ui`
- `npm run test:seo`
- `npm run test:perf`
- `npm run qa`
- `npm run release:doctor`
- `npm run harness`

## Risk Register

### P0

- 검증되지 않은 상품 링크가 기본 홈 목록으로 새어 나오는 회귀.
- 구매 이동 링크가 새 탭이 아닌 내부 스크롤/잘못된 href로 바뀌는 회귀.
- 모바일 홈 첫 화면이 다시 긴 혜택/루틴 섹션으로 밀리는 회귀.

### P1

- SEO 구조화 데이터가 상품 데이터와 불일치하는 회귀.
- 마이페이지에 개발자용 문구가 다시 노출되는 회귀.
- 검색 alias가 늘어난 상품 DB와 동기화되지 않는 문제.

### P2

- Lighthouse 실측이 정적 성능 예산과 차이가 나는 문제.
- 스크린샷 기반 UI 회귀 테스트 미구축.
- 운영 피드 연동 전 검수 근거 작성 부담.

## Improvement Queue

1. `npm run harness`를 release 후보마다 실행한다.
2. 배포 URL이 생기면 Lighthouse CI 또는 PageSpeed API 기반 측정으로 `docs/PERFORMANCE_REPORT.md`를 보강한다.
3. Playwright 설치 후 `artifacts/ui/` 스크린샷 비교를 추가한다.
4. 상품 추가 시 `data/verifiedPurchaseLinks.ts` evidence를 필수로 작성한다.
