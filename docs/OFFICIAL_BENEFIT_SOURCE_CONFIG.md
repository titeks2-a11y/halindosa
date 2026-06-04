# 공식 혜택 소스 설정 가이드

할인도사의 실시간 할인/무료/쿠폰/이벤트 정보는 무단 크롤링이 아니라 공식 RSS, 공식 JSON, 제휴 API, 공개적으로 허용된 이벤트 feed, 운영자가 승인한 소스만 사용한다.

## 설정 파일

공식 혜택 feed provider는 아래 파일에서 관리한다.

```text
data/officialBenefitFeedSources.json
```

운영자가 새 소스를 추가할 때는 앱 코드가 아니라 이 설정 파일에 provider 정의를 추가한다.

필수 필드:

- `id`: 운영자가 구분할 소스 ID
- `provider`: `news`, `event_news`, `official_event`, `public_coupon` 중 하나
- `source`: 리포트에 표시할 소스 그룹명
- `enabled`: 운영 반영 여부
- `seed`: seed fallback 사용 여부
- `env`: 실제 feed URL을 받을 환경변수 목록
- `categories`: 홈/검색 추천에 사용할 카테고리
- `benefitTypes`: `coupon`, `freebie`, `card`, `culture`, `foodDelivery` 같은 혜택 유형
- `recommendedQueries`: 홈 공식 혜택 섹션에 추천할 검색어 후보
- `allowedUse`: 허용되는 데이터 사용 방식
- `blockedUse`: 노출하면 안 되는 링크/데이터
- `operatorNote`: 운영자가 수집 전 확인할 사항

## 운영 원칙

- `finalUrl`은 공식 신청, 공식 이벤트, 공식 쿠폰, 공식 상품 상세 또는 승인된 제휴 상세 URL이어야 한다.
- 검색 결과, 커뮤니티 원문, 블로그, 뉴스 기사 단독 링크는 사용자 이동 URL로 쓰지 않는다.
- 종료일이 없거나 혜택 조건이 불명확한 항목은 노출하지 않는다.
- HTML 이벤트 페이지를 임의 수집하지 말고, 공식 API/RSS/JSON 또는 운영자가 승인한 변환 feed만 연결한다.

## 검증 명령

```bash
npm run refresh:news
npm run verify:news
npm run release:doctor
```

`refresh:news`는 `reports/news-deals.json`에 아래 정보를 남긴다.

- 수집/정규화/노출/숨김 수
- provider별 seed/feed 수집 현황
- 카테고리별, 혜택 유형별, 출처별 수
- 추천 검색어
- 차단 사유
- `sourceConfig`: 설정 파일에서 읽은 provider, env key, 카테고리, 추천 검색어, 운영 가드레일

## 새 소스 추가 흐름

1. 공식 소스의 사용 가능 범위를 확인한다.
2. 공식 JSON/RSS/API 또는 제휴 feed endpoint를 준비한다.
3. `data/officialBenefitFeedSources.json`에 provider 설정을 추가한다.
4. 운영 환경변수에 feed URL을 연결한다.
5. `npm run refresh:news`와 `npm run verify:news`를 실행한다.
6. `reports/news-deals.json`에서 `configuredFeedErrors`, `hiddenDeals`, `sourceConfig`를 확인한다.
7. 숨김/실패 항목이 없고 공식 링크만 통과하면 운영 노출한다.
