# 공식 소스 라이브 접근성 점검

이 문서는 공식 이벤트/혜택 소스 후보의 현재 접근 상태를 non-strict 방식으로 기록합니다. 무단 크롤링을 수행하지 않으며, 보호된 페이지는 공식 API/RSS/제휴 feed 또는 수동 승인 데이터로 연결해야 합니다.

- 생성 시각: 2026-06-03T20:50:05.526Z
- 모드: non_strict_live_readiness
- 후보 소스: 21개
- 접근 가능: 13개
- 보호/권한 확인 필요: 2개
- 검토 필요: 2개
- timeout/network error: 1개
- 404/410 교체 필요: 1개
- CSV 리포트: reports/official-source-live-check.csv

## 운영 원칙

- 이 리포트는 사용자 노출 데이터를 자동으로 바꾸지 않습니다.
- 검색 결과, 커뮤니티 원문, 종료 이벤트, 보호 페이지 크롤링 결과는 상품/혜택 카드로 노출하지 않습니다.
- protected/guarded 소스는 무리하게 수집하지 않고 공식 feed 또는 제휴 담당자 제공 데이터로 연결합니다.

## 상태별 요약

| 상태 | 수 | 운영 액션 |
| --- | ---: | --- |
| reachable | 13 | 승인 feed 또는 공식 페이지 매핑 후보로 유지 |
| guarded | 2 | 공식 API/RSS/제휴 feed 확인 |
| needs_review | 2 | 최종 도메인과 응답 정책 수동 확인 |
| timeout/network_error | 1 | 재시도 또는 담당자 확인 |
| stale_or_removed | 1 | 카탈로그 URL 교체 전 사용 금지 |

## 소스별 결과

| ID | Provider | 우선순위 | 상태 | HTTP | 최종 호스트 | 운영 액션 |
| --- | --- | --- | --- | ---: | --- | --- |
| gs25-event-goods | official_event | high | reachable | 200 | gs25.gsretail.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cu-plus-event | official_event | high | server_error | 501 | cu.bgfretail.com | 일시 장애 여부를 재확인하고 노출 데이터는 기존 검증 feed만 유지 |
| ssg-event-main | official_event | high | reachable | 200 | ssg.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| emart-event-main | official_event | medium | reachable | 200 | emart.ssg.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| homeplus-event | official_event | medium | reachable | 200 | front.homeplus.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| yogiyo-event | event_news | high | reachable | 200 | yogiyo.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| bhc-ecoupon | official_event | medium | reachable | 200 | bhc.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| cgv-events | public_coupon | medium | guarded | 403 | cgv.co.kr | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| lottecinema-events | public_coupon | medium | reachable | 200 | lottecinema.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| culture-day | public_coupon | high | reachable | 200 | culture.go.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| mnuri-benefit | public_coupon | high | reachable | 200 | mnuri.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| naverpay-benefit | official_event | high | needs_review | 200 | nid.naver.com | 최종 도메인이 공식 운영 도메인인지 확인 후 allowlist에 반영 |
| kbcard-events | official_event | medium | reachable | 200 | card.kbcard.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| bccard-events | official_event | medium | server_error | 501 | bccard.com | 일시 장애 여부를 재확인하고 노출 데이터는 기존 검증 feed만 유지 |
| tworld-membership | official_event | medium | reachable | 200 | tworld.co.kr | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| koreanair-promotion | event_news | medium | timeout | 0 | koreanair.com | 공식 feed 연결 전 브라우저/제휴 담당자 확인 필요 |
| jejuair-events | official_event | high | guarded | 403 | jejuair.net | 무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용 |
| samsung-shop-event | official_event | medium | reachable | 200 | samsung.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |
| himart-events | official_event | medium | stale_or_removed | 404 | e-himart.co.kr | 카탈로그 URL을 최신 공식 이벤트/혜택 URL로 교체 |
| hmall-official-events | news | medium | needs_review | 200 | hmall.com | 최종 도메인이 공식 운영 도메인인지 확인 후 allowlist에 반영 |
| musinsa-fashion-festa | official_event | medium | reachable | 200 | musinsa.com | 승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결 |

## 다음 작업

- reachable 소스는 승인 JSON/RSS feed 또는 수동 공식 페이지 매핑 후보로 유지합니다.
- guarded 소스는 브라우저 자동 수집 대신 공식 API, RSS, 제휴 feed, 담당자 승인 데이터로 연결합니다.
- stale_or_removed 소스는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 사용하지 않습니다.

