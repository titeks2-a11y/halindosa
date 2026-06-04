# 할인도사 공식 혜택 Feed 계약

할인도사 뉴스/이벤트 feed는 승인된 공식 페이지를 앱용 혜택 카드로 변환하기 위한 서버 측 JSON/RSS/Atom 계약이다. 검색 결과, 커뮤니티 글, 블로그 글, 뉴스 기사 원문, 쇼핑몰 메인, 종료 이벤트는 사용자 화면에 노출하지 않는다.

## 연결 위치

운영 feed URL은 쉼표, 세미콜론, 줄바꿈 또는 JSON 배열로 `.env`에 입력한다. URL query 안의 쉼표는 분리하지 않으므로 `https://feed.example/a.json?tags=mart,coupon, https://feed.example/b.rss`처럼 써도 첫 번째 URL의 `tags=mart,coupon` 값은 유지된다. 운영에서는 긴 URL이 많으면 JSON 배열이나 줄바꿈을 권장한다.

- `DEAL_NEWS_FEED_URLS`: 공식 보도자료 또는 승인된 혜택 JSON feed
- `DEAL_NEWS_RSS_URLS`: 공식 보도자료 또는 승인된 혜택 RSS/Atom feed
- `DEAL_EVENT_NEWS_FEED_URLS`: 공식 이벤트 뉴스 feed
- `OFFICIAL_EVENT_FEED_URLS`: 쇼핑몰, 편의점, 마트, 통신사, 카드사 공식 이벤트 feed
- `PUBLIC_COUPON_FEED_URLS`: 공공 쿠폰, 문화 혜택, 무료 체험 feed

각 feed는 `Deal[]`, `{ "items": Deal[] }`, `{ "deals": Deal[] }`, `{ "newsDeals": Deal[] }`, `{ "events": Deal[] }`, `{ "coupons": Deal[] }`, `{ "benefits": Deal[] }` 중 하나를 반환할 수 있다.

RSS/Atom feed도 사용할 수 있다. RSS/Atom은 `<item>` 또는 `<entry>` 단위로 읽으며, `halindosa:finalUrl`, `finalUrl`, `eventUrl`, `purchaseUrl` 중 하나가 있으면 사용자 이동 URL로 사용한다. 해당 필드가 없으면 `<description>`, `<summary>`, `<content:encoded>` 본문 안 공식 링크를 먼저 찾고, 마지막으로 `<link>`를 후보로 쓴다. 기사 링크는 `sourceUrl`로만 보관하고, 본문 안 공식 링크가 승인 도메인이면 그 공식 링크를 `finalUrl`로 승격한다. 공식 혜택/이벤트 페이지가 아니면 사용자 화면에서 제외된다.

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

## RSS/Atom 필드 예시

```xml
<item>
  <guid>stable-official-benefit-id</guid>
  <title>공식 혜택명</title>
  <description>사용자가 조건을 이해할 수 있는 한두 문장 요약</description>
  <halindosa:merchant>공식 판매처 또는 기관명</halindosa:merchant>
  <halindosa:category>마트/편의점</halindosa:category>
  <halindosa:benefitType>coupon</halindosa:benefitType>
  <halindosa:startDate>2026-06-01</halindosa:startDate>
  <halindosa:endDate>2026-12-31</halindosa:endDate>
  <halindosa:sourceName>공식 출처명</halindosa:sourceName>
  <halindosa:sourceUrl>https://official.example/event</halindosa:sourceUrl>
  <halindosa:finalUrl>https://official.example/event</halindosa:finalUrl>
  <halindosa:confidenceScore>85</halindosa:confidenceScore>
</item>
```

운영 RSS가 일반 뉴스 RSS처럼 기사 링크만 제공한다면 `sourceUrl`로만 보관하고, 앱 노출용 `finalUrl`은 공식 이벤트/쿠폰/구매 페이지로 별도 매핑해야 한다. 매핑되지 않은 기사 원문은 기본 노출에서 제외된다.

뉴스 RSS 본문 안에 공식 이벤트 링크가 포함된 경우에는 자동으로 공식 링크를 우선 사용한다. 예를 들어 `<link>`가 뉴스 기사이고 `<description>`에 공식 이벤트 `<a href="https://official.example/event">`가 있으면 앱 이동 URL은 공식 이벤트 링크가 되며, 뉴스 기사는 운영 출처로만 남는다.

## 공식 소스 카탈로그

운영자가 새 feed를 연결하기 전에는 `npm run source:catalog:report`를 먼저 실행한다. 이 명령은 `data/officialSourceCatalog.json`의 공식 이벤트·공공 혜택·쿠폰 후보를 검증하고 `reports/official-source-catalog.json`, `docs/OFFICIAL_SOURCE_CATALOG.md`를 생성한다.

- 후보 URL은 공식 이벤트, 공식 쿠폰, 공식 구매, 공식 공공혜택 안내 페이지여야 한다.
- 검색 결과, 커뮤니티 원문, 쇼핑몰 메인, placeholder 도메인은 후보로 등록하지 않는다.
- 필수 10개 혜택 카테고리는 카테고리별 최소 2개 후보를 갖고, `news`, `event_news`, `official_event`, `public_coupon` provider가 모두 채워져야 release doctor를 통과한다.

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
- `freeShipping`
- `event`
- `membership`
- `card`
- `culture`
- `travel`
- `public`
- `point`
- `foodDelivery`
- `convenienceStore`
- `mart`

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
npm run news:feed:canary
npm run test:news-feed-errors
npm run refresh:news
npm run verify:news
npm run refresh:all
```

환경변수에 공식 feed URL을 연결한 뒤에는 `npm run news:feed:canary`로 연결된 feed URL, 설정 feed 공백, 노출 가능 후보, HTTP 오류, timeout, JSON/RSS 파싱 오류를 먼저 확인한다. canary 리포트는 `reports/news-feed-canary.json`과 `docs/NEWS_FEED_CANARY_REPORT.md`에 저장되며, `live_feed_ready` 또는 미연결 상태의 `seed_fallback_only`일 때만 다음 refresh 단계로 넘어간다.

환경변수에 공식 feed URL을 연결한 뒤에는 해당 feed의 HTTP 오류, timeout, JSON/RSS 파싱 오류가 1건이라도 있으면 `verify:news`가 실패한다. seed fallback은 로컬 개발과 미연결 provider의 화면 안정장치일 뿐이며, 설정된 운영 feed의 장애를 성공으로 덮지 않는다. `reports/news-deals.json.gates.configuredFeedErrors`에서 실패 provider, feed 수, 오류 메시지를 먼저 확인한다.

`reports/news-deals.json.sourceTrustScores`는 출처별 운영 신뢰도 표다. `trusted` 출처는 공식 링크, 마감일, 혜택 조건, 우선순위 점수가 안정적인 소스이며, `watch` 또는 `needs_review`가 나오면 검색 결과 링크, 종료 혜택, 비공식 URL, 낮은 신뢰도 사유를 먼저 수정한다. 이 표는 `/api/admin/news-operations`와 CSV export에도 포함된다.

`data/newsFeed.sample.json`과 `data/newsFeed.sample.rss.xml`은 운영자가 feed 포맷을 확인하는 안전한 샘플이다. 샘플과 실제 feed 모두 `scripts/news-feed-contract-doctor.mjs`의 계약 검사를 통과해야 한다. `npm run test:news-feed-errors`는 정상 JSON feed와 깨진 feed를 모두 재현해, 설정된 운영 feed 실패가 `configuredFeedErrors`로 잡히는지 확인한다.
