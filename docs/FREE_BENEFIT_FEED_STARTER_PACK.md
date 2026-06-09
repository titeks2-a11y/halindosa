# 무료혜택 운영 Feed Starter Pack

- 생성 시각: 2026-06-09T20:22:53.052Z
- 공식 소스 후보: 189개
- starter lane: 12개
- 연결 후보: 96개
- 접근 가능 후보: 96개
- 보호/승인 필요 후보: 0개

## 사용 방법

1. 아래 후보의 officialUrl은 사람이 확인하는 기준 URL입니다.
2. 운영 env에는 officialUrl을 그대로 긁는 주소가 아니라 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 넣습니다.
3. `reports/free-benefit-feed-starter-pack.env`를 복사해 Vercel Environment Variables에 필요한 키만 채웁니다.
4. 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news`를 실행합니다.

## Starter Lane

| Lane | Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |
| --- | --- | ---: | ---: | ---: | --- |
| 오늘의 무료혜택 | BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 편의점 1+1·2+1 | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 뷰티 샘플·체험 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 카페·외식 쿠폰 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 페이·포인트·캐시백 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 전원증정·선착순 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 출석체크·룰렛·미션 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 신규가입·웰컴 쿠폰 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 기프티콘·문화초대권 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 공공·문화 무료 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 교육 무료체험 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 반려동물·체험단 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |

## 우선 후보

### 오늘의 무료혜택

- env: BENEFIT_REFRESH_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| LG전자 공식 혜택·이벤트 허브 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lge.co.kr/benefits |
| 맘큐 공식 신규회원 웰컴혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event/202601290003 |
| 고용24 국민내일배움카드 공식 발급 안내 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do |
| 동대문구 유아숲체험원 가족 숲 교육 무료 예약 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260421215619744831 |
| 서울생활사박물관 어린이체험실 옴팡 무료 관람 예약 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S251118144705678859 |
| 서울시 동대문구 수상스포츠 무료 체험교육 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?locale=ko&rsv_svc_id=S260512102120511430 |

### 편의점 1+1·2+1

- env: OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 세븐일레븐 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.7-eleven.co.kr/event/eventList.asp |
| CU 공식 1+1·2+1 행사상품 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 |
| GS25 행사상품과 카드 할인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://gs25.gsretail.com/gscvs/ko/products/event-goods |
| 이마트24 공식 이벤트·행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://emart24.co.kr/event |
| GS25 혜자로운빵 토스페이 1+1 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://gs25.gsretail.com/gscvs/ko/customer-engagement/event/detail/publishing?eventCode=8842754706976&pageNum=1 |
| SSG닷컴 공식 장보기 행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.ssg.com/event/eventMain.ssg |

### 뷰티 샘플·체험

- env: OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 라운드랩 공식 이벤트 게시판 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://roundlab.co.kr/board/gallery/list.html?board_no=8 |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 아모레몰 공식 이벤트·체험단 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event |
| 이니스프리 공식 샘플마켓 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.innisfree.com/kr/ko/dp/sample-market |
| 이니스프리 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/dp/posting-list |
| 아모레몰 공식 뷰티포인트·샘플 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/main.html |

### 카페·외식 쿠폰

- env: OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS
- 첫 작업: OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| KFC 공식 딜리버리 무료배송 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kfckorea.com/promotion/promotionList/detail/1053 |
| 메가MGC커피 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event |
| 메가MGC커피 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.mega-mgccoffee.com/bbs/?bbs_category=3 |
| 스타벅스 공식 캠페인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/whats_new/campaign_list.do |
| 이디야커피 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.ediya.com/contents/event.html |

### 페이·포인트·캐시백

- env: PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| OK캐쉬백 공식 앱 설치·포인트 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/event/newwelcomeback |
| 카카오페이 공식 결제 포인트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kakaopay.com/services/life/payment?t_ch=main&t_src=homepage |
| OK캐쉬백 공식 쇼핑적립 포인트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://okcashbag.com/shopping |
| PAYCO 공식 리워드 포인트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.payco.com/point/reward.nhn |
| PAYCO 공식 이벤트·쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.payco.com/event.nhn |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |

### 전원증정·선착순

- env: BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 네이버페이 공식 온라인 쿠폰함 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/coupon/home/online |
| 맘큐 공식 신규회원 웰컴혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event/202601290003 |
| KT 공식 요고 모바일 가입 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://shop.kt.com/unify/yogoEvent.do |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 아모레몰 공식 이벤트·체험단 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event |
| LG전자 공식 혜택·이벤트 허브 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lge.co.kr/benefits |

### 출석체크·룰렛·미션

- env: PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |
| L.POINT 공식 미션·룰렛·출석 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lpoint.com/app/common/LHZZ300300.do |
| 해피포인트 공식 쿠폰·모바일 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/coupon/coupon.spc |
| OK캐쉬백 공식 앱 설치·포인트 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/event/newwelcomeback |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| 해피포인트 공식 제휴 할인 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/alliance/service/guide.spc |

### 신규가입·웰컴 쿠폰

- env: PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| KFC 공식 신규 회원 쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kfckorea.com/promotion/promotionList/detail/1040 |
| 네이버페이 공식 온라인 쿠폰함 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/coupon/home/online |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |
| 해피포인트 공식 쿠폰·모바일 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/coupon/coupon.spc |
| 맘큐 공식 신규회원 웰컴혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event/202601290003 |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |

### 기프티콘·문화초대권

- env: PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 문화포털 공식 문화초대이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/portal/cltBnf/cltInvEvt/list.do?menuNo=200106 |
| 서울시 한양도성 역사 무료 해설 체험 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847 |
| 서울 한강공원 공식 무료 행사·공연 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://hangang.seoul.go.kr/www/eventMng/list.do?mid=53 |
| 문화가 있는 날 공식 월간 프로그램 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/local/wday/mnthCltrLctnYList.do |
| 서울문화포털 공식 무료·할인 문화행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do |
| 서울시 공공서비스예약 무료 체험·교육 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/main.do |

### 공공·문화 무료

- env: PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 서울시 공공서비스예약 무료 체험·교육 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/main.do |
| 서울시 한양도성 역사 무료 해설 체험 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847 |
| 국립중앙박물관 공식 전시·문화 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current |
| EBS 평생학교 공식 무료 강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://lifelongschool.ebs.co.kr/lifelongschool/subject/introduce |
| 문화가 있는 날 공식 월간 프로그램 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/local/wday/mnthCltrLctnYList.do |
| 문화포털 공식 문화초대이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/portal/cltBnf/cltInvEvt/list.do?menuNo=200106 |

### 교육 무료체험

- env: PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 고용24 직업훈련·국민내일배움카드 공식 지원 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.work24.go.kr/cm/main.do |
| 고용24 국민내일배움카드 공식 발급 안내 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do |
| K-MOOC 공식 무료 온라인 강좌 예시 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18713 |
| K-MOOC 동역학 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18013 |
| K-MOOC 미디어리터러시 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/19037 |
| K-MOOC 예술적 얼굴과 감정조절 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/19060 |

### 반려동물·체험단

- env: BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 아모레몰 공식 이벤트·체험단 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 아모레몰 공식 뷰티포인트·샘플 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/main.html |
| 아모레몰 공식 써봐야안다 샘플 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event_detail?planDisplaySn=5277 |
| 이니스프리 공식 샘플마켓 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.innisfree.com/kr/ko/dp/sample-market |
| 퓨리나 공식 반려동물 이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.purinapetcare.co.kr/shop/event_list.php |

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 운영 feed로 쓰지 않습니다.
- 보호/로그인/WAF 페이지는 자동 수집하지 않고 공식 API, RSS, 제휴 feed, 담당자 승인 JSON으로 전환합니다.
- finalUrl은 실제 쿠폰 받기, 이벤트 참여, 샘플 신청, 출석체크, 무료체험 페이지로만 연결합니다.

