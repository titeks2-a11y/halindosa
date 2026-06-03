# 할인도사 공식 혜택 Feed 계약

할인도사 뉴스/이벤트 feed는 승인된 공식 페이지를 앱용 혜택 카드로 변환하기 위한 서버 측 JSON 계약이다. 검색 결과, 커뮤니티 글, 블로그 글, 뉴스 기사 원문, 쇼핑몰 메인, 종료 이벤트는 사용자 화면에 노출하지 않는다.

## 연결 위치

운영 feed URL은 쉼표로 구분해 `.env`에 입력한다.

- `DEAL_NEWS_FEED_URLS`: 공식 보도자료 또는 승인된 혜택 feed
- `DEAL_EVENT_NEWS_FEED_URLS`: 공식 이벤트 뉴스 feed
- `OFFICIAL_EVENT_FEED_URLS`: 쇼핑몰, 편의점, 마트, 통신사, 카드사 공식 이벤트 feed
- `PUBLIC_COUPON_FEED_URLS`: 공공 쿠폰, 문화 혜택, 무료 체험 feed

각 feed는 `Deal[]`, `{ "items": Deal[] }`, `{ "deals": Deal[] }`, `{ "newsDeals": Deal[] }`, `{ "events": Deal[] }`, `{ "coupons": Deal[] }`, `{ "benefits": Deal[] }` 중 하나를 반환할 수 있다.

## 필수 필드

```json
{
  "id": "stable-official-benefit-id",
  "title": "공식 혜택명",
  "summary": "사용자가 조건을 이해할 수 있는 한두 문장 요약",
  "merchant": "공식 판매처 또는 기관명",
  "category": "마트/편의점",
  "benefitType": "coupon",
  "startDate": "2026-06-01",
  "endDate": "2026-12-31",
  "sourceName": "공식 출처명",
  "sourceUrl": "https://official.example/event",
  "finalUrl": "https://official.example/event",
  "confidenceScore": 85,
  "tags": ["공식행사", "쿠폰"]
}
```

## 허용 카테고리

- 식품/생필품
- 마트/편의점
- 디지털/가전
- 패션/뷰티
- 외식/배달
- 여행/숙박
- 영화/문화
- 카드/멤버십
- 무료혜택
- 정부/공공혜택

## 허용 혜택 유형

- `discount`
- `coupon`
- `freebie`
- `membership`
- `card`
- `culture`
- `travel`
- `public`

## 노출 차단 기준

`refresh:news`와 `verify:news`는 아래 항목을 사용자 노출에서 제외한다.

- `finalUrl`이 공식 승인 도메인이 아닌 경우
- `/search`, `query=`, `keyword=`, `shopping/search`, `msearch`, `/find`, `/result` 등 검색 결과 URL
- 커뮤니티, 블로그, 뉴스 기사 원문, 영상 플랫폼 URL
- `endDate`가 지난 이벤트
- 혜택 조건이 불명확하거나 낚시성/스팸성 문구가 포함된 항목
- `confidenceScore`가 70 미만인 항목

뉴스 기사는 정보 출처로만 사용할 수 있다. 앱에서 열리는 `finalUrl`은 반드시 공식 이벤트, 공식 쿠폰, 공식 구매 또는 공식 혜택 안내 페이지여야 한다.

## 검증 명령

```bash
npm run news:feed:doctor
npm run refresh:news
npm run verify:news
npm run refresh:all
```

`data/newsFeed.sample.json`은 운영자가 feed 포맷을 확인하는 안전한 샘플이다. 샘플과 실제 feed 모두 `scripts/news-feed-contract-doctor.mjs`의 계약 검사를 통과해야 한다.
