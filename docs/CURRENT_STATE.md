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
- 현재 최신 원격 반영 커밋: `4631e5c6 feat: expand public education benefit sources`
- 현재 워크트리에는 공식 무료혜택 소스 카탈로그를 확장하고 검증 리포트를 갱신한 변경이 있으며, 아직 커밋 전이다.

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
- 투썸플레이스, 메가MGC커피, 쿠팡이츠, 롯데마트, 다이소몰 공식 무료혜택 소스 신호 추가: `c77953ca`
- G마켓, 옥션, 이벤트하우스 공식/보조 무료혜택 소스 신호 추가: `b570bb98`
- 홈 API 내부 오류 메시지 노출 방지: `3b9dae86`
- 홈 검색 UX를 무료혜택·쿠폰 중심으로 전환: `7852c351`
- 배스킨라빈스, 던킨, 파리바게뜨, 해피포인트, OK캐쉬백, L.POINT 공식 혜택 소스 확장: `d1713437`
- EBS, KOCW, 고용24, 로얄캐닌 공공·교육·반려동물 혜택 소스 확장: `4631e5c6`
- `benefit:event:contract`는 홈과 `/free-benefits`의 조건/검증 배지를 회귀 검사한다.
- 최근 안정 검증: `source:catalog:report`, `source:breadth:doctor`, `refresh:benefits`, `verify:benefits`, `benefit:event:contract`, `security:check`, `lint`, `test:mobile-compact`, `release:doctor`, `build`, `smoke:local`, `harness`, `qa`, `build:android`, `cap:sync` 성공.

## 현재 커밋 전 변경 요약

공식 무료혜택 소스 카탈로그를 더 넓혔다. 구매 상품 중심이 아니라 서울 청년 무료지원, 서울런4050 평생학습, 한강공원 무료 행사, 보조금24 공식 안내처럼 공공 무료 혜택 후보를 강화했다.

변경 내용:

- `data/officialSourceCatalog.json`에 서울청년 청년지원정보, 서울런4050, 한강공원 행사·공연, 행정안전부 보조금24 공식 안내 후보를 추가했다.
- `scripts/free-benefit-source-breadth-doctor.mjs`에 서울청년, 서울런4050, 한강공원, 보조금24 신호를 추가해 카탈로그 회귀를 막는다.
- 공식 소스 후보는 137개로 늘었고, source breadth doctor는 12/12 수집 축을 통과한다.
- source live doctor 기준 공식 후보 117/137개 reachable, 20개 guarded, stale_or_removed 0건이다.
- `refresh:benefits` 기준 공식 active 혜택은 102/100 기준을 통과했고, 검색 링크/비공식 링크 노출은 0건이다.

주의:

- 이벤트하우스는 보조 발견 소스다. 사용자 CTA는 이벤트하우스 글이 아니라 원 브랜드 공식 이벤트·신청 URL로만 연결한다.
- G마켓/옥션도 검색 결과, 대표몰 메인, 상품 리스트가 아니라 공식 이벤트 상세와 조건 확인 항목만 publishable로 전환한다.
- 서울청년/서울런4050/한강공원 계열은 목록을 발견 소스로만 쓰고, 사용자 CTA는 공식 상세 또는 신청 페이지가 active이고 무료 조건이 확인된 경우에만 연결한다.

변경 파일:

- `data/officialSourceCatalog.json`
- `scripts/free-benefit-source-breadth-doctor.mjs`
- 공식 소스/무료혜택/검증 관련 리포트와 문서들
- `docs/CURRENT_STATE.md`

검증 결과:

- `npm run source:catalog:report` 성공, 공식 소스 후보 137개
- `npm run source:breadth:doctor` 성공, 12/12
- `npm run source:live:doctor` 성공, reachable 117/137, guarded 20, stale_or_removed 0
- `npm run refresh:benefits` 성공, freebies 42/42, events 101/101, 검색 링크 0, 비공식 링크 0
- `npm run verify:benefits` 성공, active official events 102/100
- `npm run benefit:event:contract` 성공, 16/16
- `npm run security:check` 성공, 11/11
- `npm run lint` 성공
- `npm run test:mobile-compact` 성공, 14/14
- `npm run release:doctor` 성공, 188/188
- `npm run smoke:local` 성공, 103/103
- `npm run harness` 성공
- `npm run qa` 성공, 75/75
- `npm run build` 성공
- `npm run build:android` 성공
- `npm run cap:sync` 성공

## 다음 세션에서 바로 할 일

1. `git status --short --branch`로 현재 변경 상태를 확인한다.
2. 필요하면 `npm run workspace:doctor:strict`를 실행해 재생성 산출물 상태를 확인한다.
3. 서울 공공 무료지원 공식 소스 확장 변경을 커밋한다.
   - 권장 커밋 메시지: `feat: expand civic free benefit sources`
4. 가능하면 원격 브랜치에 push한다.
5. 이어서 실제 운영 feed URL 연결, 공공/교육/반려동물 무료혜택 후보 확대, Vercel env feed 연결 검증을 진행한다.

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
