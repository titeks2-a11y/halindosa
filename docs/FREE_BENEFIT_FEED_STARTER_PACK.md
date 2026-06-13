# 무료혜택 운영 Feed Starter Pack

- 생성 시각: 2026-06-13T11:11:53.155Z
- 공식 소스 후보: 252개
- starter lane: 13개
- 연결 후보: 104개
- 접근 가능 후보: 100개
- 보호/승인 필요 후보: 4개

## 사용 방법

1. 아래 후보의 officialUrl은 사람이 확인하는 기준 URL입니다.
2. 운영 env에는 officialUrl을 그대로 긁는 주소가 아니라 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 넣습니다.
3. 첫 연결 smoke/starter 값으로 `https://www.halindosa.com/api/feeds/free-benefits`를 `BENEFIT_REFRESH_FEED_URLS`에 넣을 수 있습니다. 이 endpoint는 공식·검증·publishable 무료혜택만 내보냅니다.
4. `reports/free-benefit-feed-starter-pack.env`를 복사해 Vercel Environment Variables에 필요한 키만 채웁니다.
5. `reports/free-benefit-feed-vercel-env-commands.md`의 대화형 Vercel CLI 명령으로 Production/Preview env를 연결합니다.
6. `reports/free-benefit-feed-github-actions-commands.md`로 30분 주기 GitHub Actions 갱신 secret과 운영 URL variable을 연결합니다.
7. 공식 feed URL을 새로 연결한 직후에는 GitHub Actions를 `force_live_feed=true`로 수동 실행해 정각을 기다리지 않고 운영 `/api/cron/refresh?mode=liveFeed`를 검증합니다.
8. 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news`를 실행합니다.
9. 기본 운영 feed는 소비자 브랜드/쇼핑몰/프랜차이즈/멤버십 무료혜택을 우선합니다. 공공·교육 lane은 별도 탭 또는 명시 필터가 필요할 때만 선택 연결합니다.

## Starter Lane

| Lane | 운영 구분 | Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 오늘 바로 받는 무료혜택 | 기본 | BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 편의점 1+1·2+1 | 기본 | CONVENIENCE_BENEFIT_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 8 | 0 | CONVENIENCE_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 뷰티 샘플·체험 | 기본 | BEAUTY_SAMPLE_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | BEAUTY_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 카페·외식 쿠폰 | 기본 | CAFE_FRANCHISE_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | 8 | 8 | 0 | CAFE_FRANCHISE_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 쇼핑몰·브랜드 쿠폰 | 기본 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 페이·포인트·캐시백 | 기본 | PAY_POINT_BENEFIT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 8 | 0 | PAY_POINT_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 전원증정·선착순 | 기본 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 출석체크·룰렛·미션 | 기본 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 신규가입·웰컴 쿠폰 | 기본 | SIGNUP_GIFT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | SIGNUP_GIFT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 기프티콘·문화초대권 | 기본 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 6 | 2 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 반려동물·체험단 | 기본 | PET_SAMPLE_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PET_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 선택 운영: 공공·문화 무료 | 선택 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 8 | 8 | 0 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 선택 운영: 교육 무료체험 | 선택 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 8 | 8 | 0 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |

## 우선 후보

### 오늘 바로 받는 무료혜택

- env: BENEFIT_REFRESH_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 이니스프리 공식 이벤트·쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/EventList.do |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |
| 해피포인트 공식 쿠폰·모바일 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/coupon/coupon.spc |
| 롯데잇츠 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteeatz.com/event/main |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 아모레몰 공식 이벤트·체험단 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event |

### 편의점 1+1·2+1

- env: CONVENIENCE_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS
- 첫 작업: CONVENIENCE_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 세븐일레븐 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.7-eleven.co.kr/event/eventList.asp |
| CU 공식 1+1·2+1 행사상품 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 |
| CU 공식 1+1·2+1 행사상품 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1&sf=N |
| GS25 행사상품과 카드 할인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://gs25.gsretail.com/gscvs/ko/products/event-goods |
| 이마트24 공식 이벤트·행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://emart24.co.kr/event |
| CU편의점택배 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.cupost.co.kr/mobile/cuevent/eventList.cupost |

### 뷰티 샘플·체험

- env: BEAUTY_SAMPLE_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 첫 작업: BEAUTY_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 이니스프리 공식 이벤트·쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/EventList.do |
| 라운드랩 공식 이벤트 게시판 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://roundlab.co.kr/board/gallery/list.html?board_no=8 |
| 아모레몰 공식 이벤트·체험단 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/display/event |
| 마몽드 공식 이벤트·체험 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.mamonde.com/kr/ko/event.html |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 아모레몰 공식 뷰티포인트·샘플 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.amoremall.com/kr/ko/main.html |

### 카페·외식 쿠폰

- env: CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS
- 첫 작업: CAFE_FRANCHISE_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 도미노피자 공식 이벤트·제휴 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://web.dominos.co.kr/event/list?gubun=E0200 |
| 롯데잇츠 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteeatz.com/event/main |
| 버거킹 공식 진행 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.burgerking.co.kr/event/ongoing |
| 메가MGC커피 공식 이벤트·제휴 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.mega-mgccoffee.com/bbs/?bbs_category=3&bbs_detail_category=12 |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |

### 쇼핑몰·브랜드 쿠폰

- env: PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 롯데ON 공식 롭스·뷰티 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteon.com/event/onLohbsShare |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 오늘의집 공식 시즌 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://events.ohou.se/promotions/o-season-week |
| 쿠팡 공식 이벤트·쿠폰 혜택 센터 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.coupang.com/np/coupangbenefit |
| 네이버페이 공식 온라인 쿠폰함 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/coupon/home/online |
| CJ더마켓 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.cjthemarket.com/pc/event/eventMain |

### 페이·포인트·캐시백

- env: PAY_POINT_BENEFIT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 첫 작업: PAY_POINT_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| NH농협카드 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://nhpay.nonghyup.com/bn/BN600000F |
| 롯데카드 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lottecard.co.kr/app/LPCDADB_V100.lc |
| 네이버페이 공식 결제혜택 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/benefit/payment/list |
| L.POINT 공식 이벤트·포인트 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.lpoint.com/app/event/LWEA100110.do |
| OK캐쉬백 공식 앱 설치·포인트 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/event/newwelcomeback |
| 신한카드 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.shinhancard.com/pconts/html/benefit/event/eventList.html |

### 전원증정·선착순

- env: BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 신세계포인트 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.shinsegaepoint.com/ingevents |
| 이니스프리 공식 이벤트·쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.innisfree.com/kr/ko/EventList.do |
| LG생활건강 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lghnh.com:984/news/event.jsp |
| 네이버페이 공식 온라인 쿠폰함 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/coupon/home/online |
| 맘큐 공식 신규회원 웰컴혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event/202601290003 |
| CU편의점택배 공식 진행 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.cupost.co.kr/mobile/cuevent/eventList.cupost |

### 출석체크·룰렛·미션

- env: PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |
| L.POINT 공식 미션·룰렛·출석 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lpoint.com/app/common/LHZZ300300.do |
| 해피포인트 공식 쿠폰·모바일 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/coupon/coupon.spc |
| T멤버십 공식 매일 혜택 미션 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://m.tworld.co.kr/membership/submain |
| OK캐쉬백 공식 앱 설치·포인트 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.okcashbag.com/event/newwelcomeback |
| 신세계포인트 공식 출석체크·포인트 플러스 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.shinsegaepoint.com/benefits/pntPlus/attend |

### 신규가입·웰컴 쿠폰

- env: SIGNUP_GIFT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: SIGNUP_GIFT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| CJ ONE 공식 신규가입 축하 쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.cjone.com/cjmweb/event-coupon/coupon.do |
| KFC 공식 신규 회원 쿠폰 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kfckorea.com/promotion/promotionList/detail/1040 |
| 네이버페이 공식 온라인 쿠폰함 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://pay.naver.com/coupon/home/online |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |
| 해피포인트 공식 쿠폰·모바일 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.happypointcard.com/coupon/coupon.spc |
| 맘큐 공식 신규회원 웰컴혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event/202601290003 |

### 기프티콘·문화초대권

- env: PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| CJ ONE 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.cjone.com/cjmmobile/event/event.do |
| LG U+ 공식 멤버십 제휴사 혜택 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.lguplus.com/benefit-membership/affiliate-perks |
| SKT T멤버십 공식 할인·무료 혜택 | guarded | 무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결 | https://www.tworld.co.kr/web/html/tmembership/index.html |
| 롯데잇츠 공식 이벤트·쿠폰 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteeatz.com/event/main |
| 스타벅스 리워드 공식 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.starbucks.co.kr/msr/msreward/about.do |
| 요기요 공식 룰렛 쿠폰 프로모션 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.yogiyo.co.kr/promotion/roulette/ |

### 반려동물·체험단

- env: PET_SAMPLE_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS
- 첫 작업: PET_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| LG생활건강 공식 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lghnh.com:984/news/event.jsp |
| 맘큐 공식 육아 샘플·이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.momq.co.kr/event |
| 파우더룸 공식 체험단·샘플 캠페인 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.powderroom.co.kr/campaigns |
| 퓨리나 공식 반려동물 이벤트 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.purinapetcare.co.kr/shop/event_list.php |
| 네츄럴코어 공식 이벤트 게시판 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://naturalcore.co.kr/board/%EC%9D%B4%EB%B2%A4%ED%8A%B8/8/ |
| 롯데ON 공식 롭스·뷰티 이벤트 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.lotteon.com/event/onLohbsShare |

### 선택 운영: 공공·문화 무료

- env: OPTIONAL_PUBLIC_BENEFIT_FEED_URLS
- 첫 작업: OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 서울시 공공서비스예약 무료 체험·교육 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/main.do |
| 서울시 한양도성 역사 무료 해설 체험 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847 |
| 국립중앙박물관 공식 전시·문화 혜택 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current |
| 서울문화포털 공식 무료·할인 문화행사 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do |
| EBS 평생학교 공식 무료 강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://lifelongschool.ebs.co.kr/lifelongschool/subject/introduce |
| 문화가 있는 날 공식 월간 프로그램 목록 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.culture.go.kr/local/wday/mnthCltrLctnYList.do |

### 선택 운영: 교육 무료체험

- env: OPTIONAL_PUBLIC_BENEFIT_FEED_URLS
- 첫 작업: OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결

| 후보 | 상태 | 권장 작업 | 공식 확인 URL |
| --- | --- | --- | --- |
| 고용24 직업훈련·국민내일배움카드 공식 지원 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.work24.go.kr/cm/main.do |
| 고용24 국민내일배움카드 공식 발급 안내 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do |
| K-MOOC 공식 무료 온라인 강좌 예시 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18713 |
| K-MOOC 동역학 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/18013 |
| K-MOOC 미디어리터러시 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/19037 |
| K-MOOC 예술적 얼굴과 감정조절 공식 무료강좌 | reachable | 공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결 | https://www.kmooc.kr/view/course/detail/19060 |

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 운영 feed로 쓰지 않습니다.
- 보호/로그인/WAF 페이지는 자동 수집하지 않고 공식 API, RSS, 제휴 feed, 담당자 승인 JSON으로 전환합니다.
- finalUrl은 실제 쿠폰 받기, 이벤트 참여, 샘플 신청, 출석체크, 무료체험 페이지로만 연결합니다.

