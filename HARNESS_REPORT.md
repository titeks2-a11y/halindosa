# 할인도사 Harness Report

Started: 2026-06-07T18:41:03.080Z
Finished: 2026-06-07T18:43:07.116Z
Status: PASS

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
| lint | PASS | 15.3s |
| build | PASS | 22.7s |
| verify:links | PASS | 3.0s |
| test:external-links | PASS | 0.6s |
| test:images | PASS | 0.5s |
| news:images:enrich | PASS | 9.2s |
| verify:images | PASS | 0.5s |
| image:operations:doctor | PASS | 0.5s |
| test:search | PASS | 8.1s |
| test:ui | PASS | 0.5s |
| test:mobile-ux | PASS | 0.5s |
| test:mobile-compact | PASS | 0.5s |
| home:realtime:doctor | PASS | 0.5s |
| test:home-realtime | PASS | 4.5s |
| test:seo | PASS | 0.5s |
| test:perf | PASS | 0.6s |
| smoke:local | PASS | 54.1s |
| release:doctor | PASS | 1.8s |

## Step Output

### lint

```text
> halindosa@1.0.1 lint
> eslint .
```

### build

```text
> halindosa@1.0.1 build
> next build

▲ Next.js 16.2.6 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 4.5s
  Running TypeScript ...
  Finished TypeScript in 10.4s ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/204) ...
  Generating static pages using 23 workers (51/204) 
  Generating static pages using 23 workers (102/204) 
  Generating static pages using 23 workers (153/204) 
✓ Generating static pages using 23 workers (204/204) in 2.4s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /api/account/delete
├ ƒ /api/admin/daily-operations
├ ƒ /api/admin/daily-queue
├ ƒ /api/admin/deal-quality
├ ƒ /api/admin/export
├ ƒ /api/admin/exposure-policy
├ ƒ /api/admin/health-readiness
├ ƒ /api/admin/image-queue
├ ƒ /api/admin/import
├ ƒ /api/admin/link-launch-gate
├ ƒ /api/admin/link-revalidation-priority
├ ƒ /api/admin/live-probe-review
├ ƒ /api/admin/news-feed-canary
├ ƒ /api/admin/news-feed-live
├ ƒ /api/admin/news-feed-preview
├ ƒ /api/admin/news-operations
├ ƒ /api/admin/news-revalidation-priority
├ ƒ /api/admin/notification-campaigns
├ ƒ /api/admin/official-alerts
├ ƒ /api/admin/push-readiness
├ ƒ /api/admin/push/send
├ ƒ /api/admin/reports
├ ƒ /api/admin/source-feed-env
├ ƒ /api/admin/source-live
├ ƒ /api/admin/source-onboarding
├ ƒ /api/admin/source-readiness
├ ƒ /api/affiliate/status
├ ƒ /api/benefits/briefing
├ ƒ /api/benefits/calendar
├ ƒ /api/benefits/claim-effort
├ ƒ /api/benefits/decision-guide
├ ƒ /api/benefits/official-alerts
├ ƒ /api/benefits/personalized
├ ƒ /api/benefits/routine
├ ƒ /api/benefits/today
├ ƒ /api/cron/refresh
├ ƒ /api/deals
├ ƒ /api/deals/[id]
├ ƒ /api/freebies
├ ƒ /api/health
├ ƒ /api/home
├ ƒ /api/hot-signals
├ ƒ /api/image
├ ƒ /api/metrics
├ ƒ /api/news-deals
├ ƒ /api/redirect/[id]
├ ƒ /api/reports
├ ƒ /api/sources
├ ƒ /api/track
├ ○ /auth/callback
├ ○ /categories
├ ○ /commercialization
├ ● /deals/[id]
│ ├ /deals/d001
│ ├ /deals/d002
│ ├ /deals/d003
│ └ [+137 more paths]
├ ○ /favorites
├ ○ /free-benefits
├ ƒ /go/[id]
├ ƒ /go/news/[id]
├ ○ /guide
├ ○ /login
├ ○ /manifest.webmanifest
├ ○ /mypage
├ ○ /notifications
├ ○ /onboarding
├ ○ /popular
├ ○ /privacy
├ ƒ /reports
├ ○ /robots.txt
├ ○ /signup
├ ○ /sitemap.xml
├ ○ /store-preview
├ ○ /support
└ ○ /terms


○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

### verify:links

```text
> halindosa@1.0.1 verify:links
> node scripts/verify-product-links-live.mjs --body --no-body

Product link verification passed: 140/140 verified purchase URLs (100%).
- Publishable after exposure policy: 140/140 (hidden 0)
- Distinct purchase hosts: 47
- Product detail URLs: 110
- Official benefit/event URLs: 30
- Live probe: checked 140, passed 60, failed 80, redirected 7
- Live probe signals: 404 0, 410 0, 5xx 0, timeout 0, rate-limit 13, robots/access 64, sold-out text 0
- Live probe failure reasons: robots_or_access_blocked:64, http_429:13, request_failed:3
- Live probe is non-strict: seller access protections are recorded for review without hiding otherwise valid purchase links.
```

### test:external-links

```text
> halindosa@1.0.1 test:external-links
> node scripts/test-external-links.mjs

External link safety passed: 284 files scanned, 67 target=_blank links.
```

### test:images

```text
> halindosa@1.0.1 test:images
> node scripts/test-images.mjs

Image quality passed: 93/140 deals have explicit images.
```

### news:images:enrich

```text
> halindosa@1.0.1 news:images:enrich
> node scripts/enrich-news-benefit-images.mjs

Official benefit image enrichment completed.
- visible benefits: 105
- newly found official images: 66
- retained mappings: 70
- data/verifiedNewsBenefitImages.json
- reports/news-benefit-images.json
```

### verify:images

```text
> halindosa@1.0.1 verify:images
> node scripts/verify-images.mjs

PASS deal image schema - Deal 표준 타입이 imageType과 qualityScore를 명시합니다.
PASS official benefit image schema - 공식 혜택 타입이 imageType과 qualityScore를 명시합니다.
PASS official benefit image normalization - 공식 혜택 정규화 단계가 생성 placeholder와 qualityScore를 자동으로 채웁니다.
PASS official benefit verified image mapping - 공식 혜택 70개가 OG/schema 이미지 매핑을 우선 사용합니다.
PASS normalizer image fields - 정규화 단계에서 imageType과 qualityScore를 모든 상품에 채우고 낮은 품질 항목을 publishable에서 제외합니다.
PASS image type resolver - 이미지 resolver가 공식/생성/fallback 이미지를 구분합니다.
PASS quality score image weighting - qualityScore가 최신성, 링크 검증, 이미지 타입, 신고/숨김 상태를 반영합니다.
PASS ranking quality score - 홈/추천 랭킹에 qualityScore가 반영됩니다.
PASS generated placeholder mapping - 20개 카테고리/혜택 생성 placeholder가 mock 데이터 fallback으로 연결되어 있습니다.
PASS generated placeholder assets - 생성 placeholder는 gradient/icon 기반 SVG이며 실제 상품 사진을 가장하지 않습니다.
PASS image rendering components - 주요 카드/피드 컴포넌트가 lazy loading, async decoding, object-cover, no-referrer를 유지합니다.
PASS local image proxy - 로컬 개발에서 차단 가능성이 높은 이미지 호스트는 프록시 유틸을 통과하고, 깨진 이미지는 혜택/카테고리 생성 placeholder로 대체됩니다.
PASS runtime broken image fallback - 주요 카드/피드 컴포넌트가 이미지 로딩 실패 시 1회성 생성 placeholder로 자동 전환합니다.
PASS explicit image floor - 명시 이미지 또는 파생 가능 이미지 라인이 93/140개(66%)입니다.
PASS publishable image exposure audit - 노출 상품 140개 모두 공식/파생/생성 이미지로 렌더링 가능합니다.
PASS official image operating floor - 공식/파생 이미지 비율이 66%입니다.
PASS refreshed benefit placeholder exposure - refresh:deals 산출물 83/140개가 혜택 유형별 generated placeholder를 사용합니다.
PASS official benefit image exposure audit - 공식 혜택 105개 모두 렌더 가능한 이미지와 qualityScore 70 이상을 갖습니다.
PASS official benefit image operating floor - 공식 혜택 68/105개가 공식 OG/schema 이미지를 사용합니다.
PASS verified product image priority - 검증된 공식 상품/혜택 이미지가 명시 이미지와 생성 placeholder보다 먼저 적용됩니다.
Image verification passed: 20/20
```

### image:operations:doctor

```text
> halindosa@1.0.1 image:operations:doctor
> node scripts/image-operations-doctor.mjs

Image operations doctor passed: 16/16
```

### test:search

```text
> halindosa@1.0.1 test:search
> node scripts/search-quality-doctor.mjs

Search quality doctor passed.
- Search test keywords: 145
- High-intent home keywords: 54
- Search aliases: 102
- 생필품: 48 deals
- 무배: 72 deals
- 0원: 103 deals
- 가전제품: 16 deals
- 편의점: 27 deals
- 앱테크: 12 deals
- 육아템: 7 deals
- 로켓: 70 deals
- 지마켓: 44 deals
- 충전케이블: 35 deals
- 배달쿠폰: 78 deals
- 커피쿠폰: 9 deals
- 영화무료: 30 deals
- 생수: 65 deals
- 물티슈: 42 deals
- 기저귀: 35 deals
- 치약: 40 deals
- 패션: 9 deals
- 우산: 2 deals
- 치킨쿠폰: 2 deals
- 무료커피: 8 deals
- 라면: 5 deals
- 햇반: 6 deals
- 세제: 7 deals
- 선크림: 1 deals
- 유산균: 1 deals
- 계란: 35 deals
- 우유: 35 deals
- 닭가슴살: 35 deals
- 마스크: 37 deals
- 충전케이블: 35 deals
- 멀티탭: 28 deals
- 화장지: 37 deals
- 청소포: 38 deals
- 김자반: 51 deals
- 김치: 39 deals
- 키친타월: 37 deals
- 참치: 39 deals
- 가글: 28 deals
- 콜라: 7 deals
- 탈취제: 28 deals
- 단백질바: 7 deals
- 새우깡: 36 deals
```

### test:ui

```text
> halindosa@1.0.1 test:ui
> node scripts/test-ui-rules.mjs

PASS bottom tabs - 하단 탭은 홈, 인기, 카테고리, 마이 4개로 고정되어 있습니다.
PASS removed standalone tabs - 무료혜택, 알림, 찜은 단독 하단 탭으로 노출되지 않습니다.
PASS forbidden hrefs - 구매/탐색 UI에 빈 링크, #, javascript:void(0)가 없습니다.
PASS external purchase navigation - 구매 이동 링크에 새 탭과 noopener noreferrer가 적용되어 있습니다.
PASS verified-only home data - 홈 데이터는 검증 링크 필드와 검증 통계를 사용합니다.
PASS mypage production copy - 마이페이지에 준비/개발자용 문구가 노출되지 않습니다.
PASS mobile compact home - 모바일 홈은 단일 검색, compact 필터, 안전 하단 여백 기준을 갖습니다.
UI rules passed: 7/7
```

### test:mobile-ux

```text
> halindosa@1.0.1 test:mobile-ux
> node scripts/test-mobile-ux.mjs

PASS mobile shell width and safe area - 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다.
PASS bottom nav compactness - 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다.
PASS compact search - 검색창은 짧은 placeholder, 40px 모바일 높이, 데스크톱 결과 수, 추천 검색어를 유지하고 모바일에서는 결과 보조 줄을 줄입니다.
PASS single home search entry - 모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다.
PASS home first screen budget - 초기 렌더 12개 제한, 더보기 확장, 심화 혜택/상세 필터 지연 렌더링, 상단 특가 스냅 레일과 스크롤 신호가 유지됩니다.
PASS category rail compactness - 핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다.
PASS filter rail consolidation - 쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다.
PASS quick card scanability - compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다.
PASS live row compact actions - 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다.
PASS mobile official benefit quick list - 공식 혜택은 모바일에서 빠른 목록을 먼저 보여주고 상세 탐색 패널은 넓은 화면으로 분리합니다.
PASS mobile freebie hero priority - 모바일 홈 첫 화면에서 무료/쿠폰/0원/무배 혜택 히어로를 상품 리스트보다 먼저 압축 노출합니다.
PASS mobile live benefit strip - 모바일 첫 화면에서 검증된 공식 혜택 2개를 초압축 가로 레일로 보여주며 invalid/search/community 링크를 제외합니다.
PASS toast does not cover bottom nav - 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다.
Mobile UX checks passed: 13/13
```

### test:mobile-compact

```text
> halindosa@1.0.1 test:mobile-compact
> node scripts/test-mobile-ux.mjs

PASS mobile shell width and safe area - 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다.
PASS bottom nav compactness - 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다.
PASS compact search - 검색창은 짧은 placeholder, 40px 모바일 높이, 데스크톱 결과 수, 추천 검색어를 유지하고 모바일에서는 결과 보조 줄을 줄입니다.
PASS single home search entry - 모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다.
PASS home first screen budget - 초기 렌더 12개 제한, 더보기 확장, 심화 혜택/상세 필터 지연 렌더링, 상단 특가 스냅 레일과 스크롤 신호가 유지됩니다.
PASS category rail compactness - 핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다.
PASS filter rail consolidation - 쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다.
PASS quick card scanability - compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다.
PASS live row compact actions - 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다.
PASS mobile official benefit quick list - 공식 혜택은 모바일에서 빠른 목록을 먼저 보여주고 상세 탐색 패널은 넓은 화면으로 분리합니다.
PASS mobile freebie hero priority - 모바일 홈 첫 화면에서 무료/쿠폰/0원/무배 혜택 히어로를 상품 리스트보다 먼저 압축 노출합니다.
PASS mobile live benefit strip - 모바일 첫 화면에서 검증된 공식 혜택 2개를 초압축 가로 레일로 보여주며 invalid/search/community 링크를 제외합니다.
PASS toast does not cover bottom nav - 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다.
Mobile UX checks passed: 13/13
```

### home:realtime:doctor

```text
> halindosa@1.0.1 home:realtime:doctor
> node scripts/home-realtime-doctor.mjs

PASS app/api/deals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/news-deals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/freebies/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/hot-signals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/home/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS public api cors no-store - 공개 홈 데이터 API는 Capacitor WebView와 웹에서 no-store/CORS/OPTIONS 응답을 함께 지원합니다.
PASS home api cache buster - 홈 API 요청이 /api/home 및 /api/freebies snapshot, freshness, no-store, timestamp cache-buster를 함께 사용합니다.
PASS native live api bridge - Capacitor 앱은 공개 API base URL이 있으면 /api/home no-store snapshot을 호출하고, 없을 때만 정적 번들 데이터를 fallback으로 사용합니다.
PASS hot signal source no-store - 핫시그널 RSS/API/게시판 수집 fetch가 120초 route cache 대신 no-store로 최신 데이터를 요청합니다.
PASS refreshed deals runtime snapshot - refresh:deals 산출물은 정적 import가 아니라 요청 시점 파일 읽기로 홈/API에 즉시 반영됩니다.
PASS product realtime data snapshot - refresh:deals 산출물 140개가 updatedAt/verifiedAt/availability/finalUrl/imageType/dealType을 갖고, 무료/쿠폰/이벤트성 127개를 홈/API에 직접 반영합니다.
PASS home realtime refresh loop - 상품, 핫시그널, 공식 혜택이 단일 /api/home no-store snapshot 주기로 동기화됩니다.
PASS home realtime cadence - 홈 자동 갱신 주기가 45초이며 상품/공식혜택/핫시그널 채널을 함께 관리합니다.
PASS home snapshot metadata - /api/home이 공식 혜택 추천, 전체 혜택 분포, 채널별 freshness, no-store 생성 메타, 노출 품질 요약을 함께 반환합니다.
PASS home realtime data snapshot - 수집 산출물 105개가 updatedAt/verifiedAt/availability/source/finalUrl을 갖고 홈 no-store API로 반영될 준비가 되어 있습니다.
PASS home realtime status ux - 모바일 상태 배지에 최신성, 수동 새로고침, 진행 상태가 표시됩니다.
PASS home ranking hydration stability - 홈 인기/추천 정렬은 상품 검증 시각을 기본 기준으로 사용해 서버/클라이언트 첫 렌더 순서가 흔들리지 않습니다.
PASS home realtime copy regression - 홈 최신성 문구가 JSX 문자열 보간 실수와 내부 품질 점수 노출 없이 표시됩니다.
PASS home realtime qa gate - home:realtime:doctor, 런타임 스냅샷 검증, test:home-realtime이 package, QA, harness에 연결되어 있습니다.
Home realtime doctor passed: 19/19
```

### test:home-realtime

```text
> halindosa@1.0.1 test:home-realtime
> node scripts/home-realtime-doctor.mjs && node scripts/home-runtime-snapshot-doctor.mjs

PASS app/api/deals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/news-deals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/freebies/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/hot-signals/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS app/api/home/route.ts no-store - 실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.
PASS public api cors no-store - 공개 홈 데이터 API는 Capacitor WebView와 웹에서 no-store/CORS/OPTIONS 응답을 함께 지원합니다.
PASS home api cache buster - 홈 API 요청이 /api/home 및 /api/freebies snapshot, freshness, no-store, timestamp cache-buster를 함께 사용합니다.
PASS native live api bridge - Capacitor 앱은 공개 API base URL이 있으면 /api/home no-store snapshot을 호출하고, 없을 때만 정적 번들 데이터를 fallback으로 사용합니다.
PASS hot signal source no-store - 핫시그널 RSS/API/게시판 수집 fetch가 120초 route cache 대신 no-store로 최신 데이터를 요청합니다.
PASS refreshed deals runtime snapshot - refresh:deals 산출물은 정적 import가 아니라 요청 시점 파일 읽기로 홈/API에 즉시 반영됩니다.
PASS product realtime data snapshot - refresh:deals 산출물 140개가 updatedAt/verifiedAt/availability/finalUrl/imageType/dealType을 갖고, 무료/쿠폰/이벤트성 127개를 홈/API에 직접 반영합니다.
PASS home realtime refresh loop - 상품, 핫시그널, 공식 혜택이 단일 /api/home no-store snapshot 주기로 동기화됩니다.
PASS home realtime cadence - 홈 자동 갱신 주기가 45초이며 상품/공식혜택/핫시그널 채널을 함께 관리합니다.
PASS home snapshot metadata - /api/home이 공식 혜택 추천, 전체 혜택 분포, 채널별 freshness, no-store 생성 메타, 노출 품질 요약을 함께 반환합니다.
PASS home realtime data snapshot - 수집 산출물 105개가 updatedAt/verifiedAt/availability/source/finalUrl을 갖고 홈 no-store API로 반영될 준비가 되어 있습니다.
PASS home realtime status ux - 모바일 상태 배지에 최신성, 수동 새로고침, 진행 상태가 표시됩니다.
PASS home ranking hydration stability - 홈 인기/추천 정렬은 상품 검증 시각을 기본 기준으로 사용해 서버/클라이언트 첫 렌더 순서가 흔들리지 않습니다.
PASS home realtime copy regression - 홈 최신성 문구가 JSX 문자열 보간 실수와 내부 품질 점수 노출 없이 표시됩니다.
PASS home realtime qa gate - home:realtime:doctor, 런타임 스냅샷 검증, test:home-realtime이 package, QA, harness에 연결되어 있습니다.
Home realtime doctor passed: 19/19
PASS api no-store cache policy - no-store, no-cache, must-revalidate, proxy-revalidate
PASS marker absent before refresh - 임시 마커를 쓰기 전에는 홈 API 검색 결과에 나타나지 않습니다.
PASS marker visible after snapshot update - 서버 재시작 없이 refreshedDeals.json 변경이 /api/home에 즉시 반영됩니다.
PASS marker removed after restore - 원본 스냅샷 복구 후 임시 항목이 홈 API에서 사라집니다.
Home runtime snapshot doctor passed: 4/4
```

### test:seo

```text
> halindosa@1.0.1 test:seo
> node scripts/test-seo.mjs

PASS root metadata - 홈 기본 title, description, metadataBase가 설정되어 있습니다.
PASS social and canonical metadata - Open Graph, manifest, canonical 설정이 있습니다.
PASS sitemap - 사이트맵이 상품 상세 URL을 포함하도록 구성되어 있습니다.
PASS robots - robots.txt에서 sitemap을 안내합니다.
PASS deal detail metadata - 상품 상세 페이지가 동적 metadata를 생성합니다.
PASS structured data readiness - 상품 상세 구조화 데이터 또는 확장 지점이 있습니다.
PASS secondary page titles - 주요 보조 페이지에 title metadata가 있습니다.
SEO checks passed: 7/7
```

### test:perf

```text
> halindosa@1.0.1 test:perf
> node scripts/test-perf.mjs

PASS home section budget - 홈 section 정적 개수 21개로 관리 중입니다.
PASS image lazy loading - 이미지 4개 중 lazy 처리 4개.
PASS mobile safe area - 하단 탭바 겹침 방지를 위한 safe-area padding이 있습니다.
PASS initial render cap - 초기 상품 렌더 수 제한 코드가 있습니다.
PASS progressive disclosure - 긴 상세 필터는 접힘/반응형 숨김으로 관리됩니다.
Performance checks passed: 5/5
Performance report written: C:\Users\titek\Documents\Codex\2026-05-29\goal-codex-goal-mvp-ui-next\docs\PERFORMANCE_REPORT.md
```

### smoke:local

```text
pi/redirect/d132?from=smoke 302 in 31ms (next.js: 1747µs, application-code: 29ms)
 GET /api/redirect/d133?from=smoke 302 in 31ms (next.js: 1707µs, application-code: 30ms)
 GET /api/redirect/d134?from=smoke 302 in 32ms (next.js: 1906µs, application-code: 30ms)
 GET /api/redirect/d135?from=smoke 302 in 33ms (next.js: 1622µs, application-code: 31ms)
 GET /api/redirect/d136?from=smoke 302 in 30ms (next.js: 1603µs, application-code: 29ms)
 GET /api/redirect/d137?from=smoke 302 in 32ms (next.js: 2ms, application-code: 30ms)
 GET /api/redirect/d138?from=smoke 302 in 31ms (next.js: 1596µs, application-code: 29ms)
 GET /api/redirect/d139?from=smoke 302 in 30ms (next.js: 1783µs, application-code: 28ms)
 GET /api/redirect/d140?from=smoke 302 in 34ms (next.js: 5ms, application-code: 28ms)
 GET /api/redirect/d047?from=smoke 302 in 30ms (next.js: 1549µs, application-code: 28ms)
 GET /api/redirect/d054?from=smoke 302 in 30ms (next.js: 1596µs, application-code: 29ms)
 GET /api/redirect/d057?from=smoke 302 in 30ms (next.js: 1489µs, application-code: 29ms)
 GET /api/redirect/d061?from=smoke 302 in 31ms (next.js: 1837µs, application-code: 29ms)
 GET /api/redirect/d073?from=smoke 302 in 32ms (next.js: 1678µs, application-code: 30ms)
 GET /api/redirect/d074?from=smoke 302 in 31ms (next.js: 1938µs, application-code: 29ms)
 GET /api/redirect/d115?from=smoke 302 in 31ms (next.js: 1891µs, application-code: 29ms)
 GET /api/affiliate/status 200 in 93ms (next.js: 90ms, application-code: 4ms)
 GET /api/admin/export 200 in 143ms (next.js: 110ms, application-code: 33ms)
 GET /api/admin/deal-quality?format=csv 200 in 98ms (next.js: 89ms, application-code: 9ms)
 POST /api/admin/deal-quality 200 in 17ms (next.js: 1961µs, application-code: 15ms)
 GET /api/deals?limit=200 200 in 39ms (next.js: 3ms, application-code: 36ms)
 GET /api/redirect/d014?from=smoke-manual-hidden 404 in 47ms (next.js: 16ms, application-code: 31ms)
 POST /api/admin/deal-quality 200 in 15ms (next.js: 1770µs, application-code: 14ms)
 GET /api/redirect/d014?from=smoke-manual-restored 302 in 31ms (next.js: 1781µs, application-code: 29ms)
 GET /api/admin/image-queue?format=csv 200 in 45ms (next.js: 1908µs, application-code: 43ms)
 GET /sitemap.xml 200 in 127ms (next.js: 122ms, application-code: 5ms)
 GET /robots.txt 200 in 162ms (next.js: 159ms, application-code: 4ms)
 GET /manifest.webmanifest 200 in 198ms (next.js: 194ms, application-code: 4ms)
PASS home page (3453ms)
PASS home realtime api cache policy (850ms)
PASS customer navigation simplification (0ms)
PASS home query filters (308ms)
PASS home empty search recovery (76ms)
PASS mypage data controls (490ms)
PASS auth pages (512ms)
PASS oauth callback and onboarding pages (479ms)
PASS account deletion guard (241ms)
PASS service guide page (463ms)
PASS support page (342ms)
PASS store screenshot preview (347ms)
PASS not found page (303ms)
PASS category and notification pages (5679ms)
PASS admin dashboard quality cards (6887ms)
PASS commercial launch readiness page (7661ms)
PASS deals api (37ms)
PASS news deals api (107ms)
PASS freebies api (115ms)
PASS hot signals api internal discovery links (216ms)
PASS admin news operations api (119ms)
PASS admin news feed canary api (111ms)
PASS admin news feed live pipeline api (100ms)
PASS admin news feed preview api (163ms)
PASS admin source live readiness api (98ms)
PASS admin source live readiness csv (7ms)
PASS admin source onboarding plan api (97ms)
PASS admin source onboarding plan csv (8ms)
PASS admin source onboarding env template (8ms)
PASS admin source feed env readiness api (94ms)
PASS admin source readiness rollup api (100ms)
PASS admin source readiness rollup csv (8ms)
PASS admin daily operations api (113ms)
PASS admin daily operations csv (7ms)
PASS admin health readiness api (92ms)
PASS cron refresh api guard (135ms)
PASS admin exposure policy api (104ms)
PASS admin exposure policy csv (11ms)
PASS admin link launch gate api (90ms)
PASS admin link launch gate csv (6ms)
PASS admin link revalidation priority api (100ms)
PASS admin link revalidation priority csv (7ms)
PASS admin live probe review api (115ms)
PASS admin live probe review csv (41ms)
PASS admin news revalidation priority api (92ms)
PASS admin news revalidation priority csv (7ms)
PASS admin notification campaigns api (182ms)
PASS admin push readiness api (179ms)
PASS admin official benefit alerts api (93ms)
PASS admin push dry-run api (90ms)
PASS deals filters api (2417ms)
PASS deal link integrity (47ms)
PASS benefit type filter api (183ms)
PASS free benefits page (1355ms)
PASS verified direct purchase link coverage (43ms)
PASS deal detail api (871ms)
PASS health api (52ms)
PASS today benefits api (148ms)
PASS admin daily benefit queue api (147ms)
PASS admin image queue api (152ms)
PASS weekly benefit calendar api (139ms)
PASS daily benefit briefing api (144ms)
PASS daily benefit routine api (138ms)
PASS benefit decision guide api (139ms)
PASS benefit claim effort api (135ms)
PASS personalized benefits api (142ms)
PASS official benefit alerts api (119ms)
PASS metrics api (171ms)
PASS sources api (148ms)
PASS sources csv export (42ms)
PASS report api (120ms)
PASS report page reason prefill (888ms)
PASS report validation (7ms)
PASS admin reports api (108ms)
PASS admin report status update (31ms)
PASS partner feed import dry-run (99ms)
PASS partner feed sample validation api (9ms)
PASS partner feed import blocks unsafe links (7ms)
PASS partner feed import validation (6ms)
PASS track api (119ms)
PASS redirect api (864ms)
PASS redirect consent guard (51ms)
PASS go purchase redirect (856ms)
PASS go official news redirect (1306ms)
PASS detail purchase consent guard (4374ms)
PASS favorites page consent guard (448ms)
PASS verified purchase redirect destinations (1413ms)
PASS affiliate status api (95ms)
PASS admin export csv (145ms)
PASS admin deal quality csv (99ms)
PASS admin manual hide affects public exposure (171ms)
PASS admin image queue csv (46ms)
PASS seo files (201ms)
Smoke test passed: 93/93
```

### release:doctor

```text
itical policy copy.
PASS deployment env checklist content - docs/deployment-env-checklist.md includes launch-critical policy copy.
PASS public url submission report content - docs/PUBLIC_URL_REPORT.md includes launch-critical policy copy.
PASS store metadata qa report content - docs/STORE_METADATA_REPORT.md includes launch-critical policy copy.
PASS store submission packet content - docs/store-submission-packet.md includes launch-critical policy copy.
PASS store console fields content - docs/STORE_CONSOLE_FIELDS.md includes launch-critical policy copy.
PASS store manual checklist content - docs/STORE_MANUAL_CHECKLIST.md includes launch-critical policy copy.
PASS store handoff report content - docs/STORE_HANDOFF_REPORT.md includes launch-critical policy copy.
PASS release notes content - docs/RELEASE_NOTES.md includes launch-critical policy copy.
PASS support playbook content - docs/SUPPORT_PLAYBOOK.md includes launch-critical policy copy.
PASS known issues content - docs/KNOWN_ISSUES.md includes launch-critical policy copy.
PASS store packet qa report content - docs/STORE_PACKET_REPORT.md includes launch-critical policy copy.
PASS store submission readiness report content - docs/STORE_SUBMISSION_REPORT.md includes launch-critical policy copy.
PASS store review notes content - docs/store-review-notes.md includes launch-critical policy copy.
PASS link coverage report content - docs/link-coverage-report.md includes launch-critical policy copy.
PASS catalog quality report content - docs/catalog-quality-report.md includes launch-critical policy copy.
PASS customer support guide content - docs/customer-support-guide.md includes launch-critical policy copy.
PASS release evidence freshness - Working tree has pending changes; clean release candidates must refresh evidence after the final commit. Current document points at cfd80bfa.
PASS store manual checklist freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_MANUAL_CHECKLIST.md after the final commit. Current document points at cfd80bfa.
PASS device qa report freshness - Working tree has pending changes; clean release candidates must refresh docs/DEVICE_QA_REPORT.md after the final commit. Current document points at cfd80bfa.
PASS store screenshots report freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_SCREENSHOTS_REPORT.md after the final commit. Current document points at cfd80bfa.
PASS known issues freshness - Working tree has pending changes; clean release candidates must refresh docs/KNOWN_ISSUES.md after the final commit. Current document points at cfd80bfa.
PASS public url report freshness - Working tree has pending changes; clean release candidates must refresh docs/PUBLIC_URL_REPORT.md after the final commit. Current document points at cfd80bfa.
PASS store submission report freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_SUBMISSION_REPORT.md after the final commit. Current document points at cfd80bfa.
PASS store console fields freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_CONSOLE_FIELDS.md after the final commit. Current document points at cfd80bfa.
PASS store handoff report freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_HANDOFF_REPORT.md after the final commit. Current document points at cfd80bfa.
PASS release notes freshness - Working tree has pending changes; clean release candidates must refresh docs/RELEASE_NOTES.md after the final commit. Current document points at cfd80bfa.
PASS support playbook freshness - Working tree has pending changes; clean release candidates must refresh docs/SUPPORT_PLAYBOOK.md after the final commit. Current document points at cfd80bfa.
PASS store packet report freshness - Working tree has pending changes; clean release candidates must refresh docs/STORE_PACKET_REPORT.md after the final commit. Current document points at 3204688d.
PASS customer navigation simplification - Customer navigation is reduced to home/popular/categories/my and default deal API favors verified purchase links.
PASS deal refresh pipeline - Provider collection, normalization, dedupe, validation, reports, snapshot, admin operations, and deal quality CSV export are wired.
PASS news and official event pipeline - Approved news, official event, public coupon, refresh:news, verify:news, refresh:all, home section, admin status surfaces, and provider-risk CSV export are wired.
PASS admin auth hardening - Admin and cron APIs use request-aware token extraction, header-based auth, query-token compatibility, and a QA/release doctor gate.
PASS cron refresh automation - Protected daily cron refresh endpoint, explicit live feed mode, Vercel Hobby-compatible schedule, dry-run smoke guard, env keys, and runbook guidance are wired.
PASS operational health readiness - Health readiness report proves product links, official benefits, category coverage, provider risk, freshness, refresh:all, and cron refresh status are launch-ready.
PASS daily operations readiness - Daily operations report ties verified links, official benefits, refresh:all, source readiness, cron/push, admin API, CSV export, and store release gates into a daily operator queue.
PASS keystore example - Example signing config is present.
PASS Android signing doctor - Signing doctor guards Gradle release signing, local secret ignores, example file, docs, and tracked signing secrets.
PASS release keystore - Not committed. Create android/keystore.properties locally or use Android Studio signing wizard.
PASS release AAB - android/app/release/app-release.aab (14320180 bytes)
PASS debug APK - Not retained in clean workspaces. Run npm run android:debug only when device QA needs a fresh debug APK.
PASS store assets - Store icon, feature graphic, PWA, Android, and iOS assets have launch-ready dimensions and bright red generation support.
Release doctor passed: 186/186
```


## Policy

- 검증된 구매 링크만 기본 노출합니다.
- 구매 이동은 내부 /go 라우트를 거쳐 새 탭으로 열리게 유지합니다.
- 외부 링크는 opener 접근을 막고, 앱 화면을 덮지 않도록 새 탭/외부 브라우저 정책을 검사합니다.
- 상품 이미지는 고정 비율, lazy loading, fallback 정책을 검사합니다.
- 하단 탭은 홈, 인기, 카테고리, 마이 4개만 유지합니다.
- 모바일 첫 화면은 검색, compact 필터, 핵심 특가 리스트를 우선합니다.
