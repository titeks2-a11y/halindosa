# 할인도사 현재 상태

작성 시점: 2026-06-12, Asia/Seoul

이 문서는 새 Codex 세션이 이전 긴 대화에 의존하지 않고 현재 워크트리와 실제 명령 결과만으로 이어받기 위한 핸드오프 문서다.

## 현재 기준

- Branch: `codex/12h-product-ux-growth-hardening`
- 최신 확인 HEAD: `036ca243` (`feat: expand official free benefit sources`) 기준 Vercel Production 반영 확인.
- Remote: `origin/main`, `origin/codex/12h-product-ux-growth-hardening`에 반영 대상
- 운영 URL: `https://www.halindosa.com`
- Vercel Production Deploy: `036ca243` 기준 운영 `/api/health` 반영 확인. 운영 응답은 `deployment.shortCommit=036ca243`, `branch=main`을 반환한다.
- GitHub CI: 최신 `main`/`codex/12h-product-ux-growth-hardening` push 대상. 운영 기능 상태는 `dc7278cc` 기준 확인.
- 로컬 최신 홈페이지: `http://127.0.0.1:3000/?verifiedOnly=true`
- 운영 API 최신 계약 확인:
  - `/api/home?limit=1&verifiedOnly=true`: HTTP 200
  - 응답 body `requestId` 존재
  - `X-Request-Id` 헤더 존재
  - `X-RateLimit-Remaining` 헤더 존재
  - `Cache-Control`은 no-store 계열
  - `/api/freebies?limit=5`: HTTP 200, `ok=true`, `requestId` 존재
  - 운영 홈페이지 `https://www.halindosa.com/?verifiedOnly=true`: 무료혜택 카드 DOM 렌더링 확인
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
- 공식 무료혜택 소스 카탈로그는 메가MGC커피, PAYCO, L.POINT, 신세계포인트 공식 이벤트/리워드/출석체크 후보를 추가해 217개 후보로 확장했다. `source:catalog:report`, `source:breadth:doctor`, `source:live:doctor`, `source:readiness:report`는 검색/대표몰/비공식 CTA를 허용하지 않는 기준으로 이 후보를 검사한다.
- 홈 무료혜택 히어로는 브랜드 키를 정규화해 같은 브랜드 샘플/쿠폰이 첫 화면에 반복 노출되는 문제를 줄인다.
- 홈 무료혜택 히어로는 `오늘마감`과 `마감임박`을 분리하고, 공식 무료혜택 카드 16개와 즉시 수령 카드 8개를 모바일 첫 화면 우선 영역으로 노출한다.
- 오늘마감 혜택이 0건이면 홈 대표 지표와 카테고리 바로가기에서 0건을 크게 띄우지 않고 `이번주마감` 또는 `마감임박` 혜택을 대체 노출한다. 이 정책은 `benefit:event:contract`에서 검사한다.
- `scripts/home-runtime-snapshot-doctor.mjs`는 `localhost:3000`을 먼저 확인하고, 다른 앱이 `127.0.0.1:3000`을 점유해도 할인도사 런타임 스냅샷 검증이 잘못 실패하지 않게 했다.
- `FreeBenefitEvent`는 `qualityScore`, `freshnessScore`, `officialScore`, `urgencyScore`, `rewardScore`를 함께 계산해 공식성, 최신성, 마감성, 보상 가치를 랭킹과 운영 리포트에 반영한다.
- `docs/FREE_BENEFIT_SCORING.md`에 무료혜택 노출 조건과 점수 기준을 정리했다.
- `benefit:category:doctor`를 추가해 전원증정, 선착순, 쿠폰, 무료 샘플, 무료체험, 기프티콘, 포인트/캐시백, 무료배송, 신규가입, 출석체크 카테고리별 최소 노출 수량을 출시 게이트에서 확인한다.
- `/api/benefits/events`는 `deadline=today|week|soon`을 지원하며, `/free-benefits` 화면은 `오늘마감`, `이번주마감`, `마감 임박만` 칩으로 공식 무료혜택을 마감 기준으로 좁힐 수 있다.
- 홈 무료혜택 히어로의 빠른 필터도 `deadline=today|week|soon` URL을 사용해 운영 API와 같은 마감 기준으로 이동한다.

## 현재 데이터 품질 기준

- 상품 링크:
  - 총 140개 검증 URL
  - 사용자 노출 가능 138~140개 범위
  - 검색 링크 노출 0건
  - 품절/종료 링크 노출 0건
  - hard failure 노출 0건
  - 외부몰 일시 5xx/접근보호 이슈는 고객 노출에서 숨기고 운영자 재검증 큐로 보낸다.
- 공식 혜택:
  - `refresh:news` 기준 190개 공식 혜택 노출
  - `verify:news` 기준 190/190 공식 혜택 링크 검증
  - 기본 top consumer feed는 공공정책성 혜택 0건
- 무료혜택:
  - `refresh:benefits` 기준 무료혜택 116/116, 공식 이벤트 174/174
  - `verify:freebies` 기준 193/193 visible, 검색 링크 0, 비공식 링크 0, 깨진 이미지 0
  - `verify:freebies`는 공식 도메인 111개, 브랜드 112개, 구매조건 낮은 혜택 기준도 함께 검사한다.
  - FreeBenefitEvent 기준 active official events 188개, sources 148개, hosts 109개
  - FreeBenefitEvent 평균 점수: quality 100, freshness 100, official 96, urgency 41, reward 69
  - `benefit:category:doctor` 기준 visible active benefits 193개, official hosts 111개, no-purchase 167개, 필수 카테고리 10/10 통과
  - 공식 소스 후보 217개 이상, reachable/guarded 분리 관리

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
  - `npm run smoke:local`: 104/104 통과
  - `npm run release:doctor`: 191/191 통과
  - `npm run build`: 통과
  - `npm run build:android`: 통과
  - `npm run cap:sync`: 통과
  - `npm run android:webview:doctor`: 13/13 통과
  - `npm run workspace:doctor:strict`: 재생성 산출물 0B, 통과
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
- 무료혜택 소스 축 커버리지 패널/API 작업 후 추가 확인:
  - `npm run source:breadth:doctor`: 통과, 필수 수집축 12/12 및 공식 소스 후보 217개 확인
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `npm run release:doctor`: 192/192 통과
  - `npm run smoke:local`: 108/108 통과. `/api/admin/source-breadth`, CSV, 관리자 패널 검사를 포함한다.
- `npm run vercel:doctor`: 운영 계약 검증에 사용. 최신 커밋 반영 여부는 GitHub Actions Vercel Production Deploy 결과와 운영 `/api/health` 응답을 함께 본다.

## CI/Vercel 상태 해석

- `da63cc6a` 기준 GitHub CI와 Vercel Production Deploy가 모두 성공했다.
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
