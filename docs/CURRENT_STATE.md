# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

## 새 세션 시작 규칙

- 이전 대화는 resume하지 않는다.
- 새 `codex` 세션은 `AGENTS.md`, 이 파일, 현재 워크트리만 기준으로 시작한다.
- 기존 대화는 `/exit`로 닫고, 새 작업은 새 `codex` 세션에서 시작한다.
- 사용자에게 중간 질문하지 않고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 판단한다.

## Git 상태

- Branch: `codex/12h-product-ux-growth-hardening`
- Remote: `origin/codex/12h-product-ux-growth-hardening`
- 최근 커밋:
  - `59341f5d docs: refresh launch handoff evidence`
  - `d6f075fe feat: disable empty home free benefit filters`
  - `d8e9a8fe docs: refresh current state handoff`
  - `44c129c3 test: cover home free benefit counts`
  - `c3f70882 feat: share free benefit counts with home hero`
  - `fad0394d feat: use server free benefit counts in filters`
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

- 무료혜택 데이터 모델과 계약이 정리되어 있다.
  - `types/freeBenefitEvent.ts`
  - `lib/freeBenefitEvents.ts`
  - `scripts/free-benefit-event-contract-doctor.mjs`
- 홈과 `/free-benefits`는 12개 무료혜택 필터 계약을 공유한다.
  - 전체, 전원증정, 선착순, 쿠폰, 샘플, 무료체험, 기프티콘, 포인트/캐시백, 출석체크, 신규가입, 공공무료, 체험단
- `/api/benefits/events`는 위 12개 필터의 active publishable 카운트를 `categories`, `categoryCounts`, `filteredCategoryCounts`로 함께 내려준다.
- `/free-benefits` 화면은 API 제공 카테고리 카운트를 우선 사용하고, 0개 필터는 비활성화 톤으로 표시한다.
- `/api/home`과 홈 상단 무료혜택 히어로도 같은 카테고리 카운트를 사용해 첫 화면 빠른 필터 숫자를 맞춘다.
- 홈 빠른 필터는 URL 파라미터로 `/free-benefits` 필터 상태를 복원한다.
- 홈 빠른 필터에서 서버 카운트가 0개인 카테고리는 링크 대신 `aria-disabled="true"` 비활성 칩으로 표시해 빈 결과 화면으로 이동하지 않게 한다.
- 무료혜택 CTA는 공식 이벤트/신청 URL만 통과시키는 정책으로 운영한다.
- source feed starter pack은 12개 lane 기준으로 확장되어 있다.
- 공식 소스 후보는 파스쿠찌 공식 이벤트 목록과 던킨 공식 프로모션 목록까지 포함해 140개 수준이다.
- source activation gate는 live doctor, breadth doctor, benefit event contract를 함께 본다.
- `source:feed-env:doctor`는 starter pack을 읽어 12개 lane의 다음 feed 활성화 큐, 우선 검토 후보, 운영자 체크리스트를 `docs/SOURCE_FEED_ENV_REPORT.md`에 함께 남긴다.

## 최근 검증 상태

최근 안정 상태에서 아래 검증이 통과했다.

```bash
npm run source:catalog:report
npm run source:breadth:doctor
npm run source:live:doctor
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
npm run source:activation:doctor
npm run security:check
npm run lint
npm run test:mobile-compact
npm run release:doctor
npm run smoke:local
npm run harness
npm run qa
npm run build
npm run build:android
npm run cap:sync
npm run workspace:doctor:strict
```

주의:

- build 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 기존 `./.next/dev/types/routes.d.ts` 정책으로 되돌린다.
- Android web assets는 `workspace:doctor:strict` 정리 후 삭제될 수 있다. 앱 반영이 필요하면 `npm run build:android && npm run cap:sync`를 다시 실행한다.
- 마지막 안정 상태에서는 `workspace:doctor:strict`가 재생성 산출물 `0B`로 통과했다.

## 다음 작업 후보

1. 실제 운영 feed URL을 Vercel env에 연결하기 전 `docs/SOURCE_FEED_ENV_REPORT.md`, `docs/FREE_BENEFIT_FEED_HANDOFF.md`, `docs/SOURCE_FEED_ACTIVATION.md` 기준으로 검증한다.
2. 공공/교육/반려동물/문화/카페 프랜차이즈 무료혜택 후보를 추가하되, 사용자 CTA는 공식 상세 또는 신청 페이지가 active이고 무료 조건이 확인된 경우에만 연결한다.
3. 홈 히어로 빠른 필터는 현재 0개 카테고리를 비활성화 톤으로 표시한다. 다음에는 실제 모바일 화면에서 노출 순서와 숨김/비활성 정책 중 어느 쪽이 전환율이 좋은지 확인한다.
4. 새 공식 후보를 추가하면 아래 순서로 먼저 검증한다.

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:breadth:doctor
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
```

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
