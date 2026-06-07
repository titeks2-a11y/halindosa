# Push Readiness Report

할인도사의 실제 FCM 발송 전 준비 상태를 파일로 남기는 운영 리포트입니다. V1은 사용자 권한 요청 없이 앱 안의 알림 큐와 dry-run을 먼저 운영합니다.

- 생성 시각: 2026-06-07T20:07:56.543Z
- 상태: dry_run_ready
- 준비도: 100/100
- 검증 상품 후보: 140
- 공식 혜택 후보: 105
- 캠페인 후보: 9/9
- 큐 후보 행: 46
- 관심 세그먼트: 14/14
- FCM 설정: dry-run only

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| verified product base | PASS | 전체 감사 상품 140개, 고객 노출 가능 상품 140개를 알림 후보로 사용할 수 있습니다. |
| official benefit base | PASS | 공식 혜택 70개 이상을 알림 후보로 사용할 수 있습니다. |
| interest segment coverage | PASS | 14/14 관심 세그먼트가 알림 후보를 가집니다. |
| push queue candidate rows | PASS | 46개 dry-run 큐 후보가 있습니다. |
| database schema | PASS | push_subscriptions, push_notification_queue, price_drop_alerts와 RLS가 준비됐습니다. |
| readiness model | PASS | 동의/철회, 세그먼트, 큐, DB 테이블 준비도 모델이 있습니다. |
| campaign queue builder | PASS | 상품 특가와 공식 혜택 알림 캠페인 큐 빌더가 있습니다. |
| safe send adapter | PASS | FCM 발송은 환경변수와 dry-run 기준으로 보호됩니다. |
| admin operation | PASS | 관리자 API와 화면에서 준비도와 dry-run을 확인할 수 있습니다. |
| runbook | PASS | 운영 runbook에 push readiness와 큐 처리 기준이 있습니다. |

## Campaign Rows

| Campaign | Source | Alert | Priority | Rows | Status |
| --- | --- | --- | --- | ---: | --- |
| 신규 특가 | product_deal | deal_registered | medium | 5 | dry_run_ready |
| 무료·쿠폰 혜택 | product_deal | free_event | high | 5 | dry_run_ready |
| 가격 인하 | product_deal | price_drop | high | 5 | dry_run_ready |
| 마감 임박 | product_deal | ending_soon | critical | 5 | dry_run_ready |
| 관심 카테고리 | product_deal | interest_category | medium | 6 | dry_run_ready |
| 공식 무료·쿠폰 혜택 | official_benefit | free_event | high | 5 | dry_run_ready |
| 카드·멤버십 공식 혜택 | official_benefit | interest_category | medium | 5 | dry_run_ready |
| 문화·공공 공식 혜택 | official_benefit | free_event | medium | 5 | dry_run_ready |
| 마트·편의점 공식 혜택 | official_benefit | ending_soon | critical | 5 | dry_run_ready |

## Segment Coverage

| Segment | Rows | Campaigns | Sample | Action |
| --- | ---: | ---: | --- | --- |
| 무료/체험 | 10 | 2 | 삼성 86인치 4K 스마트 UHD TV, 맥도날드 해피 스낵 무료 음료 혜택 | 무료/체험 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 쿠폰/이벤트 | 10 | 2 | 신라면+너구리+짜파게티+오징어짬뽕 총 20봉, GS25 드링킹 페스타 1+1·다량 구매 행사 | 쿠폰/이벤트 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 식품 | 10 | 2 | 새우깡 8봉 + 매운새우깡 8봉, GS25 드링킹 페스타 1+1·다량 구매 행사 | 식품 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 생활용품 | 10 | 2 | 베네베딩 여름 냉감 침대 패드, SSG닷컴 공식 장보기·생활 행사 | 생활용품 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 마트/편의점 | 10 | 2 | 삼성 86인치 4K 스마트 UHD TV, GS25 드링킹 페스타 1+1·다량 구매 행사 | 마트/편의점 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 외식/배달 | 10 | 2 | T멤버십 커피 무료 사이즈업 쿠폰, 던킨 공식 이달의 콤보 쿠폰 혜택 | 외식/배달 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 디지털 | 10 | 2 | 삼성 86인치 4K 스마트 UHD TV, 삼성닷컴 공식 기획전·카드 혜택 | 디지털 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 패션 | 10 | 2 | 아이더 POP ON 남성 여름 냉감 폴로 티셔츠, 무신사 패션 페스타 공식 혜택 | 패션 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 뷰티 | 10 | 2 | JMW 에이플로 온도 센서 플라즈마 미니 드라이기, 무신사 패션 페스타 공식 혜택 | 뷰티 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 육아 | 5 | 1 | 군 기저귀 프리미엄 밴드 대형 36P 4팩 | 육아 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 여행 | 10 | 2 | [제주] 제주투어패스 타임제로 자유이용권, 대한항공 탑승권 제휴 할인 혜택 | 여행 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 영화/문화 | 9 | 2 | 메가박스 공식 영화·문화 이벤트, 이번 주 문화가 있는 날 프로그램 | 영화/문화 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 카드/멤버십 | 10 | 2 | 프리미엄 한우 불고기 600g, GS25 6월 신용카드 현장 할인 혜택 | 카드/멤버십 관심 세그먼트는 현재 알림 후보로 커버됩니다. |
| 정부/공공혜택 | 5 | 1 | 문화가 있는 날 매주 수요일 문화 혜택 | 정부/공공혜택 관심 세그먼트는 현재 알림 후보로 커버됩니다. |

## Next Actions

- FCM 키 설정 전까지는 앱 내 알림 큐와 dry-run만 운영
- 관심 카테고리 세그먼트 커버리지 유지
- 알림 권한 요청은 사용자가 찜, 가격 알림, 관심 카테고리를 저장한 뒤 명시 동의 플로우에서만 노출

