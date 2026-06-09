# 할인도사 현재 상태

작성 시점: 2026-06-09, Asia/Seoul

최종 정리 시점: 2026-06-09 15시대, Asia/Seoul

이 파일은 새 `codex` 세션에서 이전 긴 대화를 resume하지 않고 현재 프로젝트 상태만 파악하기 위한 시작 문서다.

## 최신 핸드오프 요약

- 이전 대화는 새 세션에서 resume하지 않는다. 새 `codex` 세션은 `AGENTS.md`, 이 파일, 현재 워크트리만 기준으로 시작한다.
- 현재 브랜치는 `codex/12h-product-ux-growth-hardening`이다.
- 최신 푸시된 안정 커밋은 `213160fd feat: expand payco official benefit sources`다.
- 현재 워크트리에는 카카오페이 공식 결제·쿠폰·멤버십 혜택 소스 3개 보강 결과와 QA/리포트 재생성 산출물이 남아 있다.
- 카카오페이 보강 결과:
  - 공식 소스 후보 `151`개
  - `refresh:news` 기준 노출 공식 혜택 `118`개
  - `refresh:benefits` 기준 active 무료혜택 이벤트 `115`개
  - 새 카카오페이 혜택 3개 모두 `publishable=true`, `validationStatus=passed`, `availability=active`, `linkType=official_coupon`
  - 최신 source live check 기준 reachable `129`, guarded `22`, stale_or_removed `0`
- 최신 추가 보강 결과:
  - OK캐쉬백 공식 쇼핑적립 포인트 혜택
  - OK캐쉬백 공식 포인트·이벤트 서비스 안내
  - 해피포인트 공식 멤버십 등급 혜택 안내
  - 공식 소스 후보 `154`개
  - `refresh:news` 기준 노출 공식 혜택 `121`개
  - `refresh:benefits` 기준 active 무료혜택 이벤트 `118`개
  - 새 OK캐쉬백/해피포인트 혜택 3개 모두 `publishable=true`, `validationStatus=passed`, `availability=active`, `linkType=official_coupon`
  - `refresh:benefits` 기준 무료혜택 `53/53`, 공식 이벤트 `117/117`, 검색 링크 노출 `0`, 비공식 링크 노출 `0`
- 새 세션에서 커밋이 필요하면 `git add .`를 쓰지 말고 카카오페이 보강 관련 파일만 명시적으로 stage한다.

## 새 세션 시작 규칙

- 이전 대화는 resume하지 않는다.
- 기존 대화는 `/exit`로 닫고, 새 작업은 새 `codex` 세션에서 시작한다.
- 새 `codex` 세션은 `AGENTS.md`, 이 파일, 현재 워크트리만 기준으로 시작한다.
- 사용자에게 중간 질문하지 않고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 판단한다.

## Git 상태

- Branch: `codex/12h-product-ux-growth-hardening`
- 최근 안정 커밋:
  - 최신 검증 작업: 카카오페이 공식 결제·쿠폰·멤버십 혜택 소스 3개 보강, 검증 완료
  - 최신 저장 작업: PAYCO 공식 쿠폰·포인트 혜택 소스 3개 보강, 검증 완료
  - `0365f635 feat: expand telecom free benefit sources`
  - `b8685ae9 chore: harden cron refresh security guards`
  - `91080983 feat: expand official free benefit sources`
  - `bf620a86 docs: update current state after cron readiness commit`
  - `0cfb6f41 test: surface benefits cron readiness in admin`
  - `cb899921 test: expose benefits cron health gates`
  - `a2704ad2 feat: expand official pet benefit sources`
  - `f57c287c test: require roulette benefit release evidence`
  - `6fcffddb feat: add roulette free benefit category`
  - `72bdc8b4 test: guard free benefit first home exposure`
  - `c37f7a83 docs: record mobile free benefit ux gate`
  - `16848082 test: enforce mobile free benefit category chips`
- 워크트리는 refresh, verification, release evidence 산출물 때문에 dirty일 수 있다.
- 코드 커밋 시 `git add .`를 피하고 필요한 파일만 명시적으로 stage한다.

최근 완료 작업:

- 카카오페이 공식 결제·쿠폰·멤버십 혜택 소스를 추가했다.
  - 카카오페이 공식 결제 포인트 혜택
  - 카카오페이 공식 혜택·쿠폰 고객센터 안내
  - 카카오페이 공식 멤버십 적립 사용 가이드
- 공식 소스 후보는 151개, `refresh:news` 기준 노출 공식 혜택은 118개, `refresh:benefits` 기준 active 무료혜택 이벤트는 115개다.
- 새 카카오페이 혜택 3개는 모두 `publishable=true`, `validationStatus=passed`, `availability=active`, `linkType=official_coupon`으로 확인됐다.
- 최신 source live check 기준 reachable 129개, guarded 22개, stale_or_removed 0개다.

- OK캐쉬백/해피포인트 공식 멤버십·포인트 혜택 소스를 추가했다.
  - OK캐쉬백 공식 쇼핑적립 포인트 혜택
  - OK캐쉬백 공식 포인트·이벤트 서비스 안내
  - 해피포인트 공식 멤버십 등급 혜택 안내
- 공식 소스 후보는 154개, `refresh:news` 기준 노출 공식 혜택은 121개, `refresh:benefits` 기준 active 무료혜택 이벤트는 118개다.
- 새 OK캐쉬백/해피포인트 혜택 3개는 모두 `publishable=true`, `validationStatus=passed`, `availability=active`, `linkType=official_coupon`으로 확인됐다.

- PAYCO 공식 쿠폰·포인트 혜택 소스를 추가했다.
  - PAYCO 공식 리워드 포인트 혜택
  - PAYCO 공식 모여서 쿠폰 쓰기 참여 가이드
  - PAYCO 공식 프로모션 코드·쿠폰 등록 안내
- 공식 소스 후보는 148개, `refresh:news` 기준 노출 공식 혜택은 115개, `refresh:benefits` 기준 active 무료혜택 이벤트는 112개다.
- 새 PAYCO 혜택 3개는 모두 `publishable=true`, `validationStatus=passed`, `availability=active`, `linkType=official_coupon`으로 확인됐다.
- 최신 source live check 기준 reachable 126개, guarded 22개, stale_or_removed 0개다.

- 통신사 공식 무료혜택 소스를 추가했다.
  - LG U+ 공식 멤버십 제휴사 혜택
  - KT 공식 요고 모바일 가입 혜택
  - LG U+ 공식 진행 이벤트 혜택
- 공식 소스 후보는 145개, `refresh:news` 기준 노출 공식 혜택은 112개, `refresh:benefits` 기준 active 무료혜택 이벤트는 109개다.
- 새 통신사 혜택 3개는 모두 `publishable=true`, `validationStatus=passed`, `availability=active`로 확인됐다.
- 이 변경은 `0365f635 feat: expand telecom free benefit sources`로 커밋/푸시했다.

- 보호된 cron refresh API 보안을 강화했다.
  - `/api/cron/refresh`, `/api/cron/benefits`는 Origin 헤더가 있는 브라우저 요청에 대해 신뢰된 origin만 허용한다.
  - cron 실행 결과의 `stdoutTail`, `stderrTail`은 secret, token, 로컬 경로, stack trace성 라인을 제거한 뒤 리포트/API payload에 남긴다.
  - `security:check`와 `cron:refresh:doctor`가 이 보안 기준을 검사한다.

- 공식 무료혜택 소스 후보를 확장했다.
  - 네이버페이 온라인 쿠폰함
  - 요기요 룰렛 쿠폰 프로모션
  - LG전자 혜택 이벤트 허브
  - 롯데하이마트 L.POINT 멤버십 혜택
- `data/newsDeals.seed.json`, `data/officialSourceCatalog.json`, refresh/verification 관련 docs와 reports를 갱신했다.
- 이 변경은 `91080983 feat: expand official free benefit sources`로 커밋/푸시했다.

- 관리자 화면에 무료혜택 cron 상태와 `benefits dry-run` 링크를 노출했다.
  - `app/admin/page.tsx`
  - `components/AdminCronRefreshPanel.tsx`
  - `lib/adminDashboardHrefs.ts`
- 운영 헬스 리포트에 `cronBenefits` 항목을 추가했다.
  - `lib/operations/healthReadiness.ts`
  - `scripts/health-readiness-report.mjs`
  - `docs/HEALTH_READINESS_REPORT.md`
- smoke/release doctor가 무료혜택 cron 운영 상태를 검사하도록 보강했다.
  - `scripts/lib/smoke-admin-checks.mjs`
  - `scripts/release-doctor.mjs`
- 이 변경은 `0cfb6f41 test: surface benefits cron readiness in admin`로 커밋/푸시했다.

새 세션 시작 체크:

```bash
git status --short --branch
npm run lint
npm run smoke:local
npm run release:doctor
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
- 공식 소스 후보는 142개다.
- 마지막 official source live check 기준:
  - reachable 119
  - guarded 19
  - stale_or_removed 0
- 최신 보강 라운드에서 공식 소스 후보는 142개, live check 기준 reachable 122개, guarded 20개, stale_or_removed 0개까지 확인했다.
- `refresh:news` 기준 공식 혜택은 109개, `refresh:benefits` 기준 active 무료혜택은 106개, source 96개, host 76개다.
- 새로 보강한 공식 소스:
  - 네이버페이 공식 온라인 쿠폰함
  - 요기요 공식 룰렛 쿠폰 프로모션
  - LG전자 공식 혜택·이벤트 허브
  - 롯데하이마트 공식 L.POINT 멤버십 혜택
- 반려동물 샘플 lane은 로얄캐닌과 퓨리나 공식 이벤트/0원딜 소스를 포함해 최소 3개 기준으로 강화되어 있다.
- 공식 소스 카탈로그는 동일 `officialUrl` 중복을 `duplicate_official_url`로 실패 처리한다.
- `security:check`는 공식 소스 카탈로그가 검색/커뮤니티/비공식/약한 CTA 정책을 포함하지 않는지도 검사한다.
- `release:doctor`는 보안 게이트, 무료혜택 계약, 홈 노출 순서, 모바일 필터 evidence를 검사한다.
- `/api/health`는 `/api/cron/refresh`뿐 아니라 `/api/cron/benefits` 상태도 별도로 노출한다.
  - `cronBenefitsStatus`
  - `cronBenefitsVisibleActiveEvents`
  - `cronBenefitsSourceCount`
  - `cronBenefitsRefreshReportPath`
  - `cronBenefitsEventsReportPath`
- `smoke:local`, `release:doctor`, `cron:refresh:doctor`는 무료혜택 cron 상태와 100개 이상 active official benefit evidence를 검사한다.
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
npm run health:readiness
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

현재 미커밋 cronBenefits 관리자/헬스 변경 후 확인한 명령:

```bash
npm run lint
npm run health:readiness
npm run smoke:local
npm run release:doctor
npm run build
npm run security:check
npm run qa
npm run harness
npm run build:android
npm run cap:sync
npm run workspace:doctor:strict
```

검증 결과:

- `qa`: 75/75 통과
- `harness`: 통과
- `workspace:doctor:strict`: 재생성 산출물 0B 통과
- `build:android`: 성공
- `cap:sync`: 성공 후 `out`, `android/app/src/main/assets/public`, `android/app/src/main/assets/capacitor.config.json`은 재생성 산출물이라 삭제했다.
- `npm run build`와 `npm run build:android` 이후 `next-env.d.ts`는 `./.next/dev/types/routes.d.ts`로 되돌려 두었다.

## 새 세션에서 이어서 하면 좋은 작업

1. Vercel Production에서 `CRON_SECRET`이 설정된 상태로 `/api/cron/benefits?dryRun=true`와 `/api/health`를 확인한다.
2. 공식 feed URL을 실제 환경변수에 연결하기 전 `source:feed-env:doctor`, `news:feed:canary`, `refresh:benefits` 순서로 검증한다.
3. 공공/교육/카페/반려동물 무료혜택 후보를 추가하되 공식 상세 또는 신청 URL만 CTA로 사용한다.
4. release evidence dirty 파일은 최종 release candidate 직전에만 새 커밋 기준으로 재생성한다.

## 주의

- 빌드 후 `next-env.d.ts`가 `./.next/types/routes.d.ts`로 바뀌면 `./.next/dev/types/routes.d.ts`로 되돌린다.
- `.next`를 삭제할 때는 절대경로가 현재 workspace 내부인지 확인한다.
- release evidence 문서들은 doctor freshness를 맞추기 위해 dirty 상태로 남아 있을 수 있다.
- 이전 대화 내용은 새 세션에서 참조하지 않는다.
