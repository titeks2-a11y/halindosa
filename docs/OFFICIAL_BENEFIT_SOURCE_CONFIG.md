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
- `targetSections`: 홈·카테고리·추천 검색에서 우선 노출할 섹션명
- `operatorOwner`: 운영 담당 그룹. 예: `benefit-ops`, `commerce-ops`, `event-ops`
- `launchPriority`: `high`, `medium`, `low` 중 하나. 출시 전 우선 연결할 소스는 `high`
- `refreshCadenceMinutes`: 운영 feed 재확인 권장 주기. 이벤트·마트·배달은 180분, 공공·문화·카드는 360분을 기본으로 둔다
- `qualityChecklist`: 운영자가 feed 연결 전 확인해야 할 품질 항목. 예: `officialFinalUrl`, `endDate`, `benefitConditions`, `sourceAttribution`
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
- 수집 → 정규화 → 검증 → 중복 제거 → 노출/차단으로 이어지는 `collectionSummary`
- 중복 제거 수, 실패 feed 수, 설정됐지만 비어 있는 feed 수
- provider별 seed/feed 수집 현황
- 출처별 `sourceTrustScores`: 노출 수, 숨김/실패/검색 링크/종료 수, 평균 우선순위, 신뢰도 점수, 권장 운영 액션
- 카테고리별, 혜택 유형별, 출처별 수
- 추천 검색어
- 차단 사유
- `sourceConfig`: 설정 파일에서 읽은 provider, env key, 카테고리, 추천 검색어, 운영 가드레일
- `sourceConfig.nextRefreshAt`: 가장 짧은 `refreshCadenceMinutes` 기준 다음 공식 feed 재확인 시각
- `sourceConfig.sourceRefreshWindows`: 소스별 담당 그룹, 재확인 주기, 다음 확인 시각, 상태(`near_realtime`, `standard`, `watch`), 운영 액션
- `sourceConfig.sourceOperations`: 소스별 담당 그룹, 출시 우선순위, 재확인 주기, 다음 확인 시각, 노출 섹션, 품질 체크리스트
- `sourceConfig.targetSections`: 홈에서 우선 보여줄 추천 섹션 후보
- `sourceConfig.operatorOwners`: 운영 담당 그룹 목록

`/api/news-deals`는 보이는 혜택에서 뽑은 키워드와 이 설정 파일의 `recommendedQueries`를 함께 사용한다. 따라서 운영자가 `오늘의 무료`, `쿠폰`, `마트 행사`, `편의점 1+1`, `배달 쿠폰`, `카드 혜택`, `정부 지원`, `문화 혜택` 같은 검색어를 설정하면 홈 공식 혜택 섹션의 추천 검색어 칩에도 반영된다. `targetSections`는 관리자 운영 화면에서 노출 후보로 확인해 홈 편집과 피드 운영이 같은 기준을 보게 한다.

## 새 소스 추가 흐름

1. 공식 소스의 사용 가능 범위를 확인한다.
2. 공식 JSON/RSS/API 또는 제휴 feed endpoint를 준비한다.
3. `data/officialBenefitFeedSources.json`에 provider 설정을 추가한다.
4. 운영 환경변수에 feed URL을 연결한다.
5. `npm run refresh:news`와 `npm run verify:news`를 실행한다.
6. `reports/news-deals.json`에서 `configuredFeedErrors`, `hiddenDeals`, `sourceConfig`를 확인한다.
7. 숨김/실패 항목이 없고 공식 링크만 통과하면 운영 노출한다.
