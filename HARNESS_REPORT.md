# 할인도사 Harness Report

Started: 2026-06-02T16:17:14.538Z
Finished: 2026-06-02T16:18:32.191Z
Status: PASS

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
| lint | PASS | 14.2s |
| build | PASS | 22.7s |
| verify:links | PASS | 0.6s |
| test:external-links | PASS | 0.6s |
| test:images | PASS | 0.6s |
| image:operations:doctor | PASS | 0.6s |
| test:search | PASS | 7.7s |
| test:ui | PASS | 0.6s |
| test:mobile-ux | PASS | 0.6s |
| test:seo | PASS | 0.5s |
| test:perf | PASS | 0.6s |
| smoke:local | PASS | 27.2s |
| release:doctor | PASS | 1.3s |

## Step Output

### lint

```text
> halindosa@1.0.0 lint
> eslint .
```

### build

```text
> halindosa@1.0.0 build
> next build

▲ Next.js 16.2.6 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 4.2s
  Running TypeScript ...
  Finished TypeScript in 8.9s ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/186) ...
  Generating static pages using 23 workers (46/186) 
  Generating static pages using 23 workers (92/186) 
  Generating static pages using 23 workers (139/186) 
✓ Generating static pages using 23 workers (186/186) in 1425ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /api/account/delete
├ ƒ /api/admin/daily-queue
├ ƒ /api/admin/export
├ ƒ /api/admin/image-queue
├ ƒ /api/admin/import
├ ƒ /api/admin/reports
├ ƒ /api/affiliate/status
├ ƒ /api/benefits/briefing
├ ƒ /api/benefits/calendar
├ ƒ /api/benefits/claim-effort
├ ƒ /api/benefits/decision-guide
├ ƒ /api/benefits/personalized
├ ƒ /api/benefits/routine
├ ƒ /api/benefits/today
├ ƒ /api/deals
├ ƒ /api/deals/[id]
├ ƒ /api/health
├ ƒ /api/hot-signals
├ ƒ /api/image
├ ƒ /api/metrics
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
> halindosa@1.0.0 verify:links
> node scripts/verify-product-links.mjs

Product link verification passed: 140/140 verified purchase URLs (100%).
- Distinct purchase hosts: 48
- Product detail URLs: 109
- Official benefit/event URLs: 31
```

### test:external-links

```text
> halindosa@1.0.0 test:external-links
> node scripts/test-external-links.mjs

External link safety passed: 160 files scanned, 30 target=_blank links.
```

### test:images

```text
> halindosa@1.0.0 test:images
> node scripts/test-images.mjs

Image quality passed: 39/140 deals have explicit images.
```

### image:operations:doctor

```text
> halindosa@1.0.0 image:operations:doctor
> node scripts/image-operations-doctor.mjs

Image operations doctor passed: 10/10
```

### test:search

```text
> halindosa@1.0.0 test:search
> node scripts/search-quality-doctor.mjs

Search quality doctor passed.
- Search test keywords: 145
- High-intent home keywords: 54
- Search aliases: 102
- 생필품: 48 deals
- 무배: 74 deals
- 0원: 106 deals
- 가전제품: 16 deals
- 편의점: 27 deals
- 앱테크: 11 deals
- 육아템: 8 deals
- 로켓: 71 deals
- 지마켓: 44 deals
- 알리: 54 deals
- 배달쿠폰: 80 deals
- 커피쿠폰: 8 deals
- 영화무료: 31 deals
- 생수: 65 deals
- 물티슈: 42 deals
- 기저귀: 35 deals
- 치약: 39 deals
- 패션: 10 deals
- 우산: 2 deals
- 치킨쿠폰: 2 deals
- 무료커피: 7 deals
- 라면: 5 deals
- 햇반: 6 deals
- 세제: 7 deals
- 선크림: 1 deals
- 유산균: 1 deals
- 계란: 35 deals
- 우유: 35 deals
- 닭가슴살: 35 deals
- 마스크: 37 deals
- 충전케이블: 3 deals
- 멀티탭: 28 deals
- 화장지: 37 deals
- 청소포: 38 deals
- 김자반: 50 deals
- 김치: 39 deals
- 키친타월: 37 deals
- 참치: 39 deals
- 가글: 28 deals
- 콜라: 6 deals
- 탈취제: 28 deals
- 단백질바: 6 deals
- 새우깡: 35 deals
```

### test:ui

```text
> halindosa@1.0.0 test:ui
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
> halindosa@1.0.0 test:mobile-ux
> node scripts/test-mobile-ux.mjs

PASS mobile shell width and safe area - 모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다.
PASS bottom nav compactness - 하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다.
PASS compact search - 검색창은 짧은 placeholder, 40px 모바일 높이, 결과 수, 추천 검색어를 유지합니다.
PASS single home search entry - 모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다.
PASS home first screen budget - 초기 렌더 12개 제한과 상세 필터 접힘 구조가 유지됩니다.
PASS category rail compactness - 핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다.
PASS filter rail consolidation - 쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다.
PASS quick card scanability - compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다.
PASS live row compact actions - 라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다.
PASS toast does not cover bottom nav - 토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다.
Mobile UX checks passed: 10/10
```

### test:seo

```text
> halindosa@1.0.0 test:seo
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
> halindosa@1.0.0 test:perf
> node scripts/test-perf.mjs

PASS home section budget - 홈 section 정적 개수 19개로 관리 중입니다.
PASS image lazy loading - 이미지 4개 중 lazy 처리 4개.
PASS mobile safe area - 하단 탭바 겹침 방지를 위한 safe-area padding이 있습니다.
PASS initial render cap - 초기 상품 렌더 수 제한 코드가 있습니다.
PASS progressive disclosure - 긴 상세 필터는 접힘/반응형 숨김으로 관리됩니다.
Performance checks passed: 5/5
Performance report written: C:\Users\titek\Documents\Codex\2026-05-29\goal-codex-goal-mvp-ui-next\docs\PERFORMANCE_REPORT.md
```

### smoke:local

```text
orts 200 in 6ms (next.js: 1541µs, application-code: 5ms)
 POST /api/admin/import 200 in 42ms (next.js: 36ms, application-code: 6ms)
 GET /api/admin/import 200 in 6ms (next.js: 1708µs, application-code: 5ms)
 POST /api/admin/import 200 in 6ms (next.js: 1727µs, application-code: 4ms)
 POST /api/admin/import 200 in 5ms (next.js: 1507µs, application-code: 4ms)
 POST /api/track 200 in 45ms (next.js: 40ms, application-code: 5ms)
 GET /api/redirect/d014?from=smoke&analytics=granted&affiliate=granted 302 in 744ms (next.js: 732ms, application-code: 12ms)
 GET /api/redirect/d014?from=smoke 302 in 27ms (next.js: 18ms, application-code: 9ms)
 GET /go/d014?from=smoke&analytics=granted&affiliate=granted 302 in 764ms (next.js: 754ms, application-code: 10ms)
 GET /deals/d014 200 in 3.1s (next.js: 543ms, generate-params: 494ms, application-code: 2.6s)
 GET /favorites 200 in 503ms (next.js: 421ms, application-code: 83ms)
 GET /api/redirect/d014?from=smoke 302 in 26ms (next.js: 17ms, application-code: 9ms)
 GET /api/redirect/d016?from=smoke 302 in 10ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d015?from=smoke 302 in 11ms (next.js: 1992µs, application-code: 9ms)
 GET /api/redirect/d012?from=smoke 302 in 9ms (next.js: 1691µs, application-code: 8ms)
 GET /api/redirect/d020?from=smoke 302 in 9ms (next.js: 1819µs, application-code: 8ms)
 GET /api/redirect/d041?from=smoke 302 in 10ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d043?from=smoke 302 in 10ms (next.js: 1717µs, application-code: 8ms)
 GET /api/redirect/d044?from=smoke 302 in 11ms (next.js: 2ms, application-code: 9ms)
 GET /api/redirect/d118?from=smoke 302 in 11ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d119?from=smoke 302 in 10ms (next.js: 1835µs, application-code: 8ms)
 GET /api/redirect/d120?from=smoke 302 in 10ms (next.js: 1800µs, application-code: 8ms)
 GET /api/redirect/d121?from=smoke 302 in 10ms (next.js: 1822µs, application-code: 8ms)
 GET /api/redirect/d122?from=smoke 302 in 10ms (next.js: 1852µs, application-code: 8ms)
 GET /api/redirect/d123?from=smoke 302 in 10ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d124?from=smoke 302 in 10ms (next.js: 1689µs, application-code: 8ms)
 GET /api/redirect/d125?from=smoke 302 in 10ms (next.js: 1825µs, application-code: 8ms)
 GET /api/redirect/d126?from=smoke 302 in 10ms (next.js: 1736µs, application-code: 8ms)
 GET /api/redirect/d127?from=smoke 302 in 10ms (next.js: 1745µs, application-code: 8ms)
 GET /api/redirect/d128?from=smoke 302 in 10ms (next.js: 1916µs, application-code: 8ms)
 GET /api/redirect/d129?from=smoke 302 in 10ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d130?from=smoke 302 in 10ms (next.js: 1794µs, application-code: 8ms)
 GET /api/redirect/d131?from=smoke 302 in 10ms (next.js: 1781µs, application-code: 8ms)
 GET /api/redirect/d132?from=smoke 302 in 9ms (next.js: 1748µs, application-code: 7ms)
 GET /api/redirect/d133?from=smoke 302 in 9ms (next.js: 1774µs, application-code: 8ms)
 GET /api/redirect/d134?from=smoke 302 in 10ms (next.js: 1652µs, application-code: 8ms)
 GET /api/redirect/d135?from=smoke 302 in 9ms (next.js: 1775µs, application-code: 8ms)
 GET /api/redirect/d136?from=smoke 302 in 9ms (next.js: 1777µs, application-code: 8ms)
 GET /api/redirect/d137?from=smoke 302 in 10ms (next.js: 2ms, application-code: 8ms)
 GET /api/redirect/d138?from=smoke 302 in 9ms (next.js: 1537µs, application-code: 7ms)
 GET /api/redirect/d139?from=smoke 302 in 9ms (next.js: 1662µs, application-code: 8ms)
 GET /api/redirect/d140?from=smoke 302 in 9ms (next.js: 1633µs, application-code: 7ms)
 GET /api/affiliate/status 200 in 100ms (next.js: 96ms, application-code: 4ms)
 GET /api/admin/export 200 in 117ms (next.js: 104ms, application-code: 13ms)
 GET /api/admin/image-queue?format=csv 200 in 11ms (next.js: 3ms, application-code: 8ms)
 GET /manifest.webmanifest 200 in 121ms (next.js: 117ms, application-code: 4ms)
 GET /robots.txt 200 in 158ms (next.js: 154ms, application-code: 4ms)
 GET /sitemap.xml 200 in 198ms (next.js: 194ms, application-code: 5ms)
PASS home page (1102ms)
PASS customer navigation simplification (0ms)
PASS home query filters (325ms)
PASS home empty search recovery (85ms)
PASS mypage data controls (206ms)
PASS auth pages (194ms)
PASS oauth callback and onboarding pages (200ms)
PASS account deletion guard (70ms)
PASS service guide page (175ms)
PASS support page (111ms)
PASS store screenshot preview (148ms)
PASS not found page (101ms)
PASS category and notification pages (3384ms)
PASS admin dashboard quality cards (3899ms)
PASS commercial launch readiness page (2427ms)
PASS deals api (12ms)
PASS deals filters api (1609ms)
PASS deal link integrity (20ms)
PASS benefit type filter api (56ms)
PASS free benefits page (895ms)
PASS verified direct purchase link coverage (17ms)
PASS deal detail api (750ms)
PASS health api (18ms)
PASS today benefits api (51ms)
PASS admin daily benefit queue api (43ms)
PASS admin image queue api (42ms)
PASS weekly benefit calendar api (39ms)
PASS daily benefit briefing api (41ms)
PASS daily benefit routine api (42ms)
PASS benefit decision guide api (40ms)
PASS benefit claim effort api (40ms)
PASS personalized benefits api (43ms)
PASS metrics api (53ms)
PASS sources api (48ms)
PASS report api (48ms)
PASS report page reason prefill (359ms)
PASS report validation (6ms)
PASS admin reports api (46ms)
PASS admin report status update (15ms)
PASS partner feed import dry-run (43ms)
PASS partner feed sample validation api (8ms)
PASS partner feed import blocks unsafe links (7ms)
PASS partner feed import validation (7ms)
PASS track api (47ms)
PASS redirect api (747ms)
PASS redirect consent guard (30ms)
PASS go purchase redirect (777ms)
PASS detail purchase consent guard (3146ms)
PASS favorites page consent guard (505ms)
PASS seller search redirect fallbacks (430ms)
PASS affiliate status api (102ms)
PASS admin export csv (118ms)
PASS admin image queue csv (13ms)
PASS seo files (208ms)
Smoke test passed: 54/54
```

### release:doctor

```text
 provider, docs, production feed doctor, and admin dashboard expose source readiness and safe production JSON feed policy for official API, RSS, and partner feed transition.
PASS live deal detail source - Deal detail lookup reads provider data first and only falls back to cached/default data when necessary.
PASS admin link review workflow - Admin link review queue and CSV export expose priority, reason, confidence, current destination URL, and daily benefit queue operation fields.
PASS commercial launch readiness page - Commercialization page exposes launch readiness metrics, daily benefit queue readiness, retention readiness, external setup, and remaining link review risk.
PASS commercial deal fields - Deal type includes product/search URL split and commercial engagement fields.
PASS structured benefit claim guide - Deals expose structured eligibility checklist, claim steps, and warning text for benefit claim UX.
PASS free benefits dedicated page - Free benefits, coupons, convenience store, mart, delivery, point offers, claimed-benefit tracking, today's priority queue, weekly routine, claim-effort filtering, and active-benefit filtering remain available without occupying primary navigation.
PASS go redirect route - Purchase redirect uses /go/[dealId] with click logging and server-side outbound URL resolution.
PASS native purchase navigation - Native purchase buttons keep web redirect tracking when available and fall back to a safe product URL in static app bundles.
PASS launch sitemap coverage - Sitemap includes service guide, support, privacy, and commercialization readiness pages.
PASS capacitor appId - com.halindosa.app
PASS capacitor appName - 할인도사
PASS capacitor webDir - out
PASS Capacitor export stability - Capacitor static export avoids unsupported headers and uses runtime data mode.
PASS Android applicationId - com.halindosa.app
PASS Android versionCode - 1
PASS Android versionName - 1.0.0
PASS Android app label - 할인도사
PASS Android permissions - Only expected network permission found.
PASS Android auth deep link - halindosa://auth/callback intent-filter is registered.
PASS Android icons - Launcher icon densities are present.
PASS Android splash - Splash image exists.
PASS iOS project - ios/App is present.
PASS iOS bundle identifier - com.halindosa.app
PASS iOS build number - 1
PASS iOS version - 1.0.0
PASS iOS display name - 할인도사
PASS iOS auth deep link - halindosa URL scheme is registered.
PASS iOS app icon - App Store icon asset is present.
PASS iOS splash - Splash image asset is present.
PASS iOS privacy permissions - No tracking, camera, microphone, location, contacts, or photo permissions declared.
PASS iOS privacy manifest - PrivacyInfo.xcprivacy is bundled and declares no tracking or collected data for V1.
PASS policy and store docs - Required policy/listing drafts are present.
PASS store metadata guard - scripts/store-metadata-doctor.mjs includes launch-critical policy copy.
PASS device qa record guard - scripts/device-qa-doctor.mjs includes launch-critical policy copy.
PASS privacy policy content - app/privacy/page.tsx includes launch-critical policy copy.
PASS terms content - app/terms/page.tsx includes launch-critical policy copy.
PASS service guide content - app/guide/page.tsx includes launch-critical policy copy.
PASS support page content - app/support/page.tsx includes launch-critical policy copy.
PASS data safety guide content - docs/data-safety-guide.md includes launch-critical policy copy.
PASS privacy policy draft content - docs/privacy-policy-draft.md includes launch-critical policy copy.
PASS test plan content - docs/test-plan.md includes launch-critical policy copy.
PASS readme qa guidance - README.md includes launch-critical policy copy.
PASS runbook harness guidance - docs/RUNBOOK.md includes launch-critical policy copy.
PASS oauth setup content - docs/OAUTH_SETUP.md includes launch-critical policy copy.
PASS deep link auth content - docs/DEEPLINK_AUTH.md includes launch-critical policy copy.
PASS account deletion content - docs/ACCOUNT_DELETION.md includes launch-critical policy copy.
PASS release evidence content - docs/release-evidence.md includes launch-critical policy copy.
PASS launch day checklist content - docs/launch-day-checklist.md includes launch-critical policy copy.
PASS store screenshot storyboard content - docs/store-assets-guide.md includes launch-critical policy copy.
PASS device qa checklist content - docs/device-qa-checklist.md includes launch-critical policy copy.
PASS device qa record template content - docs/device-qa-record-template.md includes launch-critical policy copy.
PASS deployment env checklist content - docs/deployment-env-checklist.md includes launch-critical policy copy.
PASS store submission packet content - docs/store-submission-packet.md includes launch-critical policy copy.
PASS store review notes content - docs/store-review-notes.md includes launch-critical policy copy.
PASS link coverage report content - docs/link-coverage-report.md includes launch-critical policy copy.
PASS catalog quality report content - docs/catalog-quality-report.md includes launch-critical policy copy.
PASS release evidence freshness - Working tree has pending changes; clean release candidates must refresh evidence after the final commit. Current document points at 96eddd8.
PASS customer navigation simplification - Customer navigation is reduced to home/popular/categories/my and default deal API favors verified purchase links.
PASS keystore example - Example signing config is present.
PASS release keystore - Not committed. Create android/keystore.properties locally or use Android Studio signing wizard.
PASS release AAB - android/app/build/outputs/bundle/release/app-release.aab (6500073 bytes)
PASS debug APK - android/app/build/outputs/apk/debug/app-debug.apk (10610182 bytes)
PASS store assets - Store icon, feature graphic, PWA, Android, and iOS assets have launch-ready dimensions and bright red generation support.
Release doctor passed: 142/142
```


## Policy

- 검증된 구매 링크만 기본 노출합니다.
- 구매 이동은 내부 /go 라우트를 거쳐 새 탭으로 열리게 유지합니다.
- 외부 링크는 opener 접근을 막고, 앱 화면을 덮지 않도록 새 탭/외부 브라우저 정책을 검사합니다.
- 상품 이미지는 고정 비율, lazy loading, fallback 정책을 검사합니다.
- 하단 탭은 홈, 인기, 카테고리, 마이 4개만 유지합니다.
- 모바일 첫 화면은 검색, compact 필터, 핵심 특가 리스트를 우선합니다.
