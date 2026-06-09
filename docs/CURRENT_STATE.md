# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

이 문서는 새 `codex` 세션에서 이전 긴 대화를 resume하지 않고 현재 워크트리만 기준으로 시작하기 위한 핸드오프 문서다.

## 시작 원칙

- 이전 대화는 resume하지 않는다.
- 기존 대화는 `/exit`로 닫고, 새 작업은 새 `codex` 세션에서 시작한다.
- 새 세션은 `AGENTS.md`, 이 파일, 현재 워크트리, 실제 명령 결과만 기준으로 판단한다.
- 사용자에게 중간 질문하지 않고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 진행한다.

## 현재 브랜치와 커밋

- Branch: `codex/12h-product-ux-growth-hardening`
- Remote tracking: `origin/codex/12h-product-ux-growth-hardening`
- 최신 확인 커밋:
  - `02a8d818 feat: add official pet sample benefit`
  - `9696e102 fix: block homepage-like official benefit links`
  - `e98e0ee0 feat: expand seoul public free service benefits`
  - `c70ab1ae feat: add seoul public free benefit events`
  - `cc1b72ff feat: prioritize low-friction free benefits`
  - `ec97d6b2 feat: add shinhancard official benefit events`
  - `37e0f517 test: guard home-like official benefit sources`
  - `1df27b8f docs: save current handoff state`
  - `0051cac0 feat: expand official public and food benefit sources`
  - `077489b4 test: enforce small mobile freebie viewport gate`
  - `f48772a7 feat: clarify free benefit participation conditions`
  - `44bc7444 feat: promote official public benefit seeds`

## 제품 방향

- 할인도사는 상품 구매 링크 앱이 아니라 무료혜택, 쿠폰, 샘플, 무료체험, 전원증정, 공식 이벤트 중심 플랫폼이다.
- 홈 상단은 무료혜택/쿠폰/0원딜/무료배송/오늘마감 중심으로 유지한다.
- 구매 상품 영역은 보조 섹션으로 취급한다.
- 비회원도 핵심 혜택은 열람 가능해야 하며, 찜/알림/개인화만 가입 유도와 연결한다.

## 데이터 상태

- 이번 보강 작업 시작 기준 HEAD: `49227568`
- 공식 소스 후보: `175`
- 뉴스/혜택 seed: `150`
- `data/refreshedNewsDeals.json` 기준 refreshed 항목: `147`
- `publishable=true`, `validationStatus=passed`, `availability=active` 기준 노출 가능 항목: `147`
- 최근 보강 소스:
  - 파파이스 공식 이벤트·쿠폰 혜택
  - 서울시 공공서비스예약 무료 체험·교육 혜택
  - 아모레몰 체험/샘플/포인트 혜택
  - 문화가 있는 날, K-MOOC, 복지로, 고용24 등 공공/교육 혜택
  - 카카오페이, OK캐쉬백, 해피포인트 등 포인트/멤버십 혜택
  - 신한카드 공식 신규 고객 연회비 캐시백, 생활요금 자동납부 캐시백 혜택
  - 서울시 공공서비스예약 공식 상세 무료 체험 4건: 월드컵공원 누에 생태 체험, 동대문구 수상스포츠 체험교육, 한양도성 역사 해설 체험, 서울퓨처랩 배틀봇 체험
  - 서울시 공공서비스예약 공식 상세 무료 서비스 4건: 광역반려식물병원 무료 진단, 우장산 청년 숲마실, 서서울호수공원 유아 자연체험, 사가정공원 유아숲 생태놀이
  - 로얄캐닌 코리아 공식 성장기 반려동물 캠페인: 6월 샘플 체험키트 증정과 모델 선발 이벤트 조건을 공식 상세 URL로 노출
  - 토스 공식 토스피드 출석체크·포인트 혜택
  - 아이챌린지 공식 베이비 월령별 무료체험교재 신청 혜택
  - GS25 공식 혜자로운빵 토스페이 1+1 개별 이벤트 상세 혜택
  - 무신사 공식 온라인 할인 쿠폰 받기 혜택

## 품질 정책

- 사용자 CTA에는 공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL만 연결한다.
- 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크는 사용자 화면에 노출하지 않는다.
- 데이터는 `publishable=true`, `availability=active`, `validationStatus=passed` 조건을 우선 적용한다.
- 공식 소스라도 검색 결과, 홈 URL, 카테고리 URL, 의미 없는 랜딩이면 노출하지 않는다.
- 홈/랜딩 성격의 공식 소스 후보는 `priority=low`와 “사용자 CTA 직접 노출 금지” 정책 문구가 있을 때만 카탈로그에 남길 수 있다.
- 홈 무료혜택 랭킹은 카드발급/구매/결제 조건형 혜택을 낮추고, 샘플/무료교육/공공무료/쿠폰/포인트처럼 바로 확인 가능한 혜택을 올린다.
- 링크 품질 문제를 UI 문구로 덮지 않는다.

## 주요 명령

- 개발 서버: `npm run dev`
- 웹 빌드: `npm run build`
- Android 웹 번들 반영: `npm run build:android`
- Capacitor 동기화: `npm run cap:sync`
- 뉴스 혜택 수집: `npm run refresh:news`
- 무료혜택 수집: `npm run refresh:benefits`
- 뉴스 링크 검증: `npm run verify:news`
- 무료혜택 검증: `npm run verify:freebies`
- 모바일 UX 게이트: `npm run test:mobile-ux`
- 보안 게이트: `npm run security:check`
- QA 게이트: `npm run qa`
- 릴리즈 닥터: `npm run release:doctor`
- 워크스페이스 산출물 점검: `npm run workspace:doctor:strict`

## 마지막 검증 상태

최근 안정 커밋 기준으로 다음 게이트가 통과한 상태로 기록되어 있다.

- `npm run refresh:news`: 150개 수집, 중복 제거 후 147개 노출
- `npm run refresh:benefits`: active 공식 무료혜택 이벤트 144개, 124개 소스, 94개 호스트
- `npm run verify:news`: 147/147 공식 혜택 링크 검증
- `npm run verify:freebies`: 143/143 통과
- `npm run qa`: 75/75 통과
- `npm run harness`: 통과
- `npm run test:mobile-ux`: 17/17 통과
- `npm run release:doctor`: 188/188 통과
- `npm run build`: 통과
- `npm run build:android`: 통과
- `npm run cap:sync`: 통과
- `npm run workspace:doctor:strict`: 재생성 산출물 0B 통과
- 검색 링크 노출: 0
- 비공식 링크 노출: 0
- 2026-06-09 추가 보강: `security:check`가 홈/랜딩 성격의 공식 소스 후보를 CTA 금지 정책 없이 허용하지 않도록 강화되었고, 현재 14/14 통과했다.
- 2026-06-09 추가 보강: 홈 무료혜택 랭킹에서 구매/카드발급/결제 조건형 혜택을 낮추고, 샘플/무료교육/공공무료/쿠폰/포인트처럼 바로 확인 가능한 혜택을 우선 노출하도록 조정했다.
- 2026-06-09 추가 보강: 서울시 공공서비스예약의 개별 무료 예약 상세 4건을 seed/catalog에 추가했고 모두 `publishable=true`, `validationStatus=passed`, `availability=active`로 검증됐다.
- 2026-06-09 추가 보강: 서울시 공공서비스예약의 무료 공공서비스 상세 4건과 로얄캐닌 반려동물 샘플 체험키트 공식 캠페인을 추가했고, 공식 혜택 143개와 무료혜택 이벤트 140개 기준으로 `qa`, `harness`, `build`, `build:android`, `cap:sync`가 통과했다.
- 2026-06-09 추가 보강: 사용자 CTA에 직접 노출되던 대표/메인 성격의 공식 혜택 seed 5건을 제거했다. 제거 항목은 문화누리카드 메인, L.POINT 혜택 메인, 고용24 메인, 한국장학재단 메인, 서울시 공공서비스예약 메인이다.
- 2026-06-09 추가 보강: 노출 공식 혜택의 `finalUrl` 중 root/main/index 계열 대표 URL은 0건으로 확인됐다.
- 2026-06-09 추가 보강: 로얄캐닌 코리아 공식 성장기 반려동물 샘플 체험키트 혜택을 추가했고 `refresh:news`, `verify:news`, `refresh:benefits`, `security:check`, `qa`, `harness`, `build`, `build:android`, `cap:sync`, `workspace:doctor:strict`가 통과했다.
- 2026-06-09 추가 보강: 토스 공식 출석체크·포인트 혜택과 아이챌린지 공식 무료체험교재 혜택을 무료혜택 seed로 승격했고, 아이챌린지를 공식 소스 카탈로그에 추가했다. 현재 공식 혜택 145개, 무료혜택 이벤트 142개 기준으로 `lint`, `verify:news`, `refresh:benefits`, `security:check`, `qa`, `harness`, `build`, `build:android`, `cap:sync`, `workspace:doctor:strict`가 통과했다.
- 2026-06-09 추가 보강: GS25 공식 혜자로운빵 토스페이 1+1 개별 이벤트 상세를 추가했고, 현재 공식 혜택 146개와 공식 소스 후보 174개 기준으로 `lint`, `verify:news`, `refresh:benefits`, `security:check`, `test:mobile-ux`, `build`, `release:doctor`, `qa`, `build:android`, `cap:sync`, `workspace:doctor:strict`가 통과했다.
- 2026-06-09 추가 보강: 무신사 공식 온라인 할인 쿠폰 받기 페이지를 추가했고, 현재 공식 혜택 147개와 공식 소스 후보 175개 기준으로 `lint`, `verify:news`, `refresh:benefits`, `security:check`, `test:mobile-ux`, `build`, `release:doctor`, `qa`, `build:android`, `cap:sync`, `workspace:doctor:strict`가 통과했다.
- 2026-06-09 확인: `next-env.d.ts`는 `./.next/dev/types/routes.d.ts` 경로를 참조하는 정상 상태다.

새 세션에서는 필요한 명령을 다시 실행해 실제 현재 상태를 확인한 뒤 진행한다.

## 워크트리 주의사항

- refresh, verification, release evidence 산출물 때문에 워크트리가 dirty일 수 있다.
- 현재 워크트리에는 QA/harness/refresh 실행으로 갱신된 report/data 산출물이 많이 남아 있을 수 있다. 새 세션은 먼저 `git status --short --branch`로 실제 dirty 범위를 확인한다.
- 2026-06-09 현재 확인 기준으로 소스 변경은 최신 커밋까지 push되어 있고, dirty 항목 대부분은 `reports/`, 루트 리포트, `docs/*REPORT*`, `data/refreshedDeals.json`, `data/verifiedNewsBenefitImages.json`, `data/linkValidationExposureOverrides.json` 같은 재생성 산출물이다.
- `git add .`를 쓰지 말고 이번 작업 관련 파일만 명시적으로 stage한다.
- 빌드 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 `./.next/dev/types/routes.d.ts`로 되돌린다.
- 정상 동작 중인 Vercel, Android/Capacitor, 환경변수, Supabase 설정을 깨뜨리지 않는다.

## 다음 추천 작업

1. 공식 무료혜택 소스 중 카드/페이/통신/공공/교육/브랜드 이벤트 영역을 추가 확장한다.
2. 추가 전에는 공식 URL이 검색/홈/커뮤니티/종료 페이지가 아닌지 검증한다.
3. `refresh:news`, `refresh:benefits`, `verify:news`, `verify:freebies`, `security:check`, `release:doctor`를 통과시킨다.
4. 관련 파일만 stage해서 작은 단위로 commit/push한다.
