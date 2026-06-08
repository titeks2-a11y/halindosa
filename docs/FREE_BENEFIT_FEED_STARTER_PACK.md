# 무료혜택 운영 Feed Starter Pack

- 생성 시각: 2026-06-08T22:47:49.481Z
- 공식 소스 후보: 102개
- starter lane: 8개
- 연결 후보: 64개
- 접근 가능 후보: 56개
- 보호/승인 필요 후보: 8개

## 사용 방법

1. 아래 후보의 officialUrl은 사람이 확인하는 기준 URL입니다.
2. 운영 env에는 officialUrl을 그대로 긁는 주소가 아니라 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 넣습니다.
3. `reports/free-benefit-feed-starter-pack.env`를 복사해 Vercel Environment Variables에 필요한 키만 채웁니다.
4. 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news`를 실행합니다.

## Starter Lane

| Lane | Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |
| --- | --- | ---: | ---: | ---: | --- |
| 오늘의 무료혜택 | BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 6 | 2 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 편의점 1+1·2+1 | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 뷰티 샘플·체험 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 7 | 1 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 카페·외식 쿠폰 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 페이·포인트·캐시백 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 6 | 2 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 공공·문화 무료 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 교육 무료체험 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 반려동물·체험단 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 7 | 1 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |

## 우선 후보

### 오늘의 무료혜택

- env: BENEFIT_REFRESH_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 고용24 직업훈련·국민내일배움카드 공식 지원 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.work24.go.kr/cm/main.do |
| K-MOOC 공식 무료 온라인 강좌 예시 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18713 |
| 해피포인트 공식 제휴 할인 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/alliance/service/guide.spc |
| L.POINT 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.lpoint.com/index.jsp?tabIndex=1 |
| OK캐쉬백 공식 이벤트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/life/event/eventHome.do |
| 서울문화포털 공식 무료·할인 문화행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do |

### 편의점 1+1·2+1

- env: OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 세븐일레븐 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.7-eleven.co.kr/event/eventList.asp |
| CU 공식 1+1·2+1 행사상품 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 |
| GS25 행사상품과 카드 할인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://gs25.gsretail.com/gscvs/ko/products/event-goods |
| 이마트24 공식 이벤트·행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://emart24.co.kr/event |
| SSG닷컴 공식 장보기 행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.ssg.com/event/eventMain.ssg |
| 이마트몰 공식 행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://emart.ssg.com/event/eventMain.ssg |

### 뷰티 샘플·체험

- env: OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 이니스프리 공식 샘플마켓 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.innisfree.com/kr/ko/dp/sample-market |
| 이니스프리 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/dp/posting-list |
| 올리브영 공식 이벤트 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.oliveyoung.co.kr/store/main/getEventList.do |
| 롯데ON 공식 혜택 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteon.com/event/onLohbsShare |
| 컬리 공식 뷰티 증정 이벤트 상품 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kurly.com/goods/1000120890 |
| 텐바이텐 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.10x10.co.kr/event/eventmain.asp |

### 카페·외식 쿠폰

- env: OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| KFC 공식 딜리버리 무료배송 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kfckorea.com/promotion/promotionList/detail/1053 |
| 메가MGC커피 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event |
| 스타벅스 공식 캠페인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/whats_new/campaign_list.do |
| 이디야커피 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.ediya.com/contents/event.html |
| 던킨 공식 이달의 콤보 쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.dunkindonuts.co.kr/event/view?id=5392 |

### 페이·포인트·캐시백

- env: PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| OK캐쉬백 공식 이벤트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/life/event/eventHome.do |
| OK캐쉬백 공식 브랜드 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/life/event/eventMain.do |
| 네이버페이 공식 이벤트 혜택 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://new-m.pay.naver.com/pcpay/eventbenefit |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| 해피포인트 공식 제휴 할인 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/alliance/service/guide.spc |
| L.POINT 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.lpoint.com/index.jsp?tabIndex=1 |

### 공공·문화 무료

- env: PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 서울문화포털 공식 무료·할인 문화행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do |
| 국립중앙박물관 공식 전시·문화 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current |
| 문화가 있는 날 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/wday/main/main.do |
| 복지로 공식 복지서비스·신청 혜택 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.bokjiro.go.kr/ssis-tbu/index.do |
| 고용24 직업훈련·국민내일배움카드 공식 지원 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.work24.go.kr/cm/main.do |
| 정부24 혜택알리미 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.gov.kr/portal/rcvfvrSvc/main |

### 교육 무료체험

- env: PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 고용24 직업훈련·국민내일배움카드 공식 지원 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.work24.go.kr/cm/main.do |
| K-MOOC 공식 무료 온라인 강좌 예시 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18713 |
| 서울문화포털 공식 무료·할인 문화행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do |
| 국립중앙박물관 공식 전시·문화 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current |
| 복지로 공식 복지서비스·신청 혜택 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.bokjiro.go.kr/ssis-tbu/index.do |
| 문화가 있는 날 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/wday/main/main.do |

### 반려동물·체험단

- env: BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 이니스프리 공식 샘플마켓 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.innisfree.com/kr/ko/dp/sample-market |
| 로얄캐닌 코리아 공식 반려동물 캠페인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.royalcanin.com/kr/about-us/news/sol4-campaign |
| 이니스프리 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/dp/posting-list |
| 파우더룸 공식 뷰티 체험단 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.powderroom.co.kr/review |
| 올리브영 공식 이벤트 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.oliveyoung.co.kr/store/main/getEventList.do |
| 롯데ON 공식 혜택 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteon.com/event/onLohbsShare |

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 운영 feed로 쓰지 않습니다.
- 보호/로그인/WAF 페이지는 자동 수집하지 않고 공식 API, RSS, 제휴 feed, 담당자 승인 JSON으로 전환합니다.
- finalUrl은 실제 쿠폰 받기, 이벤트 참여, 샘플 신청, 출석체크, 무료체험 페이지로만 연결합니다.

