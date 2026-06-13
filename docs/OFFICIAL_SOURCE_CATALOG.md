# 공식 소스 카탈로그

이 문서는 할인도사에 연결할 수 있는 공식 이벤트, 공공 혜택, 제휴 JSON/RSS 후보를 정리합니다. 무단 크롤링 후보가 아니라 운영자가 승인 feed 또는 공식 페이지 매핑으로 전환할 때 쓰는 출발점입니다.

- 생성 시각: 2026-06-13T04:02:33.815Z
- 상태: PASS
- 후보 소스: 236개
- 고우선순위 후보: 99개
- 현재 env feed 연결 후보: 0개
- 공식 혜택 노출: 197개
- feed 전환 상태: seed_launch_ready
- CSV 리포트: reports/official-source-catalog.csv

## 카테고리 커버리지

| 카테고리 | 후보 수 | 상태 |
| --- | ---: | --- |
| 식품/생필품 | 23 | 충분 |
| 마트/편의점 | 19 | 충분 |
| 디지털/가전 | 14 | 충분 |
| 패션/뷰티 | 26 | 충분 |
| 외식/배달 | 59 | 충분 |
| 여행/숙박 | 12 | 충분 |
| 영화/문화 | 27 | 충분 |
| 카드/멤버십 | 90 | 충분 |
| 무료혜택 | 199 | 충분 |
| 정부/공공혜택 | 43 | 충분 |

## Provider 커버리지

| Provider | 후보 수 | 상태 |
| --- | ---: | --- |
| news | 1 | 포함 |
| event_news | 2 | 포함 |
| official_event | 164 | 포함 |
| public_coupon | 69 | 포함 |

## 후보 목록

| ID | Provider | 카테고리 | 우선순위 | 공식 URL | Env |
| --- | --- | --- | --- | --- | --- |
| gs25-event-goods | official_event | 마트/편의점, 무료혜택 | high | https://gs25.gsretail.com/gscvs/ko/products/event-goods | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
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
| kfc-delivery-free | official_event | 외식/배달, 무료혜택 | high | https://www.kfckorea.com/promotion/promotionList/detail/1053 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| lotteeatz-monthly-coupon | official_event | 외식/배달, 무료혜택 | high | https://www.lotteeatz.com/event/main/selectEvent/17589 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| krispykreme-wednesday-event | official_event | 외식/배달, 무료혜택 | medium | https://www.lotteeatz.com/event/main/selectEvent/6769 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| baskinrobbins-events | official_event | 외식/배달, 무료혜택 | medium | https://www.baskinrobbins.co.kr/m/play/event/list.php | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| happypoint-alliance-benefits | public_coupon | 카드/멤버십, 외식/배달, 무료혜택 | high | https://www.happypointcard.com/alliance/service/guide.spc | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| okcashbag-event-benefits | public_coupon | 카드/멤버십, 무료혜택, 마트/편의점 | high | https://www.okcashbag.com/life/event/eventHome.do | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| okcashbag-brand-events | public_coupon | 카드/멤버십, 무료혜택 | medium | https://www.okcashbag.com/life/event/eventMain.do | PUBLIC_COUPON_FEED_URLS, DEAL_EVENT_FEED_URLS |
| parisbaguette-promotion | official_event | 외식/배달, 무료혜택 | medium | https://www.paris.co.kr/promotion/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| mcdonalds-happy-snack-free-drink | public_coupon | 외식/배달, 무료혜택 | high | https://www.mcdonalds.co.kr/kor/promotion/detail/E51CF9 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| kfc-new-member-coupon-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.kfckorea.com/promotion/promotionList/detail/1040 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| pizzahut-member-free-coupon-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.pizzahut.co.kr/misc/membership | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| starbucks-rewards-official-benefit | public_coupon | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.starbucks.co.kr/msr/msreward/about.do | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| megabox-membership-official-benefit | public_coupon | 영화/문화, 무료혜택, 카드/멤버십 | medium | https://www.megabox.co.kr/benefit/membership | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| megabox-vip-lounge-official-benefit | public_coupon | 영화/문화, 무료혜택 | medium | https://www.megabox.co.kr/benefit/viplounge | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecinema-lpoint-membership-benefit | public_coupon | 영화/문화, 카드/멤버십 | medium | https://www.lottecinema.co.kr/NLCHS/Membership/l_point | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| samsung-members-official-benefit | official_event | 디지털/가전, 무료혜택, 카드/멤버십 | medium | https://www.samsung.com/sec/members/benefit/ | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| homeplus-membership-official-coupon | official_event | 마트/편의점, 식품/생필품, 무료혜택 | medium | https://front.homeplus.co.kr/membership | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| bccard-benefit-official-center | public_coupon | 카드/멤버십, 무료혜택 | medium | https://www.bccard.com/app/card/BenefitActn.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| cu-plus-official-monthly-benefit | official_event | 마트/편의점, 무료혜택 | high | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| naverplus-membership-official-benefit | public_coupon | 카드/멤버십, 무료혜택 | medium | https://nid.naver.com/membership/join | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| samsungcard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.samsungcard.com/personal/event/ing/UHPPBE1401M0.jsp | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lottecard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.lottecard.co.kr/app/LPCDADA_V100.lc | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| hanacard-official-event-benefit | public_coupon | 카드/멤버십 | medium | https://www.hanacard.co.kr/OPI35000000D.web | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| kt-membership-official-benefit | public_coupon | 카드/멤버십, 외식/배달, 영화/문화 | medium | https://membership.kt.com/main/MainInfo.do | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
| uplus-membership-official-benefit | public_coupon | 카드/멤버십, 외식/배달, 영화/문화 | medium | https://www.lguplus.com/benefit-membership | PUBLIC_COUPON_FEED_URLS, DEAL_NEWS_FEED_URLS |
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
| skt-tmembership-official-benefits | official_event | 카드/멤버십, 무료혜택, 외식/배달, 영화/문화 | high | https://www.tworld.co.kr/web/html/tmembership/index.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| work24-training-support-official | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.work24.go.kr/cm/main.do | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, DEAL_NEWS_FEED_URLS |
| kmooc-official-free-courses | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/18713 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| bokjiro-official-welfare-services | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.bokjiro.go.kr/ssis-tbu/index.do | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, DEAL_NEWS_FEED_URLS |
| culture-seoul-official-events | public_coupon | 영화/문화, 정부/공공혜택, 무료혜택 | medium | https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS |
| royalcanin-kr-official-events | official_event | 식품/생필품, 무료혜택 | medium | https://www.royalcanin.com/kr/about-us/news/sol4-campaign | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| purina-official-event-list | official_event | 무료혜택, 식품/생필품 | high | https://www.purinapetcare.co.kr/shop/event_list.php | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| purina-zero-won-official-event | official_event | 무료혜택, 식품/생필품 | high | https://www.purinapetcare.co.kr/shop/event_view.php?stx=&stx=&wi_idx=427 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| powderroom-review-event | public_coupon | 패션/뷰티, 무료혜택 | medium | https://www.powderroom.co.kr/review | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lguplus-lifecare-benefit-event | official_event | 카드/멤버십, 무료혜택 | high | https://www.lguplus.com/benefit-event/lifecare/home/81776 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| amoremall-official-benefit-events | official_event | 패션/뷰티, 무료혜택 | high | https://www.amoremall.com/kr/ko/main.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| amoremall-official-event-list | official_event | 패션/뷰티, 무료혜택 | high | https://www.amoremall.com/kr/ko/display/event | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| amoremall-try-before-buy-sample | official_event | 패션/뷰티, 무료혜택 | high | https://www.amoremall.com/kr/ko/display/event_detail?planDisplaySn=5277 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| amoremall-official-payment-benefit | official_event | 패션/뷰티, 카드/멤버십, 무료혜택 | medium | https://www.amoremall.com/kr/ko/display/event_detail?planDisplaySn=6438 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| roundlab-official-event-board | official_event | 패션/뷰티, 무료혜택 | medium | https://roundlab.co.kr/board/gallery/list.html?board_no=8 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kakaopay-membership-benefits | official_event | 카드/멤버십, 무료혜택 | medium | https://www.kakaopay.com/services/life/membership | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-official-benefit-events | official_event | 카드/멤버십, 무료혜택 | medium | https://www.payco.com/event.nhn | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lotteon-lohbs-official-event | official_event | 식품/생필품, 패션/뷰티, 무료혜택 | medium | https://www.lotteon.com/event/onLohbsShare | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| danawa-official-events | official_event | 디지털/가전, 무료혜택 | medium | https://event.danawa.com/main/index.php | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| suto-approved-event-discovery | public_coupon | 무료혜택 | low | https://www.suto.co.kr/bbs/board.php?bo_table=cpevent | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| drg-official-event-board | official_event | 패션/뷰티, 무료혜택 | medium | https://www.dr-g.co.kr/event | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| thefaceshop-official-events | official_event | 패션/뷰티, 무료혜택 | medium | https://www.thefaceshop.com/mall/event/event.jsp | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| naturecollection-official-events | official_event | 패션/뷰티, 무료혜택 | medium | https://www.naturecollection.com/mall/event/event.jsp | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| toss-official-benefit-feed | official_event | 카드/멤버십, 무료혜택 | medium | https://toss.im/tossfeed/topic/%ED%98%9C%ED%83%9D | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| twosome-heart-app-membership | official_event | 외식/배달, 무료혜택 | medium | https://twosome.co.kr/eng/html/mo/twMobileIntro.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| mega-mgc-official-events | official_event | 외식/배달, 무료혜택 | medium | https://www.mega-mgccoffee.com/bbs/?bbs_category=3 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| coupang-eats-official-benefits | official_event | 외식/배달, 무료혜택 | low | https://www.coupangeats.com/home/ | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lottemart-official-benefits | official_event | 식품/생필품, 마트/편의점, 무료혜택 | medium | https://company.lottemart.com/mobiledowa/event/event_list.asp | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| daisomall-official-events | official_event | 마트/편의점, 무료혜택 | medium | https://www.daisomall.co.kr/ds/spexhbt/C211?exbtNo=787 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| gmarket-official-coupon-event | official_event | 패션/뷰티, 무료혜택 | medium | https://www.gmarket.co.kr/e/spt/amorepacific | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| auction-official-ecoupon-event | official_event | 외식/배달, 무료혜택 | medium | https://promotion.auction.co.kr/promotion/MD/eventview.aspx?txtMD=088B0E6DDE%28pc%29 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| eventhouse-approved-event-discovery | public_coupon | 무료혜택, 영화/문화 | low | https://www.eventhouse.kr/mobile/ | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| baskinrobbins-official-event-list | official_event | 외식/배달, 카드/멤버십, 무료혜택 | medium | https://www.baskinrobbins.co.kr/play/event/list.php?category=C | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| dunkin-official-event-benefits | official_event | 외식/배달, 무료혜택 | medium | https://www.dunkindonuts.co.kr/index.php/event/view?id=4516 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| parisbaguette-official-promotions | official_event | 외식/배달, 카드/멤버십, 무료혜택 | medium | https://www.paris.co.kr/promotion/pb-with-lafc/ | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| happy-point-official-coupons | official_event | 카드/멤버십, 외식/배달, 무료혜택 | high | https://www.happypointcard.com/coupon/coupon.spc | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| okcashbag-welcome-point-event | official_event | 카드/멤버십, 무료혜택 | high | https://www.okcashbag.com/event/newwelcomeback | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lpoint-official-daily-missions | official_event | 카드/멤버십, 무료혜택 | medium | https://www.lpoint.com/app/common/LHZZ300300.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| ebs-family-free-learning-services | public_coupon | 정부/공공혜택, 무료혜택 | high | https://m.ebs.co.kr/familyService | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| ebs-lifelong-school-free-courses | public_coupon | 정부/공공혜택, 무료혜택, 영화/문화 | medium | https://lifelongschool.ebs.co.kr/lifelongschool/subject/introduce | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| kocw-official-open-course | public_coupon | 정부/공공혜택, 무료혜택 | medium | https://www.kocw.net/home/cview.do?cid=6315ee4acf8a5ca8 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| work24-training-card-issue-guide | public_coupon | 정부/공공혜택, 무료혜택 | high | https://m.work24.go.kr/hr/h/a/1100/selectIssuGudn.do | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| royalcanin-start-of-life-campaign | official_event | 무료혜택 | medium | https://www.royalcanin.com/kr/about-us/events/start-of-life-campaign | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-youth-policy-free-support-guide | public_coupon | 정부/공공혜택, 무료혜택 | high | https://youth.seoul.go.kr/infoData/sprtInfo/list.do?key=2309130006 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| seoul-lifelong-learning-4050-intro | public_coupon | 정부/공공혜택, 무료혜택 | medium | https://sll.seoul.go.kr/main/doIntroView.do?main_se=jce&mnid=202412257900 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| hangang-seoul-official-free-events | public_coupon | 영화/문화, 정부/공공혜택, 무료혜택 | medium | https://hangang.seoul.go.kr/www/eventMng/list.do?mid=53 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| mois-subsidy24-official-guide | public_coupon | 정부/공공혜택, 무료혜택 | medium | https://www.mois.go.kr/frt/bbs/type002/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000205&nttId=97408 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| culture-portal-invite-events | public_coupon | 영화/문화, 정부/공공혜택, 무료혜택 | high | https://www.culture.go.kr/portal/cltBnf/cltInvEvt/list.do?menuNo=200106 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| pascucci-official-event-list | official_event | 외식/배달, 카드/멤버십, 무료혜택 | medium | https://www.pascucci.co.kr/event/eventList.asp | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| dunkin-official-promotion-list | official_event | 외식/배달, 카드/멤버십, 무료혜택 | medium | https://www.dunkindonuts.co.kr/event?flag=A | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| momq-official-event-list | official_event | 무료혜택, 식품/생필품, 패션/뷰티 | high | https://www.momq.co.kr/event | BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| momq-new-member-welcome-benefit | official_event | 무료혜택, 식품/생필품, 카드/멤버십 | medium | https://www.momq.co.kr/event/202601290003 | BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| naverpay-online-coupon-home | public_coupon | 카드/멤버십, 무료혜택, 식품/생필품, 패션/뷰티 | high | https://pay.naver.com/coupon/home/online | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| yogiyo-official-roulette-promotion | official_event | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.yogiyo.co.kr/promotion/roulette/ | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| lge-official-benefit-event-hub | official_event | 디지털/가전, 무료혜택, 카드/멤버십 | high | https://www.lge.co.kr/benefits | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| himart-lpoint-membership-benefit | public_coupon | 디지털/가전, 카드/멤버십, 무료혜택 | medium | https://company.himart.co.kr/membership/intro | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lguplus-membership-affiliate-perks | official_event | 카드/멤버십, 무료혜택, 외식/배달, 영화/문화 | high | https://www.lguplus.com/benefit-membership/affiliate-perks | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kt-yogo-mobile-official-benefit | official_event | 카드/멤버십, 무료혜택, 디지털/가전 | medium | https://shop.kt.com/unify/yogoEvent.do | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_NEWS_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lguplus-ongoing-membership-event | official_event | 카드/멤버십, 무료혜택, 디지털/가전 | medium | https://www.lguplus.com/benefit-event/ongoing/80995 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-reward-official-point-benefit | official_event | 카드/멤버십, 무료혜택 | medium | https://www.payco.com/point/reward.nhn | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-partyplus-coupon-guide | official_event | 카드/멤버십, 무료혜택 | high | https://events.payco.com/partyplus/guide | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-promotion-code-official-guide | official_event | 카드/멤버십, 무료혜택 | medium | https://www.payco.com/payco/guidepromotion.nhn | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kakaopay-payment-point-official-benefit | official_event | 카드/멤버십, 무료혜택 | medium | https://www.kakaopay.com/services/life/payment?t_ch=main&t_src=homepage | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kakaopay-benefits-faq-official-coupon | official_event | 카드/멤버십, 무료혜택 | medium | https://support.kakaopay.com/inapp/faq-list/CUSTOMER_CENTER_FAQ_BENEFITS?qna=all | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kakaopay-membership-usage-official-guide | official_event | 카드/멤버십, 무료혜택 | medium | https://contents.kakaopay.com/contents/909 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| okcashbag-shopping-point-official-benefit | official_event | 카드/멤버십, 무료혜택 | medium | https://okcashbag.com/shopping | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| okcashbag-service-official-point-guide | official_event | 카드/멤버십, 무료혜택 | medium | https://okcashbag.kr/utility/okcashbagInfo.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| happypoint-membership-official-benefit-guide | official_event | 카드/멤버십, 무료혜택 | medium | https://www.happypointcard.com/page/presentation/membership.spc | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| culture-day-monthly-official-program-list | official_event | 영화/문화, 정부/공공혜택, 무료혜택 | high | https://www.culture.go.kr/local/wday/mnthCltrLctnYList.do | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-blockchain-digital-asset-free-course | official_event | 정부/공공혜택, 무료혜택 | medium | https://www.kmooc.kr/view/course/detail/19048 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-ai-teaching-innovation-free-course | official_event | 정부/공공혜택, 무료혜택 | medium | https://www.kmooc.kr/view/course/detail/19997 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| popeyes-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.popeyes.co.kr/event | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS |
| seoul-public-reservation-free-experience | public_coupon | 정부/공공혜택, 영화/문화, 무료혜택 | high | https://yeyak.seoul.go.kr/web/main.do | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| seoul-worldcup-silkworm-free-experience-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260520140256572900 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-dongdaemun-water-sports-free-class-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?locale=ko&rsv_svc_id=S260512102120511430 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-hanyangdoseong-free-history-tour-202606 | public_coupon | 정부/공공혜택, 영화/문화, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260522131054795847 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-futurelab-battlebot-free-experience-202606 | public_coupon | 정부/공공혜택, 디지털/가전, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260509143239234573 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-plant-hospital-free-care-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S250103153915708411 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-ujangsan-forest-healing-free-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260430141839376361 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-seoseoul-lake-green-free-kids-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260529131642855996 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-sagajeong-forest-play-free-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260519152853080472 | PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinhancard-annual-fee-cashback-202606 | official_event | 카드/멤버십, 무료혜택 | medium | https://www.shinhancard.com/pconts/html/benefit/event/1239025_2239.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinhancard-utility-autopay-cashback-202606 | official_event | 카드/멤버십, 무료혜택 | medium | https://www.shinhancard.com/pconts/html/benefit/event/1239015_2239.html | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| ichallenge-baby-free-trial-kit-202606 | official_event | 무료혜택 | high | https://m.i-challenge.co.kr/event/freetrial_r1/index.asp | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| gs25-hyeja-bread-tosspay-plusone-202606 | official_event | 마트/편의점, 무료혜택 | medium | https://gs25.gsretail.com/gscvs/ko/customer-engagement/event/detail/publishing?eventCode=8842754706976&pageNum=1 | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| musinsa-online-coupon-2026 | official_event | 패션/뷰티, 무료혜택 | medium | https://www.musinsa.com/coupon-service/coupon/coupon_online | OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-art-face-emotion-free-course-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/19060 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-dynamics-free-course-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/18013 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-computer-graphics-free-course-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/19266 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-machine-learning-free-course-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/19382 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kmooc-media-literacy-free-course-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://www.kmooc.kr/view/course/detail/19037 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-life-museum-ompang-free-kids-2026 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S251118144705678859 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-dongdaemun-forest-family-free-2026 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260421215619744831 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-history-museum-guide-free-2026 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?reSvc=Y&rsv_svc_id=S221208131717851016 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-baekje-kids-museum-free-exhibit-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S240429112658694635 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seoul-history-kids-museum-free-visit-2026 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?locale=ko&rsv_svc_id=S260320170624732091 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| hansung-baekje-conservation-family-free-202607 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260223140354039679 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| guro-picnic-garden-free-reservation-202606 | public_coupon | 정부/공공혜택, 무료혜택 | high | https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S250417160236520990 | PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| cjthemarket-welcome-coupon-free-shipping-2026 | official_event | 식품/생필품, 무료혜택 | high | https://vod.cjthemarket.com/pc/bnf/coupon | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| cjthemarket-random-lucky-coupon-daily-2026 | official_event | 식품/생필품, 무료혜택 | high | https://m.cjthemarket.com/mo/event/new/randomCouponEvnt | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| coupang-official-benefit-coupon-center | official_event | 무료혜택, 식품/생필품, 디지털/가전 | high | https://www.coupang.com/np/coupangbenefit | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| naver-official-event-hub | official_event | 무료혜택, 카드/멤버십 | high | https://mkt.naver.com/promotion | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| naverpay-official-campaign-all | official_event | 무료혜택, 카드/멤버십 | high | https://m-campaign.naver.com/npay-event-all/ | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| baemin-official-free-delivery-club-event | official_event | 무료혜택, 외식/배달 | high | https://event-view.baemin.com/apps/9ikdKTU?mode=no-lottie | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| todayhouse-official-season-promotion | official_event | 무료혜택, 식품/생필품, 디지털/가전 | medium | https://events.ohou.se/promotions/o-season-week | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| tossfeed-tosspay-official-promotion | official_event | 무료혜택, 카드/멤버십 | medium | https://toss.im/tossfeed/article/tosspay-promotion | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| sktmembership-daily-mission-point | official_event | 무료혜택, 카드/멤버십, 외식/배달 | high | https://m.tworld.co.kr/membership/submain | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| sktmembership-benefit-brand-list | official_event | 카드/멤버십, 외식/배달, 마트/편의점 | medium | https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/list-tab1.do | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kt-membership-daldal-benefit | official_event | 무료혜택, 카드/멤버십, 외식/배달 | high | https://membership.kt.com/discount/benefit/DaldalBenefit.do | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kt-official-ongoing-event-list | official_event | 카드/멤버십, 무료혜택 | medium | https://event.kt.com/html/event/ongoing_event_list.html | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lguplus-official-ongoing-benefit-event | official_event | 무료혜택, 카드/멤버십 | high | https://www.lguplus.com/benefit-event/ongoing | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lguplus-benefit-plus-monthly | official_event | 무료혜택, 카드/멤버십, 외식/배달 | high | https://www.lguplus.com/benefit-plus | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| naverpay-cafe-point-benefit | official_event | 무료혜택, 카드/멤버십, 외식/배달 | high | https://campaign2.naver.com/npay/cafe/ | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| cjone-signup-welcome-coupon | official_event | 무료혜택, 카드/멤버십, 외식/배달 | high | https://www.cjone.com/cjmweb/event-coupon/coupon.do | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinhansolpay-first-signup-point | official_event | 무료혜택, 카드/멤버십 | high | https://www.shinhancard.com/pconts/html/benefit/event/1220118_2239.html | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kbpay-official-event-point-coupon | official_event | 무료혜택, 카드/멤버십 | medium | https://m.kbcard.com/BON/DVIEW/MBBV0002 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| hpoint-official-event-point-coupon | official_event | 무료혜택, 카드/멤버십 | medium | https://www.h-point.co.kr/benefit/evntDtl.nhd?evntId=181309 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lotteeatz-coupon-center | official_event | 무료혜택, 외식/배달 | high | https://www.lotteeatz.com/coupon/main | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| daisomall-signup-benefit | official_event | 무료혜택, 식품/생필품 | high | https://prdm.daisomall.co.kr/ev/eva/SCR_EVA_0003?evtCd=EVT00286 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lghnh-official-event | official_event | 무료혜택, 패션/뷰티, 식품/생필품 | high | https://www.lghnh.com:984/news/event.jsp | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| powderroom-official-campaign | official_event | 무료혜택, 패션/뷰티 | high | https://www.powderroom.co.kr/campaigns | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lotteworld-official-benefit | official_event | 무료혜택, 영화/문화, 여행/숙박 | medium | https://www.lotteworld.com/contents/contents.asp?cmsCd=CM0029 | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| everland-official-event | official_event | 무료혜택, 영화/문화, 여행/숙박 | medium | https://www.everland.com/web/everland/now/news/1216661_10436.html | OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| mega-mgc-official-event-list | official_event | 무료혜택, 외식/배달, 카드/멤버십 | high | https://www.mega-mgccoffee.com/bbs/?bbs_category=3&bbs_detail_category=12 | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-official-reward | official_event | 무료혜택, 카드/멤버십 | high | https://m.payco.com/point/reward.nhn | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| payco-official-benefit-home | official_event | 무료혜택, 카드/멤버십 | medium | https://events.payco.com/event/app/detail/sbHAyIM.nhn | PAY_POINT_BENEFIT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS |
| lpoint-official-event-list | official_event | 무료혜택, 카드/멤버십 | high | https://m.lpoint.com/app/event/LWEA100110.do | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinsegae-point-official-events | official_event | 무료혜택, 마트/편의점, 카드/멤버십 | high | https://m.shinsegaepoint.com/ingevents | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinsegae-point-attendance | official_event | 무료혜택, 카드/멤버십 | high | https://m.shinsegaepoint.com/benefits/pntPlus/attend | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| paikdabang-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://paikdabang.com/news/event/ | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| theventi-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.theventi.co.kr/new2022/news/event.html | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| tomntoms-official-event-coupon | official_event | 외식/배달, 무료혜택 | medium | https://www.tomntoms.com/event/eventList.php | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| twosome-official-event-list | official_event | 외식/배달, 무료혜택, 카드/멤버십 | high | https://mo.twosome.co.kr/ev/eventList.do | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| touslesjours-official-event-list | official_event | 외식/배달, 무료혜택, 카드/멤버십 | high | https://m.tlj.co.kr/community/event/list.asp | CAFE_FRANCHISE_COUPON_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| cupost-official-event-list | official_event | 마트/편의점, 무료혜택, 카드/멤버십 | high | https://www.cupost.co.kr/mobile/cuevent/eventList.cupost | CONVENIENCE_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS, SIGNUP_GIFT_FEED_URLS |
| naverpay-payment-benefit-list | official_event | 카드/멤버십, 무료혜택 | high | https://pay.naver.com/benefit/payment/list | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| naverpay-card-promotion-event | official_event | 카드/멤버십, 무료혜택 | medium | https://card.pay.naver.com/home/promotion/event | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| shinhancard-mobile-event-list | official_event | 카드/멤버십, 무료혜택 | medium | https://www.shinhancard.com/mob/MOBFM026N/MOBFM026C01.shc | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, SIGNUP_GIFT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| lottecard-mobile-event-list | official_event | 카드/멤버십, 무료혜택 | medium | https://www.lottecard.co.kr/app/LPBNFDA_V100.lc | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, SIGNUP_GIFT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| cu-official-plus-event-goods | official_event | 마트/편의점, 무료혜택 | high | https://cu.bgfretail.com/event/plus.do?category=event&depth2=1&sf=N | CONVENIENCE_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| seven-eleven-official-service-event-menu | official_event | 마트/편의점, 무료혜택, 카드/멤버십 | medium | https://www.7-eleven.co.kr/product/service.asp | CONVENIENCE_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| lguplus-roaming-coupon-event | official_event | 여행/숙박, 무료혜택, 카드/멤버십 | medium | https://www.lguplus.com/plan/roaming/event | TELECOM_MEMBERSHIP_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| kbcard-official-event-list | official_event | 카드/멤버십, 무료혜택 | medium | https://card.kbcard.com/BON/DVIEW/HBMCXCRDNEC0002 | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, SIGNUP_GIFT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| hyundaicard-official-event-list | official_event | 카드/멤버십, 무료혜택 | medium | https://www.hyundaicard.com/cpb/ev/CPBEV0101_01.hc | PAY_POINT_BENEFIT_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, SIGNUP_GIFT_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| innisfree-official-event-list | official_event | 패션/뷰티, 무료혜택 | high | https://www.innisfree.com/kr/ko/EventList.do | BEAUTY_SAMPLE_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| mamonde-official-event-list | official_event | 패션/뷰티, 무료혜택 | medium | https://www.mamonde.com/kr/ko/event.html | BEAUTY_SAMPLE_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, BENEFIT_REFRESH_FEED_URLS |
| burgerking-official-ongoing-events | official_event | 외식/배달, 무료혜택 | high | https://www.burgerking.co.kr/event/ongoing | OFFICIAL_EVENT_FEED_URLS, CAFE_FRANCHISE_COUPON_FEED_URLS, PUBLIC_COUPON_FEED_URLS |
| lotteeatz-official-event-main | official_event | 외식/배달, 무료혜택, 카드/멤버십 | high | https://www.lotteeatz.com/event/main | OFFICIAL_EVENT_FEED_URLS, CAFE_FRANCHISE_COUPON_FEED_URLS, PUBLIC_COUPON_FEED_URLS |

## 다음 작업

- OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.
- 새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.
- 사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다.

## CSV 사용

- `reports/official-source-catalog.csv`는 `source_catalog`, `feed_transition`, `next_action` 행을 포함한다.
- 운영자는 CSV를 스프레드시트로 열어 공식 URL, 카테고리, 우선 연결 env key, 현재 feed URL 수, 다음 액션을 함께 검수한다.

## 검증 결과

- 이슈 없음

