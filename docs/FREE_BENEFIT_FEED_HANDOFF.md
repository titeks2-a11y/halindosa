# 무료혜택 Feed 운영 핸드오프

- 생성 시각: 2026-06-09T02:04:44.392Z
- starter lane: 8개
- 연결 후보: 64개
- 접근 가능 후보: 62개
- 보호/승인 필요 후보: 2개
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
| 뷰티 샘플·체험 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | 8 | 7 | 1 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 카페·외식 쿠폰 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | 8 | 8 | 0 | OFFICIAL_EVENT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 페이·포인트·캐시백 | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 공공·문화 무료 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 교육 무료체험 | PUBLIC_COUPON_FEED_URLS<br>DEAL_NEWS_FEED_URLS | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |
| 반려동물·체험단 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | 8 | 8 | 0 | BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결 |

## 바로 확인할 후보

### 오늘의 무료혜택

- 해피포인트 공식 쿠폰·모바일 혜택: https://www.happypointcard.com/coupon/coupon.spc
- OK캐쉬백 공식 앱 설치·포인트 이벤트: https://www.okcashbag.com/event/newwelcomeback
- 아모레몰 공식 뷰티포인트·샘플 이벤트: https://www.amoremall.com/kr/ko/main.html

### 편의점 1+1·2+1

- 세븐일레븐 공식 진행 이벤트: https://www.7-eleven.co.kr/event/eventList.asp
- CU 공식 1+1·2+1 행사상품: https://cu.bgfretail.com/event/plus.do?category=event&depth2=1
- GS25 행사상품과 카드 할인: https://gs25.gsretail.com/gscvs/ko/products/event-goods

### 뷰티 샘플·체험

- 라운드랩 공식 이벤트 게시판: https://roundlab.co.kr/board/gallery/list.html?board_no=8
- 이니스프리 공식 샘플마켓: https://m.innisfree.com/kr/ko/dp/sample-market
- 이니스프리 공식 이벤트·쿠폰: https://www.innisfree.com/kr/ko/dp/posting-list

### 카페·외식 쿠폰

- 스타벅스 리워드 공식 혜택: https://www.starbucks.co.kr/msr/msreward/about.do
- KFC 공식 딜리버리 무료배송 혜택: https://www.kfckorea.com/promotion/promotionList/detail/1053
- 메가MGC커피 공식 이벤트: https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event

### 페이·포인트·캐시백

- OK캐쉬백 공식 앱 설치·포인트 이벤트: https://www.okcashbag.com/event/newwelcomeback
- PAYCO 공식 이벤트·쿠폰 혜택: https://www.payco.com/event.nhn
- 해피포인트 공식 쿠폰·모바일 혜택: https://www.happypointcard.com/coupon/coupon.spc

### 공공·문화 무료

- 서울문화포털 공식 무료·할인 문화행사: https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do
- 국립중앙박물관 공식 전시·문화 혜택: https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current
- 문화가 있는 날 공식 혜택: https://www.culture.go.kr/wday/main/main.do

### 교육 무료체험

- 고용24 직업훈련·국민내일배움카드 공식 지원: https://www.work24.go.kr/cm/main.do
- K-MOOC 공식 무료 온라인 강좌 예시: https://www.kmooc.kr/view/course/detail/18713
- 복지로 공식 복지서비스·신청 혜택: https://www.bokjiro.go.kr/ssis-tbu/index.do

### 반려동물·체험단

- 아모레몰 공식 뷰티포인트·샘플 이벤트: https://www.amoremall.com/kr/ko/main.html
- 이니스프리 공식 샘플마켓: https://m.innisfree.com/kr/ko/dp/sample-market
- 닥터지 공식 이벤트·샘플 혜택: https://www.dr-g.co.kr/event

## 금지 원칙

- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 feed로 쓰지 않는다.
- 공식 HTML 이벤트 페이지를 무단 스크래핑하지 않는다. 사람이 검수하는 기준 URL로만 사용한다.
- 토큰, API 키, 세션 값이 들어간 URL은 문서나 리포트에 남기지 않는다.
- 검증 실패 feed는 홈, 카테고리, 알림, 무료혜택 페이지 어디에도 노출하지 않는다.

