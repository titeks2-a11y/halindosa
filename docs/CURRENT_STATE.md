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
  - `76bcb379 test: require source catalog security in release doctor`
  - `ba84af79 docs: update current state for new codex session`
  - `d3241d4c test: guard official source catalog security`
  - `d1392c27 docs: refresh current state handoff`
  - `1aaa7370 feat: add momq official benefit sources`
- 현재 워크트리는 release evidence, refresh 데이터, 리포트 산출물이 dirty 상태로 남아 있을 수 있다.
- 코드 커밋 시 `git add .`를 피하고 필요한 파일만 명시적으로 stage한다.
- 새 세션 시작 시 먼저 실행:

```bash
git status --short --branch
npm run workspace:doctor:strict
```

## 제품 방향

할인도사는 상품 구매 링크 앱이 아니라 무료혜택 중심 플랫폼이다.

우선순위:

1. 공식 무료혜택, 쿠폰, 샘플, 체험, 전원증정, 선착순, 출석체크, 신규가입 혜택을 홈 상단에 우선 노출한다.
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
- 홈과 `/free-benefits`는 12개 무료혜택 필터 계약을 공유한다.
  - 전체, 전원증정, 선착순, 쿠폰, 샘플, 무료체험, 기프티콘, 포인트/캐시백, 출석체크, 신규가입, 공공무료, 체험단
- `/api/benefits/events`는 active publishable 카운트를 `categories`, `categoryCounts`, `filteredCategoryCounts`로 함께 내려준다.
- `/api/home`과 홈 상단 무료혜택 히어로도 같은 카테고리 카운트를 사용한다.
- 홈 빠른 필터에서 서버 카운트가 0개인 카테고리는 비활성 칩으로 표시한다.
- 무료혜택 CTA는 공식 이벤트/신청 URL만 통과시키는 정책으로 운영한다.
- 공식 소스 후보는 142개이며, source feed starter pack은 12개 lane 기준으로 확장되어 있다.
- 맘큐 공식 이벤트 목록과 신규회원 웰컴혜택 소스가 추가되어 육아/샘플/신규가입 혜택 발견 축이 보강되었다.
- 마지막 live check 기준 공식 소스는 reachable 123개, guarded 19개, stale_or_removed 0개다.
- `security:check`는 공식 소스 카탈로그가 검색/커뮤니티/비공식/약한 CTA 정책을 포함하지 않는지도 검사한다.
- `release:doctor`의 `free benefit security gates`도 `security-check.mjs`의 공식 소스 카탈로그 guard, unsafe URL detector, benefit policy detector, `docs/SECURITY_CHECK_REPORT.md` evidence를 직접 검사한다.
- source feed env readiness 구조가 있다.
  - `lib/operations/sourceFeedEnvReadiness.ts`
  - `scripts/source-feed-env-doctor.mjs`
  - `docs/SOURCE_FEED_ENV_REPORT.md`
- 관리자 화면에는 `다음 Feed 활성화 큐`, `starter pack 기준`, `운영자 체크리스트`가 노출되고 smoke/release doctor가 이를 검사한다.

## 현재 dirty 파일 성격

- release evidence 문서 다수
- refresh/verification으로 재생성된 `data/*`, `reports/*`, 루트 QA 리포트

주의:

- release evidence 문서들은 doctor freshness를 맞추기 위해 dirty 상태로 남아 있을 수 있다.
- 코드 커밋 시 `git add .`를 피하고 필요한 파일만 명시적으로 stage한다.
- 새 커밋을 만들면 release evidence 문서를 다시 생성한 뒤 `release:doctor`를 확인한다.

## 최근 검증 상태

최근 안정 상태에서 아래 검증이 통과했다.

```bash
npm run source:feed-env:doctor
npm run release:doctor
npm run workspace:doctor:strict
npm run security:check
npm run lint
```

최근 커밋 `d3241d4c` 기준 아래 검증이 통과했다.

```bash
npm run lint
npm run source:catalog:report
npm run source:breadth:doctor
npm run source:live:doctor
npm run source:feed-env:doctor
npm run security:check
npm run qa
npm run harness
npm run smoke:local
npm run release:doctor
npm run workspace:doctor:strict
npm run build
```

최근 커밋 `76bcb379` 기준 아래 검증이 통과했다.

```bash
npm run security:check
npm run lint
npm run release:doctor
npm run workspace:doctor:strict
```

주의:

- build 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 기존 `./.next/dev/types/routes.d.ts` 정책으로 되돌린다.
- Android web assets는 `workspace:doctor:strict` 정리 후 삭제될 수 있다. 앱 반영이 필요하면 `npm run build:android && npm run cap:sync`를 다시 실행한다.

## 다음 작업 후보

1. 무료혜택 운영 feed URL을 실제 Vercel env에 연결하기 전 아래 문서를 기준으로 검증한다.
   - `docs/SOURCE_FEED_ENV_REPORT.md`
   - `docs/FREE_BENEFIT_FEED_HANDOFF.md`
   - `docs/SOURCE_FEED_ACTIVATION.md`
2. 공공/교육/반려동물/문화/카페 프랜차이즈 무료혜택 후보를 추가하되, 사용자 CTA는 공식 상세 또는 신청 페이지가 active이고 무료 조건이 확인된 경우에만 연결한다.
3. 공식 소스 후보를 추가할 때 live check에서 4xx/5xx가 뜨는 상세 URL은 카탈로그에 남기지 말고 목록 소스나 승인 feed 후보로만 보강한다.

## 운영 feed 연결 순서

1. `docs/FREE_BENEFIT_FEED_HANDOFF.md`
2. `docs/SOURCE_FEED_ACTIVATION.md`
3. `docs/FREE_BENEFIT_EVENT_CONTRACT.md`
4. `/api/admin/source-feed-handoff`
5. `/api/admin/source-feed-activation`

운영 feed 검증 명령:

```bash
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
npm run test:home-realtime
npm run source:activation:doctor
```

## 파일별 참고

- `AGENTS.md`: 새 세션 작업 규칙
- `docs/CURRENT_STATE.md`: 현재 상태와 다음 작업
- `docs/FREE_BENEFIT_EVENT_CONTRACT.md`: FreeBenefitEvent 노출 계약
- `docs/FREE_BENEFIT_FEED_HANDOFF.md`: 운영 feed 연결 안내
- `docs/SOURCE_FEED_ACTIVATION.md`: source feed 활성화 절차
- `docs/SOURCE_FEED_ENV_REPORT.md`: source feed env readiness 보고서
