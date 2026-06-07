# 할인도사 운영 헬스 리포트

이 문서는 상품 링크, 공식 혜택, refresh 파이프라인이 실제 출시 운영 기준을 만족하는지 요약합니다.

- 생성 시각: 2026-06-07T18:13:22.933Z
- 운영 준비 점수: 100/100
- 상태: PASS

## 핵심 지표

- 상품 특가: 140개
- 검증된 상품 링크: 140개 (100%)
- 검색 링크 노출: 0개
- 품절/종료 의심 노출: 0개
- 공식 혜택: 105개
- 공식 혜택 카테고리 커버리지: 10/10
- 공식 혜택 Provider: 4개 (feed 연결 0개)
- 공식 혜택 source mix: seed 107개 · 외부 feed 0개 · 성공 feed 0/0
- 공식 혜택 설정 feed 공백: 0개 (없음)
- 공식 feed canary: seed_fallback_only · fresh · 0.1시간 · 연결 0개 · 후보 0개
- 공식 혜택 Provider 위험도: 정상 0개 · 관찰 4개 · 즉시 점검 0개
- 공식 소스 통합 준비도: seed launch ready / 공식 feed 연결 대기
- 공식 소스 후보/노출 혜택: 95개 / 105개
- 공식 소스 차단 이슈: 0개
- 공식 혜택 리포트 신선도: 0.7시간
- refresh:all 상태: PASS
- cron refresh 상태: 수동 갱신 기준 정상 (manual_refresh_ready)

## 카테고리 커버리지

| 카테고리 | 노출 건수 | 기준 | 상태 |
| --- | ---: | ---: | --- |
| 식품/생필품 | 5 | 2 | PASS |
| 마트/편의점 | 9 | 2 | PASS |
| 디지털/가전 | 7 | 2 | PASS |
| 패션/뷰티 | 8 | 2 | PASS |
| 외식/배달 | 20 | 2 | PASS |
| 여행/숙박 | 9 | 2 | PASS |
| 영화/문화 | 11 | 2 | PASS |
| 카드/멤버십 | 19 | 2 | PASS |
| 무료혜택 | 11 | 2 | PASS |
| 정부/공공혜택 | 6 | 2 | PASS |

## 공식 혜택 Provider 상태

| Provider | Source | Feed 연결 | 수집 | 정규화 | 노출 | 숨김 | 실패 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| news | approved_news_feed | seed/fallback | 4 | 4 | 4 | 0 | 0 |
| event_news | official_event_news_feed | seed/fallback | 6 | 6 | 6 | 0 | 0 |
| official_event | official_event_page_feed | seed/fallback | 62 | 61 | 61 | 0 | 0 |
| public_coupon | public_coupon_and_culture_benefit_feed | seed/fallback | 35 | 34 | 34 | 0 | 0 |

## 공식 혜택 Provider 위험도

| Provider | 위험도 | Source | 노출 | 이슈 | 실패율 | 사유 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| news | seed 운영 | approved_news_feed | 4 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |
| event_news | seed 운영 | official_event_news_feed | 6 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |
| official_event | seed 운영 | official_event_page_feed | 61 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |
| public_coupon | seed 운영 | public_coupon_and_culture_benefit_feed | 34 | 0 | 0% | 승인된 seed/fallback으로 운영 중입니다. |

## 공식 소스 통합 준비도

- 상태: seed launch ready / 공식 feed 연결 대기 (passed)
- 공식 소스 후보: 95개
- 접근 가능/보호 소스: 82개 / 13개
- 설정된 공식 feed URL: 0개
- 공식 혜택 노출 가능: 105개
- 차단 이슈: 0개

### 공식 소스 다음 액션

- OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.
- 새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.
- 사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다.
- OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결
- PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결

## 자동 refresh cron 운영

- 상태: 수동 갱신 기준 정상 (manual_refresh_ready)
- 스케줄: 0 18 * * *
- 보호 여부: CRON_SECRET 또는 관리자 토큰 필요
- 리포트: reports/cron-refresh.json (아직 없음)
- 마지막 실행: 직접 실행 전
- 상품/뉴스 건수: 140 / 105
- 메시지: 아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 정상입니다.

## 게이트

| 게이트 | 상태 | 상세 |
| --- | --- | --- |
| product count floor | PASS | 140 verified product deals are available. |
| product verification rate | PASS | 100% product links are verified. |
| search link exposure | PASS | No search/result URLs are exposed. |
| sold out exposure | PASS | No sold-out or ended product links are exposed. |
| product hidden/failed queue | PASS | Customer exposure is clean with 140 visible deals; 0 hidden deals stay in the operator review queue. |
| official benefit count floor | PASS | 105 official benefit deals are visible. |
| official benefit category coverage | PASS | All 10 required categories have at least 2 visible benefits. |
| official benefit hidden/failed queue | PASS | No hidden, expired, non-official, or failed official benefit links are exposed. |
| official benefit freshness | PASS | Official benefit report freshness is 0.7h. |
| refresh all pipeline | PASS | refresh:all completed successfully. |
| cron refresh operations | PASS | Cron refresh status=manual_refresh_ready; report=manual refresh fallback. |
| provider stats coverage | PASS | Product providers=6, news providers=4. |
| official feed source mix counters | PASS | seed=107, feed=0, success=0/0. |
| configured empty feed watch | PASS | configured-empty=0; providers=none. |
| official feed canary | PASS | status=seed_fallback_only; freshness=fresh; age=0.1h; configured=0; visible=0. |
| provider risk gate | PASS | Official benefit providers danger=0, watch=4. |
| official source readiness gate | PASS | 95 official source candidates, 105 visible official benefits, blocking failed gates=0, advisory failed gates=0. |

## 운영 조치

- 현재 상품 링크, 공식 혜택, refresh 파이프라인 모두 출시 운영 기준을 만족합니다.
- 공식 혜택 feed가 추가되면 `data/newsFeed.sample.json` 계약을 기준으로 `npm run news:feed:doctor`를 먼저 실행하세요.
- 검색 링크, 대표몰, 커뮤니티 원문 링크, 종료 이벤트는 사용자 노출 전에 hidden 처리해야 합니다.

