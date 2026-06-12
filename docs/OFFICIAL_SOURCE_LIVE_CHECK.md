# 공식 소스 라이브 접근성 점검

이 문서는 공식 이벤트/혜택 소스 후보의 현재 접근 상태를 non-strict 방식으로 기록합니다. 무단 크롤링을 수행하지 않으며, 보호된 페이지는 공식 API/RSS/제휴 feed 또는 수동 승인 데이터로 연결해야 합니다.

- 생성 시각: 2026-06-12T15:19:59.050Z
- 모드: non_strict_live_readiness
- 후보 소스: 223개
- 접근 가능: 196개
- 보호/권한 확인 필요: 27개
- 검토 필요: 0개
- timeout/network error: 0개
- 404/410 교체 필요: 0개
- CSV 리포트: reports/official-source-live-check.csv

## 운영 원칙

- 이 리포트는 사용자 노출 데이터를 자동으로 바꾸지 않습니다.
- 검색 결과, 커뮤니티 원문, 종료 이벤트, 보호 페이지 크롤링 결과는 상품/혜택 카드로 노출하지 않습니다.
- protected/guarded 소스는 무리하게 수집하지 않고 공식 feed 또는 제휴 담당자 제공 데이터로 연결합니다.

## 상태별 요약

| 상태 | 수 | 운영 액션 |
| --- | ---: | --- |
| reachable | 196 | 승인 feed 또는 공식 페이지 매핑 후보로 유지 |
| guarded | 27 | 공식 API/RSS/제휴 feed 확인 |
| needs_review | 0 | 최종 도메인과 응답 정책 수동 확인 |
| timeout/network_error | 0 | 재시도 또는 담당자 확인 |
| stale_or_removed | 0 | 카탈로그 URL 교체 전 사용 금지 |

## 소스별 결과

| ID | Provider | 우선순위 | 상태 | HTTP | 최종 호스트 | 운영 액션 |
| --- | --- | --- | --- | ---: | --- | --- |
| gs25-event-goods | official_event | high | reachable | 200 | gs25.gsretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ssg-event-main | official_event | high | reachable | 200 | ssg.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| emart-event-main | official_event | medium | reachable | 200 | emart.ssg.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| homeplus-event | official_event | medium | reachable | 200 | front.homeplus.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| yogiyo-event | event_news | high | reachable | 200 | yogiyo.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| bhc-ecoupon | official_event | medium | reachable | 200 | bhc.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| starbucks-campaign | official_event | medium | reachable | 200 | starbucks.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cjone-mobile-events | official_event | medium | reachable | 200 | cjone.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| oliveyoung-events | official_event | medium | guarded | 403 | oliveyoung.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| cgv-events | public_coupon | medium | guarded | 403 | cgv.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| lottecinema-events | public_coupon | medium | reachable | 200 | lottecinema.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| megabox-events | public_coupon | medium | reachable | 200 | megabox.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| culture-day | public_coupon | high | reachable | 200 | culture.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mnuri-benefit | public_coupon | high | reachable | 200 | mnuri.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverpay-benefit | official_event | high | guarded | 200 | nid.naver.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| kbcard-events | official_event | medium | reachable | 200 | card.kbcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| bccard-events | official_event | medium | reachable | 200 | bccard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| tworld-membership | official_event | medium | reachable | 200 | tworld.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| koreanair-promotion | event_news | medium | reachable | 200 | koreanair.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| jejuair-events | official_event | high | guarded | 503 | jejuair.net | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsung-shop-event | official_event | medium | reachable | 200 | samsung.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| himart-events | official_event | medium | reachable | 200 | company.himart.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hmall-official-events | news | medium | reachable | 200 | hmall.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| musinsa-fashion-festa | official_event | medium | reachable | 200 | musinsa.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mcdonalds-happysnack | official_event | medium | reachable | 200 | mcdonalds.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lpoint-benefits | public_coupon | high | reachable | 200 | m.lpoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lpoint-card-events | public_coupon | medium | reachable | 200 | m.lpoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| visitkorea-travel-week | public_coupon | high | reachable | 200 | korean.visitkorea.or.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| baemin-academy-events | public_coupon | medium | reachable | 200 | academy.baemin.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kfc-delivery-free | official_event | high | reachable | 200 | kfckorea.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteeatz-monthly-coupon | official_event | high | reachable | 200 | lotteeatz.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| krispykreme-wednesday-event | official_event | medium | reachable | 200 | lotteeatz.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| baskinrobbins-events | official_event | medium | reachable | 200 | baskinrobbins.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| happypoint-alliance-benefits | public_coupon | high | reachable | 200 | happypointcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-event-benefits | public_coupon | high | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-brand-events | public_coupon | medium | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| parisbaguette-promotion | official_event | medium | reachable | 200 | paris.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mcdonalds-happy-snack-free-drink | public_coupon | high | reachable | 200 | mcdonalds.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kfc-new-member-coupon-benefit | public_coupon | high | reachable | 200 | kfckorea.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| pizzahut-member-free-coupon-benefit | public_coupon | high | guarded | 200 | pizzahut.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| starbucks-rewards-official-benefit | public_coupon | high | reachable | 200 | starbucks.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| megabox-membership-official-benefit | public_coupon | medium | guarded | 200 | megabox.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| megabox-vip-lounge-official-benefit | public_coupon | medium | reachable | 200 | megabox.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lottecinema-lpoint-membership-benefit | public_coupon | medium | guarded | 200 | lottecinema.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsung-members-official-benefit | official_event | medium | guarded | 200 | samsung.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| homeplus-membership-official-coupon | official_event | medium | guarded | 200 | front.homeplus.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| bccard-benefit-official-center | public_coupon | medium | reachable | 200 | bccard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cu-plus-official-monthly-benefit | official_event | high | reachable | 200 | cu.bgfretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverplus-membership-official-benefit | public_coupon | medium | guarded | 200 | nid.naver.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsungcard-official-event-benefit | public_coupon | medium | reachable | 200 | samsungcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lottecard-official-event-benefit | public_coupon | medium | reachable | 200 | lottecard.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hanacard-official-event-benefit | public_coupon | medium | reachable | 200 | hanacard.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kt-membership-official-benefit | public_coupon | medium | guarded | 200 | membership.kt.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| uplus-membership-official-benefit | public_coupon | medium | guarded | 200 | lguplus.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| national-museum-official-exhibition | public_coupon | medium | reachable | 200 | museum.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| innisfree-sample-market | public_coupon | high | reachable | 200 | m.innisfree.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| innisfree-event-coupon | official_event | medium | reachable | 200 | innisfree.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kurly-beauty-sample-product | official_event | medium | reachable | 200 | kurly.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kurly-living-free-shipping-product | official_event | medium | reachable | 200 | kurly.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kurly-digital-free-shipping-product | official_event | medium | reachable | 200 | kurly.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kurly-fashion-free-shipping-product | official_event | medium | reachable | 200 | kurly.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hollys-official-event-coupon | official_event | medium | reachable | 200 | hollys.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| momstouch-official-event-coupon | official_event | medium | reachable | 200 | momstouch.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mega-mgc-official-event-coupon | official_event | medium | reachable | 200 | mega-mgccoffee.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| subway-official-promotion | official_event | medium | reachable | 200 | subway.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seven-eleven-official-events | official_event | high | reachable | 200 | 7-eleven.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| emart24-official-events | official_event | high | reachable | 200 | emart24.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| pizzahut-luckydraw-coupon | official_event | medium | reachable | 200 | pizzahut.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dunkin-monthly-combo-coupon | official_event | high | reachable | 200 | dunkindonuts.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dunkin-donut-fryday-coupon | official_event | medium | reachable | 200 | dunkindonuts.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dunkin-membership-partner-benefits | official_event | medium | reachable | 200 | dunkindonuts.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| gov24-benefit-alert-service | public_coupon | high | reachable | 200 | plus.gov.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kosaf-scholarship-support | public_coupon | medium | reachable | 200 | kosaf.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ikea-official-offers | official_event | medium | reachable | 200 | ikea.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| yanolja-official-promotion | official_event | medium | reachable | 200 | nol.yanolja.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| twayair-official-events | official_event | medium | reachable | 200 | twayair.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| eastarjet-official-events | official_event | medium | reachable | 200 | eastarjet.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| airbusan-official-events | official_event | medium | guarded | 403 | airbusan.com | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| lottehotel-official-offers | official_event | medium | reachable | 200 | lottehotel.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kyochon-official-events | official_event | medium | reachable | 200 | kyochon.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteworld-official-benefits | official_event | medium | reachable | 200 | adventure.lotteworld.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| everland-official-special-offers | official_event | medium | reachable | 200 | everland.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| aquaplanet-official-events | official_event | medium | reachable | 200 | aquaplanet.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cjthemarket-official-events | official_event | high | reachable | 200 | cjthemarket.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ediya-official-events | official_event | medium | reachable | 200 | ediya.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| tenbyten-official-events | official_event | medium | reachable | 200 | 10x10.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| apple-certified-refurbished | official_event | medium | reachable | 200 | apple.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| elevenst-official-shocking-deal | official_event | medium | reachable | 200 | 11st.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| skt-tmembership-official-benefits | official_event | high | guarded | 401 | tworld.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| work24-training-support-official | public_coupon | high | reachable | 200 | work24.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-official-free-courses | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| bokjiro-official-welfare-services | public_coupon | high | reachable | 200 | bokjiro.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| culture-seoul-official-events | public_coupon | medium | reachable | 200 | culture.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| royalcanin-kr-official-events | official_event | medium | reachable | 200 | royalcanin.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| purina-official-event-list | official_event | high | reachable | 200 | purinapetcare.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| purina-zero-won-official-event | official_event | high | reachable | 200 | purinapetcare.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| powderroom-review-event | public_coupon | medium | reachable | 200 | powderroom.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lguplus-lifecare-benefit-event | official_event | high | reachable | 200 | lguplus.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| amoremall-official-benefit-events | official_event | high | reachable | 200 | amoremall.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| amoremall-official-event-list | official_event | high | reachable | 200 | amoremall.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| amoremall-try-before-buy-sample | official_event | high | reachable | 200 | amoremall.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| amoremall-official-payment-benefit | official_event | medium | reachable | 200 | amoremall.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| roundlab-official-event-board | official_event | medium | reachable | 200 | roundlab.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kakaopay-membership-benefits | official_event | medium | guarded | 200 | kakaopay.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| payco-official-benefit-events | official_event | medium | reachable | 200 | payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteon-lohbs-official-event | official_event | medium | reachable | 200 | lotteon.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| danawa-official-events | official_event | medium | reachable | 200 | event.danawa.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| suto-approved-event-discovery | public_coupon | low | guarded | 403 | suto.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| drg-official-event-board | official_event | medium | reachable | 200 | dr-g.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| thefaceshop-official-events | official_event | medium | reachable | 200 | thefaceshop.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naturecollection-official-events | official_event | medium | reachable | 200 | naturecollection.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| toss-official-benefit-feed | official_event | medium | reachable | 200 | toss.im | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| twosome-heart-app-membership | official_event | medium | guarded | 403 | twosome.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| mega-mgc-official-events | official_event | medium | reachable | 200 | mega-mgccoffee.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| coupang-eats-official-benefits | official_event | low | reachable | 200 | coupangeats.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lottemart-official-benefits | official_event | medium | reachable | 200 | company.lottemart.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| daisomall-official-events | official_event | medium | reachable | 200 | daisomall.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| gmarket-official-coupon-event | official_event | medium | guarded | 403 | gmarket.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| auction-official-ecoupon-event | official_event | medium | reachable | 200 | promotion.auction.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| eventhouse-approved-event-discovery | public_coupon | low | reachable | 200 | eventhouse.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| baskinrobbins-official-event-list | official_event | medium | reachable | 200 | baskinrobbins.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dunkin-official-event-benefits | official_event | medium | reachable | 200 | dunkindonuts.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| parisbaguette-official-promotions | official_event | medium | reachable | 200 | paris.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| happy-point-official-coupons | official_event | high | reachable | 200 | happypointcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-welcome-point-event | official_event | high | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lpoint-official-daily-missions | official_event | medium | reachable | 200 | m.lpoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ebs-family-free-learning-services | public_coupon | high | reachable | 200 | m.ebs.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ebs-lifelong-school-free-courses | public_coupon | medium | reachable | 200 | lifelongschool.ebs.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kocw-official-open-course | public_coupon | medium | reachable | 200 | kocw.net | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| work24-training-card-issue-guide | public_coupon | high | reachable | 200 | m.work24.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| royalcanin-start-of-life-campaign | official_event | medium | reachable | 200 | royalcanin.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-youth-policy-free-support-guide | public_coupon | high | reachable | 200 | youth.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-lifelong-learning-4050-intro | public_coupon | medium | reachable | 200 | sll.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hangang-seoul-official-free-events | public_coupon | medium | reachable | 200 | hangang.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mois-subsidy24-official-guide | public_coupon | medium | reachable | 200 | mois.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| culture-portal-invite-events | public_coupon | high | reachable | 200 | culture.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| pascucci-official-event-list | official_event | medium | reachable | 200 | pascucci.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dunkin-official-promotion-list | official_event | medium | reachable | 200 | dunkindonuts.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| momq-official-event-list | official_event | high | reachable | 200 | momq.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| momq-new-member-welcome-benefit | official_event | medium | reachable | 200 | momq.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverpay-online-coupon-home | public_coupon | high | reachable | 200 | pay.naver.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| yogiyo-official-roulette-promotion | official_event | high | reachable | 200 | yogiyo.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lge-official-benefit-event-hub | official_event | high | reachable | 200 | lge.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| himart-lpoint-membership-benefit | public_coupon | medium | guarded | 200 | company.himart.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| lguplus-membership-affiliate-perks | official_event | high | guarded | 200 | lguplus.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| kt-yogo-mobile-official-benefit | official_event | medium | reachable | 200 | shop.kt.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lguplus-ongoing-membership-event | official_event | medium | reachable | 200 | lguplus.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| payco-reward-official-point-benefit | official_event | medium | reachable | 200 | payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| payco-partyplus-coupon-guide | official_event | high | reachable | 200 | events.payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| payco-promotion-code-official-guide | official_event | medium | reachable | 200 | payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kakaopay-payment-point-official-benefit | official_event | medium | reachable | 200 | kakaopay.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kakaopay-benefits-faq-official-coupon | official_event | medium | guarded | 500 | support.kakaopay.com | 일시 장애 여부를 재확인하고 노출 데이터는 기존 검증 feed만 유지 |
| kakaopay-membership-usage-official-guide | official_event | medium | reachable | 200 | contents.kakaopay.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-shopping-point-official-benefit | official_event | medium | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-service-official-point-guide | official_event | medium | guarded | 0 | okcashbag.kr | 공식 feed 연결 전 브라우저/제휴 담당자 확인 필요 |
| happypoint-membership-official-benefit-guide | official_event | medium | guarded | 200 | happypointcard.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| culture-day-monthly-official-program-list | official_event | high | reachable | 200 | culture.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-blockchain-digital-asset-free-course | official_event | medium | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-ai-teaching-innovation-free-course | official_event | medium | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| popeyes-official-event-coupon | official_event | medium | reachable | 200 | popeyes.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-public-reservation-free-experience | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-worldcup-silkworm-free-experience-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-dongdaemun-water-sports-free-class-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-hanyangdoseong-free-history-tour-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-futurelab-battlebot-free-experience-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-plant-hospital-free-care-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-ujangsan-forest-healing-free-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-seoseoul-lake-green-free-kids-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-sagajeong-forest-play-free-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| shinhancard-annual-fee-cashback-202606 | official_event | medium | reachable | 200 | shinhancard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| shinhancard-utility-autopay-cashback-202606 | official_event | medium | reachable | 200 | shinhancard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ichallenge-baby-free-trial-kit-202606 | official_event | high | reachable | 200 | m.i-challenge.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| gs25-hyeja-bread-tosspay-plusone-202606 | official_event | medium | reachable | 200 | gs25.gsretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| musinsa-online-coupon-2026 | official_event | medium | reachable | 200 | musinsa.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-art-face-emotion-free-course-202606 | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-dynamics-free-course-202606 | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-computer-graphics-free-course-202606 | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-machine-learning-free-course-202606 | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kmooc-media-literacy-free-course-202606 | public_coupon | high | reachable | 200 | kmooc.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-life-museum-ompang-free-kids-2026 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-dongdaemun-forest-family-free-2026 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-history-museum-guide-free-2026 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-baekje-kids-museum-free-exhibit-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| seoul-history-kids-museum-free-visit-2026 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hansung-baekje-conservation-family-free-202607 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| guro-picnic-garden-free-reservation-202606 | public_coupon | high | reachable | 200 | yeyak.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cjthemarket-welcome-coupon-free-shipping-2026 | official_event | high | reachable | 200 | vod.cjthemarket.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cjthemarket-random-lucky-coupon-daily-2026 | official_event | high | reachable | 200 | m.cjthemarket.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| coupang-official-benefit-coupon-center | official_event | high | reachable | 200 | coupang.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naver-official-event-hub | official_event | high | reachable | 200 | mkt.naver.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverpay-official-campaign-all | official_event | high | reachable | 200 | m-campaign.naver.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| baemin-official-free-delivery-club-event | official_event | high | reachable | 200 | event-view.baemin.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| todayhouse-official-season-promotion | official_event | medium | reachable | 200 | events.ohou.se | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| tossfeed-tosspay-official-promotion | official_event | medium | reachable | 200 | toss.im | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| sktmembership-daily-mission-point | official_event | high | guarded | 200 | m.tworld.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| sktmembership-benefit-brand-list | official_event | medium | guarded | 200 | sktmembership.tworld.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| kt-membership-daldal-benefit | official_event | high | guarded | 200 | membership.kt.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| kt-official-ongoing-event-list | official_event | medium | reachable | 200 | event.kt.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lguplus-official-ongoing-benefit-event | official_event | high | reachable | 200 | lguplus.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lguplus-benefit-plus-monthly | official_event | high | reachable | 200 | lguplus.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverpay-cafe-point-benefit | official_event | high | reachable | 200 | campaign2.naver.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cjone-signup-welcome-coupon | official_event | high | reachable | 200 | cjone.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| shinhansolpay-first-signup-point | official_event | high | reachable | 200 | shinhancard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kbpay-official-event-point-coupon | official_event | medium | reachable | 200 | m.kbcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hpoint-official-event-point-coupon | official_event | medium | reachable | 200 | h-point.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteeatz-coupon-center | official_event | high | reachable | 200 | lotteeatz.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| daisomall-signup-benefit | official_event | high | reachable | 200 | daisomall.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lghnh-official-event | official_event | high | reachable | 200 | lghnh.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| powderroom-official-campaign | official_event | high | reachable | 200 | powderroom.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteworld-official-benefit | official_event | medium | reachable | 200 | lotteworld.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| everland-official-event | official_event | medium | reachable | 200 | wwwrod.everland.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mega-mgc-official-event-list | official_event | high | reachable | 200 | mega-mgccoffee.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| payco-official-reward | official_event | high | reachable | 200 | payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| payco-official-benefit-home | official_event | medium | reachable | 200 | events.payco.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lpoint-official-event-list | official_event | high | reachable | 200 | m.lpoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| shinsegae-point-official-events | official_event | high | reachable | 200 | m.shinsegaepoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| shinsegae-point-attendance | official_event | high | reachable | 200 | m.shinsegaepoint.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| paikdabang-official-event-coupon | official_event | medium | reachable | 200 | paikdabang.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| theventi-official-event-coupon | official_event | medium | reachable | 200 | theventi.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| tomntoms-official-event-coupon | official_event | medium | guarded | 0 | tomntoms.com | 공식 feed 연결 전 브라우저/제휴 담당자 확인 필요 |
| twosome-official-event-list | official_event | high | reachable | 200 | mo.twosome.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| touslesjours-official-event-list | official_event | high | reachable | 200 | tlj.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cupost-official-event-list | official_event | high | reachable | 200 | cupost.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |

## 다음 작업

- reachable 소스는 승인 JSON/RSS feed 또는 수동 공식 페이지 매핑 후보로 유지합니다.
- guarded 소스는 브라우저 자동 수집 대신 공식 API, RSS, 제휴 feed, 담당자 승인 데이터로 연결합니다.
- stale_or_removed 소스는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 사용하지 않습니다.

