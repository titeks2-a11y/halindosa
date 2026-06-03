# 할인도사

할인도사는 국내 특가, 무료 혜택, 쿠폰, 무료배송, 편의점/마트 행사, 앱테크 포인트를 한 화면에서 빠르게 찾는 Next.js + Capacitor 기반 상업용 MVP입니다.

## 핵심 기능

- 상품명, 브랜드, 쇼핑몰, 카테고리, 태그, 혜택 요약 통합 검색
- 홈 상단 빠른 상품 검색 패널과 URL query 기반 검색 상태 유지
- 홈 상단 검색창의 최근+인기 추천 검색어 칩으로 모바일 첫 화면에서 바로 검색 적용
- 생수, 물티슈, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 화장지, 김치처럼 자주 쓰는 생활형 검색어를 추천 검색어로 우선 노출
- 검색 결과 핵심 요약으로 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 첫 화면에서 확인
- 검색 결과 추천 판단 바가 구매처 확인, 마감 임박, 무료배송, 핫딜, 할인율순 중 지금 먼저 볼 기준을 자동 제안
- 적용된 검색/필터 조건은 칩으로 표시하고 각 조건을 개별 해제 가능
- `smoke:local`이 생수+구매처 확인+무료배송+가격순, 지마켓+쇼핑몰+할인율순, 생활용품+물티슈+가격대+구매처 확인 조합 검색을 검증
- 검색 결과 빠른 분류 아래 결정 카드로 판매처, 카테고리, 혜택 유형, 구매처 확인 기준을 즉시 적용
- 상품 목록 앞에서 현재 결과에 많이 나온 쇼핑몰, 카테고리, 혜택 유형을 `현재 결과 빠른 좁히기` 칩으로 다시 선택
- 상품 목록 빠른 스캔으로 구매처 확인, 무료배송, 핫딜, 낮은 가격 후보, 할인율 최고 기준을 목록 위에서 바로 적용
- 현재 목록 가격 비교로 가장 낮은 가격, 할인율 최고, 절약액 큰 상품, 마감 먼저 볼 상품을 바로 확인
- 홈 첫 화면의 `오늘 바로 볼 특가` 가로 상품 레일로 검색 결과에서 바로 볼 상품을 먼저 노출
- 홈/카테고리/찜 목록은 `QuickDealCard`로 상품 이미지, 가격 요약, 현재가, 정상가, 구매 전 한눈에 요약, 배송, 찜, 공유, 구매하기를 압축 표시
- 카테고리 바로가기 칩과 쇼핑몰별 상품 수 표시로 모바일 첫 화면 탐색 강화
- 카테고리, 쇼핑몰, 혜택 유형, 가격대, 무료배송, 핫딜, 마감임박 필터
- 검증된 실제 구매/신청 상세 URL 기반 `/go/[dealId]` 새 탭 이동
- 실제 상품/혜택 상세 URL로 검수된 큐레이션 상품 140개와 100% 구매 링크 커버리지
- 링크 검증은 상품 상세 URL과 공식 혜택/이벤트 URL을 구분해 대표몰, 검색 결과, 커뮤니티 링크를 차단
- 찜, 최근 본 상품, 관심 카테고리, 가격 알림 준비 구조
- 무료 혜택 전용 페이지와 신고/종료/링크 오류 접수
- Android/iOS Capacitor 패키징 준비

## 실행

```bash
npm install
npm run dev
```

고급 하네스 검증:

```bash
npm run test:ui
npm run test:seo
npm run test:perf
npm run harness
```

`npm run harness`는 lint, build, 링크/이미지/검색/UI/모바일 UX/SEO/성능/smoke/release doctor를 순서대로 실행하고 [docs/HARNESS_REPORT.md](docs/HARNESS_REPORT.md)에 결과를 남깁니다.

검증:

```bash
npm run verify:links
npm run verify:products
npm run link:policy:regression
npm run refresh:news
npm run verify:news
npm run news:feed:doctor
npm run refresh:all
npm run exposure:doctor
npm run health:readiness
npm run catalog:doctor
npm run catalog:report
npm run search:doctor
npm run test:external-links
npm run test:images
npm run image:backlog:report
npm run image:operations:doctor
npm run source:live:doctor
npm run test:ui
npm run test:mobile-ux
npm run test:seo
npm run test:perf
npm run purchase:navigation:doctor
npm run detail:navigation:doctor
npm run navigation:doctor
npm run home:url-state:doctor
npm run home:list-scan:doctor
npm run lint
npm run smoke:local
npm run build
npm run build:android
npm run cap:sync
npm run release:doctor
```

`npm run image:backlog:report`는 전체 이미지 보강 큐(`IMAGE_BACKLOG.csv`), 이번 주 실행 배치(`IMAGE_BACKLOG_NEXT_BATCH.csv`), 판매처별 피드 요청서(`IMAGE_BACKLOG_MALL_REQUESTS.csv`), JSON/문서 리포트를 함께 생성합니다. 공개 운영 전에는 주간 배치 CSV부터 처리하고, backlog가 많은 판매처는 mall request CSV로 `imageUrl` 또는 `thumbnail` 확보를 요청합니다.

`npm run source:live:doctor`는 `data/officialSourceCatalog.json`의 공식 소스 후보 URL을 non-strict로 점검해 `reports/official-source-live-check.json`, `reports/official-source-live-check.csv`, [docs/OFFICIAL_SOURCE_LIVE_CHECK.md](docs/OFFICIAL_SOURCE_LIVE_CHECK.md)를 생성합니다. 이 점검은 무단 크롤링이 아니라 접근 가능, WAF/권한 보호, 404/410 교체 필요 상태를 운영자가 보는 리포트이며 사용자 노출 데이터를 자동 변경하지 않습니다.

`npm run source:onboarding:plan`은 공식 소스 카탈로그와 live 점검 결과를 합쳐 `reports/source-onboarding-plan.json`, `reports/source-onboarding-plan.csv`, [docs/SOURCE_ONBOARDING_PLAN.md](docs/SOURCE_ONBOARDING_PLAN.md)를 생성합니다. 운영자는 이 파일에서 공식 API/RSS/제휴 feed를 어느 소스부터 연결할지, guarded 소스는 어떤 담당자 확인이 필요한지 우선순위로 확인합니다.

`npm run health:readiness`는 `reports/health-readiness.json`과 [docs/HEALTH_READINESS_REPORT.md](docs/HEALTH_READINESS_REPORT.md)를 생성해 상품 140개 이상, 검증 링크 99% 이상, 검색/품절 노출 0개, 공식 혜택 25개 이상, 필수 공식 혜택 카테고리별 2건 이상, `refresh:all` 성공, 24시간 이내 신선도를 함께 점검합니다.

`npm run qa`는 `lint`, `verify:links`, `verify:products`, `link:policy:regression`, 상품/뉴스 refresh, `verify:news`, `news:feed:doctor`, `refresh:all`, non-strict `verify:links:live`, `exposure:doctor`, `health:readiness`, 공식 소스 카탈로그/라이브 접근성/온보딩 우선순위 리포트, 외부 링크/이미지/이미지 운영 doctor, `catalog:doctor`, `search:doctor`, UI/모바일 UX/SEO/성능 doctor, 구매·상세·전역 navigation doctor, 홈 URL/list scan doctor, `smoke:local`, `build`, `release:doctor`를 순서대로 실행합니다.

## 공식 혜택 Feed 운영

할인 뉴스, 공식 이벤트, 무료 쿠폰, 카드/멤버십/문화 혜택은 검색 결과나 커뮤니티 원문을 사용자 이동 링크로 쓰지 않습니다. 운영 feed는 `docs/news-feed-contract.md`의 JSON 계약을 따라야 하며, `finalUrl`은 공식 이벤트, 공식 쿠폰, 공식 구매 또는 공식 혜택 안내 페이지여야 합니다.

```bash
npm run news:feed:doctor
npm run refresh:news
npm run verify:news
npm run refresh:all
npm run health:readiness
```

`data/newsFeed.sample.json`은 운영자가 새 feed를 만들 때 복제할 수 있는 안전한 샘플입니다. `DEAL_NEWS_FEED_URLS`, `DEAL_EVENT_NEWS_FEED_URLS`, `OFFICIAL_EVENT_FEED_URLS`, `PUBLIC_COUPON_FEED_URLS`에 연결한 feed도 같은 계약과 링크 차단 기준을 통과해야 사용자 화면에 노출됩니다.

공식 소스 후보와 feed 전환 작업표는 `GET /api/sources`에서 JSON으로 확인하고, 스프레드시트 검토가 필요하면 `GET /api/sources?format=csv`를 내려받습니다. CSV는 공식 URL, provider, 카테고리, 우선 연결 env key, 현재 feed URL 수, 다음 운영 액션을 `source_catalog`, `feed_transition`, `next_action` 행으로 정리합니다.
서버를 띄우지 않는 운영 점검에서는 `npm run source:catalog:report`로 같은 목적의 `reports/official-source-catalog.csv` 파일을 생성할 수 있습니다.

공식 feed를 붙이기 전에는 `npm run source:live:doctor`로 후보 URL의 현재 접근 상태를 확인합니다. `reachable`은 승인 feed 또는 공식 페이지 매핑 후보로 유지하고, `guarded`는 브라우저 자동 수집 대상이 아니라 공식 API/RSS/제휴 feed 담당자 확인 대상으로 분류합니다. `stale_or_removed`는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 사용하지 않습니다.

공식 feed 연결 순서는 `npm run source:onboarding:plan`으로 정합니다. 이 리포트는 high priority, live 접근성, 카테고리 보강 필요성, feed 설정 여부를 합산해 TOP10 연결 후보와 guarded 소스의 담당자 확인 액션을 CSV와 문서로 남깁니다.

## 검색 동작 방식

검색은 `lib/deals/search.ts`의 `dealMatchesSearch`를 웹 화면과 `/api/deals`가 함께 사용합니다. 한글 띄어쓰기 차이, 부분 검색, 브랜드/쇼핑몰/카테고리/태그/혜택 요약을 같은 기준으로 매칭하며, 홈 상단의 빠른 상품 검색 패널과 상세 필터 영역이 같은 상태를 공유합니다. 홈 검색 상태는 URL query parameter로 유지되며, 내부 `#` 앵커나 자동 스크롤 이동 없이 현재 화면에서 결과만 갱신합니다.

생활형 검색어는 동의어로 확장합니다. 예를 들어 `생필품`은 생활용품/생활필수/물티슈/세제/생수 계열을 함께 찾고, `무배`는 무료배송/로켓배송/네멤무료 표현을 함께 찾습니다. 라면, 햇반, 계란, 우유, 닭가슴살, 마스크, 충전케이블, 화장지, 청소포, 김자반처럼 구매 의도가 뚜렷한 키워드는 넓은 카테고리보다 제품명/브랜드/태그 중심으로 매칭합니다. 이 동의어 검색은 홈과 API가 같은 기준으로 적용하며 `npm run smoke:local`에서 재검증합니다.

검색어가 입력되면 홈 화면은 `검색 결과 빠른 분류`를 보여줍니다. 사용자는 결과에서 많이 나온 쇼핑몰, 가까운 카테고리, 혜택 유형을 가로 칩으로 바로 눌러 추가 필터를 적용할 수 있습니다.

빠른 분류 아래의 `결과 바로 판단 카드`는 검색 결과에서 가장 많이 나온 판매처, 가까운 카테고리, 대표 혜택 유형, 구매처 확인 결과를 네 개 카드로 압축합니다. 사용자는 작은 칩을 훑지 않아도 한 번의 탭으로 현재 결과를 쇼핑몰, 카테고리, 혜택, 안전 이동 기준으로 다시 좁힐 수 있습니다.

홈 상단 검색창은 최근 검색어와 인기 검색어를 합쳐 `추천 검색어` 칩으로 보여줍니다. 추천어를 누르면 같은 검색 상태와 URL query 흐름을 사용하므로 새로고침 후에도 사용자가 고른 검색 조건이 유지됩니다.

검색 입력은 모바일 키보드의 검색 동작에 맞춘 `search` 입력으로 동작하며, 검색어가 있을 때는 지우기 버튼과 검색어 해제 칩을 함께 제공합니다. 결과 수는 접근성 상태 영역으로 갱신되어 스크린리더 사용자도 현재 결과 수를 확인할 수 있습니다.

추천 검색어에는 `생수`, `물티슈`, `계란`, `우유`, `닭가슴살`, `마스크`, `충전케이블`, `멀티탭`, `화장지`, `청소포`, `김자반`, `김치`, `키친타월`, `참치`, `가글`, `로켓`, `지마켓`, `배달쿠폰`, `커피쿠폰`, `라면`, `햇반`, `세제`, `유산균`처럼 앱 사용자가 바로 눌러볼 만한 생활형 검색어를 먼저 섞습니다. 이 키워드는 `data/searchAliases.json`과 `npm run search:doctor` 기준으로 관리합니다.

검색 결과가 없을 때도 단순 빈 화면으로 끝내지 않습니다. 홈은 `검색 결과 없음 복구` 영역에서 다시 눌러볼 추천 검색어와 실제 구매 링크가 확인된 검증 특가 3개를 함께 보여주며, 사용자가 조건 초기화 없이도 다음 탐색으로 이어가도록 합니다.

홈 검색 박스 아래의 `홈 탐색 바로가기`는 전체상품, 오늘인기, 무료배송, 마감임박, 구매처확인 목록으로 바로 내려갑니다. 긴 홈에서도 사용자가 설명 섹션을 건너뛰고 상품 목록과 가격 비교 카드로 즉시 이동할 수 있어야 합니다.

검색 패널은 현재 조건 기준의 `검색 결과 핵심 요약`도 함께 보여줍니다. 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 먼저 보여줘 긴 목록을 내려보기 전에 어떤 기준으로 볼지 빠르게 판단할 수 있습니다.

`검색 결과 추천 판단`은 현재 결과에서 가장 먼저 눌러볼 기준을 자동으로 고릅니다. 검증 링크가 일부만 있으면 구매처 확인을 우선하고, 마감 임박이나 무료배송 비중이 높으면 해당 필터를 바로 제안합니다.

적용된 조건 영역은 검색어, 카테고리, 쇼핑몰, 가격대, 혜택 유형, 정렬 조건을 각각 해제할 수 있는 칩으로 표시합니다. 전체 초기화 없이 한 조건만 빼고 다시 비교할 수 있어 모바일 탐색 흐름이 짧아집니다.

`현재 결과 빠른 좁히기`는 상품 목록 바로 앞에서 현재 결과에 많이 나온 쇼핑몰, 카테고리, 혜택 유형과 구매처 확인/무료배송/마감임박 조건을 다시 보여줍니다. 검색 패널을 지나 상품 카드까지 내려온 뒤에도 같은 화면에서 조건을 좁힐 수 있습니다.

조합 검색 회귀 검증은 `smoke:local`에 포함되어 있습니다. 생수 검색에 구매처 확인·무료배송·가격순을 동시에 적용하고, 지마켓 검색에 쇼핑몰·할인율순을 결합하며, 생활용품/물티슈/가격대/구매처 확인 조합이 모두 실제 API 결과로 유지되는지 확인합니다.

상품 목록 바로 위의 `상품 목록 빠른 스캔`은 현재 결과를 구매처 확인, 무료배송, 핫딜, 낮은 가격 후보, 할인율 최고 기준으로 즉시 좁히거나 정렬합니다. 검색 결과를 새로 불러오지 않고 같은 목록 상태에서 바뀌므로 모바일에서 긴 목록을 내려보기 전 핵심 비교 기준을 먼저 적용할 수 있습니다.

`현재 목록 가격 비교`는 현재 검색/필터 결과 안에서 가장 낮은 가격, 할인율 최고, 절약액 큰 상품, 마감 먼저 볼 상품을 4개 카드로 보여줍니다. 각 카드는 판매처 확인 흐름으로 연결되어 목록을 길게 훑기 전 가격 기준 후보를 바로 열 수 있습니다.

상품 카드의 `가격 요약`은 할인율, 현재가, 정상가, 절약 금액을 한 블록에 묶어 보여줍니다. `구매 전 한눈에` 요약은 링크 확인 상태, 배송, 마감 시간을 세 칸으로 압축합니다. `QuickDealCard` 이미지는 4:3 비율과 작은 액션 버튼을 사용해 모바일 한 화면에서 더 많은 상품을 비교할 수 있게 유지합니다. 사용자는 상세 페이지를 열기 전에 목록에서 가격 매력도와 안전하게 이동할 상품인지 먼저 판단할 수 있습니다.

홈의 혜택 브리핑, 개인화 추천, 쇼핑몰별 탐색 같은 심화 섹션은 `심화 혜택 탐색` 접힘 영역에 보관합니다. 첫 화면은 검색, 빠른 필터, 바로 볼 상품, 상품 목록에 집중하고, 운영/혜택 분석 정보는 사용자가 필요할 때 펼쳐 보도록 구성합니다.

상세 필터와 결과 분석도 기본 접힘 영역으로 둡니다. 쇼핑몰, 가격대, 혜택 목적, 조건별 결과 요약은 그대로 사용할 수 있지만 기본 화면에서는 상품 목록 앞 빠른 좁히기와 가격 비교 카드가 먼저 보이도록 정리합니다.

접힌 고급 필터 바깥에는 `상품 목록 적용 조건` 바를 별도로 보여줍니다. 검색어, 카테고리, 쇼핑몰, 가격대, 정렬, 무료배송, 구매링크 확인 같은 조건을 상품 목록 앞에서 바로 해제할 수 있어 사용자가 고급 필터를 다시 펼치지 않아도 됩니다.

검색 동의어 품질 검증:

```bash
npm run search:doctor
```

`search:doctor`는 `생필품`, `무배`, `0원`, `가전제품`, `편의점`, `앱테크`, `육아템`, `로켓`, `지마켓`, `배달쿠폰`, `치킨쿠폰`, `커피쿠폰`, `무료커피`, `영화무료`, `패션`, `우산`, `생수`, `물티슈`, `기저귀`, `치약`, `라면`, `햇반`, `세제`, `선크림`, `유산균`, `계란`, `우유`, `닭가슴살`, `마스크`, `충전케이블`, `멀티탭`, `화장지`, `청소포`, `김자반`, `김치`, `키친타월`, `참치`, `가글`, `콜라`, `탈취제`, `단백질바`, `새우깡` 같은 짧은 생활형 검색어가 실제 상품 DB에 충분히 연결되는지 확인합니다. 홈의 `highIntentSearchKeywords`도 함께 읽어 추천 검색어가 `data/searchAliases.json`과 필수 검색 검증 목록에 모두 연결되어 있는지 검사합니다.

예시:

- `애플 워치` 검색 → `애플워치` 상품 매칭
- `쿠팡 로켓` 검색 → 쿠팡/로켓배송 관련 상품 매칭
- `생필품` 검색 → 생활용품, 생활필수, 장보기 관련 상품 매칭
- `무배` 검색 → 무료배송, 무배, 로켓배송 관련 상품 매칭
- `초대권`, `포인트`, `무료배송` 검색 → 혜택 유형과 태그 매칭

## 상품 데이터 추가 기준

신규 상품은 검색 결과나 대표몰 메인 링크가 아니라 실제 상품/혜택 상세 페이지를 `verifiedPurchaseLinks.ts` 또는 운영 피드의 `productUrl`, `finalPurchaseUrl`, `affiliateUrl`에 등록해야 합니다.
검증 링크에는 `checkedAt`, `source`, `evidence`를 함께 남겨야 하며 `npm run verify:links`는 URL 형태뿐 아니라 검수 근거와 구매 도메인 다양성까지 확인합니다. 검증 통과 URL은 상품 상세 URL 또는 공식 혜택/이벤트 URL 신호가 있어야 하며, `reports/link-validation.json`의 `auditedItems`에는 상품별 `linkType`, `availability`, `validationStatus`, `isHidden`, `priorityScore`가 기록됩니다. `npm run exposure:doctor`는 이 감사 행을 기준으로 검색 링크, 품절/종료 링크, 실패 링크가 사용자 노출 목록에 섞이지 않았는지 다시 확인합니다.

필수 기준:

- 실제 구매 또는 혜택 신청 상세 URL
- 커뮤니티 글, 블로그 글, 뉴스 기사, 검색 결과, 쇼핑몰 메인 URL 제외
- `sourceUrl`은 원문 출처, `finalPurchaseUrl`은 실제 이동 URL로 분리
- 가격, 배송비, 쿠폰 조건은 판매처에서 최종 확인한다는 안내 유지

링크 검증:

```bash
npm run verify:links
npm run verify:products
npm run link:policy:regression
npm run exposure:doctor
npm run verify:links:live -- --dry-run
```

`link:policy:regression`은 실제 상품 상세 URL, 검색 URL, 대표몰 홈, 커뮤니티 원문, 위험 프로토콜, 품절/종료 문구, 공식 이벤트 URL 샘플을 검사하고 `reports/link-quality-regression.json`을 생성합니다. `verify:links:live`는 실제 HTTP HEAD/GET으로 redirect, 404/410/5xx, timeout, 접근 차단 신호를 확인하는 선택 운영 명령입니다. 기본 실행은 실패를 리포트에 남기되 출시 QA를 과도하게 흔들지 않도록 non-strict이며, 출시 직전 강하게 막고 싶을 때는 `npm run verify:links:live -- --strict`, 품절/판매종료 문구까지 확인하려면 `npm run verify:links:live -- --body`를 사용합니다.

운영 피드는 `npm run feed:validate`와 `/api/admin/import` dry-run을 통과한 뒤 연결합니다. 두 검증 모두 구매 이동 후보가 검색 결과 URL뿐인 행, 커뮤니티/placeholder 링크, 중복 externalId, 같은 판매처의 중복 상품명을 `needs_fix`로 분리합니다. 운영 반영 전 `rows[].status`가 모두 `ready`인지 확인하세요.

상품 DB 품질 검증:

```bash
npm run catalog:doctor
```

`catalog:doctor`는 전체 상품 수 140개 이상, 필수 카테고리별 최소 5개, 필수 혜택 유형별 최소 5개, 판매처 다양성, 무료/쿠폰/이벤트성 혜택 수, 검증 구매 링크 커버리지를 함께 검사합니다. 또한 상품 ID 순번, 중복 ID, 같은 판매처의 중복 상품명, 정상가/할인가/할인율 범위, 검색용 태그 수까지 확인합니다. 상품 수를 늘릴 때는 이 게이트를 통과해야 홈 탐색 품질이 유지됩니다.

`npm run catalog:report`는 [docs/catalog-quality-report.md](docs/catalog-quality-report.md)에 카테고리, 혜택 유형, 판매처, 구매 도메인, 할인율/절약액 상위 상품, 다음 보강 우선순위를 기록합니다. 새 상품을 대량 추가하기 전후에 실행하면 특정 카테고리나 판매처 쏠림을 바로 확인할 수 있습니다.

구매 이동 검증:

```bash
npm run purchase:navigation:doctor
```

홈, 상세, 찜, 무료혜택 화면의 구매 CTA가 `/go/[dealId]` 추적 경로를 거쳐 웹에서는 새 탭으로, Android/iOS에서는 Capacitor Browser로 열리는지 검사합니다.

상세 링크 새 탭 검증:

```bash
npm run detail:navigation:doctor
```

상품 카드, 최근 본 상품, 찜/알림/무료혜택 등 고객이 누르는 `/deals/[id]` 상세 링크가 현재 화면을 빼앗지 않고 새 탭으로 열리며 `noopener noreferrer`를 유지하는지 검사합니다.

전역 네비게이션 정책 검증:

```bash
npm run navigation:doctor
```

`app`과 `components`의 모든 TSX 화면을 훑어 `href="#"`, `javascript:void`, `target="_blank"`의 `rel` 누락, `/deals/[id]` 상세 링크의 현재 탭 이동, `/go/[dealId]` 구매 링크의 새 탭 정책 누락을 차단합니다. 새 화면이나 관리자 링크를 추가할 때도 이 검사를 통과해야 합니다.

검색/필터 URL 상태 검증:

```bash
npm run home:url-state:doctor
```

홈의 검색어, 카테고리, 쇼핑몰, 정렬, 무료배송, 핫딜, 마감임박, 구매링크 확인, 가격대, 혜택 유형 필터가 URL에 저장되고 새로고침 후 복원되는지 코드 기준으로 검사합니다.

구매 이동 정책:

- 상품 카드의 구매 CTA는 `/go/[dealId]` 추적 경로를 거친 뒤 새 탭 또는 앱 외부 브라우저로 열립니다.
- `href="#"`, `javascript:void`, 쇼핑몰 검색 결과, 커뮤니티 글 URL은 노출 상품 링크로 등록하지 않습니다.
- `target="_blank"`를 쓰는 링크는 항상 `rel="noopener noreferrer"`를 함께 둡니다.
- `npm run test:mobile-ux`는 홈 검색창 중복, 카테고리/필터 가로 칩, 하단 탭 safe-area, compact 카드, 토스트 위치와 `오늘 바로 볼 특가` 레일의 스냅, 오른쪽 fade, `옆으로 넘기기` 신호를 10개 게이트로 검사하고 `MOBILE_UX_REPORT.md`를 갱신합니다.
- `npm run release:doctor`는 홈 화면에 자동 스크롤 기반 탐색이 다시 들어오지 않았는지, 모바일 UX 게이트와 보고서가 QA/harness에 계속 묶여 있는지 함께 검사합니다.
