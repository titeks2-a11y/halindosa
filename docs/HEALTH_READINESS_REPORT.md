# 할인도사 운영 헬스 리포트

이 문서는 상품 링크, 공식 혜택, refresh 파이프라인이 실제 출시 운영 기준을 만족하는지 요약합니다.

- 생성 시각: 2026-06-03T17:03:29.444Z
- 운영 준비 점수: 100/100
- 상태: PASS

## 핵심 지표

- 상품 특가: 140개
- 검증된 상품 링크: 140개 (100%)
- 검색 링크 노출: 0개
- 품절/종료 의심 노출: 0개
- 공식 혜택: 26개
- 공식 혜택 카테고리 커버리지: 10/10
- 공식 혜택 Provider: 4개 (feed 연결 0개)
- 공식 혜택 Provider 위험도: 정상 0개 · 관찰 4개 · 즉시 점검 0개
- 공식 혜택 리포트 신선도: 0시간
- refresh:all 상태: PASS
- cron refresh 상태: 수동 갱신 기준 정상 (manual_refresh_ready)

## 카테고리 커버리지

| 카테고리 | 노출 건수 | 기준 | 상태 |
| --- | ---: | ---: | --- |
| 식품/생필품 | 2 | 2 | PASS |
| 마트/편의점 | 6 | 2 | PASS |
| 디지털/가전 | 2 | 2 | PASS |
| 패션/뷰티 | 2 | 2 | PASS |
| 외식/배달 | 2 | 2 | PASS |
| 여행/숙박 | 2 | 2 | PASS |
| 영화/문화 | 3 | 2 | PASS |
| 카드/멤버십 | 3 | 2 | PASS |
| 무료혜택 | 2 | 2 | PASS |
| 정부/공공혜택 | 2 | 2 | PASS |

## 공식 혜택 Provider 상태

| Provider | Source | Feed 연결 | 수집 | 정규화 | 노출 | 숨김 | 실패 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| news | approved_news_feed | seed/fallback | 0 | 0 | 0 | 0 | 0 |
| event_news | official_event_news_feed | seed/fallback | 5 | 5 | 5 | 0 | 0 |
| official_event | official_event_page_feed | seed/fallback | 16 | 16 | 16 | 0 | 0 |
| public_coupon | public_coupon_and_culture_benefit_feed | seed/fallback | 5 | 5 | 5 | 0 | 0 |

## 공식 혜택 Provider 위험도

| Provider | 위험도 | Source | 노출 | 이슈 | 실패율 | 사유 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| news | 수집 대기 | approved_news_feed | 0 | 0 | 0% | 노출 가능한 공식 혜택이 아직 없습니다. |
| event_news | seed 운영 | official_event_news_feed | 5 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |
| official_event | seed 운영 | official_event_page_feed | 16 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |
| public_coupon | seed 운영 | public_coupon_and_culture_benefit_feed | 5 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |

## 자동 refresh cron 운영

- 상태: 수동 갱신 기준 정상 (manual_refresh_ready)
- 스케줄: 0 */6 * * *
- 보호 여부: CRON_SECRET 또는 관리자 토큰 필요
- 리포트: reports/cron-refresh.json (아직 없음)
- 마지막 실행: 직접 실행 전
- 상품/뉴스 건수: 140 / 26
- 메시지: 아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 정상입니다.

## 게이트

| 게이트 | 상태 | 상세 |
| --- | --- | --- |
| product count floor | PASS | 140 verified product deals are available. |
| product verification rate | PASS | 100% product links are verified. |
| search link exposure | PASS | No search/result URLs are exposed. |
| sold out exposure | PASS | No sold-out or ended product links are exposed. |
| product hidden/failed queue | PASS | No hidden or failed product deals remain in the customer exposure set. |
| official benefit count floor | PASS | 26 official benefit deals are visible. |
| official benefit category coverage | PASS | All 10 required categories have at least 2 visible benefits. |
| official benefit hidden/failed queue | PASS | No hidden, expired, non-official, or failed official benefit links are exposed. |
| official benefit freshness | PASS | Official benefit report freshness is 0h. |
| refresh all pipeline | PASS | refresh:all completed successfully. |
| cron refresh operations | PASS | Cron refresh status=manual_refresh_ready; report=manual refresh fallback. |
| provider stats coverage | PASS | Product providers=6, news providers=4. |
| provider risk gate | PASS | Official benefit providers danger=0, watch=4. |

## 운영 조치

- 현재 상품 링크, 공식 혜택, refresh 파이프라인 모두 출시 운영 기준을 만족합니다.
- 공식 혜택 feed가 추가되면 `data/newsFeed.sample.json` 계약을 기준으로 `npm run news:feed:doctor`를 먼저 실행하세요.
- 검색 링크, 대표몰, 커뮤니티 원문 링크, 종료 이벤트는 사용자 노출 전에 hidden 처리해야 합니다.

