# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

## 현재 브랜치

- Branch: `codex/12h-product-ux-growth-hardening`
- Remote: `origin/codex/12h-product-ux-growth-hardening`
- 최근 원격 반영 커밋: `4e19f077 feat: expose free benefit feed starter pack operations`
- 현재 작업 트리: starter pack 관리자 화면/API/스모크/릴리즈 닥터 노출 작업 커밋 및 push 완료
- 최신 검증: `npm run lint` 성공, `npm run smoke:local` 97/97 통과, `npm run release:doctor` 187/187 통과, `npm run qa` 72/72 통과, `npm run build` 성공, `npm run build:android` 성공, `npm run cap:sync` 성공, `npm run workspace:doctor:strict` 통과

## 이번 세션에서 진행한 핵심 변경

- 홈 화면을 상품 구매 링크 중심에서 무료혜택 우선 구조로 전환 중.
- `components/HomeClient.tsx`에서 `HomeFreebieHero`를 검색/필터보다 위로 올려 첫 화면에 `오늘 챙길 쿠폰·0원딜`이 먼저 보이게 함.
- 기존 상품 목록은 `추가 할인 상품`, `무료혜택 다음에 볼 상품` 보조 영역으로 내림.
- `components/home/HomeFreebieHero.tsx`가 `FreeBenefitEvent[]`를 직접 받아 공식 무료혜택 이벤트 카드를 먼저 렌더링하도록 확장됨.
- `types/freeBenefitEvent.ts`에 `imageUrl` 필드가 추가됨.
- `lib/freeBenefitEvents.ts`가 `imageUrl`을 정규화함.
- `app/api/benefits/events/route.ts`를 추가해 표준 `FreeBenefitEvent`만 반환하는 no-store/rate-limit 공개 API를 제공함.
- `scripts/smoke.mjs`, `scripts/security-check.mjs`, `scripts/release-doctor.mjs`에 `/api/benefits/events` 회귀 검사를 추가함.
- `scripts/source-feed-env-doctor.mjs`가 `BENEFIT_REFRESH_FEED_URLS`와 `BENEFIT_REFRESH_APPROVED_HOSTS`를 검사하고, 내부망/metadata 주소를 `private_or_metadata_host`로 차단함.
- `BENEFIT_REFRESH_FEED_URLS`가 이제 `public_coupon` 런타임 provider, `data/officialBenefitFeedSources.json`, feed canary/preview/transition report, news feed contract doctor, release doctor, 관리자 운영 리포트에 연결됨.
- 무료혜택 전용 feed는 `PUBLIC_COUPON_FEED_URLS`와 같은 공식 링크 차단 기준을 따르며, 검색/메인/커뮤니티/비공식 URL은 노출되지 않음.
- `app/api/cron/benefits/route.ts`를 추가해 `refresh:benefits`만 실행하는 보호된 무료혜택 전용 cron endpoint를 분리함.
- `vercel.json`에 `/api/cron/benefits` daily cron을 추가함. 기존 `/api/cron/refresh`는 전체 refresh, 새 route는 홈 상단 무료혜택/쿠폰/샘플/전원증정 이벤트 갱신에 집중함.
- `scripts/smoke.mjs`, `scripts/release-doctor.mjs`, `scripts/cron-refresh-doctor.mjs`, `docs/RUNBOOK.md`, `docs/roadmap.md`가 새 benefits cron route를 검사/문서화함.
- `FreeBenefitEvent` 모델에 `claimCtaLabel`, `urgencyLabel`, `rankingReason`, `trustBadges`를 추가해 사용자가 받을 혜택, 조건, 마감, 신뢰 근거를 카드에서 바로 이해할 수 있게 함.
- `lib/freeBenefitEvents.ts`에 무료혜택 추천 점수 함수를 추가해 전원증정, 구매 조건 낮음, 공식 검증, 마감 임박, 품질 점수를 우선하고 구매 필요/로그인 필요 조건은 낮게 정렬함.
- `/api/benefits/events`가 `sort=recommended|endingSoon|latest|noPurchase|quality`, `noPurchaseOnly=true` 필터, `rankingPolicy`, `filters`, `officialSourceCount`를 반환하도록 강화됨.
- `components/home/HomeFreebieHero.tsx`의 공식 이벤트 카드가 추천 이유, 마감/진행 라벨, 신뢰 배지, 혜택 유형별 CTA 문구를 표시함.
- `scripts/smoke.mjs`, `scripts/security-check.mjs`, `scripts/release-doctor.mjs`가 새 무료혜택 이벤트 API 계약을 회귀 검사함.
- `/free-benefits` 전용 페이지가 서버 초기 렌더링과 60초 클라이언트 refresh 모두에서 `/api/benefits/events`를 직접 사용하도록 전환됨.
- `components/FreeBenefitsClient.tsx` 공식 혜택 섹션은 `FreeBenefitEvent` 카드, 전용 혜택 유형 칩, 구매조건 낮음 카운트, 추천 이유, 마감 라벨, 신뢰 배지, 혜택 유형별 CTA를 우선 표시함.
- `lib/homeApi.ts`에 `/api/benefits/events` 요청 builder와 응답 타입을 추가해 홈/전용 페이지가 같은 무료혜택 이벤트 계약을 재사용할 수 있게 함.
- `data/officialSourceCatalog.json`에 SKT T멤버십, 고용24, K-MOOC, 복지로, 서울문화포털, 로얄캐닌, 파우더룸 등 통신사/교육/공공/반려동물/체험단 무료혜택 후보 7개를 추가함.
- `scripts/official-source-catalog-report.mjs`가 `BENEFIT_REFRESH_FEED_URLS`를 공식 소스 카탈로그 preferred env key로 허용하도록 갱신됨.
- stale URL로 확인된 K-MOOC 목록 URL과 로얄캐닌 범용 이벤트 URL은 공식 상세 URL로 교체했고, 퓨리나 이벤트 후보는 안정 공식 URL을 확인할 때까지 카탈로그에서 제외함.
- `scripts/test-ui-rules.mjs`, `scripts/test-mobile-ux.mjs`, `scripts/lib/smoke-page-checks.mjs`, `scripts/release-doctor.mjs`의 검사 문구를 무료혜택 중심 구조에 맞게 갱신 중.
- README와 출시/QA 문서의 옛 `오늘 바로 볼 특가` 표현을 `무료혜택 다음에 볼 상품`으로 전환 중.
- `scripts/free-benefit-source-breadth-doctor.mjs`를 추가해 통신사, 편의점, 뷰티, 카페·프랜차이즈, 배달, 금융·페이·포인트, 마트, 오픈마켓, 문화·공공, 교육, 반려동물, 체험단 12개 무료혜택 수집 축이 공식 소스 카탈로그에 충분히 확보됐는지 검사함.
- `source:breadth:doctor`를 `package.json`, `qa`, `release:doctor`에 연결해 무료혜택 플랫폼 방향에 필요한 소스 다양성이 회귀되지 않도록 출시 게이트에 포함함.
- `reports/free-benefit-source-breadth.json`과 `docs/FREE_BENEFIT_SOURCE_BREADTH.md`를 생성해 lane별 기준, 활성 소스 수, stale 여부, 운영 원칙을 기록함.
- `scripts/free-benefit-feed-starter-pack.mjs`를 추가해 공식 소스 카탈로그와 live check를 바탕으로 무료혜택 운영 feed starter pack을 생성함.
- `source:starter:pack`은 오늘의 무료혜택, 편의점, 뷰티 샘플, 카페·외식, 페이·포인트, 공공·문화, 교육, 반려동물·체험단 8개 연결 묶음과 Vercel env 템플릿을 생성하며, HTML 직접 스크래핑 대신 공식 API/RSS/Atom/승인 JSON feed 연결을 안내함.
- `app/api/admin/source-starter-pack/route.ts`를 추가해 운영자가 starter pack을 JSON/CSV/env 템플릿으로 내려받을 수 있게 함.
- `app/admin/page.tsx`에 `무료혜택 운영 feed starter pack` 섹션을 추가해 운영 묶음, 연결 후보, 접근 가능 후보, 승인 필요 후보, 대표 후보를 바로 확인할 수 있게 함.
- `lib/operations/sourceStarterPack.ts`가 `reports/free-benefit-feed-starter-pack.json`과 `.env` 산출물을 읽어 관리자/API에 제공함.
- `scripts/smoke.mjs`, `scripts/release-doctor.mjs`, `scripts/lib/release-doctor-operational-data.mjs`가 starter pack 관리자 API, CSV, env 다운로드, admin auth hardening을 검사하도록 확장됨.

## 검증 결과

- `npm run test:mobile-ux`: 성공, 13/13 통과.
- `npm run refresh:benefits`: 성공, 4/4 통과.
- `npm run security:check`: 성공, 10/10 통과.
- `npm run smoke:local`: 성공, 94/94 통과.
- `npm run release:doctor`: 성공, 187/187 통과. 새 `source:breadth:doctor` QA 연결도 확인됨.
- `npm run qa`: 성공, 70/70 통과.
- `npm run harness`: 성공.
- 참고: 이번 라운드에서 `qa`의 첫 실행은 180초 제한으로 중단됐고, 300초 제한 단독 재실행은 70/70 통과함.
- `npm run source:feed-env:doctor`: 성공, 7개 feed env key 검사.
- `npm run source:catalog:report`: 성공, 공식 소스 102개, 카테고리 10/10, provider 4/4.
- `npm run source:breadth:doctor`: 성공, 무료혜택 필수 수집 축 12/12 통과.
- `npm run source:starter:pack`: 성공, starter lane 8개, 연결 후보 64개, env key 6개.
- `npm run source:starter:pack`: 2026-06-09 재실행 성공, starter lane 8개, 연결 후보 64개, env key 6개.
- `npm run smoke:local`: 2026-06-09 재실행 성공, 97/97 통과. 새 `/api/admin/source-starter-pack` JSON/CSV/env route 포함.
- `npm run qa`: 2026-06-09 재실행 성공, 72/72 통과.
- `npm run build`: 2026-06-09 단독 재실행 성공.
- `npm run build:android`: 2026-06-09 재실행 성공.
- `npm run cap:sync`: 2026-06-09 `build:android`로 `out` 생성 후 재실행 성공.
- `npm run workspace:doctor:strict`: 2026-06-09 `.next` 정리 후 성공, 재생성 산출물 0B.
- `npm run source:live:doctor`: 성공, reachable 88개, guarded 14개, stale_or_removed 0개.
- `npm run news:feed:doctor`: 성공.
- `npm run news:feed:canary`: 성공, seed_fallback_only.
- `npm run feed:transition:report`: 성공, seed_launch_ready.
- `npm run source:readiness:report`: 성공.
- `npm run lint`: 성공.
- `npm run build`: 성공.
- `npm run build:android`: 성공.
- `npm run cap:sync`: 성공.
- `npm run workspace:doctor:strict`: 성공, 재생성 산출물 0B.

## 해결된 실패

`npm run release:doctor`의 이전 실패는 해결됨:

- Check: `mobile ux report coverage`
- 조치: `scripts/lib/release-doctor-ui-accessibility.mjs`의 모바일 UX 리포트 기대 문구를 `무료혜택 다음에 볼 상품` 기준으로 수정하고, `MOBILE_UX_REPORT.md`를 재생성함.
- 결과: `release:doctor` 187/187 통과, `qa` 70/70 통과.

## 현재 데이터/품질 지표

- 상품 구매 링크: 140/140 검증 통과.
- 공식 뉴스/혜택 링크: 105/105 검증 통과.
- 무료혜택 API: 101/101 visible, 검색 링크 0, 비공식 링크 0, 깨진 이미지 0.
- 무료혜택 이벤트 API: `/api/benefits/events?limit=12&type=all` smoke 통과, publishable-only 정책과 no-store 정책 노출.
- 무료혜택 이벤트 API: `sort=noPurchase&noPurchaseOnly=true` smoke 통과, 구매 필요 이벤트를 제외한 공식 혜택만 반환.
- 무료혜택 이벤트 API 계약: 모든 노출 이벤트가 `claimCtaLabel`, `urgencyLabel`, `rankingReason`, `trustBadges`를 포함.
- 무료혜택 이벤트 검증: active official events 102개, sources 92개, hosts 74개.
- 공식 소스 카탈로그: 102개 소스, 10/10 카테고리 커버리지, provider 4/4, stale_or_removed 0개.
- 무료혜택 소스 축: 통신사, 편의점, 뷰티, 카페·프랜차이즈, 배달, 금융·페이·포인트, 마트, 오픈마켓, 문화·공공, 교육, 반려동물, 체험단 12/12 통과.
- 무료혜택 feed starter pack: 8개 운영 묶음, 64개 연결 후보, 접근 가능 56개, 보호/승인 필요 8개.
- 공식 feed env doctor: 7개 키 검사, 설정된 feed URL 0개, 실패 0개, SSRF/private host 회귀 샘플 차단.
- 공식 feed 전환 상태: `BENEFIT_REFRESH_FEED_URLS` 포함, 현재 seed fallback 운영 가능 상태. 실제 운영에서는 승인된 JSON/RSS/Atom feed URL과 승인 host를 Vercel env에 연결하면 됨.
- 무료혜택 cron: `/api/cron/benefits?dryRun=true&token=local-admin` smoke 통과. 무토큰 호출은 401, 토큰 dry-run은 200.
- Cron readiness: `cron:refresh:doctor` 14/14 통과, 전체 refresh와 benefits refresh가 Vercel Hobby 호환 daily schedule로 분리됨.
- 모바일 UX: 하단 safe-area, compact 검색, 필터 칩, 무료혜택 히어로, 공식 혜택 strip, 토스트 위치 모두 통과.

## 다음 세션에서 바로 할 일

1. Vercel/GitHub 배포가 필요하면 `codex/12h-product-ux-growth-hardening` 최신 push 이후 배포 상태를 확인한다.
2. 실제 외부 공식 feed URL을 `BENEFIT_REFRESH_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`, `OFFICIAL_EVENT_FEED_URLS`에 연결해 seed fallback 비율을 낮춘다.
3. 운영 feed 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news` 순서로 검증한다.
4. Vercel production 환경에서는 `CRON_SECRET`을 설정하고 `/api/cron/refresh`, `/api/cron/benefits` 두 cron이 실행되는지 deployment logs에서 확인한다.
5. `/free-benefits`의 나머지 긴 루틴/운영 섹션도 점진적으로 카드 단위 컴포넌트로 분리해 파일 크기를 줄인다.

## 주의할 파일

- `components/HomeClient.tsx`
- `components/home/HomeFreebieHero.tsx`
- `components/FreeBenefitsClient.tsx`
- `types/freeBenefitEvent.ts`
- `lib/freeBenefitEvents.ts`
- `lib/homeApi.ts`
- `app/api/benefits/events/route.ts`
- `app/api/cron/benefits/route.ts`
- `vercel.json`
- `scripts/cron-refresh-doctor.mjs`
- `scripts/test-ui-rules.mjs`
- `scripts/test-mobile-ux.mjs`
- `scripts/lib/smoke-page-checks.mjs`
- `scripts/release-doctor.mjs`
- `scripts/security-check.mjs`
- `scripts/smoke.mjs`
- `scripts/source-feed-env-doctor.mjs`
- `scripts/free-benefit-source-breadth-doctor.mjs`
- `scripts/free-benefit-feed-starter-pack.mjs`
- `lib/operations/sourceStarterPack.ts`
- `app/api/admin/source-starter-pack/route.ts`
- `docs/FREE_BENEFIT_SOURCE_BREADTH.md`
- `docs/FREE_BENEFIT_FEED_STARTER_PACK.md`
- `README.md`
- `docs/RUNBOOK.md`
- `docs/test-plan.md`
- `docs/release-checklist.md`
- `docs/device-qa-checklist.md`
- `docs/device-qa-record-template.md`
- `MOBILE_UX_REPORT.md`

## 사용자 의도

사용자는 다음 세션에서 이전 대화 resume을 원하지 않는다. 새 세션은 이 파일과 `AGENTS.md`만 읽고, 할인도사를 무료 할인 혜택·무료 이벤트·쿠폰·샘플·체험·전원증정 중심 플랫폼으로 계속 고도화해야 한다.
