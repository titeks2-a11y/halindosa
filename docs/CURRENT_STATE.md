# 할인도사 현재 상태

작성 시점: 2026-06-11, Asia/Seoul

이 문서는 새 Codex 세션이 이전 긴 대화에 의존하지 않고 현재 워크트리와 실제 명령 결과만으로 이어받기 위한 핸드오프 문서다.

## 현재 기준

- Branch: `codex/12h-product-ux-growth-hardening`
- 최신 확인 HEAD: 새 세션 시작 시 `git log -1 --oneline`으로 확인한다. 이 문서 직전 기준은 `929fda6a feat: diversify free benefit hero recommendations`였다.
- Remote: `origin/main`, `origin/codex/12h-product-ux-growth-hardening` 모두 최신 HEAD까지 push 완료
- 운영 URL: `https://www.halindosa.com`
- Vercel Production Deploy: 최신 확인 기준 실패. GitHub Actions에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` Secrets가 없어 Vercel CLI 배포 단계가 skip되고, 기존 운영 URL만 확인하다가 최신 커밋 메타데이터가 없어 차단된다.
- 로컬 최신 홈페이지: `http://127.0.0.1:3000/?verifiedOnly=true`
- 운영 API 최신 계약 확인:
  - `/api/home?limit=1&verifiedOnly=true`: HTTP 200
  - 응답 body `requestId` 존재
  - `X-Request-Id` 헤더 존재
  - `X-RateLimit-Remaining` 헤더 존재
  - `Cache-Control`은 no-store 계열
  - 단, 운영 API는 아직 이전 배포 기준으로 `newsDeals=120`, `freeBenefitEvents=72`, `deployment.shortCommit` 없음. 로컬 최신 기준은 `newsDeals=151`, `freeBenefitEvents=128`, 무료혜택 검증 181/181이다.

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
- 홈 무료혜택 히어로는 브랜드 키를 정규화해 같은 브랜드 샘플/쿠폰이 첫 화면에 반복 노출되는 문제를 줄인다.

## 현재 데이터 품질 기준

- 상품 링크:
  - 총 140개 검증 URL
  - 사용자 노출 가능 138~140개 범위
  - 검색 링크 노출 0건
  - 품절/종료 링크 노출 0건
  - hard failure 노출 0건
  - 외부몰 일시 5xx/접근보호 이슈는 고객 노출에서 숨기고 운영자 재검증 큐로 보낸다.
- 공식 혜택:
  - `refresh:news` 기준 185개 공식 혜택 노출
  - `verify:news` 기준 185/185 공식 혜택 링크 검증
  - 기본 top consumer feed는 공공정책성 혜택 0건
- 무료혜택:
  - `refresh:benefits` 기준 무료혜택 109/109, 공식 이벤트 162/162
  - `verify:freebies` 기준 181/181 visible, 검색 링크 0, 비공식 링크 0, 깨진 이미지 0
  - FreeBenefitEvent 기준 active official events 177개, sources 141개, hosts 107개
  - 공식 소스 후보 212개, reachable/guarded 186/26 분리 관리

## 최근 통과한 로컬 검증

- `npm run lint`: 통과
- `npm run test:mobile-ux`: 17/17 통과
- `npm run verify:freebies`: 181/181 통과
- `npm run smoke:local`: 103/103 통과
- `npm run release:prepare:reports:ci`: 27/27 통과
- `npm run release:doctor`: 189/189 통과
- `npm run qa`: 71/71 통과
- `npm run build`: 통과
- `npm run build:android`: 통과
- `npm run cap:sync`: 통과
- `npm run vercel:doctor`: 기본 운영 계약 검증은 통과 가능. `REQUIRE_DEPLOY_COMMIT=true EXPECTED_DEPLOY_COMMIT=<latest_sha> npm run vercel:doctor`는 현재 운영 도메인이 이전 배포라 실패한다.

## CI/Vercel 상태 해석

- 최신 Vercel Production Deploy는 실패가 맞다. 최신 커밋이 운영 도메인에 실제 반영되지 않은 상태를 엄격 검증이 잡아낸 것이다.
- GitHub Actions job에서 `Launch verification gates`, `Pull Vercel environment`, `Build Vercel production artifact`, `Deploy Vercel production artifact`, `Verify deployed URL` 단계가 skipped이면 Vercel Secrets가 없다는 뜻이다.
- 해결: GitHub Repository Secrets에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 설정하거나, Vercel 프로젝트의 GitHub main 브랜치 자동 배포 연결을 복구한 뒤 최신 main을 redeploy한다.
- GitHub CI는 concurrency 때문에 이전 커밋의 실패/취소 기록이 남아 있을 수 있다.
- CI가 실패하면 먼저 실패 job의 마지막 단계가 `Release doctor`인지 확인한다.
- 로컬 재현 순서:
  1. `npm run release:prepare:reports:ci`
  2. `npm run release:doctor`
  3. `npm run qa`
- 위 순서가 로컬에서 통과하면, 새 커밋으로 CI를 다시 돌려 최신 기준으로 확인한다.

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
- Vercel 운영 배포 검증: `npm run vercel:doctor`
- 워크스페이스 산출물 점검: `npm run workspace:doctor:strict`

## 워크트리 주의사항

- QA, refresh, release prepare를 실행하면 루트 리포트, `docs/*REPORT*`, `reports/*.json`, `data/refreshedDeals.json`, `data/refreshedNewsDeals.json`, `data/verifiedNewsBenefitImages.json` 등이 많이 갱신된다.
- 대부분 재생성 산출물이므로 커밋 전에 의도한 파일만 선별 stage한다.
- `git add .`를 피한다.
- 빌드 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 `./.next/dev/types/routes.d.ts`로 되돌린다.
- 정상 동작 중인 Vercel, Android/Capacitor, 환경변수, Supabase 설정을 깨뜨리지 않는다.

## 다음 추천 작업

1. CI가 최신 HEAD에서 최종 성공하는지 확인한다.
2. `reports/`와 루트 리포트의 재생성 산출물 정책을 더 줄여 워크트리 노이즈를 낮춘다.
3. 홈 화면의 무료혜택/쿠폰/샘플/체험 이벤트 카드 밀도를 더 높이고, 공공성 혜택은 명시 필터로만 보이게 유지한다.
4. 공식 소스 feed URL이 실제로 연결되면 `news:feed:canary`가 seed fallback이 아닌 external feed 성공으로 바뀌는지 확인한다.
