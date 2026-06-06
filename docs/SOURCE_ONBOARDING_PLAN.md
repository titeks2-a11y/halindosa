# 공식 소스 온보딩 우선순위

- 생성 시각: 2026-06-06T17:09:29.077Z
- 공식 소스 후보: 73개
- 접근 가능: 61개
- 보호/권한 확인 필요: 12개
- 차단 live 이슈: 0개
- feed 설정 완료 소스: 0개

## 운영 원칙

- 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 운영 feed로 연결합니다.
- 검색 결과, 커뮤니티 원문, 블로그 글, 쇼핑몰 메인 페이지는 사용자 finalUrl로 쓰지 않습니다.
- guarded 소스는 무단 크롤링하지 않고 공식 제휴 또는 수동 승인 매핑으로만 운영합니다.

## 다음 연결 우선순위 TOP 10

| 순위 | 소스 | Provider | 상태 | 점수 | 다음 액션 |
| --- | --- | --- | --- | ---: | --- |
| 1 | 도미노피자 공식 할인 및 제휴 혜택 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 2 | 해피포인트 공식 제휴 할인 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 3 | KFC 공식 신규 회원 쿠폰 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 4 | L.POINT 공식 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 5 | OK캐쉬백 공식 이벤트 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 6 | 스타벅스 리워드 공식 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 7 | CU 공식 1+1·2+1 행사상품 | official_event | connect_official_feed | 86 | OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 8 | 문화가 있는 날 공식 혜택 | public_coupon | connect_official_feed | 86 | PUBLIC_COUPON_FEED_URLS 또는 DEAL_NEWS_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 9 | 이마트24 공식 이벤트·행사 | official_event | connect_official_feed | 86 | OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 10 | GS25 행사상품과 카드 할인 | official_event | connect_official_feed | 86 | OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |

## 환경변수 연결 템플릿

운영자는 아래 env key별로 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 연결합니다. 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.

| Env key | 후보 | 접근 가능 | 보호/승인 필요 | 대표 후보 |
| --- | ---: | ---: | ---: | --- |
| OFFICIAL_EVENT_FEED_URLS | 59 | 51 | 8 | 도미노피자 공식 할인 및 제휴 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / L.POINT 공식 혜택 / OK캐쉬백 공식 이벤트 혜택 |
| PUBLIC_COUPON_FEED_URLS | 40 | 32 | 8 | 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / L.POINT 공식 혜택 / OK캐쉬백 공식 이벤트 혜택 / 스타벅스 리워드 공식 혜택 |
| DEAL_EVENT_FEED_URLS | 25 | 22 | 3 | 도미노피자 공식 할인 및 제휴 혜택 / CU 공식 1+1·2+1 행사상품 / 이마트24 공식 이벤트·행사 / GS25 행사상품과 카드 할인 / 세븐일레븐 공식 진행 이벤트 |
| DEAL_EVENT_NEWS_FEED_URLS | 11 | 10 | 1 | KFC 공식 딜리버리 무료배송 혜택 / 롯데잇츠 공식 월간 쿠폰 혜택 / 요기요 배달 쿠폰 이벤트 / 제주항공 공식 진행 이벤트 / 배민아카데미 공식 무료 교육 이벤트 |
| DEAL_NEWS_FEED_URLS | 10 | 6 | 4 | 문화가 있는 날 공식 혜택 / 서울문화포털 공식 무료·할인 문화행사 / 한국관광공사 공식 여행 혜택 / BC카드 공식 혜택 안내 / KT 멤버십 공식 할인·쿠폰 |

```env
# 할인도사 공식 혜택 feed 연결 템플릿
# 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 입력하세요.
# 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.
# 여러 URL은 줄바꿈, 쉼표, 세미콜론, JSON 배열 형식 중 하나로 관리할 수 있습니다.

# OFFICIAL_EVENT_FEED_URLS
# 후보 59개 · 접근 가능 51개 · 보호/승인 필요 8개
# 대표 후보: 도미노피자 공식 할인 및 제휴 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / L.POINT 공식 혜택 / OK캐쉬백 공식 이벤트 혜택
OFFICIAL_EVENT_FEED_URLS=

# PUBLIC_COUPON_FEED_URLS
# 후보 40개 · 접근 가능 32개 · 보호/승인 필요 8개
# 대표 후보: 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / L.POINT 공식 혜택 / OK캐쉬백 공식 이벤트 혜택 / 스타벅스 리워드 공식 혜택
PUBLIC_COUPON_FEED_URLS=

# DEAL_EVENT_FEED_URLS
# 후보 25개 · 접근 가능 22개 · 보호/승인 필요 3개
# 대표 후보: 도미노피자 공식 할인 및 제휴 혜택 / CU 공식 1+1·2+1 행사상품 / 이마트24 공식 이벤트·행사 / GS25 행사상품과 카드 할인 / 세븐일레븐 공식 진행 이벤트
DEAL_EVENT_FEED_URLS=

# DEAL_EVENT_NEWS_FEED_URLS
# 후보 11개 · 접근 가능 10개 · 보호/승인 필요 1개
# 대표 후보: KFC 공식 딜리버리 무료배송 혜택 / 롯데잇츠 공식 월간 쿠폰 혜택 / 요기요 배달 쿠폰 이벤트 / 제주항공 공식 진행 이벤트 / 배민아카데미 공식 무료 교육 이벤트
DEAL_EVENT_NEWS_FEED_URLS=

# DEAL_NEWS_FEED_URLS
# 후보 10개 · 접근 가능 6개 · 보호/승인 필요 4개
# 대표 후보: 문화가 있는 날 공식 혜택 / 서울문화포털 공식 무료·할인 문화행사 / 한국관광공사 공식 여행 혜택 / BC카드 공식 혜택 안내 / KT 멤버십 공식 할인·쿠폰
DEAL_NEWS_FEED_URLS=

```

## 전체 큐

| 순위 | ID | 카테고리 | Live | HTTP | Env | Guardrail |
| --- | --- | --- | --- | ---: | --- | --- |
| 1 | dominos-official-discount-benefits | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 2 | happypoint-alliance-benefits | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 3 | kfc-new-member-coupon-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 4 | lpoint-benefits | 카드/멤버십 / 무료혜택 / 마트/편의점 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 5 | okcashbag-event-benefits | 카드/멤버십 / 무료혜택 / 마트/편의점 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 6 | starbucks-rewards-official-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 7 | cu-plus-official-monthly-benefit | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 8 | culture-day | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 9 | emart24-official-events | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 10 | gs25-event-goods | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 11 | kfc-delivery-free | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 12 | lotteeatz-monthly-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 13 | mcdonalds-happy-snack-free-drink | 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 14 | pizzahut-member-free-coupon-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 15 | seoul-culture-official-free-events | 영화/문화 / 무료혜택 / 정부/공공혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 16 | seven-eleven-official-events | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 17 | cu-plus-event | 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 18 | innisfree-sample-market | 무료혜택 / 패션/뷰티 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 19 | mnuri-benefit | 정부/공공혜택 / 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 20 | naverpay-benefit | 카드/멤버십 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 21 | ssg-event-main | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 22 | visitkorea-travel-week | 여행/숙박 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 23 | yogiyo-event | 외식/배달 | reachable | 200 | DEAL_EVENT_NEWS_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 24 | cjone-mobile-events | 카드/멤버십 / 외식/배달 / 영화/문화 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 25 | bhc-ecoupon | 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 26 | happypoint-mobile-coupon | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 27 | hollys-official-event-coupon | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 28 | kurly-beauty-sample-product | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 29 | kurly-living-free-shipping-product | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 30 | jejuair-events | 여행/숙박 | guarded | 503 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 31 | baemin-academy-events | 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 32 | baskinrobbins-events | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 33 | bccard-benefit-official-center | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 34 | ediya-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 35 | krispykreme-wednesday-event | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 36 | kt-membership-official-benefit | 카드/멤버십 / 외식/배달 / 영화/문화 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 37 | kurly-digital-free-shipping-product | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 38 | kurly-fashion-free-shipping-product | 패션/뷰티 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 39 | lotteon-lobs-share-event | 패션/뷰티 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 40 | lpoint-card-events | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 41 | mcdonalds-happysnack | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 42 | mega-mgc-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 43 | megabox-events | 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 44 | megabox-membership-official-benefit | 영화/문화 / 무료혜택 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 45 | megabox-vip-lounge-official-benefit | 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 46 | momstouch-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 47 | national-museum-official-exhibition | 영화/문화 / 무료혜택 / 정부/공공혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 48 | okcashbag-brand-events | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 49 | parisbaguette-promotion | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 50 | starbucks-campaign | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 51 | tworld-membership | 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 52 | uplus-membership-official-benefit | 카드/멤버십 / 외식/배달 / 영화/문화 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 53 | bccard-events | 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 54 | cgv-events | 영화/문화 / 무료혜택 | guarded | 403 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 55 | emart-event-main | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 56 | hanacard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 57 | homeplus-event | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 58 | homeplus-membership-official-coupon | 마트/편의점 / 식품/생필품 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 59 | innisfree-event-coupon | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 60 | kbcard-events | 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 61 | lottecard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 62 | lottecinema-events | 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 63 | lottecinema-lpoint-membership-benefit | 영화/문화 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 64 | naverplus-membership-official-benefit | 카드/멤버십 / 무료혜택 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 65 | samsung-members-official-benefit | 디지털/가전 / 무료혜택 / 카드/멤버십 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 66 | samsungcard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 67 | subway-official-promotion | 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 68 | himart-events | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 69 | hmall-official-events | 패션/뷰티 / 식품/생필품 | reachable | 200 | DEAL_NEWS_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 70 | koreanair-promotion | 여행/숙박 | reachable | 200 | DEAL_EVENT_NEWS_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 71 | musinsa-fashion-festa | 패션/뷰티 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 72 | oliveyoung-events | 패션/뷰티 / 무료혜택 | guarded | 403 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 73 | samsung-shop-event | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |

## 재생성

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:onboarding:plan
```
