# 할인도사 Data Source Runbook

## 목적

V1.0은 mock 데이터를 기본으로 사용하지만, 운영 전환 시 공식 API, RSS, 제휴 피드, 허용된 수집 방식만 연결한다.

## 모드

- `mock`: 기본 큐레이션 데이터
- `staging`: live/provider dry-run 검증
- `production`: 공식 운영 API 연결 예정
- `hybrid`: 외부 후보 + mock fallback

환경 변수:

```bash
DEAL_DATA_MODE=mock
DEAL_PRODUCTION_FEED_URLS=https://partner.example/deals.json
```

## 상태 확인

```bash
GET /api/sources
GET /api/health
GET /api/metrics
```

`/api/sources`는 공급원별 상태, 신뢰도, 현재 deal 수, 운영 피드 전환 준비도, 허용/차단 데이터 정책을 반환한다.

## 운영 전환 순서

1. 신규 공급원을 `/api/admin/import` dry-run으로 검증
2. 필수 필드, URL, 가격, 카테고리, 종료 시각 확인
3. `Deal` canonical 필드로 정규화
4. `lib/deals/linkValidator.ts` 기준으로 상품 상세 URL, 검색 fallback, 커뮤니티 출처를 분리
5. 커뮤니티 글은 `sourceUrl/sourceName`에 보관하고 실제 구매 링크만 `finalPurchaseUrl`로 저장
6. 테스트 서버에서 `DEAL_DATA_MODE=staging`
7. smoke와 release doctor 통과 확인
8. 운영 API, DB 저장 경로, 또는 `DEAL_PRODUCTION_FEED_URLS` 파트너 JSON 피드 연결
9. `DEAL_DATA_MODE=production`

## Production JSON Feed

`DEAL_DATA_MODE=production` 또는 `hybrid`에서 `DEAL_PRODUCTION_FEED_URLS`를 설정하면 서버가 허용된 공식/제휴 JSON 피드를 읽는다.

지원 형태:

```json
[
  {
    "id": "partner-001",
    "mallName": "공식몰",
    "title": "상품명",
    "description": "운영 피드에 표시할 짧은 설명",
    "dealType": "coupon",
    "benefitSummary": "쿠폰 적용 시 1만원 절약",
    "originalPrice": 39800,
    "salePrice": 24900,
    "productUrl": "https://...",
    "sourceName": "브랜드 공식몰",
    "sourceUrl": "https://...",
    "requiresSignup": false,
    "isFirstComeFirstServed": true,
    "shippingFee": "무료배송",
    "couponCondition": "판매처 쿠폰 적용",
    "minimumOrderAmount": 0,
    "eligibilityChecklist": ["판매처 상품 상세 확인", "쿠폰/배송 조건 확인", "최종 가격 확인"],
    "claimSteps": ["상품 상세 이동", "조건 확인", "결제 전 가격 확인"],
    "claimWarning": "가격, 재고, 쿠폰 조건은 판매처에서 변경될 수 있습니다.",
    "expiresAt": "2026-06-02T12:00:00.000Z",
    "tags": ["무료배송", "쿠폰"]
  }
]
```

또는 `{ "deals": [...] }`, `{ "items": [...] }`를 사용할 수 있다.

처리 기준:

- 각 URL은 5초 timeout 안에 JSON으로 응답해야 한다.
- `externalId/id`, `mall/mallName`, `title`, `dealType`, `benefitSummary`, `sourceName`, `sourceUrl`, `expiresAt`, `originalPrice`, `salePrice`, `productUrl/finalPurchaseUrl/affiliateUrl`이 필요하다.
- 커뮤니티에서 발견한 혜택은 원문을 `sourceUrl`로만 보관하고, `finalPurchaseUrl`에는 실제 상품·혜택 상세 URL을 저장한다. 두 값이 같아지면 구매 이동 품질 검수 실패로 본다.
- `dealType`은 `discount`, `freebie`, `coupon`, `freeShipping`, `experience`, `event`, `point`, `convenienceStore`, `mart`, `foodDelivery` 중 하나여야 한다.
- 무료 혜택, 쿠폰, 포인트, 배달/외식, 편의점/마트 행사는 사용자가 조건을 바로 이해할 수 있도록 `benefitSummary`, `couponCondition`, `minimumOrderAmount`, `isFirstComeFirstServed`, `requiresSignup`, `shippingFee`, `eligibilityChecklist`, `claimSteps`, `claimWarning`을 채운다.
- 관리자 dry-run은 `conditionReadyRate`로 출처, 가입/선착순, 배송비, 수령 전 체크리스트, 수령 단계, 주의 문구가 운영 노출 기준을 충족하는지 함께 보여준다.
- 기본 샘플 피드는 무료배송, 실구매 특가, 무료 쿠폰, 배달 쿠폰, 출석 포인트, 편의점 행사, 마트 행사, 체험단을 포함한다. 운영 피드도 최소 이 정도 혜택 폭을 갖춘 뒤 노출한다.
- 커뮤니티 글, placeholder, 검색 결과만 있는 링크는 운영 피드로 등록하지 않는다.
- 피드는 `validatePartnerFeed`와 `normalizePartnerFeed` 검증 경로를 거쳐 유효한 상품만 `production` 데이터로 노출한다.
- 실패하거나 유효 상품이 없으면 기존 mock fallback이 유지된다.

운영 피드 연결 전 로컬 fixture로 실제 provider 경로를 검증한다:

```bash
npm run feed:validate -- --file ./partner-feed.json
npm run feed:validate -- --url https://partner.example/deals.json
npm run feed:validate -- --file ./partner-feed.json --report ./docs/partner-feed-validation-report.json
npm run feed:production:doctor
```

`feed:validate`는 운영자가 실제 파일 또는 URL을 연결하기 전에 상세 URL, 가격, 필수 필드, 커뮤니티/placeholder 링크, 검색 결과 fallback 여부를 검수한다.
`--report`를 함께 쓰면 `ready`, `needs_fix`, 행 번호, 외부 ID, 판매처, 제목, 문제 필드, 수정 안내를 JSON으로 남긴다. 운영 연결 전에는 이 리포트에서 `invalid=0`, `readyRate=100`을 만든 뒤 production 피드로 전환한다.
`feed:production:doctor`는 임시 JSON 피드와 Next.js 서버를 띄운 뒤 `DEAL_DATA_MODE=production`, `DEAL_PRODUCTION_FEED_URLS=<fixture>` 조건에서 `/api/deals`가 `production` 데이터를 반환하는지 확인한다. 동시에 커뮤니티 원문 단독 링크가 운영 상품으로 노출되지 않는지, `/api/sources`가 설정된 운영 피드 수를 보고하는지 검증한다.

## 신규 상품 등록 기준

신규 상품이나 혜택은 아래 기준을 모두 만족해야 홈/카테고리/찜 목록에 노출한다.

1. `productUrl`, `finalPurchaseUrl`, `affiliateUrl` 중 하나에 실제 상품·혜택 상세 URL을 넣는다.
2. 검색 결과, 쇼핑몰 메인, 커뮤니티 원문, 블로그/뉴스 URL은 `finalPurchaseUrl`로 쓰지 않는다.
3. 커뮤니티나 뉴스에서 발견한 정보는 `sourceUrl`에만 남기고, 구매 이동은 판매처 상세 URL로 분리한다.
4. `checkedAt`은 ISO 시각으로 기록하고, `source`는 `manual_review`, `partner_feed`, `official_api` 중 하나로 남긴다.
5. `evidence`에는 운영자가 다시 확인할 수 있는 상품명/판매처/검수 근거를 짧게 적는다.
6. `npm run verify:links`와 `npm run links:report`를 실행해 검증 링크 100%, 도메인 다양성, 보강 대기 상품 0개를 확인한다.
7. 무료/쿠폰/포인트 혜택도 상품과 동일하게 실제 수령·신청 상세 URL을 연결한다.

## 중단 기준

- 가격이 원가보다 높거나 0원 이하
- 링크가 http/https가 아님
- 성인/주류/의약품성 상품
- 출처 권한이 불명확한 크롤링
- 제휴/광고 고지를 할 수 없는 캠페인
- 쇼핑몰 메인, 검색 결과, 카테고리 목록만 있는 링크
- 커뮤니티 게시글만 있고 실제 상품 상세 URL을 추출하지 못한 링크

## 구매 링크 검증 필드

- `linkVerified`: 상품 상세 URL 패턴 통과 여부
- `finalUrl`: 앱이 최종으로 열 URL
- `checkedAt`: 링크 정책 기준 확인 시간
- `purchaseConfidence`: 0~100 사이의 구매 링크 신뢰도
- `purchaseLinkVerified`: 실제 구매 상세 링크로 인정되는지 여부
- `finalPurchaseUrl`: 제휴/리다이렉트 처리 전 기준 구매 URL
