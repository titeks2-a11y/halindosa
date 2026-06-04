# 공식 소스 통합 준비도

- 생성 시각: 2026-06-04T06:19:10.886Z
- 준비 상태: seed launch ready / 공식 feed 연결 대기
- 출시 게이트: passed
- 공식 소스 후보: 30개
- 접근 가능/보호 소스: 27개 / 3개
- 설정된 공식 feed URL: 0개
- 공식 혜택 노출 가능: 43개
- 차단 이슈: 0개

## 운영 원칙

- 공식 API, RSS, Atom, 승인 JSON, 제휴 feed만 운영 데이터로 연결합니다.
- 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인, HTML 이벤트 랜딩 페이지는 사용자 노출 링크나 운영 feed로 사용하지 않습니다.
- 보호/권한 페이지는 직접 수집하지 않고 담당자 승인 API, RSS, 제휴 feed로 전환합니다.

## 게이트

| 게이트 | 상태 | 내용 | 다음 작업 |
| --- | --- | --- | --- |
| official source catalog | passed | 30개 공식 소스 후보, 누락 카테고리 0개, 얇은 카테고리 0개 | npm run source:catalog:report |
| official source live | passed | 접근 가능 27개, 보호 3개, 차단 이슈 0개 | npm run source:live:doctor |
| source onboarding plan | passed | env 후보 5개, 상위 액션 10개 | npm run source:onboarding:plan |
| source feed env safety | passed | 설정 URL 0개, 실패 0개, 정책 샘플 실패 0개 | npm run source:feed-env:doctor |
| official benefit exposure | passed | 노출 43개, 숨김 0개, 종료 0개, 실패 0개 | npm run refresh:news && npm run verify:news |
| refresh all pipeline | passed | 상품 140개, 공식 혜택 43개, 실패 0개 | npm run refresh:all |

## 공식 feed env 연결 후보

| Env key | 상태 | 후보 | 접근 가능 | 보호/승인 | 설정 URL | 다음 작업 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| OFFICIAL_EVENT_FEED_URLS | ready_to_connect | 24 | 21 | 3 | 0 | OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력 |
| DEAL_EVENT_FEED_URLS | ready_to_connect | 13 | 13 | 0 | 0 | DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력 |
| PUBLIC_COUPON_FEED_URLS | ready_to_connect | 12 | 10 | 2 | 0 | PUBLIC_COUPON_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력 |
| DEAL_EVENT_NEWS_FEED_URLS | ready_to_connect | 7 | 6 | 1 | 0 | DEAL_EVENT_NEWS_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력 |
| DEAL_NEWS_FEED_URLS | ready_to_connect | 3 | 3 | 0 | 0 | DEAL_NEWS_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력 |

## 점검해야 할 보호/위험 소스

| ID | 소스 | Provider | 상태 | 운영 액션 |
| --- | --- | --- | --- | --- |
| cgv-events | CGV 공식 문화 이벤트 | public_coupon | guarded | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| naverpay-benefit | 네이버페이 공식 이벤트 혜택 | official_event | guarded | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| jejuair-events | 제주항공 공식 진행 이벤트 | official_event | guarded | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |

## 다음 작업

- OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.
- 새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.
- 사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다.
- PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결
- PUBLIC_COUPON_FEED_URLS 또는 DEAL_NEWS_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결
- OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결
- PUBLIC_COUPON_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결
- 공식 feed env가 아직 연결되지 않았습니다. source:onboarding:plan의 env 템플릿에서 우선 후보를 골라 담당자 승인 JSON/RSS/API만 연결하세요.
- 검색 결과, 커뮤니티 원문, 블로그, HTML 랜딩 페이지는 운영 feed와 사용자 이동 링크로 연결하지 않습니다.

## 재생성 명령

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:onboarding:plan
npm run source:feed-env:doctor
npm run source:readiness:report
npm run refresh:all
```
