# 할인도사 현재 상태

작성 시점: 2026-06-13, Asia/Seoul

이 문서는 새 Codex 세션이 이전 긴 대화에 의존하지 않고 현재 워크트리와 실제 명령 결과만으로 이어받기 위한 핸드오프 문서다.

## 현재 기준

- Branch: `codex/12h-product-ux-growth-hardening`
- 최신 운영 확인 기준: `6eb18829` 기준 Vercel Production 반영 확인. 최신 코드 커밋은 `e85e847a`이며 Vercel Hobby 일일 배포 제한 해제 후 운영 반영을 재시도한다.
- Remote: `origin/main`, `origin/codex/12h-product-ux-growth-hardening`에 반영 대상
- 운영 URL: `https://www.halindosa.com`
- Vercel Production Deploy: `9c9f35ff` 기준 운영 `/api/health` 반영 확인. 새 커밋 후에는 운영 `/api/health`의 `deployment.shortCommit`으로 최신 반영 여부를 다시 확인한다.
- 2026-06-13 KST 확인: 최신 커밋 `e85e847a`는 공식 혜택 feed 환경변수 doctor가 대표 홈페이지 메인 URL을 `homepage_link` 사유로 별도 차단하도록 강화했다. 직전 커밋 `3c4e60fe`는 공식 혜택 feed dry-run을 JSON/RSS뿐 아니라 CSV/NDJSON까지 확장했고, 중복 후보(`duplicate_candidate`)와 종료 문구(`ended_text_detected`)를 사용자 노출 전에 숨기는 검증을 추가했다. `npm run source:feed-env:doctor`, `npm run lint`, `npm run smoke:local`, `npm run release:doctor`, `npm run build`, `npm run build:android`, `npm run cap:sync`, `npm run android:webview:doctor`, `npm run workspace:doctor:strict`를 통과했다. 현재 운영은 `seed_fallback_only`, configured official feed URLs 0개, external feed items 0개로 확인되며, 운영 최신 배포와 별개로 진짜 외부 실시간 수집 전환은 Vercel env feed 연결이 필요하다. 직접 `npx vercel deploy --prod --force --yes`는 Hobby 일일 배포 제한(`api-deployments-free-per-day`)으로 실패했다. 운영 `/api/health.deployment.shortCommit`은 아직 `6eb18829`이다. 제한 해제 또는 GitHub Actions 재실행 후 최신 커밋을 배포하고 `/api/health.deployment.shortCommit=e85e847a`를 확인한다.
- GitHub CI: 최신 `main`/`codex/12h-product-ux-growth-hardening`에 `e85e847a` push 완료. 새 커밋 후 운영 `/api/health`의 `deployment.shortCommit`으로 실제 반영 여부를 확인한다.
- 로컬 최신 홈페이지: `http://localhost:3010/?verifiedOnly=true` (3002 포트는 다른 앱이 점유 중일 수 있음)
- 운영 API 최신 계약 확인:
  - `/api/home?limit=1&verifiedOnly=true`: HTTP 200
  - 응답 body `requestId` 존재
  - `X-Request-Id` 헤더 존재
  - `X-RateLimit-Remaining` 헤더 존재
  - `Cache-Control`은 no-store 계열
  - `/api/freebies?limit=5`: HTTP 200, `ok=true`, `requestId` 존재
  - 운영 홈페이지 `https://www.halindosa.com/?verifiedOnly=true`: 무료혜택 카드 가시 렌더링 확인
  - 운영 `/api/health`: `deployment.shortCommit=9c9f35ff`, `officialBenefitVisibleCount=197`, `officialBenefitFresh=true`
  - WebView Android 앱은 `https://www.halindosa.com` 운영 웹을 직접 로드하므로 Vercel 배포가 성공하면 앱 화면에도 최신 무료혜택 홈이 반영된다.

## 제품 방향

- 할인도사는 공공기관/정책 혜택 앱이 아니라 실시간 인기 할인, 무료 혜택, 브랜드 이벤트, 쿠폰, 샘플, 체험, 전원증정 정보를 우선 보여주는 플랫폼이다.
- 기본 홈/뉴스/무료혜택 피드는 소비자 혜택을 우선한다.
- 정부/공공/지자체성 혜택은 `includePublic=true` 또는 공공 카테고리 요청 시에만 포함하는 방향을 유지한다.
- 구매 상품은 보조 섹션이며, 사용자 CTA는 실제 상품 상세 또는 공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL로만 연결한다.

## 최근 안정화 내용

- `/api/home`, `/api/deals`, `/api/news-deals`에 request id와 rate-limit 헤더를 적용했다.
- 기본 홈/뉴스/무료혜택 API에서 공공정책성 혜택을 기본 노출에서 제외하고 소비자 혜택 우선 정책을 적용했다.
- `scripts/vercel-deployment-doctor.mjs`가 `halindosa.com`과 `www.halindosa.com` 양쪽 운영 도메인의 최신 API 계약을 함께 검사한다.
- Vercel 배포가 성공처럼 보여도 운영 API가 `requestId`, `X-Request-Id`, `X-RateLimit-Remaining`을 내지 않으면 차단한다.
- smoke/release 검증은 소비자 우선 기본 피드와 `includePublic=true` 전체 공식 혜택 풀을 구분해서 검사한다.
- QA 파이프라인은 중복 실행을 제거해 71개 핵심 게이트로 정리했다. 개별 품질 기준은 유지한다.
- `/api/home`과 `/api/health`가 비밀이 아닌 deployment commit metadata를 반환한다. `vercel:doctor`는 `REQUIRE_DEPLOY_COMMIT=true`일 때 운영 도메인이 최신 커밋을 실제로 서빙하지 않으면 실패한다.
- `/api/health`는 무료혜택 feed 전환 추천 키를 lane별로 노출한다. 현재 운영 응답은 `OFFICIAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`, `TELECOM_MEMBERSHIP_FEED_URLS`, `CONVENIENCE_BENEFIT_FEED_URLS`, `BEAUTY_SAMPLE_FEED_URLS`, `CAFE_FRANCHISE_COUPON_FEED_URLS`, `PAY_POINT_BENEFIT_FEED_URLS` 등을 포함한다.
- GitHub Actions `Benefit Refresh Scheduler`는 `CRON_SECRET` 또는 `HALINDOSA_CRON_SECRET` repository secret이 있으면 30분마다 `/api/cron/benefits`를 호출하고, 정각에는 `/api/cron/refresh?mode=liveFeed`를 호출한다. Vercel Hobby의 daily cron은 유지한다.
- `benefit:operations:report`는 `reports/free-benefit-operations.json`과 `docs/FREE_BENEFIT_OPERATIONS_REPORT.md`를 생성해 노출 가능한 공식 무료혜택, 제외 후보, 공식 도메인, 브랜드/출처, 오늘/이번주 마감, 검색/비공식/깨진 이미지 0건 게이트, 상위 노출 후보를 운영자가 한 파일에서 확인하게 한다.
- `/api/admin/free-benefit-operations`와 `/api/admin/free-benefit-operations?format=csv`는 같은 무료혜택 운영 리포트를 관리자 보호 API와 CSV로 제공한다. smoke는 이 API가 공식 무료혜택 수, 공식 도메인 수, 검색/비공식/깨진 이미지 0건, 상위 후보를 유지하는지 검사한다.
- 관리자 `/admin` 화면은 무료혜택 운영 리포트 패널을 제공한다. 운영자는 화면에서 공식 무료혜택 수, 공식 도메인/브랜드 수, 검색/비공식/깨진 이미지 0건, 오늘/이번주 마감 큐, 상위 노출 후보를 확인하고 JSON/CSV를 내려받을 수 있다.
- `/api/admin/source-breadth`와 `/api/admin/source-breadth?format=csv`는 `reports/free-benefit-source-breadth.json`을 관리자 보호 API와 CSV로 제공한다. smoke는 필수 수집축 12/12, 핵심 브랜드 신호 통과, 소비자형 우선 정책을 검사한다.
- 관리자 `/admin` 화면은 무료혜택 소스 축 커버리지 패널을 제공한다. 운영자는 통신사, 편의점, 뷰티, 카페, 배달, 페이/포인트, 마트, 오픈마켓, 샘플·체험 수집축과 핵심 브랜드 후보가 빠졌는지 확인할 수 있다.
- 공식 무료혜택 소스 카탈로그는 메가MGC커피, PAYCO, L.POINT, 신세계포인트, 빽다방, 더벤티, 탐앤탐스 공식 이벤트/리워드/출석체크 후보를 추가해 220개 후보로 확장했다. `source:catalog:report`, `source:breadth:doctor`, `source:live:doctor`, `source:readiness:report`는 검색/대표몰/비공식 CTA를 허용하지 않는 기준으로 이 후보를 검사한다.
- 공식 무료혜택 소스 카탈로그는 투썸플레이스 공식 이벤트 목록, 뚜레쥬르 공식 진행 이벤트, CU편의점택배 공식 진행 이벤트를 추가해 223개 후보로 확장했다. `source:live:doctor` 기준 reachable/guarded 195/28, stale_or_removed 0건이며, 사용자 CTA는 여전히 공식 이벤트/쿠폰/신청 페이지로 검증된 항목만 허용한다.
- `source:onboarding:plan`은 공식 이벤트 feed, 쿠폰·멤버십 feed, 편의점·마트 feed, 샘플·무료체험 feed, 포인트·캐시백 feed를 5단계로 연결하는 실시간 feed 온보딩 순서를 생성한다. 각 단계는 env key, 대표 공식 후보, 사용자 영향, 검증 명령을 함께 남기며, `release:doctor`는 이 섹션과 핵심 env key가 빠지면 실패한다.
- `FreeBenefitEventRuntimeReadiness.collectionLanes`는 공식 이벤트, 쿠폰·멤버십, 편의점·마트, 샘플·무료체험, 포인트·캐시백, 배달·외식, 무료배송, 오늘·이번주 마감 수집축의 count, 공식/검증/구매조건 없음 수, 대표 브랜드, 대표 혜택 유형, 권장 env key, 상태(`healthy/thin/empty`)를 반환한다. 2026-06-13 로컬 확인 기준 `/api/freebies?limit=3`은 8개 lane 모두 `healthy`였다.
- `source:live:doctor`는 재생성 리포트(`reports/official-source-live-check.json`)와 함께 배포용 요약(`data/officialSourceLiveSnapshot.json`)을 생성한다. Vercel 런타임에서 `reports/source-readiness.json`이 없어도 `/api/admin/source-readiness`는 공식 소스 후보 220개, 접근 가능/보호 소스 192/28, stale 0건 기준으로 운영 준비도를 계산한다.
- 홈 무료혜택 히어로는 브랜드 키를 정규화해 같은 브랜드 샘플/쿠폰이 첫 화면에 반복 노출되는 문제를 줄인다.
- 홈 무료혜택 히어로는 `오늘마감`과 `마감임박`을 분리하고, 공식 무료혜택 카드 16개와 즉시 수령 카드 8개를 모바일 첫 화면 우선 영역으로 노출한다.
- 오늘마감 혜택이 0건이면 홈 대표 지표와 카테고리 바로가기에서 0건을 크게 띄우지 않고 `이번주마감` 또는 `마감임박` 혜택을 대체 노출한다. 이 정책은 `benefit:event:contract`에서 검사한다.
- `scripts/home-runtime-snapshot-doctor.mjs`는 `localhost:3000`을 먼저 확인하고, 다른 앱이 `127.0.0.1:3000`을 점유해도 할인도사 런타임 스냅샷 검증이 잘못 실패하지 않게 했다.
- `FreeBenefitEvent`는 `qualityScore`, `freshnessScore`, `officialScore`, `urgencyScore`, `rewardScore`를 함께 계산해 공식성, 최신성, 마감성, 보상 가치를 랭킹과 운영 리포트에 반영한다.
- `docs/FREE_BENEFIT_SCORING.md`에 무료혜택 노출 조건과 점수 기준을 정리했다.
- `benefit:category:doctor`를 추가해 전원증정, 선착순, 쿠폰, 무료 샘플, 무료체험, 기프티콘, 포인트/캐시백, 무료배송, 신규가입, 출석체크 카테고리별 최소 노출 수량을 출시 게이트에서 확인한다.
- `/api/benefits/events`는 `deadline=today|week|soon`을 지원하며, `/free-benefits` 화면은 `오늘마감`, `이번주마감`, `마감 임박만` 칩으로 공식 무료혜택을 마감 기준으로 좁힐 수 있다.
- 홈 무료혜택 히어로의 빠른 필터도 `deadline=today|week|soon` URL을 사용해 운영 API와 같은 마감 기준으로 이동한다.
- `/api/home`, `/api/freebies`, `/api/benefits/events`는 `runtimeReadiness`를 반환한다. 이 메타는 전체 publishable 무료혜택 풀 기준으로 공식/검증/구매조건 없음/카테고리 공백/오늘·이번주 마감/24시간 이상 미검증 항목/상위 브랜드를 요약한다.
- `/api/freebies?limit=12`처럼 화면에는 일부 카드만 반환해도 `categoryCounts`와 `runtimeReadiness`는 전체 무료혜택 운영 풀 기준으로 계산한다. smoke는 이 계약을 검사한다.
- Vercel 런타임에서 `reports/free-benefit-source-breadth.json`이 없어도 `/api/admin/source-breadth`는 번들된 `data/officialSourceCatalog.json`으로 소스 축 커버리지를 계산한다. 운영 확인값은 필수 축 12/12, 핵심 브랜드 52/52, 공식 소스 후보 217개다.
- 무료혜택 운영 리포트는 `operatorActionQueue`를 포함한다. 관리자 `/admin`, `/api/admin/free-benefit-operations`, CSV, smoke, release doctor가 오늘마감 공백, 이번주마감 대체 편성, 혜택 유형 공백, 비공식/검색/깨진 이미지 차단 작업을 같은 큐로 확인한다.
- Vercel 런타임에서 `reports/free-benefit-operations.json`이 없어도 `/api/admin/free-benefit-operations`는 번들된 `data/refreshedNewsDeals.json`으로 공식 무료혜택 운영 리포트와 `operatorActionQueue`를 계산한다.
- 뉴스/공식혜택 데이터 모델은 `freeTrial`, `signup`, `checkIn`, `roulette` 혜택 유형을 정식으로 지원한다. seed와 refresh snapshot에서 무료체험 7건, 신규가입 3건, 출석체크 4건, 기프티콘 2건, 룰렛 1건이 독립 유형으로 분류되며 운영 리포트의 혜택 유형 공백 큐는 해소됐다.
- `benefit:model:doctor`는 실제 `data/refreshedNewsDeals.json` 스냅샷을 런타임 무료혜택 모델로 점검한다. 현재 후보 197개, active 188개, 소비자형 active 152개, 공식 링크 비율 100%, 필수 필드 누락 0개 기준으로 통과하며 QA와 harness에 연결되어 있다.
- smoke는 `/api/home`, `/api/freebies`, `/api/benefits/events`가 반환하는 실제 무료혜택 이벤트의 필수 런타임 필드, 공식 URL 정합성, active/passed/official/verified 상태를 함께 검사한다. `linkType=official*`이고 검증 통과한 혜택은 provider가 seed여도 `sourceType=official`로 정규화된다.
- `release:doctor`는 이제 `benefit:model:doctor`와 smoke의 무료혜택 런타임 API 필드 계약 검사(`requiredFreeBenefitRuntimeFields`, `assertFreeBenefitRuntimeFields`)가 QA/harness에 연결되어 있는지 직접 확인한다. 무료혜택 모델 필드가 빠지거나 공식/검증 상태 계약이 약해지면 릴리즈 게이트가 실패한다.
- `benefit:ranking:doctor`는 실제 무료혜택 스냅샷의 dedupe key, 공식 URL, 소비자형 publishable 수량, 구매조건 없는 혜택 수, 바로 받을 수 있는 고신뢰 혜택 수, 첫 화면 쉬운참여 혜택 수, 혜택 유형 다양성, 평균 품질/최신성 점수, 첫 화면 후보의 브랜드/도메인 반복도를 검사한다. 같은 혜택 반복 노출이나 낮은 품질 점수, 쉬운 참여 혜택 부족이 재발하면 QA, harness, release doctor가 실패한다.
- `/api/admin/free-benefit-ranking`와 `/api/admin/free-benefit-ranking?format=csv`는 무료혜택 랭킹, 중복, 점수, 첫 화면 브랜드/도메인 반복도를 관리자 보호 API와 CSV로 제공한다. smoke는 JSON/CSV 응답, 공식 HTTPS 후보, 0개 정확 중복, 첫 화면 다양성 기준을 검사한다.
- 관리자 `/admin` 화면은 무료혜택 랭킹 리포트 패널을 제공한다. 운영자는 정확 중복 0건, 소비자형 혜택 수, 구매조건 없는 혜택 수, 바로받기 후보 수, 첫 화면 쉬운참여 혜택 수, 첫 화면 브랜드/도메인 반복도, 상위 후보를 화면에서 확인하고 JSON/CSV를 내려받을 수 있다.
- `/api/admin/free-benefit-category-coverage`와 `/api/admin/free-benefit-category-coverage?format=csv`는 `benefit:category:doctor`와 같은 기준으로 전원증정, 선착순, 쿠폰, 무료 샘플, 무료체험, 기프티콘, 포인트/캐시백, 무료배송, 신규가입, 출석체크 10개 필수 축을 관리자 보호 API와 CSV로 제공한다.
- 관리자 `/admin` 화면은 무료혜택 카테고리 커버리지 패널을 제공한다. 운영자는 노출 가능한 active 공식 혜택 수, 구매조건 없는 혜택 수, 공식 도메인 수, 오늘/이번주 마감 수량, 카테고리별 count/minimum, 상위 후보를 화면에서 확인할 수 있다.
- 무료혜택 카테고리 커버리지 리포트는 `categoryCandidateGroups`를 포함한다. 운영자는 전원증정, 선착순, 쿠폰, 무료 샘플, 무료체험, 기프티콘, 포인트/캐시백, 무료배송, 신규가입, 출석체크별 상위 공식 후보를 JSON/CSV/관리자 화면에서 바로 확인할 수 있으며, 후보 정렬은 공공·정책성 링크보다 소비자형 브랜드 공식 혜택을 우선한다.
- `/api/home`과 `/api/freebies`의 `requiredCategoryCoverage`도 `categoryCandidateGroups`를 반환한다. 홈 무료혜택 히어로는 이 값을 사용해 `카테고리별 대표 혜택` 레일을 노출하고, 사용자는 각 필수 무료혜택 축의 공식 후보를 `/go/news/[id]` 추적 경로로 바로 열 수 있다.
- 카테고리별 대표 혜택 후보는 `claimEaseScore`와 `claimUrgencyLabel`을 포함한다. 홈 카드와 API는 구매조건이 낮고, 공식 링크이며, 마감 시점이 분명한 혜택을 사용자가 더 빨리 고를 수 있게 `쉬움 N점`, `오늘마감/이번주마감/여유있음` 배지를 함께 제공한다.
- 전역 `app/loading.tsx` fallback은 제거했다. 홈은 서버 HTML에서 실제 무료혜택 카드가 바로 보이도록 유지하며, smoke와 Vercel doctor는 숨겨진 스트리밍 콘텐츠(`S:0`)나 `할인도사 화면을 불러오는 중` fallback이 홈 HTML에 섞이면 실패한다.
- `/api/health`는 `homepageVisibleRenderGuard=true`, `homepageLoadingFallbackBlocked=true`, `freeBenefitRankingOk`, `freeBenefitClaimReadyCount`, `freeBenefitTopClaimReadyCount`, `freeBenefitTopTypeDiversity`, `freeBenefitExactDuplicateGroupCount`를 반환한다. Vercel doctor는 이 런타임 플래그와 운영 HTML 가시 렌더 검사를 함께 확인해, 문서/스크립트만 바뀐 커밋이 운영 앱에 실제로 반영되지 않는 상황과 첫 화면 무료혜택 품질 저하를 더 쉽게 구분한다.
- 무료혜택 랭킹 리포트는 `operationalReadiness`를 포함한다. 운영자는 24시간 내 재검증 수, stale/missing 검증 시각 0건, 오늘/이번주 마감 수, 구매조건 없는 비율, 바로받기 비율, 공식 도메인 다양성을 관리자 화면, JSON, CSV, `/api/health`에서 함께 확인한다.
- `/api/health`는 이제 `officialSourceFeedActivationOk`, `officialSourceFeedActivationStatus`, activation check 통과 수, source feed env 추천 lane 수, 소비자형/공공성 소스 비율까지 반환한다. `smoke:local`, `release:doctor`, `vercel:doctor`는 seed fallback 또는 live feed 전환 상태가 안전한지 함께 검사한다.

## 현재 데이터 품질 기준

- 상품 링크:
  - 총 140개 검증 URL
  - 사용자 노출 가능 138~140개 범위
  - 검색 링크 노출 0건
  - 품절/종료 링크 노출 0건
  - hard failure 노출 0건
  - 외부몰 일시 5xx/접근보호 이슈는 고객 노출에서 숨기고 운영자 재검증 큐로 보낸다.
- 공식 혜택:
  - `refresh:news` 기준 197개 공식 혜택 노출
  - `verify:news` 기준 197/197 공식 혜택 링크 검증
  - 기본 top consumer feed는 공공정책성 혜택 0건
- 무료혜택:
  - `refresh:benefits` 기준 무료혜택 116/116, 공식 이벤트 174/174
  - `verify:freebies` 기준 193/193 visible, 검색 링크 0, 비공식 링크 0, 깨진 이미지 0
  - `verify:freebies`는 공식 도메인 111개, 브랜드 112개, 구매조건 낮은 혜택 기준도 함께 검사한다.
  - FreeBenefitEvent 기준 active official events 188개, sources 148개, hosts 109개
  - Runtime FreeBenefitEvent 모델 기준 active 188개, consumer active 152개, official rate 100%, 필수 필드 누락 0개
  - FreeBenefitEvent 평균 점수: quality 100, freshness 100, official 96, urgency 41, reward 69
  - 무료혜택 랭킹 기준: 바로 받을 수 있는 고신뢰 혜택 126개, 첫 화면 쉬운참여 혜택 23개, 첫 화면 혜택 유형 9종, 정확 중복 0개
  - 무료혜택 운영 SLA 기준: 24시간 내 검증된 publishable 혜택 120개 이상, stale checked 0개, checkedAt 누락 0개, 공식 도메인 80개 이상
  - `benefit:category:doctor` 기준 visible active benefits 193개, official hosts 111개, no-purchase 167개, 필수 카테고리 10/10 통과
  - 공식 소스 후보 220개 이상, reachable/guarded 분리 관리

## 최근 통과한 로컬 검증

- `npm run lint`: 통과
- `npm run test:mobile-ux`: 17/17 통과
- `npm run verify:freebies`: 193/193 통과
- `npm run refresh:benefits`: 4/4 통과
- `npm run benefit:category:doctor`: 10/10 필수 무료혜택 카테고리 통과
- `npm run benefit:event:contract`: 17/17 통과
- `npm run smoke:local`: 104/104 통과
- `npm run release:prepare:reports:ci`: 27/27 통과
- `npm run release:doctor`: 191/191 통과
- `npm run qa`: 71/71 통과
- 최신 deadline 필터 작업 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run benefit:event:contract`: 17/17 통과
  - `npm run benefit:category:doctor`: 통과
  - `npm run smoke:local`: 104/104 통과
  - `npm run qa`: 72/72 통과
  - `npm run release:doctor`: 191/191 통과
  - `npm run build`: 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 경고 없이 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
- 홈 히어로 deadline URL 정리 후 추가 확인:
  - `npm run benefit:event:contract`: 17/17 통과
  - `npm run lint`: 통과
- 무료혜택 랭킹 운영 API 추가 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run smoke:local`: 110/110 통과
  - `npm run qa`: 75/75 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
- 무료혜택 랭킹 관리자 패널 작업 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run smoke:local`: 110/110 통과, 관리자 `/admin`의 `무료혜택 랭킹 리포트` 패널 포함
  - `npm run release:doctor`: 192/192 통과
  - `npm run qa`: 75/75 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
  - `npm run vercel:doctor`: 28/28 통과
  - 운영 `/api/health`: `deployment.shortCommit=518cec21`, `branch=main` 확인
  - `npm run smoke:local`: 104/104 통과
  - `npm run release:doctor`: 191/191 통과
  - `npm run build`: 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
- 무료혜택 runtimeReadiness 작업 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run benefit:event:contract`: 21/21 통과
  - `npm run build`: 통과
  - `npm run smoke:local`: 108/108 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run build:android`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run cap:sync`: 통과
- `dc7278cc` lane-specific feed guidance 작업 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run smoke:local`: 104/104 통과
  - `npm run release:doctor`: 191/191 통과
  - `npm run build`: 통과
  - 운영 `/api/health`: `deployment.shortCommit=dc7278cc`, lane-specific feed env keys 포함 확인
- `f32397ac` 문서/배포 증거 정리 후 추가 확인:
  - `npm run build:android`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run cap:sync`: 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
- `npm run build`: 통과
- `npm run build:android`: 통과
- `npm run cap:sync`: 통과
- 무료혜택 런타임 모델 게이트 작업 후 추가 확인:
  - `npm run benefit:model:doctor`: 통과, 후보 197개, active 188개, 소비자형 active 152개, 공식 링크 100%, 필수 필드 누락 0개
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run smoke:local`: 108/108 통과
  - `npm run qa`: 74/74 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
- 무료혜택 런타임 모델/스모크 계약을 `release:doctor`에 직접 연결한 뒤 추가 확인:
  - `npm run lint`: 통과
  - `npm run release:doctor`: 192/192 통과, `benefit:model:doctor`와 런타임 API 필드 smoke 계약 연결 확인
- 무료혜택 랭킹/중복 품질 게이트 작업 후 추가 확인:
  - `npm run benefit:ranking:doctor`: 통과, publishable 188개, 소비자형 152개, 정확 중복 0개
- 무료혜택 소스 축 커버리지 패널/API 작업 후 추가 확인:
  - `npm run source:breadth:doctor`: 통과, 필수 수집축 12/12 및 공식 소스 후보 217개 확인
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run smoke:local`: 108/108 통과. `/api/admin/source-breadth`, CSV, 관리자 패널 검사를 포함한다.
- 공식 소스 카탈로그 확장/운영 갱신 작업 후 추가 확인:
  - `746c8bd7`: 투썸플레이스, 뚜레쥬르, CU편의점택배 공식 이벤트 후보 추가. `source:catalog:report`, `source:breadth:doctor`, `source:live:doctor`, `source:readiness:report`, `lint`, `verify:freebies`, `refresh:benefits`, `smoke:local`, `release:doctor`, `build`, `build:android`, `cap:sync`, `android:webview:doctor`, `workspace:doctor:strict` 통과
  - `dca3aeb8`: GitHub Actions 혜택 refresh scheduler가 운영 `/api/health`와 `/api/freebies?limit=12`까지 확인하도록 강화. `cron:refresh:doctor`, `lint`, `refresh:benefits`, `verify:freebies`, `test:home-realtime`, `build`, `release:doctor`, `build:android`, `android:webview:doctor`, `cap:sync`, `workspace:doctor:strict` 통과
  - `6e743a18`: 무료혜택 런타임 모델 필수 필드와 점수 필드 게이트 강화. `benefit:model:doctor`, `lint`, `qa`, `release:doctor`, `build`, `build:android`, `android:webview:doctor`, `cap:sync`, `workspace:doctor:strict` 통과
  - `2e2dc652`: 홈 무료혜택 카드에 `검증 n분 전`과 신청 조건 배지를 노출. `lint`, `test:mobile-compact`, `benefit:event:contract`, `smoke:local` 112/112, `build`, `build:android`, `android:webview:doctor`, `release:doctor`, `cap:sync`, `workspace:doctor:strict` 통과
  - `f189a144`: 홈 무료혜택 카드의 `검증` 시각과 신청 조건 라벨이 빠지면 `smoke:local`이 실패하도록 회귀 게이트 추가. `lint`, `test:mobile-compact`, `benefit:event:contract`, `smoke:local` 112/112, `verify:freebies`, `refresh:benefits`, `release:doctor`, `qa`, `build`, `build:android`, `android:webview:doctor`, `cap:sync`, `workspace:doctor:strict` 통과
- `npm run vercel:doctor`: 운영 계약 검증에 사용. 최신 커밋 반영 여부는 GitHub Actions Vercel Production Deploy 결과와 운영 `/api/health` 응답을 함께 본다.
- 무료혜택 소스 activation health gate 작업 후 추가 확인:
  - `npm run lint`: 통과
  - `npm run source:activation:doctor`: 통과, `seed_ready`, configured feed URL 0개, activation checks 전체 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run build`: 통과
  - `npm run smoke:local`: 112/112 통과, `/api/health`의 source feed activation 필드와 추천 lane 검사를 포함한다.
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과

## CI/Vercel 상태 해석

- `f189a144` 기준 GitHub push와 Vercel Production Deploy 반영을 확인했다.
- 운영 `/api/health` 기준 `deployment.shortCommit=f189a144`, `branch=main`, `officialBenefitVisibleCount=197`, `officialBenefitFresh=true`를 확인했다.
- 운영 홈페이지 `https://www.halindosa.com/?verifiedOnly=true`는 모바일 390x844 기준 무료혜택 히어로와 검증/조건 배지, `/go/news/...` 이동 링크를 렌더링한다.
- CI 실패가 다시 발생하면 먼저 실패 job의 마지막 단계를 확인한다.
- 로컬 재현 순서:
  1. `npm run release:prepare:reports:ci`
  2. `npm run release:doctor`
  3. `npm run qa`
- Vercel 배포 성공 후 운영 웹이 최신인지 확인하려면 `https://www.halindosa.com/api/health`와 `https://www.halindosa.com/api/freebies?limit=5`의 `Cache-Control`, `requestId`, 무료혜택 수를 확인한다.

## 주요 명령

- 개발 서버: `npm run dev`
- 웹 빌드: `npm run build`
- Android 웹 번들 반영: `npm run build:android`
- Capacitor 동기화: `npm run cap:sync`
- 뉴스 혜택 수집: `npm run refresh:news`
- 무료혜택 수집: `npm run refresh:benefits`
- 뉴스 링크 검증: `npm run verify:news`
- 무료혜택 검증: `npm run verify:freebies`
- 무료혜택 카테고리 커버리지: `npm run benefit:category:doctor`
- 모바일 UX 게이트: `npm run test:mobile-ux`
- 보안 게이트: `npm run security:check`
- QA 게이트: `npm run qa`
- 릴리즈 닥터: `npm run release:doctor`
- Vercel 운영 배포 검증: `npm run vercel:doctor`
- 워크스페이스 산출물 점검: `npm run workspace:doctor:strict`

## 워크트리 주의사항

- QA, refresh, release prepare를 실행하면 루트 리포트, `docs/*REPORT*`, `reports/*.json`, `data/refreshedDeals.json`, `data/refreshedNewsDeals.json`, `data/verifiedNewsBenefitImages.json` 등이 많이 갱신된다.
- 대부분 재생성 산출물이므로 커밋 전에 의도한 파일만 선별 stage한다.
- `git add .`를 피한다.
- 빌드 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 `./.next/dev/types/routes.d.ts`로 되돌린다.
- 정상 동작 중인 Vercel, Android/Capacitor, 환경변수, Supabase 설정을 깨뜨리지 않는다.

## 다음 추천 작업

1. 새 커밋 후 CI와 Vercel Production Deploy가 최신 HEAD에서 성공하는지 확인한다.
2. `reports/`와 루트 리포트의 재생성 산출물 정책을 더 줄여 워크트리 노이즈를 낮춘다.
3. 홈 화면의 무료혜택/쿠폰/샘플/체험 이벤트 카드 밀도를 더 높이고, 공공성 혜택은 명시 필터로만 보이게 유지한다.
4. 공식 소스 feed URL이 실제로 연결되면 `news:feed:canary`가 seed fallback이 아닌 external feed 성공으로 바뀌는지 확인한다.
