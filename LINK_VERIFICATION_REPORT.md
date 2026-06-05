# 할인도사 Link Verification Report

Generated: 2026-06-05T15:38:47.612Z

## Summary

| Metric | Value |
| --- | ---: |
| 총 상품 수 | 140 |
| 검증 대상 수 | 140 |
| 직접 링크 통과 수 | 139 |
| 노출 가능 상품 수 | 139 |
| 최종 발행 가능 상품 수 | 139 |
| 제외 상품 수 | 1 |
| 실패 이슈 수 | 1 |
| 상품 상세 URL | 110 |
| 공식 혜택/이벤트 URL | 30 |
| 검색/카테고리 의심 | 0 |
| 품절/종료 의심 | 0 |
| 메인/홈 링크 의심 | 0 |
| 커뮤니티 의심 | 0 |
| 수동 검토 필요 | 0 |
| Live probe 확인 | 140 |
| Live probe 실패 | 80 |
| Live probe robots/access 차단 | 63 |
| Live probe rate limit | 13 |
| Live probe timeout | 0 |
| Live probe exposed hard failure | 0 |
| Live probe hidden hard failure review | 1 |
| Live probe transient network | 3 |
| Live body 확인 | 136 |
| Live 제목/메타 확인 | 132 |
| Live 콘텐츠 일치 신호 | 55 |
| Live 콘텐츠 불일치 신호 | 81 |
| Live 접근 가능 본문 불일치 | 5 |
| Live 접근 차단 본문 | 32 |
| Live 가격 신호 | 26 |
| Live 구매/신청 버튼 신호 | 14 |
| Live 종료 문구 재검토 신호 | 0 |
| 출시 게이트 통과 | YES |
| 노출 검색 링크 | 0 |
| 노출 품절/종료 링크 | 0 |
| 노출 깨진 링크 | 0 |
| 노출 invalid URL | 0 |
| 노출 publishable=false | 0 |

## Live Probe Review

- 상태: needs_review
- 해석: Some URLs returned hard failure signals and should be reviewed before launch.
- 고객에게 노출되는 404/410/5xx/품절 본문 같은 강한 실패 신호: 0
- 숨김 처리 후 보정 큐에 남은 강한 실패 신호: 1
- timeout/request_failed 같은 일시 네트워크 신호: 3
- 쇼핑몰 접근 보호 또는 robots/access 차단: 63
- 품절/판매종료 본문 감지: 0

## Verification Evidence

- live_content_confirmed: 55
- seller_access_protected_manual_verified: 32
- manual_pattern_verified: 31
- seller_rate_limited_manual_verified: 13
- client_rendered_detail_manual_verified: 5
- transient_network_manual_verified: 3
- blocked: 1

## Revalidation Queue

- d043 · 알리익스프레스 · live_http_502 · priority 100
- d051 · 인터파크투어 · request_failed · priority 75
- d057 · T멤버십 · request_failed · priority 75
- d073 · 현대카드 · request_failed · priority 75
- d008 · LF몰 · client_rendered_detail_periodic_review · priority 60
- d013 · 하이마트 · client_rendered_detail_periodic_review · priority 60
- d058 · 맥도날드 · client_rendered_detail_periodic_review · priority 60
- d063 · 홈플러스 · client_rendered_detail_periodic_review · priority 60
- d084 · 하이마트 · client_rendered_detail_periodic_review · priority 60
- d011 · SSG닷컴 · seller_rate_limited_review · priority 55
- d024 · SSG닷컴 · seller_rate_limited_review · priority 55
- d029 · SSG닷컴 · seller_rate_limited_review · priority 55
- d032 · SSG닷컴 · seller_rate_limited_review · priority 55
- d041 · 이마트몰 · seller_rate_limited_review · priority 55
- d045 · SSG닷컴 · seller_rate_limited_review · priority 55
- d052 · SSG닷컴 · seller_rate_limited_review · priority 55
- d093 · SSG닷컴 · seller_rate_limited_review · priority 55
- d099 · SSG닷컴 · seller_rate_limited_review · priority 55
- d125 · SSG닷컴 · seller_rate_limited_review · priority 55
- d129 · SSG닷컴 · seller_rate_limited_review · priority 55
- d134 · SSG닷컴 · seller_rate_limited_review · priority 55
- d138 · SSG닷컴 · seller_rate_limited_review · priority 55
- d002 · 지마켓 · seller_access_protected_review · priority 45
- d003 · g마켓 · seller_access_protected_review · priority 45
- d004 · 쿠팡 · seller_access_protected_review · priority 45
- d006 · 쿠팡 · seller_access_protected_review · priority 45
- d007 · 토스 · seller_access_protected_review · priority 45
- d009 · 지마켓 · seller_access_protected_review · priority 45
- d010 · 쿠팡 · seller_access_protected_review · priority 45
- d012 · 올리브영 · seller_access_protected_review · priority 45

### Live Probe Failure Reasons

- robots_or_access_blocked: 63
- http_429: 13
- request_failed: 3
- http_502: 1

### Live Probe Failed Hosts

- item.gmarket.co.kr: 30
- coupang.com: 24
- ssg.com: 13
- oliveyoung.co.kr: 7
- aliexpress.com: 1
- hyundaicard.com: 1
- itempage3.auction.co.kr: 1
- store.ohou.se: 1
- tmembership.co.kr: 1
- tour.interpark.com: 1

## Excluded Reasons

- 없음

## Domain Distribution

- item.gmarket.co.kr: 30
- coupang.com: 24
- ssg.com: 14
- 11st.co.kr: 9
- oliveyoung.co.kr: 7
- e-himart.co.kr: 5
- musinsa.com: 5
- kurly.com: 3
- kakaopay.com: 2
- m.gsshop.com: 2
- mega-mgccoffee.com: 2
- 7-eleven.co.kr: 1
- aliexpress.com: 1
- amoremall.com: 1
- bccard.com: 1
- benebedding.com: 1
- bhc.co.kr: 1
- card.pay.naver.com: 1
- cjone.com: 1
- cu.bgfretail.com: 1
- emart.ssg.com: 1
- front.homeplus.co.kr: 1
- gift.kakao.com: 1
- gs25.gsretail.com: 1
- hyundaicard.com: 1
- ipraves.co.kr: 1
- itempage3.auction.co.kr: 1
- korailtravel.com: 1
- lfmall.co.kr: 1
- lottecinema.co.kr: 1

## Issues

- 링크 검증 이슈 없음
