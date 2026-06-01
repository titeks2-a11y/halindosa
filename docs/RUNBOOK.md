# 할인도사 운영 런북

## 로컬 검증

```bash
npm install
npm run lint
npm run build
npm run audit:commercial
npm run dev
npm run smoke
```

## 주요 헬스 체크

- 메인: `GET /`
- 특가 API: `GET /api/deals?limit=3`
- 실시간 특가 API: `GET /api/deals?q=노트북%20특가&sort=latest`
- 헬스체크: `GET /api/health`
- 운영 지표: `GET /api/metrics`
- 상세 API: `GET /api/deals/d001`
- 가격 이력: 상세 API의 `priceHistory`, `priceInsight` 필드 확인
- 신고 API: `POST /api/reports`
- 신고 큐: `GET /api/admin/reports?token=$ADMIN_EXPORT_TOKEN`
- 피드 dry-run: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
- 리다이렉트: `GET /api/redirect/d001?from=runbook`
- 제휴/판매처 fallback 상태: `GET /api/affiliate/status`
- 관리자: `GET /admin?token=$ADMIN_EXPORT_TOKEN`
- CSV export: `GET /api/admin/export?token=$ADMIN_EXPORT_TOKEN`
  - 링크 검수 작업에 필요한 `linkStatus`, `linkType`, `reviewPriority`, `reviewAction`, `reviewReason`, `purchaseConfidence`, `checkedAt`, `finalPurchaseUrl` 필드를 함께 내보낸다.
  - 운영자는 CSV를 스프레드시트로 열어 우선 검수 상품부터 실제 상품 상세 URL을 보강하고, 다음 피드 import 전에 원본 데이터의 `productUrl` 또는 `finalPurchaseUrl`에 반영한다.
- 피드 dry-run import: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
  - 신규/보강 피드는 `affiliateUrl` → `finalPurchaseUrl` → `productUrl` → `purchaseUrl` → `link` → `originalUrl` → `searchUrl` 순서로 실제 구매 이동 URL을 판정한다.
  - `linkSummary.verified`와 `linkSummary.needsReview`를 확인해 출시 전 실제 상품 상세 URL 비율을 관리한다.
  - 검색 결과 fallback, 쇼핑몰 메인, 커뮤니티/placeholder URL, 중복 externalId, 같은 판매처의 중복 상품명은 `rows[].status = "needs_fix"`로 돌려준다. 운영 반영 전 모든 행이 `ready`인지 확인한다.
  - 관리자 화면의 붙여넣기 dry-run 패널은 `행별 검수 결과`, `ready 행`, `needs_fix 행`, `수정 필요 필드`를 함께 표시한다. `needs_fix` 행은 `primaryUrlField`와 사유를 먼저 고친 뒤 다시 dry-run을 실행한다.

## 자동 smoke test

개발 서버가 실행 중인 상태에서 아래 명령으로 핵심 상업화 경로를 한 번에 확인합니다.

```bash
npm run smoke
```

다른 주소를 검증하려면 `SMOKE_BASE_URL`을 지정합니다.

```bash
SMOKE_BASE_URL=https://example.com npm run smoke
```

검증 범위:

- 메인 페이지
- 특가 목록/상세 API
- 헬스체크/운영 지표 API
- 신고/트래킹 API
- 제휴 리다이렉트 URL 파라미터
- 더미 또는 커뮤니티 링크는 판매처 검색 URL로 fallback
- CSV export
- sitemap/robots/manifest

## 검색/링크 검증 운영

- 검색 로직은 `lib/deals/search.ts`의 `dealMatchesSearch`를 기준으로 한다.
- 상품명, 브랜드, 쇼핑몰명, 카테고리, 혜택 유형, 태그, 혜택 요약을 함께 검색한다.
- 한글 띄어쓰기 차이는 정규화한다. 예: `애플 워치`는 `애플워치` 상품과 매칭되어야 한다.
- 생활형 검색어는 동의어를 함께 적용한다. 예: `생필품`은 생활용품/생활필수/물티슈/세제/생수 계열과 매칭하고, `무배`는 무료배송/로켓배송/네멤무료 계열과 매칭한다.
- 신규 카테고리나 혜택 유형을 추가할 때는 사용자가 실제로 입력할 짧은 표현을 `data/searchAliases.json`에 함께 넣고 `scripts/smoke.mjs` 또는 `scripts/search-quality-doctor.mjs`에 검색 검증을 추가한다.
- `npm run search:doctor`는 생활형 검색어 43개가 실제 상품 DB에 충분히 매칭되는지 검사한다. 홈의 `highIntentSearchKeywords`도 함께 읽어 추천 검색어가 `data/searchAliases.json` key와 필수 검색 검증 목록에 모두 포함되는지 확인한다. 상품 데이터를 늘린 뒤 이 명령이 실패하면 상품명/태그/카테고리 또는 alias를 함께 보강한다.
- 검색어가 있는 홈 화면은 `검색 결과 빠른 분류`에서 많이 나온 쇼핑몰, 가까운 카테고리, 혜택 유형을 보여준다. 이 칩들은 select 메뉴를 열지 않고도 검색 결과를 한 번 더 좁히는 모바일 우선 탐색 장치다.
- `결과 바로 판단 카드`는 빠른 분류 결과를 판매처, 카테고리, 혜택 유형, 구매처 확인 기준으로 다시 압축한다. 결과 그룹 계산을 바꾸면 이 카드가 빈 값만 보여주지 않고 필터 상태를 실제로 바꾸는지 확인한다.
- 홈 상단의 `빠른 상품 검색` 패널과 하단 상세 필터는 같은 검색 상태를 공유한다.
- 홈 상단 검색창의 `추천 검색어` 칩은 최근 검색어, 생활형 고의도 검색어, 인기 검색어를 합쳐 만든다. 추천어를 누르면 `selectSearchKeyword`를 통해 검색어와 URL query 상태가 함께 갱신되어 새로고침 후에도 같은 결과가 유지되어야 한다.
- 검색 입력은 `type="search"`와 모바일 검색 키 힌트를 유지하고, 검색어 해제 버튼/칩과 결과 수 `aria-live` 상태가 함께 동작해야 한다.
- 검색 alias를 추가할 때는 홈 추천 검색어에 노출할 가치가 있는지 함께 판단한다. 생수, 물티슈, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 화장지, 청소포, 김자반, 김치, 키친타월, 참치, 가글, 콜라, 탈취제, 단백질바, 새우깡, 로켓, 지마켓, 배달쿠폰, 커피쿠폰, 라면, 햇반, 세제, 선크림, 유산균 같은 고의도 키워드는 `highIntentSearchKeywords`, `data/searchAliases.json`, `requiredSearches`, `smoke:local`을 같이 갱신한다.
- 검색 결과가 없을 때는 `검색 결과 없음 복구` 영역이 보여야 한다. 이 영역은 추천 검색어 재검색 버튼과 실제 구매 링크가 확인된 검증 특가 3개를 함께 제공해 사용자가 빈 화면에서 이탈하지 않고 다시 탐색할 수 있게 한다.
- `홈 탐색 바로가기`는 전체상품, 오늘인기, 무료배송, 마감임박, 구매처확인 버튼으로 상품 목록 빠른 스캔 영역까지 스크롤한다. 홈 설명 섹션이 늘어나도 이 바로가기는 유지되어야 한다.
- 여러 단어가 붙은 검색어는 짧은 key를 포함한다는 이유만으로 넓게 확장하지 않는다. 예를 들어 `치킨쿠폰`은 `치킨`이 포함되어도 일반 배달 쿠폰 전체가 아니라 치킨/BHC 계열 결과를 우선해야 한다.
- 홈 상단의 `검색 결과 핵심 요약`은 현재 조건의 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 보여준다. 상품 DB나 정렬 로직을 바꾼 뒤 이 요약이 비거나 깨지면 사용자가 첫 화면에서 판단할 근거가 사라진 것이다.
- `검색 결과 추천 판단`은 현재 결과에서 구매처 확인, 마감 임박, 무료배송, 핫딜, 할인율순 중 사용자가 먼저 눌러볼 기준을 한 번에 제안한다. 검색/필터 로직을 바꾸면 이 판단 바가 빈 문구를 보이거나 실제 필터 상태와 어긋나지 않는지 확인한다.
- 적용된 조건 칩은 개별 해제가 가능해야 한다. 검색어, 카테고리, 쇼핑몰, 가격대, 혜택 유형, 정렬 조건을 바꿀 때 `activeFilterChips`와 `removeActiveFilter`가 함께 갱신되는지 확인한다.
- `현재 결과 빠른 좁히기`는 상품 목록 바로 앞에서 현재 결과 기준 쇼핑몰, 카테고리, 혜택 유형, 구매처 확인, 무료배송, 마감임박 조건을 다시 노출한다. 상품 목록 구조를 바꿀 때 `listRefinementChips`가 빈 상태나 현재 필터와 충돌하지 않는지 확인한다.
- 상품 목록 위의 `상품 목록 빠른 스캔`은 현재 결과에서 구매처 확인, 무료배송, 핫딜 조건을 토글하고 낮은 가격 후보/할인율 최고 정렬을 바로 적용한다. 검색/필터 코드를 바꾼 뒤 이 버튼들이 URL 상태와 결과 목록을 깨지 않고 같은 화면에서 작동하는지 확인한다.
- `smoke:local`은 조합 검색을 함께 검사한다. 생수+구매처 확인+무료배송+가격순은 검증 링크와 무료배송, 가격 오름차순을 확인하고, 지마켓+쇼핑몰+할인율순은 판매처와 할인율 내림차순을 확인하며, 생활용품+물티슈+1만원 미만+구매처 확인은 가격대와 검증 링크를 확인한다.
- `현재 목록 가격 비교`는 현재 결과에서 가장 낮은 가격, 할인율 최고, 절약액 큰 상품, 마감 먼저 볼 상품을 계산한다. 상품 데이터 필드를 바꾼 뒤 이 영역이 빈 상품이나 종료/품절 상품을 먼저 열지 않는지 확인한다.
- 홈 상단의 `카테고리 바로가기` 칩은 `dealChannels`와 `categoryCounts`를 기반으로 하며, 상품 수가 없는 세부 카테고리는 첫 화면 노출에서 제외한다.
- 홈 첫 화면의 `오늘 바로 볼 특가` 레일은 현재 검색/필터 결과 중 검증된 구매 링크 상품을 우선 노출한다. 상품 DB를 늘린 뒤 이 레일이 비면 검색/필터 또는 링크 검증 기준이 과하게 좁아진 것이다.
- 홈/카테고리/찜 목록은 `QuickDealCard`를 사용한다. 이 카드는 모바일 상품 탐색용이므로 4:3 상품 이미지, 몰명, `가격 요약`, `구매 전 한눈에` 링크/배송/마감 요약, 배송, 찜, 공유, 구매하기를 먼저 보여주고, 신고/조건 상세는 상세 페이지와 신고 페이지에서 처리한다.
- 홈의 `심화 혜택 탐색`은 접힘 영역으로 유지한다. 상품 목록 접근성을 위해 기본 화면은 검색/빠른 필터/즉시 비교 상품을 우선하고, 혜택 브리핑·개인화·쇼핑몰별 탐색은 필요할 때 펼쳐보는 구조가 정상이다.
- 홈의 `상세 필터와 결과 분석`도 접힘 영역으로 유지한다. 고급 필터는 보존하되 기본 화면에서는 상품 목록 앞 빠른 좁히기와 가격 비교 카드가 바로 이어져야 한다.
- `상품 목록 적용 조건` 바는 접힌 고급 필터 바깥에 있어야 한다. 사용자가 상품 목록 앞에서 검색어, 카테고리, 쇼핑몰, 가격대, 정렬, 무료배송, 구매링크 확인 조건을 바로 해제할 수 있어야 한다.
- 홈 화면 검색 상태는 URL query parameter로 유지된다. 배포 후 `/?q=애플%20워치`처럼 직접 진입해도 같은 결과가 나와야 한다.
- 탐색 버튼은 내부 `#all-deals` 앵커나 `scrollIntoView`를 쓰지 않고 필터 상태만 바꾼다. 화면 이동은 사용자가 직접 스크롤하도록 두어 상품 카드 클릭 중 갑작스러운 점프가 없어야 한다.
- `npm run verify:links`는 `data/mockDeals.ts`의 전체 상품 ID와 `data/verifiedPurchaseLinks.ts`의 실제 구매 URL 매핑을 비교한다.
- 검증 링크는 URL뿐 아니라 `checkedAt`, `source`, `evidence`, 도메인 다양성까지 검사한다. 상품을 추가할 때 검수 근거가 없으면 QA에서 실패해야 한다.
- 검증 스크립트는 커뮤니티, placeholder, 쇼핑몰 메인, 검색/카테고리 URL을 실패로 처리한다.
- 검증 스크립트는 상품 상세 URL과 공식 혜택/이벤트 URL을 분리해 집계한다. 상품 상세 신호가 없는 공식 이벤트성 혜택은 evidence에 공식 이벤트, 쿠폰, 초대권, 멤버십 등 검수 근거가 있어야 통과한다.
- `npm run catalog:doctor`는 전체 상품 수 140개 이상, 판매처 수, 필수 카테고리별 최소 5개, 필수 혜택 유형별 최소 5개, 검증 구매 링크 커버리지를 함께 검사한다. 상품 ID 순번, 중복 ID, 같은 판매처의 중복 상품명, 정상가/할인가/할인율 범위, 태그 2개 이상도 함께 확인한다.
- `npm run catalog:report`는 `docs/catalog-quality-report.md`를 갱신한다. 상품을 대량 추가한 뒤 이 보고서에서 카테고리 5개 미만 영역, 혜택 유형 5개 미만 영역, 판매처/도메인 쏠림을 확인한다.
- 신규 상품을 많이 추가한 뒤 `catalog:doctor`가 실패하면 상품 수만 늘린 것이 아니라 카테고리/혜택/판매처 균형이 무너진 것이므로 운영 피드를 다시 조정한다.
- `npm run purchase:navigation:doctor`는 홈, 상세, 찜, 무료혜택 화면의 구매 CTA가 `/go/[dealId]`를 거쳐 웹 새 탭 또는 Capacitor Browser로 열리는지 검사한다.
- `npm run smoke:local`은 `/api/deals?limit=150`으로 전체 140개 이상 상품의 링크 상태, 새 탭 이동 대상, 검증 구매 URL, 신규 seed 리다이렉트 호스트를 함께 확인한다.
- `npm run detail:navigation:doctor`는 상품 카드, 최근 본 상품, 찜/알림/무료혜택 등 고객이 누르는 특가 상세 링크가 현재 화면을 빼앗지 않고 새 탭으로 열리며 `noopener noreferrer`를 유지하는지 검사한다.
- `npm run navigation:doctor`는 `app`과 `components` 전체에서 `href="#"`, `javascript:void`, `target="_blank"`의 `rel` 누락, `/deals/[id]` 상세 링크의 현재 탭 이동, `/go/[dealId]` 구매 링크의 새 탭 정책 누락을 한 번 더 검사한다.
- `npm run home:url-state:doctor`는 홈 검색어, 카테고리, 쇼핑몰, 정렬, 무료배송, 핫딜, 마감임박, 구매링크 확인, 가격대, 혜택 유형 필터가 URL에 저장되고 새로고침 후 복원되는지 검사한다.
- `npm run search:doctor`는 라면, 햇반, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 멀티탭, 화장지, 청소포, 김자반처럼 구매 의도가 뚜렷한 검색어가 넓은 카테고리 단어로 과도하게 확장되지 않고 제품명/브랜드/태그 중심으로 매칭되는지 검사한다.
- `npm run home:list-scan:doctor`는 상품 목록 빠른 스캔 버튼이 구매처 확인, 무료배송, 핫딜, 낮은 가격, 할인율 정렬 상태와 연결되어 있는지 검사한다. `홈 탐색 바로가기`, `deal-list` 앵커, `현재 목록 가격 비교` 문구와 절약액/마감 후보 UI도 함께 확인한다.
- 구매 이동 버튼은 `/go/[dealId]` 또는 `/api/redirect/[id]` 추적 경로를 거쳐 새 탭/외부 브라우저로 열린다.
- 내부 정책/설정 화면 이동용 링크는 `Link`를 사용하고, 상품 상세 링크는 새 탭 `Link`, 상품 구매 이동은 `window.open(..., "_blank", "noopener,noreferrer")` 또는 Capacitor Browser를 사용한다.
- 새 관리자/운영 화면에 외부 확인 링크를 추가할 때도 `target="_blank"`와 `rel="noopener noreferrer"`를 함께 넣어야 하며, 빈 링크나 hash placeholder는 출시 UI에 남기지 않는다.

## 보안/배포 가드레일

- `npm run audit:commercial`은 high/critical 취약점이 있으면 실패합니다.
- `next.config.mjs`에는 웹 배포용 기본 보안 헤더와 `output: "standalone"`이 설정되어 있습니다. Capacitor 정적 export 빌드에서는 적용되지 않는 headers 설정을 자동 제외합니다.
- 신고/트래킹/리다이렉트/export API는 `X-Request-Id`, `X-RateLimit-*` 헤더를 반환합니다.
- 현재 rate limit는 in-memory 방식입니다. 다중 인스턴스 운영 시 Redis, Upstash, Supabase Edge Function 등 공유 저장소로 교체해야 합니다.
- 분석/제휴 추적은 브라우저 localStorage의 `halindosa:consent` 설정을 기준으로 클라이언트에서 제어합니다.
- `Dockerfile`은 standalone output을 사용해 production image를 만듭니다.
- `.github/workflows/ci.yml`은 install, lint, build, commercial audit, health wait, smoke test를 실행합니다.

Docker 로컬 검증 예시:

```bash
docker build -t halindosa .
docker run --rm -p 3000:3000 --env-file .env.example halindosa
```

## 배포 후 확인

1. `NEXT_PUBLIC_SITE_URL`이 실제 도메인인지 확인
2. `robots.txt`, `sitemap.xml`, `manifest.webmanifest` 응답 확인
3. `/api/health` 모니터링 등록
4. `ADMIN_EXPORT_TOKEN`을 설정하고 `/admin` 접근 보호 확인
5. 제휴 링크 연결 시 광고 고지 문구와 약관 갱신
6. `SMOKE_BASE_URL`로 배포 URL을 지정해 `npm run smoke` 실행
7. Docker 또는 호스팅 플랫폼의 환경변수에 `.env.example` 항목 반영

## 장애 대응

- 데이터 공급자가 실패하면 `DEAL_DATA_MODE=mock`으로 fallback
- 리다이렉트 장애 시 `/api/track`과 `/api/redirect/[id]` 로그를 먼저 확인
- 가격 오류 신고가 들어오면 `price_snapshots` 기준으로 수집 시점과 판매처 조건 확인
- `/reports?dealId=...` 신고가 증가하면 해당 mall/source 공급자 품질을 점검
- `/api/admin/reports`에서 신고 상태를 `open`, `reviewing`, `resolved`, `dismissed`로 관리
- 상세 페이지의 가격 신뢰도는 현재 mock 이력 기반입니다. 운영 DB 전환 후 `price_snapshots`로 계산해야 합니다.
- 신규 제휴/공식 피드는 `/api/admin/import` dry-run을 통과한 뒤 DB 저장 파이프라인에 연결합니다.
- 네이버 쇼핑 공식 API를 쓰려면 `DEAL_DATA_MODE=hybrid`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 설정합니다. 키가 없거나 API 장애가 있으면 기본 큐레이션 fallback으로 화면을 유지합니다.
- 별도 제휴 JSON 피드는 `DEAL_FEED_URLS=https://.../feed.json,https://.../feed2.json` 형태로 연결합니다.
