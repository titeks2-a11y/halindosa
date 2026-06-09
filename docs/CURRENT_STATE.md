# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

## 세션 규칙

- 이전 대화는 resume하지 않는다.
- 새 세션은 이 파일과 `AGENTS.md`만 읽고 이어간다.
- 사용자에게 중간 질문하지 않고 직접 판단해 진행한다.

## 현재 브랜치와 커밋

- Branch: `codex/12h-product-ux-growth-hardening`
- Remote: `origin/codex/12h-product-ux-growth-hardening`
- 기준 커밋: `7fa65767 feat: expand official free benefit source coverage`
- 이 상태 문서에 포함된 최신 작업: 공식 무료혜택 소스 카탈로그, 핵심 브랜드 신호 게이트, FreeBenefitEvent 계약 검증 게이트 강화.

## 최근 완료 작업

### 무료혜택 feed handoff 운영 노출

- `lib/operations/sourceFeedHandoff.ts`
- `app/api/admin/source-feed-handoff/route.ts`
- `lib/adminDashboardHrefs.ts`
- `app/admin/page.tsx`
- `scripts/smoke.mjs`
- `scripts/release-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`

구현 요약:

- `reports/free-benefit-feed-handoff.json`과 `docs/FREE_BENEFIT_FEED_HANDOFF.md`를 읽는 운영 helper를 추가했다.
- `/api/admin/source-feed-handoff` 관리자 route를 추가했다.
- JSON, CSV, Markdown 다운로드 형식을 지원한다.
- 관리자 대시보드에 `무료혜택 feed 운영 핸드오프` 섹션을 추가했다.
- smoke/release doctor에 새 관리자 route, CSV, Markdown, admin page 문구 검사를 추가했다.

### 무료혜택 feed activation doctor

- `scripts/source-feed-activation-doctor.mjs`
- `docs/SOURCE_FEED_ACTIVATION.md`
- `reports/source-feed-activation.json`
- `package.json`
- `scripts/run-qa.mjs`
- `scripts/release-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`

구현 요약:

- `source:activation:doctor` 명령을 추가했다.
- `source:prepare` 마지막 단계에 activation doctor를 연결했다.
- QA task 목록에 activation doctor를 추가했다.
- release doctor의 package/source readiness 조건이 activation script, report, docs를 확인하게 했다.
- 현재 feed URL 0개 상태는 `seed_ready`로 통과한다.
- 나중에 운영 feed URL이 설정되면 canary가 `live_feed_ready`이고 홈 실시간 반영(`test:home-realtime`)도 통과해야 activation이 통과한다.

### 무료혜택 feed activation 운영 노출

- `lib/operations/sourceFeedActivation.ts`
- `app/api/admin/source-feed-activation/route.ts`
- `lib/adminDashboardHrefs.ts`
- `app/admin/page.tsx`
- `scripts/smoke.mjs`
- `scripts/release-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`

구현 요약:

- `reports/source-feed-activation.json`과 `docs/SOURCE_FEED_ACTIVATION.md`를 읽는 운영 helper를 추가했다.
- `/api/admin/source-feed-activation` 관리자 route를 추가했다.
- JSON, CSV, Markdown 다운로드 형식을 지원한다.
- 관리자 대시보드에 `무료혜택 feed activation` 섹션을 추가했다.
- smoke/release doctor가 activation API, CSV, Markdown, admin page 문구를 검사한다.

### 공식 무료혜택 소스 카탈로그 확장

- `data/officialSourceCatalog.json`
- `scripts/free-benefit-source-breadth-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`

구현 요약:

- LG U+, 아모레몰, 라운드랩, 카카오페이, PAYCO, 롯데ON, 다나와, 슈퍼투데이 승인 발견 소스를 추가했다.
- 공식 소스 후보가 102개에서 110개로 늘었다.
- live 접근성은 94개 reachable, 16개 guarded, stale 0개로 유지된다.
- `source:breadth:doctor`가 12개 수집 축뿐 아니라 핵심 브랜드 신호 34개를 검사한다.
- release doctor가 핵심 브랜드 신호 누락을 차단한다.

### FreeBenefitEvent 계약 검증 게이트

- `scripts/free-benefit-event-contract-doctor.mjs`
- `docs/FREE_BENEFIT_EVENT_CONTRACT.md`
- `package.json`
- `scripts/run-qa.mjs`
- `scripts/harness.mjs`
- `scripts/release-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`

구현 요약:

- `benefit:event:contract` 명령을 추가했다.
- FreeBenefitEvent 필수 필드, 무료혜택 유형, 상태값, URL 안전성, 종료 문구 차단, dedupe, publishable 조건을 13개 계약 검사로 고정했다.
- `/api/benefits/events`가 no-store, rate limit, q/type/조건/정렬 필터, publishableOnly 정책, trust badge/CTA 필드를 유지하는지 검사한다.
- 홈과 `/api/freebies`가 같은 `selectPublishableFreeBenefitEvents` 기준을 쓰는지 검사한다.
- QA, harness, release doctor에 연결해 무료혜택 이벤트 계약이 출시 검증에서 빠지지 않게 했다.

## 마지막으로 확인한 명령

- `npm run lint` 성공
- `npm run source:feed:handoff` 성공
- `npm run smoke:local` 100/100 통과
- `npm run release:doctor` 187/187 통과
- `npm run qa` 73/73 통과
- `npm run build` 성공
- `npm run build:android` 성공
- `npm run cap:sync` 성공
- `npm run workspace:doctor:strict` 성공, 재생성 산출물 0B
- `npm run source:activation:doctor` 성공, `seed_ready`
- `npm run smoke:local` 103/103 통과, activation API/CSV/Markdown 포함
- `npm run qa` 74/74 통과, activation doctor 포함
- `npm run source:prepare` 성공
- `npm run test:home-realtime` 성공, 20/20 및 runtime snapshot 4/4 통과
- `npm run security:check` 성공, 10/10 통과
- `npm run source:catalog:report` 성공, 공식 소스 110개
- `npm run source:live:doctor` 성공, reachable 94개, guarded 16개, stale 0개
- `npm run source:breadth:doctor` 성공, 수집 축 12/12 및 핵심 브랜드 신호 34/34 통과
- `npm run benefit:event:contract` 성공, 13/13 통과
- `npm run release:doctor` 성공, 188/188 통과
- `npm run smoke:local` 성공, 103/103 통과
- `npm run qa` 성공, 75/75 통과

## 현재 제품 방향

할인도사는 상품 구매 링크 앱이 아니라 무료혜택 중심 플랫폼으로 전환 중이다.

우선순위:

1. 공식 무료혜택, 쿠폰, 샘플, 체험, 전원증정 이벤트 노출
2. 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크 차단
3. 모바일 첫 화면에서 무료혜택을 가장 먼저 보여주는 UI 유지
4. 핵심 브랜드/기관 소스 신호 34개를 유지하며 공식 feed 전환 준비
5. 운영자가 공식 feed URL을 쉽게 연결할 수 있는 handoff/activation 구조 강화
6. Vercel env, cron, QA, release doctor, Android sync 품질 유지

## 다음 세션에서 바로 할 일

1. 최신 커밋과 원격 push 상태를 확인한다.
2. 실제 운영 feed URL을 Vercel env에 연결하려면 `docs/FREE_BENEFIT_FEED_HANDOFF.md`, `docs/SOURCE_FEED_ACTIVATION.md`, `docs/FREE_BENEFIT_EVENT_CONTRACT.md`, `/api/admin/source-feed-handoff`, `/api/admin/source-feed-activation`을 기준으로 진행한다.
3. 운영 feed 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:benefits && npm run verify:benefits && npm run benefit:event:contract && npm run test:home-realtime && npm run source:activation:doctor` 순서로 검증한다.
4. Android web assets는 strict workspace 정리를 위해 삭제되어 있을 수 있다. 앱 반영이 필요하면 `npm run build:android && npm run cap:sync`를 다시 실행한다.

## 주의

- `reports/source-feed-activation.json`은 `reports/*` ignore 규칙에 걸리지만 release doctor 증거라서 `git add -f`로 추적해야 한다.
- `docs/FREE_BENEFIT_FEED_HANDOFF.md`는 `source:feed:handoff` 실행 시 timestamp가 바뀔 수 있다. 내용 변경이 timestamp뿐이면 커밋 전 노이즈 여부를 확인한다.
- QA/build가 `.next`, `out`, Android web assets를 만들 수 있으니 마지막에 strict workspace doctor 기준으로 정리한다.
