# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

## 새 세션 시작 규칙

- 이전 대화는 resume하지 않는다.
- 기존 대화는 `/exit`로 닫고, 새 작업은 새 `codex` 세션에서 시작한다.
- 새 `codex` 세션은 `AGENTS.md`, 이 파일, 현재 워크트리만 기준으로 시작한다.
- 사용자에게 중간 질문하지 않고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 판단한다.

## Git 상태

- Branch: `codex/12h-product-ux-growth-hardening`
- 최근 커밋:
  - `a2704ad2 feat: expand official pet benefit sources`
  - `f57c287c test: require roulette benefit release evidence`
  - `6fcffddb feat: add roulette free benefit category`
  - `72bdc8b4 test: guard free benefit first home exposure`
  - `c37f7a83 docs: record mobile free benefit ux gate`
  - `16848082 test: enforce mobile free benefit category chips`
- 워크트리는 refresh, verification, release evidence 산출물 때문에 dirty일 수 있다.
- 코드 커밋 시 `git add .`를 피하고 필요한 파일만 명시적으로 stage한다.

새 세션 시작 체크:

```bash
git status --short --branch
npm run workspace:doctor:strict
```

## 제품 방향

할인도사는 상품 구매 링크 앱이 아니라 무료혜택 중심 플랫폼이다.

우선순위:

1. 공식 무료혜택, 쿠폰, 샘플, 체험, 전원증정, 선착순, 출석체크, 룰렛, 신규가입 혜택을 홈 상단에 우선 노출한다.
2. 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크는 사용자 CTA에 노출하지 않는다.
3. 공식 이벤트, 신청, 쿠폰, 샘플, 출석체크, 무료체험 URL만 혜택 CTA에 연결한다.
4. 비회원도 핵심 혜택은 볼 수 있게 유지하고, 찜/알림/개인화만 가입 유도와 연결한다.
5. Android/Capacitor, Vercel, QA, release doctor 기준을 낮추지 않는다.

## 현재 구현 상태

- Next.js App Router, TypeScript, Tailwind CSS, Capacitor Android 기반이다.
- 무료혜택 데이터 모델과 계약이 정리되어 있다.
  - `types/freeBenefitEvent.ts`
  - `lib/freeBenefitEvents.ts`
  - `scripts/free-benefit-event-contract-doctor.mjs`
- 홈과 `/free-benefits`는 13개 무료혜택 필터 계약을 공유한다.
  - 전체, 전원증정, 선착순, 쿠폰, 샘플, 무료체험, 기프티콘, 포인트/캐시백, 출석체크, 룰렛, 신규가입, 공공무료, 체험단
- 홈 노출 순서 게이트:
  - 무료혜택 히어로
  - 검증 공식 혜택 strip
  - 추가 할인 상품 보조 영역
- 구매 상품 영역은 홈 상단 핵심 가치가 아니며 보조 탐색 영역으로 유지한다.
- `/api/benefits/events`는 active publishable 카운트를 `categories`, `categoryCounts`, `filteredCategoryCounts`로 함께 내려준다.
- `/api/home`과 홈 상단 무료혜택 히어로도 같은 카테고리 카운트를 사용한다.
- 홈 빠른 필터에서 서버 카운트가 0개인 카테고리는 비활성 칩으로 표시한다.
- 공식 소스 후보는 138개다.
- 마지막 official source live check 기준:
  - reachable 119
  - guarded 19
  - stale_or_removed 0
- 반려동물 샘플 lane은 로얄캐닌과 퓨리나 공식 이벤트/0원딜 소스를 포함해 최소 3개 기준으로 강화되어 있다.
- 공식 소스 카탈로그는 동일 `officialUrl` 중복을 `duplicate_official_url`로 실패 처리한다.
- `security:check`는 공식 소스 카탈로그가 검색/커뮤니티/비공식/약한 CTA 정책을 포함하지 않는지도 검사한다.
- `release:doctor`는 보안 게이트, 무료혜택 계약, 홈 노출 순서, 모바일 필터 evidence를 검사한다.
- source feed env readiness 구조가 있다.
  - `lib/operations/sourceFeedEnvReadiness.ts`
  - `scripts/source-feed-env-doctor.mjs`
  - `docs/SOURCE_FEED_ENV_REPORT.md`

## 주요 명령

```bash
npm run lint
npm run refresh:news
npm run verify:news
npm run refresh:deals
npm run verify:links
npm run refresh:benefits
npm run source:catalog:report
npm run source:breadth:doctor
npm run source:live:doctor
npm run source:feed-env:doctor
npm run test:ui
npm run test:mobile-ux
npm run security:check
npm run qa
npm run harness
npm run smoke:local
npm run release:doctor
npm run build
npm run build:android
npm run cap:sync
npm run workspace:doctor:strict
```

## 최근 검증 상태

최근 안정 라운드에서 아래 명령이 통과했다.

```bash
npm run benefit:event:contract
npm run test:mobile-ux
npm run test:ui
npm run lint
npm run smoke:local
npm run release:doctor
npm run security:check
npm run source:catalog:report
npm run source:breadth:doctor
npm run source:live:doctor
npm run workspace:doctor:strict
```

## 새 세션에서 이어서 하면 좋은 작업

1. `/api/health`에 `/api/cron/benefits` 전용 상태를 추가한다.
2. `lib/operations/cronRefresh.ts`에 benefits cron 상태, report freshness, visible active events 수를 노출한다.
3. `scripts/smoke.mjs`, `scripts/release-doctor.mjs`, `scripts/cron-refresh-doctor.mjs`가 benefits cron health evidence를 검사하게 강화한다.
4. 검증 후 필요한 파일만 stage하고 작게 commit/push한다.

## 주의

- 빌드 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 `./.next/dev/types/routes.d.ts`로 되돌린다.
- `.next`를 삭제할 때는 절대경로가 현재 workspace 내부인지 확인한다.
- release evidence 문서들은 doctor freshness를 맞추기 위해 dirty 상태로 남아 있을 수 있다.
- 이전 대화 내용은 새 세션에서 참조하지 않는다.
