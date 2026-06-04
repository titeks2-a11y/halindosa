# 할인도사 운영 런북

## 로컬 검증

```bash
npm install
npm run lint
npm run build
npm run audit:commercial
npm run dev
npm run smoke
```

## 주요 헬스 체크

- 관리자 API 인증:
  - 운영 자동화와 CSV 다운로드는 URL에 토큰을 남기지 않도록 `Authorization: Bearer $ADMIN_EXPORT_TOKEN` 또는 `x-admin-token: $ADMIN_EXPORT_TOKEN` 헤더를 우선 사용한다.
  - 호환성 때문에 기존 `?token=$ADMIN_EXPORT_TOKEN` 쿼리 token 방식은 유지하지만, 공유 로그와 브라우저 히스토리에 남을 수 있으므로 관리자 화면 링크 확인용으로만 제한한다.
  - `x-admin-export-token`과 `x-halindosa-admin-token`도 같은 값으로 허용한다. 회귀 점검은 `npm run admin:auth:doctor`가 `reports/admin-auth.json`에 남긴다.
- 메인: `GET /`
- 특가 API: `GET /api/deals?limit=3`
- 공식 혜택 API: `GET /api/news-deals?limit=10`
- 공식 혜택 운영 API: `GET /api/admin/news-operations?token=$ADMIN_EXPORT_TOKEN`
- 운영 헬스 API: `GET /api/admin/health-readiness?token=$ADMIN_EXPORT_TOKEN`
- 일일 운영 API: `GET /api/admin/daily-operations?token=$ADMIN_EXPORT_TOKEN`
  - CSV 점검표는 `GET /api/admin/daily-operations?format=csv&token=$ADMIN_EXPORT_TOKEN`로 내려받는다.
  - `npm run daily:operations:report`는 `reports/daily-operations.json`과 `docs/DAILY_OPERATIONS_REPORT.md`를 생성하고, 검증 구매 링크, 공식 혜택, `refresh:all`, 공식 소스 준비도, cron/push, `release:doctor`를 일일 운영 큐로 묶는다.
- 실시간 특가 API: `GET /api/deals?q=노트북%20특가&sort=latest`
- 헬스체크: `GET /api/health`
  - `officialBenefitFresh`, `officialBenefitFreshnessHours`, `officialBenefitVisibleCount`, `officialBenefitReadyCategories`, `officialBenefitRefreshAllOk`, `officialBenefitProviderRiskOk`, `officialBenefitProviderDangerCount`를 함께 확인한다.
  - `officialBenefitFeedTransitionStatus`, `officialBenefitFeedReadinessRate`, `officialBenefitFeedConfiguredProviders`, `officialBenefitFeedSeedOnlyProviders`, `officialBenefitFeedRecommendedEnvKeys`로 공식 혜택 feed가 seed fallback인지, 어떤 환경변수부터 연결해야 하는지 확인한다.
  - 공식 혜택 feed가 24시간 이상 갱신되지 않았거나 필수 카테고리 10개가 모두 ready가 아니면 `refresh:all`과 `/admin` 뉴스 운영 패널을 먼저 확인한다.
- 운영 지표: `GET /api/metrics`
  - `officialBenefitProviderRisk.summary`와 `nextActions`로 공식 혜택 provider의 seed/fallback 운영, 수집 공백, 공식 링크 누락 우선순위를 확인한다.
- 공급원 상태: `GET /api/sources`
  - 상품 feed readiness와 `officialBenefitProviderReadiness`를 함께 확인해 상품 특가와 공식 혜택 feed 전환 준비도를 같은 화면에서 판단한다.
  - `officialBenefitFeedTransitionReadiness`는 provider별 `seed_fallback`/`external_feed` 모드, 필요한 env key, 허용 소스, 다음 액션을 반환한다. 외부 feed URL을 붙인 뒤 이 값과 `/admin`의 `공식 피드 전환 준비도`가 함께 갱신되는지 확인한다.
  - 운영자가 스프레드시트로 후보를 검수해야 하면 `GET /api/sources?format=csv`를 내려받는다. CSV는 `source_catalog`, `feed_transition`, `next_action` 행을 포함하며 공식 URL, 후보 provider, 우선 연결 env key, 현재 feed URL 수, 다음 액션을 한 파일로 정리한다.
- 자동 refresh cron: `GET /api/cron/refresh`
  - Vercel Cron은 `vercel.json` 기준 6시간마다 `/api/cron/refresh`를 호출한다.
  - 운영 환경에는 `CRON_SECRET`을 반드시 설정한다. 호출은 `Authorization: Bearer $CRON_SECRET`, `x-cron-secret`, 또는 관리자 `token` 중 하나가 맞아야 실행된다.
  - 로컬 점검은 `GET /api/cron/refresh?dryRun=true&token=local-admin`으로 현재 `reports/refresh-all.json` 상태를 확인한다.
  - 실제 실행은 `node scripts/refresh-all.mjs`를 호출하고 `reports/refresh-all.json`, `reports/cron-refresh.json`에 결과를 남긴다. 실패하면 JSON은 500으로 반환되며 `stderrTail`과 단계별 로그를 먼저 확인한다.
  - 운영자는 `/admin`의 `자동 refresh cron 운영` 카드와 `/api/health`의 `cronRefreshStatus`, `cronRefreshProtected`, `cronRefreshProductDealsCount` 값을 함께 확인한다.
- 상세 API: `GET /api/deals/d001`
- 가격 이력: 상세 API의 `priceHistory`, `priceInsight` 필드 확인
- 신고 API: `POST /api/reports`
- 신고 큐: `GET /api/admin/reports?token=$ADMIN_EXPORT_TOKEN`
  - 신고 큐는 서버 런타임에서 `data/dealReports.local.json`에 최대 200건까지 보관한다. 이 파일은 운영 전용 로컬 파일이며 `.gitignore`에 포함되어 GitHub에 올라가지 않는다.
  - 운영 환경에 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 있으면 같은 신고를 Supabase `deal_reports` 테이블에도 저장하고, 관리자 큐는 Supabase와 로컬 파일을 병합해 최신 200건을 보여준다.
  - Supabase `deal_reports.deal_id`는 `deals.id` FK를 사용하므로 운영 DB에 상품이 먼저 upsert되어 있어야 한다. DB 쓰기가 실패해도 로컬 파일 fallback으로 접수 UX는 유지된다.
  - `PATCH /api/admin/reports`는 `reportId`, `status`와 함께 `operationAction=hide|restore|revalidate`를 받을 수 있다. 품절, 종료, 링크 오류 신고는 `operationAction=hide`로 먼저 노출을 낮추고, 판매처 상세 링크 보강 또는 재고 확인 후 `restore`로 복구한다.
  - 신고 SLA는 `lib/reportSla.ts`의 `buildReportSlaSummary`가 계산한다. 링크 오류, 품절, 종료 신고는 6시간, 가격/정보 오류는 24시간, 기타 문의는 48시간 기준이며 `/api/admin/reports`와 `/admin`의 `SLA 우선 처리 목록`에 노출된다.
  - `SLA 초과 신고`가 1건 이상이면 운영자는 먼저 노출 숨김 또는 재검증 액션을 실행하고, 처리 후 `resolved` 또는 `dismissed`로 닫는다. 이 기준은 `npm run smoke:local`과 `npm run release:doctor`가 함께 검사한다.
  - 응답의 `storage.persistence`, `storage.localPath`, `storage.supabaseConfigured`, `operation`을 확인하면 신고 저장소와 상품 노출 override 반영 여부를 한 번에 검수할 수 있다.
- 피드 dry-run: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
- 상품 품질 CSV: `GET /api/admin/deal-quality?format=csv&token=$ADMIN_EXPORT_TOKEN`
  - provider 수집 상태, 실패 사유, 수동 숨김 ID, live probe, link validation 요약을 내려받아 검색/품절/종료 링크 노출 0건을 운영 검수한다.
  - `POST /api/admin/deal-quality`의 `hide`/`restore` 액션은 `lib/deals/operationOverrides.ts`와 `data/dealOperationOverrides.local.json` 로컬 운영 파일을 통해 현재 목록, 상세 API, `/go`, `/api/redirect` 이동에 즉시 반영되고 서버 재시작 후에도 유지된다. 이 파일은 `.gitignore`에 포함된다.
  - `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 설정된 운영 배포에서는 같은 조치를 Supabase `admin_actions`에도 기록하고, 공개 목록 생성 시 로컬 파일과 Supabase 감사 로그를 함께 읽어 서버리스 환경에서도 숨김/복구 상태를 유지한다. Supabase `deals` 테이블에 해당 `deal_id`가 먼저 upsert되어 있어야 FK 오류 없이 영구 기록된다.
  - 품절, 이벤트 종료, 다른 상품 이동 신고가 들어오면 먼저 숨김 처리하고, 올바른 `finalPurchaseUrl` 또는 공식 혜택 URL을 보강한 뒤 복구한다.
- 리다이렉트: `GET /api/redirect/d001?from=runbook`
- 제휴/판매처 fallback 상태: `GET /api/affiliate/status`
- 관리자: `GET /admin?token=$ADMIN_EXPORT_TOKEN`
- 푸시 준비 상태: `GET /api/admin/push/send?token=$ADMIN_EXPORT_TOKEN`
  - 구독/동의 준비도: `GET /api/admin/push-readiness?token=$ADMIN_EXPORT_TOKEN`
  - 파일 리포트: `npm run push:readiness:report`
    - `reports/push-readiness.json`과 `docs/PUSH_READINESS_REPORT.md`를 생성한다.
    - 출시 전 `launchStatus=dry_run_ready` 이상, `queueRows >= 30`, 관심 세그먼트 10개 이상 준비를 기준으로 본다.
  - 발송 정책 리포트: `npm run push:delivery:doctor`
    - `reports/push-delivery-policy.json`과 `docs/PUSH_DELIVERY_POLICY.md`를 생성한다.
    - live send는 `quiet hours` 22:00-07:59 KST, 토큰 수 제한, 명시 동의, dry-run-first 정책을 모두 통과해야 한다.
  - 발송 감사 리포트: `npm run push:delivery:audit`
    - `reports/push-delivery-audit.json`과 `docs/PUSH_DELIVERY_AUDIT.md`를 생성한다.
    - `push_delivery_logs`는 dry-run/live 발송 시도의 캠페인, 대상 수, 성공/실패 수, 차단 사유, 다음 발송 가능 시각만 저장하고 토큰 원문은 저장하지 않는다.
  - `/admin`의 “푸시 구독·동의 준비도”는 관심 카테고리 세그먼트, 동의/철회 체크, 큐 행, dry-run 상태를 함께 보여준다.
  - `PUSH_SEND_ENABLED=false`이면 readiness/dry-run만 제공한다.
  - 실제 FCM 발송은 `PUSH_SEND_ENABLED=true`와 `FCM_SERVER_KEY`를 서버 환경변수로 넣은 뒤 관리자 토큰으로 보호된 `POST /api/admin/push/send?token=...`에서만 실행한다. 관리자 화면에서는 “동의 받은 테스트 토큰” 확인 후에만 live test를 허용한다.
  - `push_notification_queue`는 `source_kind`, `campaign_id`, `benefit_id`, `source_names`, `dry_run_only`를 포함한다. 공식 혜택 알림은 `source_kind=official_benefit`, 상품 알림은 `source_kind=product_deal`로 구분한다.
  - 관리자 dry-run 응답의 `deliveryAudit.eventId`는 향후 `push_delivery_logs.request_id` 또는 운영 로그 request id와 함께 추적한다.
- CSV export: `GET /api/admin/export?token=$ADMIN_EXPORT_TOKEN`
  - 링크 검수 작업에 필요한 `linkStatus`, `linkType`, `reviewPriority`, `reviewAction`, `reviewReason`, `purchaseConfidence`, `checkedAt`, `finalPurchaseUrl` 필드를 함께 내보낸다.
  - 운영자는 CSV를 스프레드시트로 열어 우선 검수 상품부터 실제 상품 상세 URL을 보강하고, 다음 피드 import 전에 원본 데이터의 `productUrl` 또는 `finalPurchaseUrl`에 반영한다.
- 이미지 보강 큐: `GET /api/admin/image-queue?token=$ADMIN_EXPORT_TOKEN`
  - JSON과 CSV 모두 `currentImageUrl`, `sourceName`, `sourceUrl`, `finalPurchaseUrl`, `imageSearchUrl`, `imageField`, `imageSourceHint`를 제공한다.
  - JSON은 `sourcingPlan`으로 공개 운영 목표 60%, 목표까지 남은 보강 수, 주간 보강 목표, 다음 처리 배치 ID를 함께 제공한다.
  - `/admin`의 “판매처별 피드 보강 우선순위”는 판매처별 fallback 규모와 피드 imageUrl 확보 우선순위를 보여준다.
  - 운영자는 `finalPurchaseUrl`에서 판매처 대표 이미지를 확인하고, 필요하면 `imageSearchUrl`로 후보 이미지를 찾은 뒤 원본 피드의 `imageUrl` 필드에 반영한다.
  - 카테고리 fallback은 화면 안정용이며 운영 ready 이미지로 보지 않는다. 신규 파트너 피드는 `imageUrl` 없이 dry-run을 통과할 수 없다.
  - 공개 운영 전 목표는 명시 실상품 이미지 60% 이상이다. 현재 25% 자동 게이트는 회귀 방지 최소선이며, 60%는 운영 보강 목표로 관리한다.
  - `npm run test:images`는 명시 실상품 이미지 커버리지 25% 미만이면 실패한다. 신규 상품을 많이 추가할 때는 이미지 없는 상품만 늘려 이 기준을 떨어뜨리지 않는다.
  - `IMAGE_QUALITY_REPORT.md`의 `Image Backlog`는 fallback 상품별 판매처, 카테고리, 이미지 후보 검색 URL을 남긴다. 출시 직전에는 이 표의 상위 상품부터 실상품 이미지를 보강한다.
  - `npm run image:backlog:report`는 전체 fallback 이미지 보강 큐를 `IMAGE_BACKLOG.csv`, 이번 주 실행 배치를 `IMAGE_BACKLOG_NEXT_BATCH.csv`, 판매처별 imageUrl 요청서를 `IMAGE_BACKLOG_MALL_REQUESTS.csv`, JSON/문서를 `IMAGE_BACKLOG.json`, `docs/IMAGE_BACKLOG_REPORT.md`로 생성한다.
  - 이미지 큐 JSON/CSV는 `sourcingPriority`, `priorityReason`, `nextBatchDeals`, `mallRequestRows`를 포함한다. 운영자는 먼저 `IMAGE_BACKLOG_NEXT_BATCH.csv`의 주간 배치 상위 후보를 처리하고, backlog가 많은 판매처는 `IMAGE_BACKLOG_MALL_REQUESTS.csv`로 제휴/운영 피드 담당자에게 `imageUrl` 또는 `thumbnail` 확보를 요청한다.
- 공식 혜택 feed 운영:
  - 새 공식 뉴스/이벤트/쿠폰 feed는 `docs/news-feed-contract.md`의 JSON 계약을 따라야 한다.
  - feed URL은 쉼표, 세미콜론, 줄바꿈 또는 JSON 배열로 입력할 수 있고, URL query 안의 쉼표는 그대로 유지된다. 긴 운영 URL은 줄바꿈이나 JSON 배열 형식을 권장한다.
  - 동일한 feed URL 파서는 런타임 provider, `refresh:*` 스크립트, `/api/sources`, `feed:transition:report`, `source:catalog:report`, production 상품 feed에 모두 적용된다. 관리자 화면의 feed URL 수와 실제 수집 대상 수가 같은 기준으로 계산되는지 함께 확인한다.
  - `data/newsFeed.sample.json`을 복제해 `items`, `deals`, `newsDeals`, `events`, `coupons`, `benefits` 중 하나로 배열을 반환한다.
  - 사용자에게 열리는 `finalUrl`은 공식 이벤트, 공식 쿠폰, 공식 구매 또는 공식 혜택 안내 페이지여야 하며, 뉴스 기사/검색 결과/커뮤니티 글은 `sourceUrl`로만 남긴다.
  - 운영자가 feed URL을 `.env`의 `DEAL_NEWS_FEED_URLS`, `DEAL_EVENT_NEWS_FEED_URLS`, `OFFICIAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`에 넣은 뒤 `npm run news:feed:doctor && npm run test:news-feed-errors && npm run refresh:news && npm run verify:news && npm run news:freshness:doctor && npm run refresh:all`을 실행한다.
  - `npm run feed:transition:report`는 `reports/feed-transition.json`과 `docs/FEED_TRANSITION_REPORT.md`를 생성한다. 운영자는 이 파일로 provider별 `seed fallback`/`공식 feed 연결`, 우선 env key, launch-blocking 여부를 확인하고 다음 feed 연결 순서를 정한다.
  - 환경변수로 연결한 공식 feed가 HTTP 오류, timeout, JSON/RSS 파싱 오류를 내면 `npm run verify:news`와 `npm run refresh:all`은 실패한다. seed fallback은 미연결 provider용 안전장치이며, 설정된 운영 feed 장애를 덮어 성공 처리하지 않는다. `npm run test:news-feed-errors`는 이 실패 게이트를 정상 feed/깨진 feed 양쪽으로 재현한다.
  - feed 오류가 나면 `reports/news-deals.json`의 `gates.configuredFeedErrors`에서 provider, feed URL 수, 오류 메시지를 확인하고 해당 feed URL 또는 포맷을 고친 뒤 다시 `npm run refresh:news && npm run verify:news`를 실행한다.
  - 검증 실패, 종료, 비공식 URL, 검색 URL은 `reports/news-deals.json`의 hidden/failed 큐로만 남고 사용자 화면에는 노출하지 않는다.
  - 공식 혜택 운영 리포트는 6시간마다 갱신을 권장하고, 24시간 이상 갱신되지 않으면 출시 전 갱신 필요 상태로 본다.
  - `npm run news:freshness:doctor`는 `reports/news-freshness.json`과 `docs/NEWS_FRESHNESS_REPORT.md`를 생성한다. 사용자 노출 공식 혜택의 `lastCheckedAt`, 종료일, 14일 이내 종료 큐, 필수 카테고리 커버리지, 공식 소스 후보 수를 확인한다.
  - `/admin`의 `뉴스 수집 현황`과 `공식 혜택 수동 운영` 패널에서 `Provider 위험도`, `신선도 운영`, `만료 임박 대체 큐`, `다음 refresh 권장`, `다음 운영 액션`을 확인한다.
  - `/api/admin/news-operations?format=csv`는 `renewal_queue`와 `watch_queue` 행을 포함한다. 14일 내 종료 혜택은 같은 카테고리의 공식 소스 후보를 준비하고, 30일 내 혜택은 감시 큐로 매일 확인한다. 각 행은 `source:onboarding:plan`의 추천 대체 소스 공식 URL과 권장 환경변수도 함께 내려보낸다.
  - `/admin`의 `공식 피드 전환 준비도`는 `news`, `event_news`, `official_event`, `public_coupon` provider가 seed fallback인지 공식 feed 연결 상태인지 보여준다. 상용 운영 전에는 우선순위가 높은 `OFFICIAL_EVENT_FEED_URLS`, `DEAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`부터 공식 API/RSS/제휴 JSON feed를 연결한다.
  - `npm run source:catalog:report`는 `data/officialSourceCatalog.json`을 검증해 `reports/official-source-catalog.json`, `reports/official-source-catalog.csv`, `docs/OFFICIAL_SOURCE_CATALOG.md`를 생성한다. 운영자는 이 문서와 CSV에서 카테고리별 공식 소스 후보, provider별 후보, 우선 연결할 환경변수, 허용/차단 사용 범위를 확인한다.
  - `npm run source:live:doctor`는 공식 소스 후보 URL을 짧게 확인해 `reports/official-source-live-check.json`, `reports/official-source-live-check.csv`, `docs/OFFICIAL_SOURCE_LIVE_CHECK.md`를 생성한다. 이 리포트는 무단 크롤링이 아니라 접근 가능, WAF/권한 보호, 404/410 교체 필요 상태를 분류하는 non-strict 운영 점검이다.
  - `npm run source:onboarding:plan`은 카탈로그와 live 점검 결과를 합쳐 `reports/source-onboarding-plan.json`, `reports/source-onboarding-plan.csv`, `reports/source-onboarding-env-template.env`, `docs/SOURCE_ONBOARDING_PLAN.md`를 생성한다. 이 파일은 공식 API/RSS/제휴 feed를 어느 소스부터 연결할지, guarded 소스는 어떤 담당자 확인이 필요한지 TOP10 우선순위, guardrail, env key별 후보 수와 복사 가능한 feed 템플릿으로 정리한다.
  - 운영자가 환경변수 초안을 받아야 하면 `GET /api/admin/source-onboarding?format=env`를 내려받는다. 이 템플릿에는 `OFFICIAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`, `DEAL_EVENT_FEED_URLS`, `DEAL_EVENT_NEWS_FEED_URLS`, `DEAL_NEWS_FEED_URLS`별 공식 후보와 접근/보호 상태가 포함되며, 검색 결과·커뮤니티 원문·블로그·쇼핑몰 메인 URL을 feed로 넣지 말라는 가드레일을 함께 제공한다.
  - 운영 feed 환경변수를 추가하거나 수정한 뒤에는 `npm run source:feed-env:doctor`를 먼저 실행한다. 이 명령은 `DEAL_NEWS_FEED_URLS`, `DEAL_NEWS_RSS_URLS`, `DEAL_EVENT_NEWS_FEED_URLS`, `OFFICIAL_EVENT_FEED_URLS`, `DEAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`에 들어간 URL이 HTTPS, 공식 소스 카탈로그 host 또는 `HALINDOSA_APPROVED_FEED_HOSTS`, JSON/RSS/Atom/API/feed endpoint인지 확인하고, 검색 결과·커뮤니티·블로그·HTML 랜딩 페이지를 차단한다. 리포트는 `reports/source-feed-env-readiness.json`과 `docs/SOURCE_FEED_ENV_REPORT.md`에 민감 query 없이 저장된다.
  - `npm run source:readiness:report`는 공식 소스 카탈로그, live 접근성, 온보딩 큐, feed env 안전성, 공식 혜택 노출, `refresh:all` 결과를 합쳐 `reports/source-readiness.json`과 `docs/SOURCE_READINESS_REPORT.md`를 생성한다. `/admin`의 `공식 소스 통합 준비도` 패널과 `GET /api/admin/source-readiness`, `GET /api/admin/source-readiness?format=csv`에서 같은 내용을 확인하고, 검색 결과·커뮤니티 원문·HTML 랜딩 페이지가 운영 feed에 들어가지 않는지 출시 전에 한 번 더 점검한다.
  - `/admin`의 `공식 소스 live 접근성` 패널과 보호된 `GET /api/admin/source-live`, `GET /api/admin/source-live?format=csv`로 같은 리포트를 운영 화면과 스프레드시트에서 확인한다.
  - live check에서 `reachable`은 승인 feed 또는 공식 페이지 매핑 후보로 유지하고, `guarded`는 공식 API/RSS/제휴 feed 또는 담당자 제공 데이터로 연결한다. `stale_or_removed`는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 쓰지 않는다.
  - `/api/sources`의 `officialSourceCatalog` 요약은 공식 feed 후보 수, 고우선순위 후보, 카테고리/provider 커버리지, thin category, 후보별 공식 URL, 허용/차단 사용 범위, 다음 연결 env key를 반환한다. 공식 feed를 붙이기 전에는 이 값이 10개 필수 카테고리별 최소 2개 후보와 4개 provider를 모두 채우는지 먼저 본다.
  - 스프레드시트 검토가 필요하면 `/api/admin/news-operations?format=csv` 또는 관리자 화면의 `Provider 위험도 CSV` 버튼으로 provider risk, 숨김/종료/공식 링크 누락, 실패 사유, 최근 로그를 내려받는다.
  - CSV의 `feed_transition` 행은 provider별 허용 소스, 필요한 환경변수, 현재 feed URL 수, 다음 액션을 포함한다. 공식 feed URL을 추가한 뒤에는 `npm run source:catalog:report && npm run source:live:doctor && npm run source:onboarding:plan && npm run source:feed-env:doctor && npm run source:readiness:report && npm run news:feed:doctor && npm run refresh:all && npm run smoke:local && npm run release:doctor`를 순서대로 실행한다.
  - `Provider 위험도`가 `즉시 점검`이면 실패/오류/공식 링크 누락을 먼저 정리하고, `수집 대기` 또는 `seed 운영`이면 상용 운영 전 공식 API/RSS/제휴 feed 연결 후보를 보강한다.
  - stale 또는 due 상태이면 `npm run refresh:all && npm run health:readiness`를 실행한 뒤 `npm run smoke:local && npm run release:doctor`로 회귀를 확인한다.
- 운영 헬스 리포트:
  - `npm run refresh:all && npm run health:readiness`를 실행하면 `reports/health-readiness.json`과 `docs/HEALTH_READINESS_REPORT.md`가 생성된다.
  - 이 리포트는 상품 140개 이상, 검증 구매 링크 99% 이상, 검색 링크 0개, 품절/종료 노출 0개, 공식 혜택 25개 이상, 필수 10개 공식 혜택 카테고리별 2건 이상, provider 즉시 점검 0개, 공식 소스 통합 준비도 통과, `refresh:all` 성공, 24시간 이내 리포트 신선도를 함께 검사한다.
  - `npm run qa`, `/admin`의 `운영 헬스 리포트`, `/api/admin/health-readiness`, `npm run release:doctor`도 이 리포트의 존재와 수치를 확인하므로, 출시 직전에는 `docs/HEALTH_READINESS_REPORT.md`가 PASS인지 먼저 확인한다.
- 일일 운영 리포트:
  - `npm run daily:operations:report`를 실행하면 `reports/daily-operations.json`과 `docs/DAILY_OPERATIONS_REPORT.md`가 생성된다.
  - 이 리포트는 검색 링크 노출 0건, 품절/종료 상품 노출 0건, 공식 혜택 25개 이상, `refresh:all` 성공, 공식 소스 launch gate 통과, cron/push 준비, `release:doctor` 통과를 오늘 운영자가 볼 카드와 우선 처리 큐로 묶는다.
  - `/admin`의 `일일 운영 리포트` 패널과 `/api/admin/daily-operations`, `/api/admin/daily-operations?format=csv`에서 같은 내용을 확인한다. 검색 결과, 대표몰, 커뮤니티 원문, 블로그, 품절/종료 링크가 큐에 보이면 노출 전에 숨김 또는 URL 보강부터 처리한다.
- 피드 dry-run import: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
  - 신규/보강 피드는 `affiliateUrl` → `finalPurchaseUrl` → `productUrl` → `purchaseUrl` → `link` → `originalUrl` → `searchUrl` 순서로 실제 구매 이동 URL을 판정한다.
  - `linkSummary.verified`와 `linkSummary.needsReview`를 확인해 출시 전 실제 상품 상세 URL 비율을 관리한다.
  - 검색 결과 fallback, 쇼핑몰 메인, 커뮤니티/placeholder URL, 중복 externalId, 같은 판매처의 중복 상품명은 `rows[].status = "needs_fix"`로 돌려준다. 운영 반영 전 모든 행이 `ready`인지 확인한다.
  - 관리자 화면의 붙여넣기 dry-run 패널은 `행별 검수 결과`, `ready 행`, `needs_fix 행`, `수정 필요 필드`를 함께 표시한다. `needs_fix` 행은 `primaryUrlField`와 사유를 먼저 고친 뒤 다시 dry-run을 실행한다.
  - dry-run 통과 행은 `readyItems`로, 수정 필요 행은 `fixReport.rows`로 내려온다. 관리자 화면의 `ready JSON 내보내기`와 `needs_fix 리포트 내보내기`를 사용해 바로 운영 피드 후보와 보강 리포트를 분리 저장한다.

## 자동 smoke test

개발 서버가 실행 중인 상태에서 아래 명령으로 핵심 상업화 경로를 한 번에 확인합니다.

```bash
npm run smoke
```

다른 주소를 검증하려면 `SMOKE_BASE_URL`을 지정합니다.

```bash
SMOKE_BASE_URL=https://example.com npm run smoke
```

검증 범위:

- 메인 페이지
- 특가 목록/상세 API
- 헬스체크/운영 지표 API
- 신고/트래킹 API
- 제휴 리다이렉트 URL 파라미터
- 더미 또는 커뮤니티 링크는 운영 노출 전 차단하고 링크 검수 큐에서 공식 상세 URL로 보강
- CSV export
- sitemap/robots/manifest

## 고급 Harness Loop

출시 후보 또는 큰 UI/데이터 변경 후에는 아래 명령을 실행합니다.

```bash
npm run harness
```

하네스는 다음 순서로 실행합니다.

1. lint
2. build
3. verified purchase link 검사
4. 외부 링크 새 탭/보안 검사
5. 상품 이미지, 전체 이미지 backlog, 이미지 운영 큐 검사
6. 검색 alias 품질 검사
7. UI 규칙 검사
8. 모바일 UX compact first-screen 검사
9. SEO metadata/structured data 검사
10. 정적 성능 예산 검사
11. 로컬 smoke
12. release doctor

결과는 `docs/HARNESS_REPORT.md`에 남습니다. 모바일 UX 결과는 `MOBILE_UX_REPORT.md`, 성능 예산은 `docs/PERFORMANCE_REPORT.md`에 별도로 기록됩니다.

UI 규칙은 하단 탭 4개 유지, 무료혜택/알림/찜 단독 탭 제거, 금지 href 차단, 구매 링크 새 탭 정책, 검증 링크 기본 노출, 마이페이지 개발 문구 제거를 확인합니다.

모바일 UX 규칙은 하단 safe-area padding, compact 검색창, 홈 검색 중복 방지, 카테고리 가로 칩, 쇼핑몰/가격/혜택 compact filter rail, compact 상품 카드, 하단 탭을 가리지 않는 토스트 위치, `오늘 바로 볼 특가` 레일의 snap scroll, 오른쪽 fade, `옆으로 넘기기` 신호를 확인합니다. release doctor는 `test:mobile-ux`가 `qa`와 harness에 계속 포함되어 있고 `MOBILE_UX_REPORT.md`가 10개 게이트를 담는지 검사합니다.

실기기 QA는 `npm run device:qa:manifest`로 `DEVICE_QA_MANIFEST.json`과 `docs/DEVICE_QA_MANIFEST.md`를 먼저 생성한 뒤 진행합니다. 이 매니페스트는 APK/AAB, 모바일 UX 리포트, 스토어 스크린샷 매니페스트, 대상 기기, 구매 링크 샘플을 한 번에 묶고, 실제 기기 확인 결과는 `docs/device-qa-record-template.md`에만 기록합니다.

SEO 규칙은 root metadata, Open Graph, canonical, manifest, sitemap, robots, 상품 상세 metadata, Product JSON-LD 구조화 데이터를 확인합니다.

## 검색/링크 검증 운영

- 검색 로직은 `lib/deals/search.ts`의 `dealMatchesSearch`를 기준으로 한다.
- 상품명, 브랜드, 쇼핑몰명, 카테고리, 혜택 유형, 태그, 혜택 요약을 함께 검색한다.
- 한글 띄어쓰기 차이는 정규화한다. 예: `애플 워치`는 `애플워치` 상품과 매칭되어야 한다.
- 생활형 검색어는 동의어를 함께 적용한다. 예: `생필품`은 생활용품/생활필수/물티슈/세제/생수 계열과 매칭하고, `무배`는 무료배송/로켓배송/네멤무료 계열과 매칭한다.
- 신규 카테고리나 혜택 유형을 추가할 때는 사용자가 실제로 입력할 짧은 표현을 `data/searchAliases.json`에 함께 넣고 `scripts/smoke.mjs` 또는 `scripts/search-quality-doctor.mjs`에 검색 검증을 추가한다.
- `npm run search:doctor`는 생활형 검색어 43개가 실제 상품 DB에 충분히 매칭되는지 검사한다. 홈의 `highIntentSearchKeywords`도 함께 읽어 추천 검색어가 `data/searchAliases.json` key와 필수 검색 검증 목록에 모두 포함되는지 확인한다. 상품 데이터를 늘린 뒤 이 명령이 실패하면 상품명/태그/카테고리 또는 alias를 함께 보강한다.
- 검색어가 있는 홈 화면은 `검색 결과 빠른 분류`에서 많이 나온 쇼핑몰, 가까운 카테고리, 혜택 유형을 보여준다. 이 칩들은 select 메뉴를 열지 않고도 검색 결과를 한 번 더 좁히는 모바일 우선 탐색 장치다.
- `결과 바로 판단 카드`는 빠른 분류 결과를 판매처, 카테고리, 혜택 유형, 구매처 확인 기준으로 다시 압축한다. 결과 그룹 계산을 바꾸면 이 카드가 빈 값만 보여주지 않고 필터 상태를 실제로 바꾸는지 확인한다.
- 홈 상단의 `빠른 상품 검색` 패널과 하단 상세 필터는 같은 검색 상태를 공유한다.
- 홈 상단 검색창의 `추천 검색어` 칩은 최근 검색어, 생활형 고의도 검색어, 인기 검색어를 합쳐 만든다. 추천어를 누르면 `selectSearchKeyword`를 통해 검색어와 URL query 상태가 함께 갱신되어 새로고침 후에도 같은 결과가 유지되어야 한다.
- 검색 입력은 `type="search"`와 모바일 검색 키 힌트를 유지하고, 검색어 해제 버튼/칩과 결과 수 `aria-live` 상태가 함께 동작해야 한다.
- 검색 alias를 추가할 때는 홈 추천 검색어에 노출할 가치가 있는지 함께 판단한다. 생수, 물티슈, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 화장지, 청소포, 김자반, 김치, 키친타월, 참치, 가글, 콜라, 탈취제, 단백질바, 새우깡, 로켓, 지마켓, 배달쿠폰, 커피쿠폰, 라면, 햇반, 세제, 선크림, 유산균 같은 고의도 키워드는 `highIntentSearchKeywords`, `data/searchAliases.json`, `requiredSearches`, `smoke:local`을 같이 갱신한다.
- 검색 결과가 없을 때는 `검색 결과 없음 복구` 영역이 보여야 한다. 이 영역은 추천 검색어 재검색 버튼과 실제 구매 링크가 확인된 검증 특가 3개를 함께 제공해 사용자가 빈 화면에서 이탈하지 않고 다시 탐색할 수 있게 한다.
- `홈 탐색 바로가기`는 전체상품, 오늘인기, 무료배송, 마감임박, 구매처확인 버튼으로 상품 목록 빠른 스캔 영역까지 스크롤한다. 홈 설명 섹션이 늘어나도 이 바로가기는 유지되어야 한다.
- 여러 단어가 붙은 검색어는 짧은 key를 포함한다는 이유만으로 넓게 확장하지 않는다. 예를 들어 `치킨쿠폰`은 `치킨`이 포함되어도 일반 배달 쿠폰 전체가 아니라 치킨/BHC 계열 결과를 우선해야 한다.
- 홈 상단의 `검색 결과 핵심 요약`은 현재 조건의 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 보여준다. 상품 DB나 정렬 로직을 바꾼 뒤 이 요약이 비거나 깨지면 사용자가 첫 화면에서 판단할 근거가 사라진 것이다.
- `검색 결과 추천 판단`은 현재 결과에서 구매처 확인, 마감 임박, 무료배송, 핫딜, 할인율순 중 사용자가 먼저 눌러볼 기준을 한 번에 제안한다. 검색/필터 로직을 바꾸면 이 판단 바가 빈 문구를 보이거나 실제 필터 상태와 어긋나지 않는지 확인한다.
- 적용된 조건 칩은 개별 해제가 가능해야 한다. 검색어, 카테고리, 쇼핑몰, 가격대, 혜택 유형, 정렬 조건을 바꿀 때 `activeFilterChips`와 `removeActiveFilter`가 함께 갱신되는지 확인한다.
- `현재 결과 빠른 좁히기`는 상품 목록 바로 앞에서 현재 결과 기준 쇼핑몰, 카테고리, 혜택 유형, 구매처 확인, 무료배송, 마감임박 조건을 다시 노출한다. 상품 목록 구조를 바꿀 때 `listRefinementChips`가 빈 상태나 현재 필터와 충돌하지 않는지 확인한다.
- 상품 목록 위의 `상품 목록 빠른 스캔`은 현재 결과에서 구매처 확인, 무료배송, 핫딜 조건을 토글하고 낮은 가격 후보/할인율 최고 정렬을 바로 적용한다. 검색/필터 코드를 바꾼 뒤 이 버튼들이 URL 상태와 결과 목록을 깨지 않고 같은 화면에서 작동하는지 확인한다.
- `smoke:local`은 조합 검색을 함께 검사한다. 생수+구매처 확인+무료배송+가격순은 검증 링크와 무료배송, 가격 오름차순을 확인하고, 지마켓+쇼핑몰+할인율순은 판매처와 할인율 내림차순을 확인하며, 생활용품+물티슈+1만원 미만+구매처 확인은 가격대와 검증 링크를 확인한다.
- `현재 목록 가격 비교`는 현재 결과에서 가장 낮은 가격, 할인율 최고, 절약액 큰 상품, 마감 먼저 볼 상품을 계산한다. 상품 데이터 필드를 바꾼 뒤 이 영역이 빈 상품이나 종료/품절 상품을 먼저 열지 않는지 확인한다.
- 홈 상단의 `카테고리 바로가기` 칩은 `dealChannels`와 `categoryCounts`를 기반으로 하며, 상품 수가 없는 세부 카테고리는 첫 화면 노출에서 제외한다.
- 홈 첫 화면의 `오늘 바로 볼 특가` 레일은 현재 검색/필터 결과 중 검증된 구매 링크 상품을 우선 노출한다. 모바일에서는 snap scroll, 오른쪽 fade, `옆으로 넘기기` 신호가 함께 보여야 하고, 상품 DB를 늘린 뒤 이 레일이 비면 검색/필터 또는 링크 검증 기준이 과하게 좁아진 것이다.
- 홈/카테고리/찜 목록은 `QuickDealCard`를 사용한다. 이 카드는 모바일 상품 탐색용이므로 4:3 상품 이미지, 몰명, `가격 요약`, `구매 전 한눈에` 링크/배송/마감 요약, 배송, 찜, 공유, 구매하기를 먼저 보여주고, 신고/조건 상세는 상세 페이지와 신고 페이지에서 처리한다.
- 홈의 `심화 혜택 탐색`은 접힘 영역으로 유지한다. 상품 목록 접근성을 위해 기본 화면은 검색/빠른 필터/즉시 비교 상품을 우선하고, 혜택 브리핑·개인화·쇼핑몰별 탐색은 필요할 때 펼쳐보는 구조가 정상이다.
- 홈의 `상세 필터와 결과 분석`도 접힘 영역으로 유지한다. 고급 필터는 보존하되 기본 화면에서는 상품 목록 앞 빠른 좁히기와 가격 비교 카드가 바로 이어져야 한다.
- `상품 목록 적용 조건` 바는 접힌 고급 필터 바깥에 있어야 한다. 사용자가 상품 목록 앞에서 검색어, 카테고리, 쇼핑몰, 가격대, 정렬, 무료배송, 구매링크 확인 조건을 바로 해제할 수 있어야 한다.
- 홈 화면 검색 상태는 URL query parameter로 유지된다. 배포 후 `/?q=애플%20워치`처럼 직접 진입해도 같은 결과가 나와야 한다.
- 탐색 버튼은 내부 `#all-deals` 앵커나 `scrollIntoView`를 쓰지 않고 필터 상태만 바꾼다. 화면 이동은 사용자가 직접 스크롤하도록 두어 상품 카드 클릭 중 갑작스러운 점프가 없어야 한다.
- `npm run verify:links`는 `data/mockDeals.ts`의 전체 상품 ID와 `data/verifiedPurchaseLinks.ts`의 실제 구매 URL 매핑을 비교한다.
  - 검색/카테고리/커뮤니티/품절/종료/공식 혜택 URL 판정 기준은 `data/linkQualityPolicy.json`이 단일 기준이다. 새 쇼핑몰, 공식 이벤트, 제휴 피드 URL 패턴을 추가할 때는 이 파일을 먼저 갱신하고 `npm run verify:links`, `npm run verify:products`, `npm run refresh:deals`, `npm run release:doctor`를 순서대로 실행한다.
  - 검증 링크는 URL뿐 아니라 `checkedAt`, `source`, `evidence`, 도메인 다양성까지 검사한다. 상품을 추가할 때 검수 근거가 없으면 QA에서 실패해야 한다.
  - 검증 스크립트는 커뮤니티, placeholder, 쇼핑몰 메인, 검색/카테고리 URL을 실패로 처리한다.
  - 검증 스크립트는 상품 상세 URL과 공식 혜택/이벤트 URL을 분리해 집계한다. 상품 상세 신호가 없는 공식 이벤트성 혜택은 evidence에 공식 이벤트, 쿠폰, 초대권, 멤버십 등 검수 근거가 있어야 통과한다.
  - `npm run link:policy:regression`은 실제 상품 상세 URL, 쇼핑몰 검색 URL, 대표몰 홈, 커뮤니티 원문, 위험 프로토콜, 품절/판매종료 문구, 공식 이벤트 URL 샘플을 같은 정책으로 검사한다. 결과는 `reports/link-quality-regression.json`에 저장되며 `samplePassed`, `exposedSearchLinks`, `exposedSoldOutLinks`, `badExposedItems`가 출시 전 모두 안전해야 한다.
  - `reports/link-validation.json`은 `policy.source`, `httpStatusSummary`, 검색 링크 수, 품절/종료 신호 수, hidden 처리 수와 상품별 `auditedItems`를 기록한다. 각 감사 행은 `title`, `mallName`, `category`, `source`, `sourceName`, `originalUrl`, `finalUrl`, `affiliateUrl`, `eventUrl`, `linkType`, `availability`, `validationStatus`, `validationReason`, `lastCheckedAt`, `priorityScore`, `isHidden`을 포함해야 한다. Play Store 제출 전에는 `launchGate.passed=true`, `actual.exposedSearchLinks=0`, `actual.exposedSoldOutLinks=0`, `actual.exposedBrokenLinks=0`, `actual.exposedInvalidUrls=0`, `visibleDeals=140` 이상을 확인한다.
  - `npm run qa`는 non-strict `npm run verify:links:live`를 포함해 Windows에서도 동일하게 redirect, 404, 410, 5xx, timeout, 접근 차단 신호를 `reports/link-validation.json`에 기록한다. `liveProbeReviewSummary.hardFailureCount`, `transientNetworkCount`, `liveProbeReasonCounts`, `liveProbeHostFailureCounts`를 먼저 확인해 실제 조치가 필요한 실패, 일시 네트워크 신호, 쇼핑몰 접근 보호를 분리한다. `--strict`는 live probe 실패를 릴리즈 차단으로 보고, `--body`는 작은 응답 본문에서 품절/판매종료 문구까지 확인한다.
  - `403`, `429`, `robots_or_access_blocked`는 쇼핑몰의 자동 접근 보호 정책일 수 있으므로, 그 자체만으로 상품을 품절/종료 처리하지 않는다. 대신 `/admin`의 `라이브 실패 사유 분포`와 `reports/exposure-policy.json.liveProbeFailureReasonCounts`에서 사유를 확인하고, 검색 링크·대표몰 이동·품절 문구·404/410이 함께 있을 때만 숨김 또는 URL 보강 대상으로 본다.
  - 라이브 검증 후에는 `npm run verify:products && npm run exposure:doctor`를 다시 실행해 `reports/product-quality.json`, `reports/exposure-policy.json`, `/api/admin/exposure-policy`에 live probe 요약, 실패 사유 분포, 상품별 감사 행이 함께 반영되도록 한다.
  - `reports/product-quality.json`은 같은 정책의 `exposurePolicy`를 기록하고 `/api/deals` 노출 조건과 리포트 조건이 어긋나면 `verify:products`에서 실패한다.
  - `npm run exposure:doctor`는 `reports/exposure-policy.json`을 생성한다. 운영자는 여기서 `badExposedItems=0`, `searchLinksExposed=0`, `soldOutExposed=0`을 확인한 뒤 신규 피드 반영 또는 스토어 제출을 진행한다.
- `npm run catalog:doctor`는 전체 상품 수 140개 이상, 판매처 수, 필수 카테고리별 최소 5개, 필수 혜택 유형별 최소 5개, 검증 구매 링크 커버리지를 함께 검사한다. 상품 ID 순번, 중복 ID, 같은 판매처의 중복 상품명, 정상가/할인가/할인율 범위, 태그 2개 이상도 함께 확인한다.
- `npm run catalog:report`는 `docs/catalog-quality-report.md`를 갱신한다. 상품을 대량 추가한 뒤 이 보고서에서 카테고리 5개 미만 영역, 혜택 유형 5개 미만 영역, 판매처/도메인 쏠림을 확인한다.
- 신규 상품을 많이 추가한 뒤 `catalog:doctor`가 실패하면 상품 수만 늘린 것이 아니라 카테고리/혜택/판매처 균형이 무너진 것이므로 운영 피드를 다시 조정한다.
- `npm run purchase:navigation:doctor`는 홈, 상세, 찜, 무료혜택 화면의 구매 CTA가 `/go/[dealId]`를 거쳐 웹 새 탭 또는 Capacitor Browser로 열리는지 검사한다.
- `npm run smoke:local`은 `/api/deals?limit=150`으로 전체 140개 이상 상품의 링크 상태, 새 탭 이동 대상, 검증 구매 URL, 신규 seed 리다이렉트 호스트를 함께 확인한다.
- `npm run detail:navigation:doctor`는 상품 카드, 최근 본 상품, 찜/알림/무료혜택 등 고객이 누르는 특가 상세 링크가 현재 화면을 빼앗지 않고 새 탭으로 열리며 `noopener noreferrer`를 유지하는지 검사한다.
- `npm run navigation:doctor`는 `app`과 `components` 전체에서 `href="#"`, `javascript:void`, `target="_blank"`의 `rel` 누락, `/deals/[id]` 상세 링크의 현재 탭 이동, `/go/[dealId]` 구매 링크의 새 탭 정책 누락을 한 번 더 검사한다.
- `npm run home:url-state:doctor`는 홈 검색어, 카테고리, 쇼핑몰, 정렬, 무료배송, 핫딜, 마감임박, 구매링크 확인, 가격대, 혜택 유형 필터가 URL에 저장되고 새로고침 후 복원되는지 검사한다.
- `npm run search:doctor`는 라면, 햇반, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 멀티탭, 화장지, 청소포, 김자반처럼 구매 의도가 뚜렷한 검색어가 넓은 카테고리 단어로 과도하게 확장되지 않고 제품명/브랜드/태그 중심으로 매칭되는지 검사한다.
- `npm run home:list-scan:doctor`는 상품 목록 빠른 스캔 버튼이 구매처 확인, 무료배송, 핫딜, 낮은 가격, 할인율 정렬 상태와 연결되어 있는지 검사한다. `홈 탐색 바로가기`, `deal-list` 앵커, `현재 목록 가격 비교` 문구와 절약액/마감 후보 UI도 함께 확인한다.
- 구매 이동 버튼은 `/go/[dealId]` 또는 `/api/redirect/[id]` 추적 경로를 거쳐 새 탭/외부 브라우저로 열린다.
- 내부 정책/설정 화면 이동용 링크는 `Link`를 사용하고, 상품 상세 링크는 새 탭 `Link`, 상품 구매 이동은 `window.open(..., "_blank", "noopener,noreferrer")` 또는 Capacitor Browser를 사용한다.
- 새 관리자/운영 화면에 외부 확인 링크를 추가할 때도 `target="_blank"`와 `rel="noopener noreferrer"`를 함께 넣어야 하며, 빈 링크나 hash placeholder는 출시 UI에 남기지 않는다.

## 보안/배포 가드레일

- `npm run audit:commercial`은 npm audit 취약점이 1건이라도 남아 있으면 실패하고, 민감정보 없이 `AUDIT_REPORT.md`와 `docs/AUDIT_REPORT.md`에 severity별 요약을 남깁니다.
- `npm run store:submission:report`는 APK/AAB, 스토어 이미지, 검증 리포트, 제출 문서, 남은 수동 작업을 민감정보 없이 `STORE_SUBMISSION_REPORT.md`와 `docs/STORE_SUBMISSION_REPORT.md`에 정리합니다.
- `next.config.mjs`에는 웹 배포용 기본 보안 헤더와 `output: "standalone"`이 설정되어 있습니다. Capacitor 정적 export 빌드에서는 적용되지 않는 headers 설정을 자동 제외합니다.
- 신고/트래킹/리다이렉트/export API는 `X-Request-Id`, `X-RateLimit-*` 헤더를 반환합니다.
- 현재 rate limit는 in-memory 방식입니다. 다중 인스턴스 운영 시 Redis, Upstash, Supabase Edge Function 등 공유 저장소로 교체해야 합니다.
- 분석/제휴 추적은 브라우저 localStorage의 `halindosa:consent` 설정을 기준으로 클라이언트에서 제어합니다.
- `Dockerfile`은 standalone output을 사용해 production image를 만듭니다.
- `.github/workflows/ci.yml`은 `main`과 `codex/**` 브랜치에서 install, commercial audit, `npm run test:env`, `npm run public:url:doctor`, `npm run store:metadata:doctor`, `npm run store:assets:doctor`, `npm run store:packet:doctor`, `npm run store:console:fields`, `npm run store:manual:checklist`, `npm run store:manual:doctor`, `npm run store:handoff:report`, `npm run release:notes`, `npm run support:playbook`, `npm run known:issues`, `npm run store:screenshots:manifest`, `npm run store:screenshots:doctor`, `npm run health:readiness`, `npm run harness`, `npm run release:doctor`를 실행합니다. `test:env`는 운영 URL이 localhost 또는 다른 OAuth callback origin으로 들어가는 회귀를 막고, 민감정보 없이 `ENV_DOCTOR_REPORT.md`와 `docs/ENV_DOCTOR_REPORT.md`에 시나리오별 결과만 남깁니다. `public:url:doctor`는 `/privacy`, `/support`, sitemap, robots, 스토어 제출 URL 문구를 함께 확인하고 `PUBLIC_URL_REPORT.md`와 `docs/PUBLIC_URL_REPORT.md`에 공개 URL 제출 표면과 남은 외부 네트워크 수동 확인을 기록합니다. `store:metadata:doctor`는 Play/App Store 설명문 길이, 금지 문구, 비회원 심사 접근, 외부 판매처 결제 안내를 검사하고 `STORE_METADATA_REPORT.md`와 `docs/STORE_METADATA_REPORT.md`에 비밀 없는 제출 문구 QA 결과를 남깁니다. `store:assets:doctor`는 Play 아이콘, 기능 그래픽, PWA 아이콘, iOS 아이콘 치수와 용량을 검사하고 `STORE_ASSETS_REPORT.md`와 `docs/STORE_ASSETS_REPORT.md`에 제출 이미지 QA 결과를 남깁니다. `store:packet:doctor`는 제출 패킷이 필수 파일, 리포트, 명령, 심사자 복사 문구를 모두 가리키는지 확인하고 `STORE_PACKET_REPORT.md`와 `docs/STORE_PACKET_REPORT.md`에 패킷 QA 결과를 남깁니다. `store:console:fields`는 Play Console/App Store Connect 입력값과 심사자 복사 문구를 `STORE_CONSOLE_FIELDS.json`과 `docs/STORE_CONSOLE_FIELDS.md`에 기록합니다. `store:manual:checklist`는 signed AAB 업로드, 공개 정책 URL 확인, 실기기 QA, 스크린샷 업로드, OAuth 콘솔 설정처럼 자동으로 완료했다고 주장하면 안 되는 외부 수동 작업을 `STORE_MANUAL_CHECKLIST.json`, `STORE_MANUAL_CHECKLIST.md`, `docs/STORE_MANUAL_CHECKLIST.md`에 분리 기록합니다. `store:manual:doctor`는 수동 체크리스트가 critical 항목, 증빙 요구, 민감정보 금지, localhost/example 차단, 외부 콘솔 완료 허위 주장 차단 기준을 유지하는지 검사합니다. `store:handoff:report`는 제출 담당자가 볼 최종 인수인계 항목, 외부 콘솔 수동 작업, 민감정보 금지 원칙을 `STORE_HANDOFF_REPORT.md`와 `docs/STORE_HANDOFF_REPORT.md`에 기록합니다. `known:issues`는 자동 검증 기준 치명 이슈, 링크/이미지 준비도, 배포 URL과 실기기 수동 확인 리스크를 `KNOWN_ISSUES.md`와 `docs/KNOWN_ISSUES.md`에 기록합니다. `store:screenshots:manifest`는 6개 제출 장면의 Play/App Store 파일명, 1080x1920/1290x2796 viewport, 안전 체크를 `STORE_SCREENSHOT_MANIFEST.json`과 `docs/STORE_SCREENSHOT_MANIFEST.md`에 기록합니다. `store:screenshots:doctor`는 `/store-preview` 촬영 보드와 6개 제출 장면, 금지 요소 체크리스트를 검사하고 `STORE_SCREENSHOTS_REPORT.md`와 `docs/STORE_SCREENSHOTS_REPORT.md`에 수동 캡처 대상을 기록합니다. `health:readiness`는 검증 상품, 공식 혜택 카테고리, 검색/품절 노출 0건, 24시간 신선도, `refresh:all` 성공을 `reports/health-readiness.json`과 `docs/HEALTH_READINESS_REPORT.md`에 기록합니다. `npm run device:qa:report`는 수동 실기기 확인을 통과로 꾸미지 않고 APK/AAB, 기준 커밋, 자동 리포트, 남은 수동 확인을 `DEVICE_QA_REPORT.md`와 `docs/DEVICE_QA_REPORT.md`에 기록합니다. `npm run store:submission:report`는 제출 파일, 검증 리포트, 정책 문서, 남은 수동 작업을 `STORE_SUBMISSION_REPORT.md`와 `docs/STORE_SUBMISSION_REPORT.md`에 정리합니다. `harness` 안에는 lint, build, 링크/이미지/검색/모바일/SEO/성능, 로컬 smoke, release doctor가 포함됩니다. CI는 성공/실패와 관계없이 `halindosa-verification-reports` artifact로 보안 감사, 환경, 공개 URL 제출 준비, 스토어 메타데이터 QA, 스토어 이미지 QA, 스토어 제출 패킷 QA, 스토어 콘솔 입력 필드, 스토어 수동 제출 체크리스트, 스토어 출시 인수인계, Known Issues, 스토어 스크린샷 매니페스트, 스토어 스크린샷 QA, 운영 헬스 리포트, 실기기 QA 준비, 스토어 제출 준비, harness, 링크, 이미지, 모바일 UX, 성능, 검색, 출시 증빙 리포트를 업로드합니다.
- `.github/pull_request_template.md`는 출시 안전 체크리스트입니다. PR 작성자는 harness, release doctor, `npm run store:manual:doctor`, 실제 상품/공식 혜택 상세 URL, 민감정보 미커밋, 비회원 접근, OAuth/정책 문서 영향, 모바일 하단 탭 겹침 여부, `docs/STORE_CONSOLE_FIELDS.md`/`docs/STORE_MANUAL_CHECKLIST.md`/`docs/STORE_HANDOFF_REPORT.md` 갱신 여부를 확인합니다.
- `.github/ISSUE_TEMPLATE`에는 특가/혜택 링크·가격 신고, 앱 버그 신고, 스토어 제출 Blocker 템플릿이 있습니다. 상품 ID, 판매처, 열린 URL/도메인, 재현 경로, Play Console/App Store Connect 제출 단계, 관련 store checklist 항목을 받되 주문번호, 주소, 결제 정보, 비밀번호, 인증 코드, OAuth client secret, Supabase service-role key, `.env`, keystore 같은 민감정보는 이슈에 남기지 않도록 안내합니다.
- `npm run release:notes`는 사용자용 변경점, 운영자 주의사항, 검증 산출물, 최근 커밋을 `RELEASE_NOTES.json`, `RELEASE_NOTES.md`, `docs/RELEASE_NOTES.md`에 민감정보 없이 기록합니다. 이 문서는 스토어 제출 성공을 증명하지 않으며, Play/App Store 업로드와 실기기 QA는 별도 증빙이 있어야 합니다.
- `npm run support:playbook`은 가격 불일치, 품절, 링크 오류, 혜택 종료, 개인정보/계정, 스토어 제출 문의에 대한 응대 매크로와 SLA를 `SUPPORT_PLAYBOOK.json`, `SUPPORT_PLAYBOOK.md`, `docs/SUPPORT_PLAYBOOK.md`에 민감정보 없이 기록합니다. 고객지원 이슈에는 주문번호, 주소, 결제 정보, OAuth client secret, Supabase service-role key, keystore, `.env` 값을 남기지 않습니다.
- `npm run known:issues`는 자동 검증 기준의 Critical 상태, 링크 커버리지, 이미지 fallback backlog, 공개 URL/실기기 수동 확인 리스크를 `KNOWN_ISSUES.md`와 `docs/KNOWN_ISSUES.md`에 민감정보 없이 기록합니다.
- `SECURITY.md`는 취약점, 키 노출, 인증 우회, open redirect, 관리자 토큰/keystore 노출을 공개 이슈가 아닌 GitHub Security Advisory 또는 배포 인수인계용 비공개 채널로 접수하도록 안내합니다.

Docker 로컬 검증 예시:

```bash
docker build -t halindosa .
docker run --rm -p 3000:3000 --env-file .env.example halindosa
```

## 배포 후 확인

1. `NEXT_PUBLIC_SITE_URL`이 실제 도메인인지 확인
2. `robots.txt`, `sitemap.xml`, `manifest.webmanifest` 응답 확인
3. `/api/health` 모니터링 등록
4. `ADMIN_EXPORT_TOKEN`을 설정하고 `/admin` 접근 보호 확인
5. 제휴 링크 연결 시 광고 고지 문구와 약관 갱신
6. `SMOKE_BASE_URL`로 배포 URL을 지정해 `npm run smoke` 실행
7. Docker 또는 호스팅 플랫폼의 환경변수에 `.env.example` 항목 반영

## 장애 대응

- 데이터 공급자가 실패하면 `DEAL_DATA_MODE=mock`으로 fallback
- 리다이렉트 장애 시 `/api/track`과 `/api/redirect/[id]` 로그를 먼저 확인
- 가격 오류 신고가 들어오면 `price_snapshots` 기준으로 수집 시점과 판매처 조건 확인
- `/reports?dealId=...` 신고가 증가하면 해당 mall/source 공급자 품질을 점검
- `/api/admin/reports`에서 신고 상태를 `open`, `reviewing`, `resolved`, `dismissed`로 관리하고, Supabase `deal_reports`와 로컬 fallback을 함께 보며 `operationAction`으로 상품 숨김/복구/재검증을 동시에 기록
- 상세 페이지의 가격 신뢰도는 현재 mock 이력 기반입니다. 운영 DB 전환 후 `price_snapshots`로 계산해야 합니다.
- 신규 제휴/공식 피드는 `/api/admin/import` dry-run을 통과한 뒤 DB 저장 파이프라인에 연결합니다.
- 네이버 쇼핑 공식 API를 쓰려면 `DEAL_DATA_MODE=hybrid`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 설정합니다. 키가 없거나 API 장애가 있으면 기본 큐레이션 fallback으로 화면을 유지합니다.
- 별도 제휴 JSON 피드는 `DEAL_FEED_URLS=https://.../feed.json,https://.../feed2.json` 형태로 연결합니다.
