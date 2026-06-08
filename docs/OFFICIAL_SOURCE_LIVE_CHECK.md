# 공식 소스 라이브 접근성 점검

이 문서는 공식 이벤트/혜택 소스 후보의 현재 접근 상태를 non-strict 방식으로 기록합니다. 무단 크롤링을 수행하지 않으며, 보호된 페이지는 공식 API/RSS/제휴 feed 또는 수동 승인 데이터로 연결해야 합니다.

- 생성 시각: 2026-06-08T21:15:39.676Z
- 모드: non_strict_live_readiness
- 후보 소스: 95개
- 접근 가능: 82개
- 보호/권한 확인 필요: 13개
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
| reachable | 82 | 승인 feed 또는 공식 페이지 매핑 후보로 유지 |
| guarded | 13 | 공식 API/RSS/제휴 feed 확인 |
| needs_review | 0 | 최종 도메인과 응답 정책 수동 확인 |
| timeout/network_error | 0 | 재시도 또는 담당자 확인 |
| stale_or_removed | 0 | 카탈로그 URL 교체 전 사용 금지 |

## 소스별 결과

| ID | Provider | 우선순위 | 상태 | HTTP | 최종 호스트 | 운영 액션 |
| --- | --- | --- | --- | ---: | --- | --- |
| gs25-event-goods | official_event | high | reachable | 200 | gs25.gsretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cu-plus-event | official_event | high | reachable | 200 | cu.bgfretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
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
| lotteon-lobs-share-event | official_event | medium | reachable | 200 | lotteon.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kfc-delivery-free | official_event | high | reachable | 200 | kfckorea.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lotteeatz-monthly-coupon | official_event | high | reachable | 200 | lotteeatz.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| krispykreme-wednesday-event | official_event | medium | reachable | 200 | lotteeatz.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| baskinrobbins-events | official_event | medium | reachable | 200 | baskinrobbins.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| happypoint-alliance-benefits | public_coupon | high | reachable | 200 | happypointcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| happypoint-mobile-coupon | public_coupon | medium | reachable | 200 | happypointcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-event-benefits | public_coupon | high | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| okcashbag-brand-events | public_coupon | medium | reachable | 200 | okcashbag.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| parisbaguette-promotion | official_event | medium | reachable | 200 | paris.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mcdonalds-happy-snack-free-drink | public_coupon | high | reachable | 200 | mcdonalds.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kfc-new-member-coupon-benefit | public_coupon | high | reachable | 200 | kfckorea.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| dominos-official-discount-benefits | official_event | high | reachable | 200 | web.dominos.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| pizzahut-member-free-coupon-benefit | public_coupon | high | guarded | 200 | pizzahut.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| starbucks-rewards-official-benefit | public_coupon | high | reachable | 200 | starbucks.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| megabox-membership-official-benefit | public_coupon | medium | guarded | 200 | megabox.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| megabox-vip-lounge-official-benefit | public_coupon | medium | reachable | 200 | megabox.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lottecinema-lpoint-membership-benefit | public_coupon | medium | guarded | 200 | lottecinema.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsung-members-official-benefit | official_event | medium | guarded | 200 | samsung.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| homeplus-membership-official-coupon | official_event | medium | guarded | 200 | front.homeplus.co.kr | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| bccard-benefit-official-center | public_coupon | medium | reachable | 200 | bccard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cu-plus-official-monthly-benefit | official_event | high | reachable | 200 | cu.bgfretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| ediya-official-event-coupon | public_coupon | medium | reachable | 200 | ediya.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverplus-membership-official-benefit | public_coupon | medium | guarded | 200 | nid.naver.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsungcard-official-event-benefit | public_coupon | medium | reachable | 200 | samsungcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| lottecard-official-event-benefit | public_coupon | medium | reachable | 200 | lottecard.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| hanacard-official-event-benefit | public_coupon | medium | reachable | 200 | hanacard.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| kt-membership-official-benefit | public_coupon | medium | guarded | 200 | membership.kt.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| uplus-membership-official-benefit | public_coupon | medium | guarded | 200 | lguplus.com | 로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| seoul-culture-official-free-events | public_coupon | high | reachable | 200 | culture.seoul.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
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
| work24-employment-support | public_coupon | medium | reachable | 200 | work24.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
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

## 다음 작업

- reachable 소스는 승인 JSON/RSS feed 또는 수동 공식 페이지 매핑 후보로 유지합니다.
- guarded 소스는 브라우저 자동 수집 대신 공식 API, RSS, 제휴 feed, 담당자 승인 데이터로 연결합니다.
- stale_or_removed 소스는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 사용하지 않습니다.

