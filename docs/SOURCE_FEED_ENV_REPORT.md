# 공식 feed 환경변수 안전성 리포트

- 생성 시각: 2026-06-09T21:18:00.822Z
- 검사한 env key: DEAL_NEWS_FEED_URLS, DEAL_NEWS_RSS_URLS, DEAL_EVENT_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS
- 설정된 feed URL: 0개
- 통과: 0개
- 실패: 0개
- 승인 추가 host: 없음

## 운영 원칙

- 공식 API, RSS, Atom, 승인된 JSON/파트너 feed만 연결합니다.
- 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 또는 HTML 이벤트 페이지 직접 수집은 금지합니다.
- 승인된 외부 feed host는 `HALINDOSA_APPROVED_FEED_HOSTS`에 host만 기록하고, 토큰·query 값은 리포트에 남기지 않습니다.
- 무료혜택 전용 feed는 `BENEFIT_REFRESH_FEED_URLS`에 연결하고, 별도 승인 host는 `BENEFIT_REFRESH_APPROVED_HOSTS`에 host만 기록합니다.
- 현재 활성화 상태: seed_fallback_only

## 검사 결과

| Env key | URL(민감 query 제거) | Host | 상태 | 사유 | 다음 작업 |
| --- | --- | --- | --- | --- | --- |
| - | - | - | passed | no_configured_feed_urls | 공식 feed가 설정되기 전에는 seed fallback으로 운영합니다. |

## 다음 Feed 활성화 큐

| Lane | 우선 Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |
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

## 우선 검토 후보

| Lane | 공식 소스 후보 | Live 상태 | 추천 Env | 공식 기준 URL |
| --- | --- | --- | --- | --- |
| 오늘의 무료혜택 | LG전자 공식 혜택·이벤트 허브 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lge.co.kr/benefits |
| 오늘의 무료혜택 | 맘큐 공식 신규회원 웰컴혜택 | reachable | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://www.momq.co.kr/event/202601290003 |
| 오늘의 무료혜택 | 고용24 국민내일배움카드 공식 발급 안내 | reachable | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do |
| 편의점 1+1·2+1 | 세븐일레븐 공식 진행 이벤트 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | https://www.7-eleven.co.kr/event/eventList.asp |
| 편의점 1+1·2+1 | CU 공식 1+1·2+1 행사상품 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 |
| 편의점 1+1·2+1 | GS25 행사상품과 카드 할인 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS | https://gs25.gsretail.com/gscvs/ko/products/event-goods |
| 뷰티 샘플·체험 | 라운드랩 공식 이벤트 게시판 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://roundlab.co.kr/board/gallery/list.html?board_no=8 |
| 뷰티 샘플·체험 | 맘큐 공식 육아 샘플·이벤트 목록 | reachable | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.momq.co.kr/event |
| 뷰티 샘플·체험 | 아모레몰 공식 이벤트·체험단 목록 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.amoremall.com/kr/ko/display/event |
| 카페·외식 쿠폰 | 스타벅스 리워드 공식 혜택 | reachable | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://www.starbucks.co.kr/msr/msreward/about.do |
| 카페·외식 쿠폰 | KFC 공식 딜리버리 무료배송 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS | https://www.kfckorea.com/promotion/promotionList/detail/1053 |
| 카페·외식 쿠폰 | 메가MGC커피 공식 이벤트 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event |
| 페이·포인트·캐시백 | OK캐쉬백 공식 앱 설치·포인트 이벤트 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.okcashbag.com/event/newwelcomeback |
| 페이·포인트·캐시백 | 카카오페이 공식 결제 포인트 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.kakaopay.com/services/life/payment?t_ch=main&t_src=homepage |
| 페이·포인트·캐시백 | OK캐쉬백 공식 쇼핑적립 포인트 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://okcashbag.com/shopping |
| 전원증정·선착순 | 네이버페이 공식 온라인 쿠폰함 | reachable | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://pay.naver.com/coupon/home/online |
| 전원증정·선착순 | 맘큐 공식 신규회원 웰컴혜택 | reachable | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://www.momq.co.kr/event/202601290003 |
| 전원증정·선착순 | KT 공식 요고 모바일 가입 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_NEWS_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://shop.kt.com/unify/yogoEvent.do |
| 출석체크·룰렛·미션 | 요기요 공식 룰렛 쿠폰 프로모션 | reachable | OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.yogiyo.co.kr/promotion/roulette/ |
| 출석체크·룰렛·미션 | L.POINT 공식 미션·룰렛·출석 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lpoint.com/app/common/LHZZ300300.do |
| 출석체크·룰렛·미션 | 해피포인트 공식 쿠폰·모바일 혜택 | reachable | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.happypointcard.com/coupon/coupon.spc |
| 신규가입·웰컴 쿠폰 | KFC 공식 신규 회원 쿠폰 혜택 | reachable | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://www.kfckorea.com/promotion/promotionList/detail/1040 |
| 신규가입·웰컴 쿠폰 | 네이버페이 공식 온라인 쿠폰함 | reachable | PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://pay.naver.com/coupon/home/online |
| 신규가입·웰컴 쿠폰 | 요기요 공식 룰렛 쿠폰 프로모션 | reachable | OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.yogiyo.co.kr/promotion/roulette/ |

## 운영자 체크리스트

- 공식 URL은 검토 기준으로만 사용하고, env에는 JSON/RSS/Atom/API/승인 파트너 feed endpoint만 넣습니다.
- HTML 이벤트 목록, 검색 결과, 커뮤니티/블로그 URL, 대표 홈페이지 URL은 source:feed-env:doctor에서 차단되어야 합니다.
- 새 host가 카탈로그에 없으면 host만 HALINDOSA_APPROVED_FEED_HOSTS 또는 BENEFIT_REFRESH_APPROVED_HOSTS에 추가하고 계약/승인 근거를 문서화합니다.
- feed 연결 후 source:feed-env:doctor, news:feed:canary, refresh:news, verify:news, refresh:benefits, security:check 순서로 확인합니다.

## 정책 회귀 샘플

| 샘플 | 기대 상태 | 기대 사유 | 실제 상태 | 실제 사유 | 결과 |
| --- | --- | --- | --- | --- | --- |
| official_machine_feed_allowed | passed | official_catalog_host_feed | passed | official_catalog_host_feed | pass |
| search_url_blocked | failed | search_or_result_url | failed | search_or_result_url | pass |
| community_host_blocked | failed | community_or_blog_host | failed | community_or_blog_host | pass |
| official_html_page_blocked | failed | not_machine_readable_feed | failed | not_machine_readable_feed | pass |
| unlisted_host_blocked | failed | unlisted_feed_host | failed | unlisted_feed_host | pass |
| unsafe_protocol_blocked | failed | unsafe_protocol | failed | unsafe_protocol | pass |
| private_host_blocked | failed | private_or_metadata_host | failed | private_or_metadata_host | pass |

## 재검증

```bash
npm run source:feed-env:doctor
npm run refresh:news
npm run verify:news
npm run refresh:all
```
