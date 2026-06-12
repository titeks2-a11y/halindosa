# 무료혜택 Feed 운영 핸드오프

- 생성 시각: 2026-06-12T04:05:39.513Z
- starter lane: 13개
- 연결 후보: 104개
- 접근 가능 후보: 98개
- 보호/승인 필요 후보: 6개
- 현재 설정된 feed URL: 0개
- canary 상태: seed_fallback_only

## 목적

할인도사는 공식 API, RSS, Atom, 승인 파트너 JSON feed를 통해 무료혜택, 쿠폰, 샘플, 체험, 전원증정 정보를 갱신한다. 이 문서는 seed fallback에서 실제 운영 feed로 넘어갈 때 필요한 환경변수와 검증 순서를 한 장으로 정리한다.

## Vercel Environment Variables

| Key | 용도 | 입력 기준 |
| --- | --- | --- |
| BENEFIT_REFRESH_FEED_URLS | 오늘 바로 받는 무료혜택, 전원증정, 샘플, 체험단 우선 feed | 공식 API/RSS/Atom/승인 JSON endpoint만 입력 |
| PUBLIC_COUPON_FEED_URLS | 소비자 쿠폰, 포인트, 기프티콘, 멤버십 feed | 검색 결과, 커뮤니티 글, HTML 메인 페이지 금지 |
| OFFICIAL_EVENT_FEED_URLS | 브랜드 공식 이벤트, 편의점, 뷰티, 외식 쿠폰 feed | 공식 이벤트 확인 페이지가 아니라 machine-readable feed endpoint 입력 |
| TELECOM_MEMBERSHIP_FEED_URLS | 통신사 멤버십 무료 쿠폰, 기프티콘, 포인트 feed | SKT, KT, LG U+ 공식/승인 feed만 입력 |
| CONVENIENCE_BENEFIT_FEED_URLS | 편의점 전원증정, 앱 쿠폰, 1+1·2+1 행사 feed | CU, GS25, 세븐일레븐, 이마트24 공식/승인 feed만 입력 |
| BEAUTY_SAMPLE_FEED_URLS | 뷰티 샘플, 무료체험, 쿠폰 feed | 올리브영, 아모레몰, 닥터지 등 공식/승인 feed만 입력 |
| CAFE_FRANCHISE_COUPON_FEED_URLS | 카페·프랜차이즈 쿠폰, 스탬프, 기프티콘 feed | 브랜드 공식/승인 feed만 입력 |
| PAY_POINT_BENEFIT_FEED_URLS | 페이·포인트·캐시백·출석체크 feed | 네이버페이, 카카오페이, 토스 등 공식/승인 feed만 입력 |
| PET_SAMPLE_FEED_URLS | 반려동물 샘플, 체험팩, 쿠폰 feed | 브랜드 공식/승인 feed만 입력 |
| SIGNUP_GIFT_FEED_URLS | 신규가입 쿠폰, 웰컴 포인트, 가입 기프티콘 feed | 추천인 홍보글과 광고 랜딩은 금지 |
| OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 공공·교육 무료혜택 선택 운영 feed | 기본 홈 feed에는 섞지 않고 명시 필터/별도 화면에서만 사용 |
| BENEFIT_REFRESH_APPROVED_HOSTS | BENEFIT_REFRESH_FEED_URLS에 쓰는 승인 host | host 이름만 입력, 토큰/query 금지 |
| HALINDOSA_APPROVED_FEED_HOSTS | 공통 승인 feed host allowlist | 공식 카탈로그에 없는 승인 feed host만 추가 |
| CRON_SECRET | /api/cron/refresh, /api/cron/benefits 보호 | Vercel Cron과 서버에서만 쓰는 랜덤 secret |

## 연결 순서

1. `npm run source:starter:pack`으로 lane별 후보와 env 템플릿을 재생성한다.
2. `reports/free-benefit-feed-starter-pack.env`에서 필요한 키를 Vercel Environment Variables에 복사한다.
3. officialUrl을 그대로 넣지 말고 담당자 승인 JSON/RSS/API feed endpoint만 넣는다.
4. 새 host가 공식 소스 카탈로그에 없으면 host만 `BENEFIT_REFRESH_APPROVED_HOSTS` 또는 `HALINDOSA_APPROVED_FEED_HOSTS`에 추가한다.
5. 공공·교육 feed는 `OPTIONAL_PUBLIC_BENEFIT_FEED_URLS`에만 연결해 기본 소비자 홈 feed와 섞지 않는다.
6. `CRON_SECRET`을 Production/Preview에 설정하고 Vercel Cron이 `/api/cron/benefits`와 `/api/cron/refresh`를 호출하게 둔다.
7. 아래 검증 명령을 순서대로 실행한다.

```bash
npm run source:starter:pack
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:news
npm run verify:news
npm run refresh:benefits
npm run security:check
npm run smoke:local
```

## Starter Lane별 첫 연결

| Lane | 운영 구분 | Env | 후보 | 접근 가능 | 승인 필요 | 첫 작업 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 오늘 바로 받는 무료혜택 | 기본 | BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 편의점 1+1·2+1 | 기본 | CONVENIENCE_BENEFIT_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 8 | 0 | CONVENIENCE_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 뷰티 샘플·체험 | 기본 | BEAUTY_SAMPLE_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 8 | 0 | BEAUTY_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 카페·외식 쿠폰 | 기본 | CAFE_FRANCHISE_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | 8 | 8 | 0 | CAFE_FRANCHISE_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 쇼핑몰·브랜드 쿠폰 | 기본 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 페이·포인트·캐시백 | 기본 | PAY_POINT_BENEFIT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 6 | 2 | PAY_POINT_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 전원증정·선착순 | 기본 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 출석체크·룰렛·미션 | 기본 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 신규가입·웰컴 쿠폰 | 기본 | SIGNUP_GIFT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | SIGNUP_GIFT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 기프티콘·문화초대권 | 기본 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 6 | 2 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 반려동물·체험단 | 기본 | PET_SAMPLE_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PET_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 선택 운영: 공공·문화 무료 | 선택 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 8 | 8 | 0 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 선택 운영: 교육 무료체험 | 선택 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 8 | 8 | 0 | OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |

## 바로 확인할 후보

### 오늘 바로 받는 무료혜택

- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/
- 해피포인트 공식 쿠폰·모바일 혜택: https://www.happypointcard.com/coupon/coupon.spc
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event

### 편의점 1+1·2+1

- 세븐일레븐 공식 진행 이벤트: https://www.7-eleven.co.kr/event/eventList.asp
- CU 공식 1+1·2+1 행사상품: https://cu.bgfretail.com/event/plus.do?category=event&depth2=1
- GS25 행사상품과 카드 할인: https://gs25.gsretail.com/gscvs/ko/products/event-goods

### 뷰티 샘플·체험

- 라운드랩 공식 이벤트 게시판: https://roundlab.co.kr/board/gallery/list.html?board_no=8
- 아모레몰 공식 이벤트·체험단 목록: https://www.amoremall.com/kr/ko/display/event
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event

### 카페·외식 쿠폰

- 메가MGC커피 공식 이벤트·제휴 혜택: https://www.mega-mgccoffee.com/bbs/?bbs_category=3&bbs_detail_category=12
- 스타벅스 리워드 공식 혜택: https://www.starbucks.co.kr/msr/msreward/about.do
- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/

### 쇼핑몰·브랜드 쿠폰

- 롯데ON 공식 롭스·뷰티 이벤트: https://www.lotteon.com/event/onLohbsShare
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event
- 오늘의집 공식 시즌 이벤트·쿠폰: https://events.ohou.se/promotions/o-season-week

### 페이·포인트·캐시백

- L.POINT 공식 이벤트·포인트 혜택: https://m.lpoint.com/app/event/LWEA100110.do
- OK캐쉬백 공식 앱 설치·포인트 이벤트: https://www.okcashbag.com/event/newwelcomeback
- 카카오페이 공식 결제 포인트 혜택: https://www.kakaopay.com/services/life/payment?t_ch=main&t_src=homepage

### 전원증정·선착순

- 신세계포인트 공식 진행 이벤트: https://m.shinsegaepoint.com/ingevents
- LG생활건강 공식 이벤트: https://www.lghnh.com:984/news/event.jsp
- 네이버페이 공식 온라인 쿠폰함: https://pay.naver.com/coupon/home/online

### 출석체크·룰렛·미션

- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/
- L.POINT 공식 미션·룰렛·출석 혜택: https://www.lpoint.com/app/common/LHZZ300300.do
- 해피포인트 공식 쿠폰·모바일 혜택: https://www.happypointcard.com/coupon/coupon.spc

### 신규가입·웰컴 쿠폰

- CJ ONE 공식 신규가입 축하 쿠폰: https://www.cjone.com/cjmweb/event-coupon/coupon.do
- KFC 공식 신규 회원 쿠폰 혜택: https://www.kfckorea.com/promotion/promotionList/detail/1040
- 네이버페이 공식 온라인 쿠폰함: https://pay.naver.com/coupon/home/online

### 기프티콘·문화초대권

- CJ ONE 공식 이벤트: https://www.cjone.com/cjmmobile/event/event.do
- 스타벅스 리워드 공식 혜택: https://www.starbucks.co.kr/msr/msreward/about.do
- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/

### 반려동물·체험단

- LG생활건강 공식 이벤트: https://www.lghnh.com:984/news/event.jsp
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event
- 파우더룸 공식 체험단·샘플 캠페인: https://www.powderroom.co.kr/campaigns

### 선택 운영: 공공·문화 무료

- 서울시 공공서비스예약 무료 체험·교육: https://yeyak.seoul.go.kr/web/main.do
- 서울시 한양도성 역사 무료 해설 체험: https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847
- 국립중앙박물관 공식 전시·문화 혜택: https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current

### 선택 운영: 교육 무료체험

- 고용24 직업훈련·국민내일배움카드 공식 지원: https://www.work24.go.kr/cm/main.do
- 고용24 국민내일배움카드 공식 발급 안내: https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do
- K-MOOC 공식 무료 온라인 강좌 예시: https://www.kmooc.kr/view/course/detail/18713

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 feed로 쓰지 않는다.
- 공식 HTML 이벤트 페이지를 무단 스크래핑하지 않는다. 사람이 검수하는 기준 URL로만 사용한다.
- 토큰, API 키, 세션 값이 들어간 URL은 문서나 리포트에 남기지 않는다.
- 검증 실패 feed는 홈, 카테고리, 알림, 무료혜택 페이지 어디에도 노출하지 않는다.

