# 할인도사

할인도사는 국내 특가, 무료 혜택, 쿠폰, 무료배송, 편의점/마트 행사, 앱테크 포인트를 한 화면에서 빠르게 찾는 Next.js + Capacitor 기반 상업용 MVP입니다.

## 핵심 기능

- 상품명, 브랜드, 쇼핑몰, 카테고리, 태그, 혜택 요약 통합 검색
- 홈 상단 빠른 상품 검색 패널과 URL query 기반 검색 상태 유지
- 카테고리 바로가기 칩과 쇼핑몰별 상품 수 표시로 모바일 첫 화면 탐색 강화
- 카테고리, 쇼핑몰, 혜택 유형, 가격대, 무료배송, 핫딜, 마감임박 필터
- 검증된 실제 구매/신청 상세 URL 기반 `/go/[dealId]` 새 탭 이동
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
npm run lint
npm run smoke:local
npm run build
npm run build:android
npm run cap:sync
npm run release:doctor
```

`npm run qa`는 `lint`, `verify:links`, `catalog:doctor`, `smoke:local`, `build`, `release:doctor`를 순서대로 실행합니다.

## 검색 동작 방식

검색은 `lib/deals/search.ts`의 `dealMatchesSearch`를 웹 화면과 `/api/deals`가 함께 사용합니다. 한글 띄어쓰기 차이, 부분 검색, 브랜드/쇼핑몰/카테고리/태그/혜택 요약을 같은 기준으로 매칭하며, 홈 상단의 빠른 상품 검색 패널과 상세 필터 영역이 같은 상태를 공유합니다. 홈 검색 상태는 URL query parameter로 유지되며, 내부 `#` 앵커나 자동 스크롤 이동 없이 현재 화면에서 결과만 갱신합니다.

예시:

- `애플 워치` 검색 → `애플워치` 상품 매칭
- `쿠팡 로켓` 검색 → 쿠팡/로켓배송 관련 상품 매칭
- `초대권`, `포인트`, `무료배송` 검색 → 혜택 유형과 태그 매칭

## 상품 데이터 추가 기준

신규 상품은 검색 결과나 대표몰 메인 링크가 아니라 실제 상품/혜택 상세 페이지를 `verifiedPurchaseLinks.ts` 또는 운영 피드의 `productUrl`, `finalPurchaseUrl`, `affiliateUrl`에 등록해야 합니다.

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

`catalog:doctor`는 전체 상품 수, 필수 카테고리, 판매처 다양성, 무료/쿠폰/이벤트성 혜택 수, 검증 구매 링크 커버리지를 함께 검사합니다. 상품 수를 늘릴 때는 이 게이트를 통과해야 홈 탐색 품질이 유지됩니다.

구매 이동 정책:

- 상품 카드의 구매 CTA는 `/go/[dealId]` 추적 경로를 거친 뒤 새 탭 또는 앱 외부 브라우저로 열립니다.
- `href="#"`, `javascript:void`, 쇼핑몰 검색 결과, 커뮤니티 글 URL은 노출 상품 링크로 등록하지 않습니다.
- `npm run release:doctor`는 홈 화면에 자동 스크롤 기반 탐색이 다시 들어오지 않았는지 함께 검사합니다.
