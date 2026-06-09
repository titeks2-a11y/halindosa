# 무료혜택 Feed 운영 핸드오프

- 생성 시각: 2026-06-09T20:23:16.134Z
- starter lane: 12개
- 연결 후보: 96개
- 접근 가능 후보: 96개
- 보호/승인 필요 후보: 0개
- 현재 설정된 feed URL: 0개
- canary 상태: seed_fallback_only

## 목적

할인도사는 공식 API, RSS, Atom, 승인 파트너 JSON feed를 통해 무료혜택, 쿠폰, 샘플, 체험, 전원증정 정보를 갱신한다. 이 문서는 seed fallback에서 실제 운영 feed로 넘어갈 때 필요한 환경변수와 검증 순서를 한 장으로 정리한다.

## Vercel Environment Variables

| Key | 용도 | 입력 기준 |
| --- | --- | --- |
| BENEFIT_REFRESH_FEED_URLS | 오늘의 무료혜택, 전원증정, 샘플, 체험단 우선 feed | 공식 API/RSS/Atom/승인 JSON endpoint만 입력 |
| PUBLIC_COUPON_FEED_URLS | 공공무료, 쿠폰, 포인트, 문화혜택 feed | 검색 결과, 커뮤니티 글, HTML 메인 페이지 금지 |
| OFFICIAL_EVENT_FEED_URLS | 브랜드 공식 이벤트, 편의점, 뷰티, 외식 쿠폰 feed | 공식 이벤트 확인 페이지가 아니라 machine-readable feed endpoint 입력 |
| BENEFIT_REFRESH_APPROVED_HOSTS | BENEFIT_REFRESH_FEED_URLS에 쓰는 승인 host | host 이름만 입력, 토큰/query 금지 |
| HALINDOSA_APPROVED_FEED_HOSTS | 공통 승인 feed host allowlist | 공식 카탈로그에 없는 승인 feed host만 추가 |
| CRON_SECRET | /api/cron/refresh, /api/cron/benefits 보호 | Vercel Cron과 서버에서만 쓰는 랜덤 secret |

## 연결 순서

1. `npm run source:starter:pack`으로 lane별 후보와 env 템플릿을 재생성한다.
2. `reports/free-benefit-feed-starter-pack.env`에서 필요한 키를 Vercel Environment Variables에 복사한다.
3. officialUrl을 그대로 넣지 말고 담당자 승인 JSON/RSS/API feed endpoint만 넣는다.
4. 새 host가 공식 소스 카탈로그에 없으면 host만 `BENEFIT_REFRESH_APPROVED_HOSTS` 또는 `HALINDOSA_APPROVED_FEED_HOSTS`에 추가한다.
5. `CRON_SECRET`을 Production/Preview에 설정하고 Vercel Cron이 `/api/cron/benefits`와 `/api/cron/refresh`를 호출하게 둔다.
6. 아래 검증 명령을 순서대로 실행한다.

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

| Lane | Env | 후보 | 접근 가능 | 승인 필요 | 첫 작업 |
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

## 바로 확인할 후보

### 오늘의 무료혜택

- LG전자 공식 혜택·이벤트 허브: https://www.lge.co.kr/benefits
- 맘큐 공식 신규회원 웰컴혜택: https://www.momq.co.kr/event/202601290003
- 고용24 국민내일배움카드 공식 발급 안내: https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do

### 편의점 1+1·2+1

- 세븐일레븐 공식 진행 이벤트: https://www.7-eleven.co.kr/event/eventList.asp
- CU 공식 1+1·2+1 행사상품: https://cu.bgfretail.com/event/plus.do?category=event&depth2=1
- GS25 행사상품과 카드 할인: https://gs25.gsretail.com/gscvs/ko/products/event-goods

### 뷰티 샘플·체험

- 라운드랩 공식 이벤트 게시판: https://roundlab.co.kr/board/gallery/list.html?board_no=8
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event
- 아모레몰 공식 이벤트·체험단 목록: https://www.amoremall.com/kr/ko/display/event

### 카페·외식 쿠폰

- 스타벅스 리워드 공식 혜택: https://www.starbucks.co.kr/msr/msreward/about.do
- KFC 공식 딜리버리 무료배송 혜택: https://www.kfckorea.com/promotion/promotionList/detail/1053
- 메가MGC커피 공식 이벤트: https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event

### 페이·포인트·캐시백

- OK캐쉬백 공식 앱 설치·포인트 이벤트: https://www.okcashbag.com/event/newwelcomeback
- 카카오페이 공식 결제 포인트 혜택: https://www.kakaopay.com/services/life/payment?t_ch=main&t_src=homepage
- OK캐쉬백 공식 쇼핑적립 포인트 혜택: https://okcashbag.com/shopping

### 전원증정·선착순

- 네이버페이 공식 온라인 쿠폰함: https://pay.naver.com/coupon/home/online
- 맘큐 공식 신규회원 웰컴혜택: https://www.momq.co.kr/event/202601290003
- KT 공식 요고 모바일 가입 혜택: https://shop.kt.com/unify/yogoEvent.do

### 출석체크·룰렛·미션

- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/
- L.POINT 공식 미션·룰렛·출석 혜택: https://www.lpoint.com/app/common/LHZZ300300.do
- 해피포인트 공식 쿠폰·모바일 혜택: https://www.happypointcard.com/coupon/coupon.spc

### 신규가입·웰컴 쿠폰

- KFC 공식 신규 회원 쿠폰 혜택: https://www.kfckorea.com/promotion/promotionList/detail/1040
- 네이버페이 공식 온라인 쿠폰함: https://pay.naver.com/coupon/home/online
- 요기요 공식 룰렛 쿠폰 프로모션: https://www.yogiyo.co.kr/promotion/roulette/

### 기프티콘·문화초대권

- 문화포털 공식 문화초대이벤트: https://www.culture.go.kr/portal/cltBnf/cltInvEvt/list.do?menuNo=200106
- 서울시 한양도성 역사 무료 해설 체험: https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847
- 서울 한강공원 공식 무료 행사·공연: https://hangang.seoul.go.kr/www/eventMng/list.do?mid=53

### 공공·문화 무료

- 서울시 공공서비스예약 무료 체험·교육: https://yeyak.seoul.go.kr/web/main.do
- 서울시 한양도성 역사 무료 해설 체험: https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847
- 국립중앙박물관 공식 전시·문화 혜택: https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current

### 교육 무료체험

- 고용24 직업훈련·국민내일배움카드 공식 지원: https://www.work24.go.kr/cm/main.do
- 고용24 국민내일배움카드 공식 발급 안내: https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do
- K-MOOC 공식 무료 온라인 강좌 예시: https://www.kmooc.kr/view/course/detail/18713

### 반려동물·체험단

- 아모레몰 공식 이벤트·체험단 목록: https://www.amoremall.com/kr/ko/display/event
- 맘큐 공식 육아 샘플·이벤트 목록: https://www.momq.co.kr/event
- 아모레몰 공식 뷰티포인트·샘플 이벤트: https://www.amoremall.com/kr/ko/main.html

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 feed로 쓰지 않는다.
- 공식 HTML 이벤트 페이지를 무단 스크래핑하지 않는다. 사람이 검수하는 기준 URL로만 사용한다.
- 토큰, API 키, 세션 값이 들어간 URL은 문서나 리포트에 남기지 않는다.
- 검증 실패 feed는 홈, 카테고리, 알림, 무료혜택 페이지 어디에도 노출하지 않는다.

