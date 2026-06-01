# 할인도사

할인도사는 국내 특가, 무료 혜택, 쿠폰, 무료배송, 편의점/마트 행사, 앱테크 포인트를 한 화면에서 빠르게 찾는 Next.js + Capacitor 기반 상업용 MVP입니다.

## 핵심 기능

- 상품명, 브랜드, 쇼핑몰, 카테고리, 태그, 혜택 요약 통합 검색
- 홈 상단 빠른 상품 검색 패널과 URL query 기반 검색 상태 유지
- 홈 상단 검색창의 최근+인기 추천 검색어 칩으로 모바일 첫 화면에서 바로 검색 적용
- 검색 결과 핵심 요약으로 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 첫 화면에서 확인
- 상품 목록 빠른 스캔으로 구매처 확인, 무료배송, 핫딜, 낮은 가격 후보, 할인율 최고 기준을 목록 위에서 바로 적용
- 홈 첫 화면의 `오늘 바로 볼 특가` 가로 상품 레일로 검색 결과에서 바로 볼 상품을 먼저 노출
- 홈/카테고리/찜 목록은 `QuickDealCard`로 상품 이미지, 현재가, 정상가, 배송, 찜, 공유, 구매하기를 압축 표시
- 카테고리 바로가기 칩과 쇼핑몰별 상품 수 표시로 모바일 첫 화면 탐색 강화
- 카테고리, 쇼핑몰, 혜택 유형, 가격대, 무료배송, 핫딜, 마감임박 필터
- 검증된 실제 구매/신청 상세 URL 기반 `/go/[dealId]` 새 탭 이동
- 실제 상품/혜택 상세 URL로 검수된 큐레이션 상품 110개와 100% 구매 링크 커버리지
- 찜, 최근 본 상품, 관심 카테고리, 가격 알림 준비 구조
- 무료 혜택 전용 페이지와 신고/종료/링크 오류 접수
- Android/iOS Capacitor 패키징 준비

## 실행

```bash
npm install
npm run dev
```

검증:

```bash
npm run verify:links
npm run catalog:doctor
npm run search:doctor
npm run purchase:navigation:doctor
npm run detail:navigation:doctor
npm run home:url-state:doctor
npm run home:list-scan:doctor
npm run lint
npm run smoke:local
npm run build
npm run build:android
npm run cap:sync
npm run release:doctor
```

`npm run qa`는 `lint`, `verify:links`, `catalog:doctor`, `search:doctor`, `purchase:navigation:doctor`, `detail:navigation:doctor`, `home:url-state:doctor`, `home:list-scan:doctor`, `smoke:local`, `build`, `release:doctor`를 순서대로 실행합니다.

## 검색 동작 방식

검색은 `lib/deals/search.ts`의 `dealMatchesSearch`를 웹 화면과 `/api/deals`가 함께 사용합니다. 한글 띄어쓰기 차이, 부분 검색, 브랜드/쇼핑몰/카테고리/태그/혜택 요약을 같은 기준으로 매칭하며, 홈 상단의 빠른 상품 검색 패널과 상세 필터 영역이 같은 상태를 공유합니다. 홈 검색 상태는 URL query parameter로 유지되며, 내부 `#` 앵커나 자동 스크롤 이동 없이 현재 화면에서 결과만 갱신합니다.

생활형 검색어는 동의어로 확장합니다. 예를 들어 `생필품`은 생활용품/생활필수/물티슈/세제/생수 계열을 함께 찾고, `무배`는 무료배송/로켓배송/네멤무료 표현을 함께 찾습니다. 이 동의어 검색은 홈과 API가 같은 기준으로 적용하며 `npm run smoke:local`에서 재검증합니다.

검색어가 입력되면 홈 화면은 `검색 결과 빠른 분류`를 보여줍니다. 사용자는 결과에서 많이 나온 쇼핑몰, 가까운 카테고리, 혜택 유형을 가로 칩으로 바로 눌러 추가 필터를 적용할 수 있습니다.

홈 상단 검색창은 최근 검색어와 인기 검색어를 합쳐 `추천 검색어` 칩으로 보여줍니다. 추천어를 누르면 같은 검색 상태와 URL query 흐름을 사용하므로 새로고침 후에도 사용자가 고른 검색 조건이 유지됩니다.

검색 패널은 현재 조건 기준의 `검색 결과 핵심 요약`도 함께 보여줍니다. 많은 판매처, 최대 할인, 낮은 현재가, 마감 임박 수를 먼저 보여줘 긴 목록을 내려보기 전에 어떤 기준으로 볼지 빠르게 판단할 수 있습니다.

상품 목록 바로 위의 `상품 목록 빠른 스캔`은 현재 결과를 구매처 확인, 무료배송, 핫딜, 낮은 가격 후보, 할인율 최고 기준으로 즉시 좁히거나 정렬합니다. 검색 결과를 새로 불러오지 않고 같은 목록 상태에서 바뀌므로 모바일에서 긴 목록을 내려보기 전 핵심 비교 기준을 먼저 적용할 수 있습니다.

검색 동의어 품질 검증:

```bash
npm run search:doctor
```

`search:doctor`는 `생필품`, `무배`, `0원`, `가전제품`, `편의점`, `앱테크`, `육아템` 같은 짧은 생활형 검색어가 실제 상품 DB에 충분히 연결되는지 확인합니다.

예시:

- `애플 워치` 검색 → `애플워치` 상품 매칭
- `쿠팡 로켓` 검색 → 쿠팡/로켓배송 관련 상품 매칭
- `생필품` 검색 → 생활용품, 생활필수, 장보기 관련 상품 매칭
- `무배` 검색 → 무료배송, 무배, 로켓배송 관련 상품 매칭
- `초대권`, `포인트`, `무료배송` 검색 → 혜택 유형과 태그 매칭

## 상품 데이터 추가 기준

신규 상품은 검색 결과나 대표몰 메인 링크가 아니라 실제 상품/혜택 상세 페이지를 `verifiedPurchaseLinks.ts` 또는 운영 피드의 `productUrl`, `finalPurchaseUrl`, `affiliateUrl`에 등록해야 합니다.
검증 링크에는 `checkedAt`, `source`, `evidence`를 함께 남겨야 하며 `npm run verify:links`는 URL 형태뿐 아니라 검수 근거와 구매 도메인 다양성까지 확인합니다.

필수 기준:

- 실제 구매 또는 혜택 신청 상세 URL
- 커뮤니티 글, 블로그 글, 뉴스 기사, 검색 결과, 쇼핑몰 메인 URL 제외
- `sourceUrl`은 원문 출처, `finalPurchaseUrl`은 실제 이동 URL로 분리
- 가격, 배송비, 쿠폰 조건은 판매처에서 최종 확인한다는 안내 유지

링크 검증:

```bash
npm run verify:links
```

운영 피드는 `npm run feed:validate`와 `/api/admin/import` dry-run을 통과한 뒤 연결합니다.

상품 DB 품질 검증:

```bash
npm run catalog:doctor
```

`catalog:doctor`는 전체 상품 수 110개 이상, 필수 카테고리, 판매처 다양성, 무료/쿠폰/이벤트성 혜택 수, 검증 구매 링크 커버리지를 함께 검사합니다. 상품 수를 늘릴 때는 이 게이트를 통과해야 홈 탐색 품질이 유지됩니다.

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

검색/필터 URL 상태 검증:

```bash
npm run home:url-state:doctor
```

홈의 검색어, 카테고리, 쇼핑몰, 정렬, 무료배송, 핫딜, 마감임박, 구매링크 확인, 가격대, 혜택 유형 필터가 URL에 저장되고 새로고침 후 복원되는지 코드 기준으로 검사합니다.

구매 이동 정책:

- 상품 카드의 구매 CTA는 `/go/[dealId]` 추적 경로를 거친 뒤 새 탭 또는 앱 외부 브라우저로 열립니다.
- `href="#"`, `javascript:void`, 쇼핑몰 검색 결과, 커뮤니티 글 URL은 노출 상품 링크로 등록하지 않습니다.
- `npm run release:doctor`는 홈 화면에 자동 스크롤 기반 탐색이 다시 들어오지 않았는지 함께 검사합니다.
