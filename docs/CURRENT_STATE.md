# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

## 세션 규칙

- 이전 대화는 resume하지 않는다.
- 새 세션은 `AGENTS.md`와 이 파일만 읽고 시작한다.
- 기존 대화는 `/exit`로 닫고, 새 작업은 새 `codex` 세션에서 시작한다.
- 사용자에게 중간 질문하지 않고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 판단한다.

## 현재 브랜치와 기준 상태

- Branch: `codex/12h-product-ux-growth-hardening`
- Remote: `origin/codex/12h-product-ux-growth-hardening`
- 현재 최신 커밋: `dae76931 feat: show free benefits page claim conditions`
- 현재 워크트리에는 공식 무료혜택 소스 카탈로그 확장 변경이 있으며, 아직 커밋 전이다.

## 현재 제품 방향

할인도사는 상품 구매 링크 앱이 아니라 무료혜택 중심 플랫폼이다.

우선순위:

1. 공식 무료혜택, 쿠폰, 샘플, 체험, 전원증정, 선착순, 출석체크, 신규가입 혜택을 홈 상단에 우선 노출한다.
2. 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크는 사용자 CTA에 노출하지 않는다.
3. 공식 이벤트, 신청, 쿠폰, 샘플, 출석체크, 무료체험 URL만 혜택 CTA에 연결한다.
4. 비회원도 핵심 혜택은 볼 수 있게 유지하고, 찜/알림/개인화만 가입 유도와 연결한다.
5. Android/Capacitor, Vercel, QA, release doctor 기준을 낮추지 않는다.

## 최근 완료된 안정 상태

- 홈 무료혜택 빠른 필터 추가: `72d79c57`
- 홈 무료혜택 카드 조건/신뢰 배지 추가: `30173ddf`
- 무료혜택 전용 화면 카드 조건/신뢰 배지 추가: `dae76931`
- `benefit:event:contract`는 홈과 `/free-benefits`의 조건/검증 배지를 회귀 검사한다.
- 최근 안정 검증: `lint`, `benefit:event:contract`, `test:mobile-compact`, `security:check`, `release:doctor`, `build`, `build:android`, `cap:sync`, `workspace:doctor:strict` 성공.

## 현재 커밋 전 변경 요약

공식 무료혜택 소스 카탈로그를 114개에서 119개로 확장했다.

추가한 공식 소스 후보:

- 투썸플레이스 공식 앱·멤버십 혜택
- 메가MGC커피 공식 이벤트·쿠폰
- 쿠팡이츠 공식 무료배달·쿠폰 혜택
- 롯데마트 공식 행사·쿠폰 혜택
- 다이소몰 공식 이벤트·쿠폰

변경 파일:

- `data/officialSourceCatalog.json`
- `scripts/free-benefit-source-breadth-doctor.mjs`
- `scripts/lib/release-doctor-operational-data.mjs`
- `docs/OFFICIAL_SOURCE_CATALOG.md`
- `docs/FREE_BENEFIT_SOURCE_BREADTH.md`

검증 결과:

- `npm run source:catalog:report` 성공, 공식 소스 119개, 카테고리 10/10, provider 4/4
- `npm run source:breadth:doctor` 성공, 수집 축 12/12, 핵심 브랜드 신호 42/42
- `npm run lint` 성공
- `npm run release:doctor` 성공, 188/188

## 다음 세션에서 바로 할 일

1. `git status --short --branch`로 현재 변경 상태를 확인한다.
2. 필요하면 `npm run workspace:doctor:strict`를 실행해 재생성 산출물 상태를 확인한다.
3. 위 공식 소스 확장 변경을 커밋한다.
   - 권장 커밋 메시지: `feat: expand free benefit source signals`
4. 가능하면 원격 브랜치에 push한다.
5. 이어서 실제 운영 feed URL 연결 또는 무료혜택 수집량 확대 작업을 진행한다.

## 운영 feed 연결 순서

운영 feed URL을 Vercel env에 연결할 때는 아래 순서를 기준으로 한다.

1. `docs/FREE_BENEFIT_FEED_HANDOFF.md`
2. `docs/SOURCE_FEED_ACTIVATION.md`
3. `docs/FREE_BENEFIT_EVENT_CONTRACT.md`
4. `/api/admin/source-feed-handoff`
5. `/api/admin/source-feed-activation`

검증 명령:

```bash
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
npm run test:home-realtime
npm run source:activation:doctor
```

## 주의

- `reports/source-feed-activation.json`은 `reports/*` ignore 규칙에 걸릴 수 있지만 release doctor 증거라면 `git add -f`로 추적한다.
- `docs/FREE_BENEFIT_FEED_HANDOFF.md`는 생성 시각만 바뀔 수 있으니 커밋 전 노이즈 여부를 확인한다.
- build 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 기존 dev 타입 경로 정책으로 되돌린다.
- Android web assets는 strict workspace 정리 후 삭제될 수 있다. 앱 반영이 필요하면 `npm run build:android && npm run cap:sync`를 다시 실행한다.
