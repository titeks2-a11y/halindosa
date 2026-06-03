# 공식 소스 카탈로그

이 문서는 할인도사에 연결할 수 있는 공식 이벤트, 공공 혜택, 제휴 JSON/RSS 후보를 정리합니다. 무단 크롤링 후보가 아니라 운영자가 승인 feed 또는 공식 페이지 매핑으로 전환할 때 쓰는 출발점입니다.

- 생성 시각: 2026-06-03T18:23:02.081Z
- 상태: PASS
- 후보 소스: 20개
- 고우선순위 후보: 7개
- 현재 env feed 연결 후보: 0개
- 공식 혜택 노출: 30개
- feed 전환 상태: seed_launch_ready

## 카테고리 커버리지

| 카테고리 | 후보 수 | 상태 |
| --- | ---: | --- |
| 식품/생필품 | 4 | 충분 |
| 마트/편의점 | 5 | 충분 |
| 디지털/가전 | 2 | 충분 |
| 패션/뷰티 | 2 | 충분 |
| 외식/배달 | 3 | 충분 |
| 여행/숙박 | 1 | 보강 |
| 영화/문화 | 4 | 충분 |
| 카드/멤버십 | 4 | 충분 |
| 무료혜택 | 4 | 충분 |
| 정부/공공혜택 | 2 | 충분 |

## Provider 커버리지

| Provider | 후보 수 | 상태 |
| --- | ---: | --- |
| news | 1 | 포함 |
| event_news | 2 | 포함 |
| official_event | 13 | 포함 |
| public_coupon | 4 | 포함 |

## 후보 목록

| ID | Provider | 카테고리 | 우선순위 | 공식 URL | Env |
| --- | --- | --- | --- | --- | --- |
| gs25-event-goods | official_event | 마트/편의점, 무료혜택 | high | https://gs25.gsretail.com/gscvs/ko/products/event-goods | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| cu-plus-event | official_event | 마트/편의점 | high | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| ssg-event-main | official_event | 식품/생필품, 마트/편의점 | high | https://www.ssg.com/event/eventMain.ssg | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| emart-event-main | official_event | 식품/생필품, 마트/편의점 | medium | https://emart.ssg.com/event/eventMain.ssg | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| homeplus-event | official_event | 식품/생필품, 마트/편의점 | medium | https://front.homeplus.co.kr/event | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| yogiyo-event | event_news | 외식/배달 | high | https://www.yogiyo.co.kr/mobile/#/event/ | DEAL_EVENT_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| bhc-ecoupon | official_event | 외식/배달 | medium | https://www.bhc.co.kr/eCoupon/purchase | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| cgv-events | public_coupon | 영화/문화, 무료혜택 | medium | https://www.cgv.co.kr/culture-event/event/defaultNew.aspx | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecinema-events | public_coupon | 영화/문화 | medium | https://www.lottecinema.co.kr/NLCHS/Event | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| culture-day | public_coupon | 영화/문화, 정부/공공혜택, 무료혜택 | high | https://www.culture.go.kr/wday/main/main.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| mnuri-benefit | public_coupon | 정부/공공혜택, 영화/문화 | high | https://www.mnuri.kr/main/main.do | PUBLIC_COUPON_FEED_URLS |
| naverpay-benefit | official_event | 카드/멤버십, 무료혜택 | high | https://new-m.pay.naver.com/pcpay/eventbenefit | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| kbcard-events | official_event | 카드/멤버십 | medium | https://card.kbcard.com/BON/DVIEW/HBBMCXCRVNEC0001 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| bccard-events | official_event | 카드/멤버십 | medium | https://www.bccard.com/app/card/EventActn.do?menuId=64 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| tworld-membership | official_event | 카드/멤버십, 외식/배달 | medium | https://www.tworld.co.kr/poc/html/product/TS3.7.1T.2.html | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| koreanair-promotion | event_news | 여행/숙박 | medium | https://www.koreanair.com/promotion/list | DEAL_EVENT_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| samsung-shop-event | official_event | 디지털/가전 | medium | https://www.samsung.com/sec/shop/event/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| himart-events | official_event | 디지털/가전 | medium | https://www.e-himart.co.kr/app/event/eventList | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| hmall-official-events | news | 패션/뷰티, 식품/생필품 | medium | https://www.hyundaihmall.com/front/evntSect.do | DEAL_NEWS_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| musinsa-fashion-festa | official_event | 패션/뷰티 | medium | https://www.musinsa.com/campaign/fashionfesta_1 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |

## 다음 작업

- OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.
- 새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.
- 사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다.

## 검증 결과

- 이슈 없음

