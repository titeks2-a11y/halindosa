# 공식 소스 카탈로그

이 문서는 할인도사에 연결할 수 있는 공식 이벤트, 공공 혜택, 제휴 JSON/RSS 후보를 정리합니다. 무단 크롤링 후보가 아니라 운영자가 승인 feed 또는 공식 페이지 매핑으로 전환할 때 쓰는 출발점입니다.

- 생성 시각: 2026-06-07T18:06:20.187Z
- 상태: PASS
- 후보 소스: 95개
- 고우선순위 후보: 27개
- 현재 env feed 연결 후보: 0개
- 공식 혜택 노출: 105개
- feed 전환 상태: seed_launch_ready
- CSV 리포트: reports/official-source-catalog.csv

## 카테고리 커버리지

| 카테고리 | 후보 수 | 상태 |
| --- | ---: | --- |
| 식품/생필품 | 9 | 충분 |
| 마트/편의점 | 12 | 충분 |
| 디지털/가전 | 6 | 충분 |
| 패션/뷰티 | 9 | 충분 |
| 외식/배달 | 32 | 충분 |
| 여행/숙박 | 9 | 충분 |
| 영화/문화 | 16 | 충분 |
| 카드/멤버십 | 29 | 충분 |
| 무료혜택 | 58 | 충분 |
| 정부/공공혜택 | 8 | 충분 |

## Provider 커버리지

| Provider | 후보 수 | 상태 |
| --- | ---: | --- |
| news | 1 | 포함 |
| event_news | 2 | 포함 |
| official_event | 58 | 포함 |
| public_coupon | 34 | 포함 |

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
| starbucks-campaign | official_event | 외식/배달, 무료혜택 | medium | https://www.starbucks.co.kr/whats_new/campaign_list.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| cjone-mobile-events | official_event | 카드/멤버십, 외식/배달, 영화/문화, 무료혜택 | medium | https://www.cjone.com/cjmmobile/event/event.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| oliveyoung-events | official_event | 패션/뷰티, 무료혜택 | medium | https://www.oliveyoung.co.kr/store/main/getEventList.do | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| cgv-events | public_coupon | 영화/문화, 무료혜택 | medium | https://www.cgv.co.kr/culture-event/event/defaultNew.aspx | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecinema-events | public_coupon | 영화/문화 | medium | https://www.lottecinema.co.kr/NLCHS/Event | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| megabox-events | public_coupon | 영화/문화, 무료혜택 | medium | https://www.megabox.co.kr/event | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| culture-day | public_coupon | 영화/문화, 정부/공공혜택, 무료혜택 | high | https://www.culture.go.kr/wday/main/main.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| mnuri-benefit | public_coupon | 정부/공공혜택, 영화/문화 | high | https://www.mnuri.kr/main/main.do | PUBLIC_COUPON_FEED_URLS |
| naverpay-benefit | official_event | 카드/멤버십, 무료혜택 | high | https://new-m.pay.naver.com/pcpay/eventbenefit | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| kbcard-events | official_event | 카드/멤버십 | medium | https://card.kbcard.com/BON/DVIEW/HBBMCXCRVNEC0001 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| bccard-events | official_event | 카드/멤버십 | medium | https://www.bccard.com/app/card/EventActn.do?menuId=64 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| tworld-membership | official_event | 카드/멤버십, 외식/배달 | medium | https://www.tworld.co.kr/poc/html/product/TS3.7.1T.2.html | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| koreanair-promotion | event_news | 여행/숙박 | medium | https://www.koreanair.com/contents/booking/get-to-know/boarding-pass-benefits/excellent-boarding-pass?hl=ko | DEAL_EVENT_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| jejuair-events | official_event | 여행/숙박 | high | https://www.jejuair.net/ko/event/event.do | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| samsung-shop-event | official_event | 디지털/가전 | medium | https://www.samsung.com/sec/shop/event/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| himart-events | official_event | 디지털/가전 | medium | https://company.himart.co.kr/event/list | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| hmall-official-events | news | 패션/뷰티, 식품/생필품 | medium | https://www.hyundaihmall.com/front/evntSect.do | DEAL_NEWS_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| musinsa-fashion-festa | official_event | 패션/뷰티 | medium | https://www.musinsa.com/campaign/fashionfesta_1 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| mcdonalds-happysnack | official_event | 외식/배달, 무료혜택 | medium | https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| lpoint-benefits | public_coupon | 카드/멤버십, 무료혜택, 마트/편의점 | high | https://m.lpoint.com/index.jsp?tabIndex=1 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lpoint-card-events | public_coupon | 카드/멤버십, 무료혜택 | medium | https://m.lpoint.com/app/asset/LWCE100100.do?fnTapPmotC=85 | PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_FEED_URLS |
| visitkorea-travel-week | public_coupon | 여행/숙박, 정부/공공혜택, 무료혜택 | high | https://korean.visitkorea.or.kr/other/otherService.do?otdid=46a412aa-0b3b-11ea-869b-020027310001 | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| baemin-academy-events | public_coupon | 외식/배달, 무료혜택 | medium | https://academy.baemin.com/event/list | PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| lotteon-lobs-share-event | official_event | 패션/뷰티, 무료혜택, 카드/멤버십 | medium | https://www.lotteon.com/event/onLohbsShare | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| kfc-delivery-free | official_event | 외식/배달, 무료혜택 | high | https://www.kfckorea.com/promotion/promotionList/detail/1053 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| lotteeatz-monthly-coupon | official_event | 외식/배달, 무료혜택 | high | https://www.lotteeatz.com/event/main/selectEvent/17589 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| krispykreme-wednesday-event | official_event | 외식/배달, 무료혜택 | medium | https://www.lotteeatz.com/event/main/selectEvent/6769 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| baskinrobbins-events | official_event | 외식/배달, 무료혜택 | medium | https://www.baskinrobbins.co.kr/m/play/event/list.php | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| happypoint-alliance-benefits | public_coupon | 카드/멤버십, 외식/배달, 무료혜택 | high | https://www.happypointcard.com/alliance/service/guide.spc | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| happypoint-mobile-coupon | public_coupon | 카드/멤버십, 외식/배달, 무료혜택 | medium | https://www.happypointcard.com/coupon/coupon.spc | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| okcashbag-event-benefits | public_coupon | 카드/멤버십, 무료혜택, 마트/편의점 | high | https://www.okcashbag.com/life/event/eventHome.do | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| okcashbag-brand-events | public_coupon | 카드/멤버십, 무료혜택 | medium | https://www.okcashbag.com/life/event/eventMain.do | PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_FEED_URLS |
| parisbaguette-promotion | official_event | 외식/배달, 무료혜택 | medium | https://www.paris.co.kr/promotion/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| mcdonalds-happy-snack-free-drink | public_coupon | 외식/배달, 무료혜택 | high | https://www.mcdonalds.co.kr/kor/promotion/detail/E51CF9 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| kfc-new-member-coupon-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.kfckorea.com/promotion/promotionList/detail/1040 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| dominos-official-discount-benefits | official_event | 외식/배달, 무료혜택, 카드/멤버십 | high | https://web.dominos.co.kr/event/discount?todo=main | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| pizzahut-member-free-coupon-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.pizzahut.co.kr/misc/membership | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| starbucks-rewards-official-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.starbucks.co.kr/msr/msreward/about.do | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| megabox-membership-official-benefit | public_coupon | 영화/문화, 무료혜택, 카드/멤버십 | medium | https://www.megabox.co.kr/benefit/membership | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| megabox-vip-lounge-official-benefit | public_coupon | 영화/문화, 무료혜택 | medium | https://www.megabox.co.kr/benefit/viplounge | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecinema-lpoint-membership-benefit | public_coupon | 영화/문화, 카드/멤버십 | medium | https://www.lottecinema.co.kr/NLCHS/Membership/l_point | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| samsung-members-official-benefit | official_event | 디지털/가전, 무료혜택, 카드/멤버십 | medium | https://www.samsung.com/sec/members/benefit/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| homeplus-membership-official-coupon | official_event | 마트/편의점, 식품/생필품, 무료혜택 | medium | https://front.homeplus.co.kr/membership | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| bccard-benefit-official-center | public_coupon | 카드/멤버십, 무료혜택 | medium | https://www.bccard.com/app/card/BenefitActn.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| cu-plus-official-monthly-benefit | official_event | 마트/편의점, 무료혜택 | high | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| ediya-official-event-coupon | public_coupon | 외식/배달, 무료혜택 | medium | https://www.ediya.com/contents/event.html | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| naverplus-membership-official-benefit | public_coupon | 카드/멤버십, 무료혜택 | medium | https://nid.naver.com/membership/join | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| samsungcard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.samsungcard.com/personal/event/ing/UHPPBE1401M0.jsp | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.lottecard.co.kr/app/LPCDADA_V100.lc | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| hanacard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.hanacard.co.kr/OPI35000000D.web | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| kt-membership-official-benefit | public_coupon | 카드/멤버십, 외식/배달, 영화/문화 | medium | https://membership.kt.com/main/MainInfo.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| uplus-membership-official-benefit | public_coupon | 카드/멤버십, 외식/배달, 영화/문화 | medium | https://www.lguplus.com/benefit-membership | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| seoul-culture-official-free-events | public_coupon | 영화/문화, 무료혜택, 정부/공공혜택 | high | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| national-museum-official-exhibition | public_coupon | 영화/문화, 무료혜택, 정부/공공혜택 | medium | https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?menuId=current | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| innisfree-sample-market | public_coupon | 무료혜택, 패션/뷰티 | high | https://m.innisfree.com/kr/ko/dp/sample-market | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| innisfree-event-coupon | official_event | 패션/뷰티, 무료혜택 | medium | https://www.innisfree.com/kr/ko/dp/posting-list | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| kurly-beauty-sample-product | official_event | 패션/뷰티, 무료혜택 | medium | https://www.kurly.com/goods/1000120890 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| kurly-living-free-shipping-product | official_event | 식품/생필품, 마트/편의점 | medium | https://www.kurly.com/goods/1001472154 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| kurly-digital-free-shipping-product | official_event | 디지털/가전 | medium | https://www.kurly.com/goods/1000284019 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| kurly-fashion-free-shipping-product | official_event | 패션/뷰티 | medium | https://www.kurly.com/goods/1002016097 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| hollys-official-event-coupon | official_event | 외식/배달, 무료혜택, 카드/멤버십 | medium | https://www.hollys.co.kr/news/event/list.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| momstouch-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://momstouch.co.kr/board/event/list.php | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| mega-mgc-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.mega-mgccoffee.com/bbs/board.php?bo_table=event | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| subway-official-promotion | official_event | 외식/배달 | medium | https://www.subway.co.kr/eventList | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| seven-eleven-official-events | official_event | 마트/편의점, 무료혜택 | high | https://www.7-eleven.co.kr/event/eventList.asp | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| emart24-official-events | official_event | 마트/편의점, 무료혜택 | high | https://emart24.co.kr/event | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| pizzahut-luckydraw-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.pizzahut.co.kr/cs/event/extra/luckydraw | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| dunkin-monthly-combo-coupon | official_event | 외식/배달, 무료혜택 | high | https://www.dunkindonuts.co.kr/event/view?id=5392 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| dunkin-donut-fryday-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.dunkindonuts.co.kr/index.php/event/view?id=5237 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| dunkin-membership-partner-benefits | official_event | 카드/멤버십, 외식/배달 | medium | https://www.dunkindonuts.co.kr/event?flag=B | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| gov24-benefit-alert-service | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.gov.kr/portal/rcvfvrSvc/main | PUBLIC_COUPON_FEED_URLS |
| work24-employment-support | public_coupon | 정부/공공혜택, 무료혜택 | medium | https://www.work24.go.kr/cm/main.do | PUBLIC_COUPON_FEED_URLS |
| kosaf-scholarship-support | public_coupon | 정부/공공혜택, 무료혜택 | medium | https://www.kosaf.go.kr/ko/main.do | PUBLIC_COUPON_FEED_URLS |
| ikea-official-offers | official_event | 식품/생필품, 무료혜택 | medium | https://www.ikea.com/kr/ko/offers/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| yanolja-official-promotion | official_event | 여행/숙박, 무료혜택 | medium | https://nol.yanolja.com/promotion | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| twayair-official-events | official_event | 여행/숙박 | medium | https://www.twayair.com/app/promotion/event/retrieveEventList | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| eastarjet-official-events | official_event | 여행/숙박 | medium | https://www.eastarjet.com/newstar/PGWDA00001 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| airbusan-official-events | official_event | 여행/숙박 | medium | https://www.airbusan.com/content/individual/promotion/event | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| lottehotel-official-offers | official_event | 여행/숙박 | medium | https://www.lottehotel.com/global/ko/offers.html | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| kyochon-official-events | official_event | 외식/배달, 무료혜택 | medium | https://www.kyochon.com/event/ing.asp | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| lotteworld-official-benefits | official_event | 영화/문화, 카드/멤버십 | medium | https://adventure.lotteworld.com/kor/price/benefit/list.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| everland-official-special-offers | official_event | 영화/문화, 여행/숙박 | medium | https://www.everland.com/everland/ticket/special.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| aquaplanet-official-events | official_event | 영화/문화 | medium | https://www.aquaplanet.co.kr/ilsan/event/eventList.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| cjthemarket-official-events | official_event | 식품/생필품, 무료혜택 | high | https://www.cjthemarket.com/pc/event/eventMain | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| ediya-official-events | official_event | 외식/배달, 무료혜택 | medium | https://www.ediya.com/contents/event.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| tenbyten-official-events | official_event | 패션/뷰티, 무료혜택 | medium | https://www.10x10.co.kr/event/eventmain.asp | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| apple-certified-refurbished | official_event | 디지털/가전 | medium | https://www.apple.com/kr/shop/refurbished | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| elevenst-official-shocking-deal | official_event | 식품/생필품, 디지털/가전 | medium | https://www.11st.co.kr/browsing/DealAction.tmall | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |

## 다음 작업

- OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.
- 새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.
- 사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다.

## CSV 사용

- `reports/official-source-catalog.csv`는 `source_catalog`, `feed_transition`, `next_action` 행을 포함한다.
- 운영자는 CSV를 스프레드시트로 열어 공식 URL, 카테고리, 우선 연결 env key, 현재 feed URL 수, 다음 액션을 함께 검수한다.

## 검증 결과

- 이슈 없음

