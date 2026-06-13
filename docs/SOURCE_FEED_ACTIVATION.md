# 무료혜택 Feed Activation 리포트

- 생성 시각: 2026-06-13T11:45:51.451Z
- 상태: seed_ready
- 설정 feed URL: 0개
- 설정 provider: 0개
- canary 노출 후보: 0개
- canary 상태: seed_fallback_only

## 의미

- `seed_ready`: 승인된 운영 feed URL은 아직 없지만, seed fallback과 안전 게이트로 출시 운영이 가능한 상태입니다.
- `live_feed_ready`: 승인 feed가 실제 노출 가능한 공식 혜택 후보를 만들고 홈 실시간 반영 게이트도 통과한 상태입니다.
- `needs_attention` 또는 `failed`: feed URL, parser, finalUrl, 종료/검색/커뮤니티 차단 정책 중 하나를 먼저 고쳐야 합니다.

## 필수 확인

| 검사 | 결과 | 근거 | 다음 작업 |
| --- | --- | --- | --- |
| feed env safety | PASS | configured=0, failed=0 | Run npm run source:feed-env:doctor and fix any unsafe, search, community, private, or non-machine-readable feed URL. |
| feed handoff readiness | PASS | lanes=13, commands=9 | Run npm run source:feed:handoff so Vercel env keys and verification commands stay current. |
| activation candidate queue | PASS | topCandidates=24, starterPack=ok | Run npm run source:starter:pack and connect the highest scoring official candidates to approved JSON/RSS/API feeds first. |
| official source live readiness | PASS | reachable=231, guarded=33, stale=0 | Run npm run source:live:doctor and replace or remove any stale_or_removed official source before feed activation. |
| official source breadth readiness | PASS | lanes=12/12, brandSignals=63/63, consumer=82%, publicPolicy=18% | Run npm run source:breadth:doctor so telecom, convenience, beauty, cafe, delivery, pay, mart, open-market, public, education, pet, sample lanes, and consumer-first source mix stay covered. |
| free benefit event contract | PASS | checks=22/22 | Run npm run benefit:event:contract so FreeBenefitEvent fields, sanitizer, publishable gate, no-store API, filters, and card trust badges remain enforced. |
| feed canary activation | PASS | status=seed_fallback_only, configured=0, providers=0, visible=0 | Seed fallback is allowed until approved JSON/RSS/Atom feeds are connected. Connect OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, or BENEFIT_REFRESH_FEED_URLS next. |
| home realtime reflection | PASS | homeChecks=21/21 | Run npm run test:home-realtime after each feed activation to prove /api/home reflects refreshed snapshots without restart. |
| free benefit refresh command | PASS | refresh:benefits is present and QA keeps it in the free-benefit pipeline. | Keep refresh:benefits in QA so freebies/events/verify steps remain release-blocking. |
| benefit cron route | PASS | Vercel cron includes dedicated benefits refresh and full refresh routes. | Keep /api/cron/benefits for free-benefit-first refresh and /api/cron/refresh for full refresh. |
| official benefit floor | PASS | visible=197, threshold=95 | Run npm run health:readiness after activation to confirm visible official benefits and freshness. |

## 우선 연결 공식 후보

| 후보 | 수집축 | Provider | 점수 | 권장 env | 공식 URL |
| --- | --- | --- | ---: | --- | --- |
| NH농협카드 공식 진행 이벤트 | 페이·포인트·캐시백 | public_coupon | 148 | PAY_POINT_BENEFIT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://nhpay.nonghyup.com/bn/BN600000F |
| 롯데카드 공식 이벤트 | 페이·포인트·캐시백 | official_event | 142 | PUBLIC_COUPON_FEED_URLS<br>PAY_POINT_BENEFIT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lottecard.co.kr/app/LPCDADB_V100.lc |
| 이니스프리 공식 이벤트·쿠폰 혜택 | 전원증정·선착순 | official_event | 130 | BEAUTY_SAMPLE_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.innisfree.com/kr/ko/EventList.do |
| CJ ONE 공식 득템프 이벤트 | 출석체크·룰렛·미션 | official_event | 122 | PAY_POINT_BENEFIT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.cjone.com/cjmweb/event-coupon/stamp/list.do |
| CJ ONE 공식 신규가입 축하 쿠폰 | 신규가입·웰컴 쿠폰 | official_event | 140 | OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.cjone.com/cjmweb/event-coupon/coupon.do |
| KFC 공식 신규 회원 쿠폰 혜택 | 신규가입·웰컴 쿠폰 | public_coupon | 140 | PUBLIC_COUPON_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS | https://www.kfckorea.com/promotion/promotionList/detail/1040 |
| 네이버페이 공식 결제혜택 목록 | 페이·포인트·캐시백 | official_event | 138 | PAY_POINT_BENEFIT_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://pay.naver.com/benefit/payment/list |
| L.POINT 공식 이벤트·포인트 혜택 | 페이·포인트·캐시백 | official_event | 138 | PAY_POINT_BENEFIT_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://m.lpoint.com/app/event/LWEA100110.do |
| OK캐쉬백 공식 앱 설치·포인트 이벤트 | 출석체크·룰렛·미션 | official_event | 122 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.okcashbag.com/event/newwelcomeback |
| CJ ONE 공식 이벤트 | 기프티콘·문화초대권 | official_event | 136 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.cjone.com/cjmmobile/event/event.do |
| LG U+ 공식 멤버십 제휴사 혜택 | 기프티콘·문화초대권 | official_event | 135 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lguplus.com/benefit-membership/affiliate-perks |
| SKT T멤버십 공식 할인·무료 혜택 | 기프티콘·문화초대권 | official_event | 135 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.tworld.co.kr/web/html/tmembership/index.html |
| 롯데ON 공식 롭스·뷰티 이벤트 | 반려동물·체험단 | official_event | 110 | OFFICIAL_EVENT_FEED_URLS<br>DEAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lotteon.com/event/onLohbsShare |
| 신한카드 공식 이벤트 | 페이·포인트·캐시백 | official_event | 134 | PUBLIC_COUPON_FEED_URLS<br>PAY_POINT_BENEFIT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.shinhancard.com/pconts/html/benefit/event/eventList.html |
| 우리카드 공식 이벤트 | 페이·포인트·캐시백 | official_event | 134 | PUBLIC_COUPON_FEED_URLS<br>PAY_POINT_BENEFIT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://pc.wooricard.com/dcpc/yh1/bnf/bnf02/prgevnt/H1BNF202S00.do |
| 요기요 공식 룰렛 쿠폰 프로모션 | 카페·외식 쿠폰 | official_event | 104 | OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.yogiyo.co.kr/promotion/roulette/ |
| 해피포인트 공식 쿠폰·모바일 혜택 | 기프티콘·문화초대권 | official_event | 116 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.happypointcard.com/coupon/coupon.spc |
| CJ ONE 공식 이벤트·쿠폰 목록 | 출석체크·룰렛·미션 | official_event | 116 | PUBLIC_COUPON_FEED_URLS<br>PAY_POINT_BENEFIT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.cjone.com/cjmweb/event-coupon/event.do |
| 라운드랩 공식 이벤트 게시판 | 뷰티 샘플·체험 | official_event | 132 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://roundlab.co.kr/board/gallery/list.html?board_no=8 |
| 신세계포인트 공식 진행 이벤트 | 전원증정·선착순 | official_event | 132 | PAY_POINT_BENEFIT_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://m.shinsegaepoint.com/ingevents |
| L.POINT 공식 미션·룰렛·출석 혜택 | 출석체크·룰렛·미션 | official_event | 132 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.lpoint.com/app/common/LHZZ300300.do |
| 롯데잇츠 공식 이벤트·쿠폰 | 카페·외식 쿠폰 | official_event | 106 | OFFICIAL_EVENT_FEED_URLS<br>CAFE_FRANCHISE_COUPON_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.lotteeatz.com/event/main |
| 맘큐 공식 육아 샘플·이벤트 목록 | 반려동물·체험단 | official_event | 116 | BENEFIT_REFRESH_FEED_URLS<br>OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS | https://www.momq.co.kr/event |
| 아모레몰 공식 이벤트·체험단 목록 | 뷰티 샘플·체험 | official_event | 130 | OFFICIAL_EVENT_FEED_URLS<br>PUBLIC_COUPON_FEED_URLS<br>BENEFIT_REFRESH_FEED_URLS | https://www.amoremall.com/kr/ko/display/event |

## 운영 연결 순서

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:breadth:doctor
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
npm run test:home-realtime
npm run health:readiness
```

## 다음 작업

- 운영 feed URL이 아직 없습니다. 공식 API/RSS/Atom 또는 승인 JSON endpoint를 Vercel env에 연결하세요.
- 연결 전에는 seed fallback과 공식 source catalog만 사용자에게 노출합니다.
