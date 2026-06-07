# 공식 혜택 알림 후보 리포트

공식 이벤트·쿠폰·공공혜택을 실제 푸시 발송 전에 검수하기 위한 운영 리포트입니다. 비회원도 보는 인앱 알림 후보를 기준으로 하며, 실제 푸시는 별도 동의 후에만 연결합니다.

## 요약

- 생성 시각: 2026-06-07T16:21:38.547Z
- 원본 스냅샷: 2026-06-07T16:20:42.004Z
- 전체 공식 혜택: 105개
- 알림 후보 가능 혜택: 105개
- 기본 추천 후보: 8개
- 최근 본 혜택 시나리오 후보: 8개
- 공식 출처 host: 76개
- 상태: PASS

## 기본 관심 카테고리 커버리지

| 관심 카테고리 | 후보 수 | 샘플 |
| --- | ---: | --- |
| 무료/체험 | 28 | 맥도날드 해피 스낵 무료 음료 혜택<br>이번 주 문화가 있는 날 프로그램<br>문화가 있는 날 매주 수요일 문화 혜택 |
| 쿠폰/이벤트 | 102 | GS25 드링킹 페스타 1+1·다량 구매 행사<br>던킨 공식 이달의 콤보 쿠폰 혜택<br>맥도날드 해피 스낵 무료 음료 혜택 |
| 마트/편의점 | 12 | GS25 드링킹 페스타 1+1·다량 구매 행사<br>GS25 6월 신용카드 현장 할인 혜택<br>GS25 행사상품 공식 목록 |
| 영화/문화 | 11 | 이번 주 문화가 있는 날 프로그램<br>CGV 공식 이벤트·쿠폰 혜택<br>롯데시네마 공식 이벤트 혜택 |

## 알림 후보 Top

| 혜택 | 출처 | 카테고리 | 이동 경로 | 이유 |
| --- | --- | --- | --- | --- |
| 컬리 이스케이프 P6 Air 무료배송 쿠폰 특가 | 컬리 공식 상품 상세 | 디지털/가전 | `/go/news/news-kurly-escape-speaker-free-shipping` | 무료/체험 관심 알림과 맞는 공식 혜택입니다. |
| 메가박스 VIP 라운지 공식 영화 쿠폰 혜택 | 메가박스 VIP 라운지 | 무료혜택 | `/go/news/news-megabox-vip-lounge-official-benefit` | 무료/체험 관심 알림과 맞는 공식 혜택입니다. |
| KFC 신규 회원 공식 쿠폰 3종 혜택 | KFC 공식 프로모션 | 무료혜택 | `/go/news/news-kfc-new-member-coupon-benefit` | 무료/체험 관심 알림과 맞는 공식 혜택입니다. |
| 스타벅스 리워드 공식 무료 쿠폰·별 적립 혜택 | 스타벅스 리워드 공식 안내 | 무료혜택 | `/go/news/news-starbucks-rewards-official-benefit` | 무료/체험 관심 알림과 맞는 공식 혜택입니다. |
| 컬리 클로브 브이넥 니트 무료배송 쿠폰 특가 | 컬리 공식 상품 상세 | 패션/뷰티 | `/go/news/news-kurly-clove-fashion-free-shipping` | 무료/체험 관심 알림과 맞는 공식 혜택입니다. |
| 던킨 공식 이달의 콤보 쿠폰 혜택 | 던킨 공식 이벤트 | 외식/배달 | `/go/news/news-dunkin-monthly-combo-coupon` | 쿠폰/이벤트 관심 알림과 맞는 공식 혜택입니다. |
| 무신사 패션 페스타 공식 혜택 | 무신사 공식 캠페인 | 패션/뷰티 | `/go/news/news-musinsa-fashion-festa` | 쿠폰/이벤트 관심 알림과 맞는 공식 혜택입니다. |
| 롯데ON 롭스 공식 쿠폰 이벤트 | 롯데ON 공식 이벤트 | 패션/뷰티 | `/go/news/news-lotteon-lohbs-coupon` | 쿠폰/이벤트 관심 알림과 맞는 공식 혜택입니다. |

## 회귀 방지 샘플

- 상태: PASS
- 합성 후보 수: 7개
- 후보 유지: regression-invalid-date, regression-official-active
- 후보 차단: regression-search-link, regression-unsafe-url, regression-expired, regression-hidden, regression-sold-out
- 내부 이동 경로 기준: `/go/news/`

| 검사 | 상태 | 내용 |
| --- | --- | --- |
| accept-official-active | PASS | 활성 공식 혜택과 종료일 형식 이상 공식 혜택은 오류 없이 후보에 남습니다. |
| reject-search-link | PASS | 검색 결과 URL은 linkType=search로 후보에서 제외합니다. |
| reject-unsafe-url | PASS | http/https가 아닌 URL은 후보에서 제외합니다. |
| reject-expired-hidden-sold-out | PASS | 종료, 숨김, 판매 중단 혜택은 후보에서 제외합니다. |
| redirect-and-metadata | PASS | 후보는 내부 redirect 경로, 공식 host, 관심 카테고리 매칭 정보를 유지합니다. |

검색 링크, unsafe URL, 종료·숨김·판매 중단 혜택은 알림 후보에서 제외하고, 날짜 형식 이상값은 점수 계산을 깨지 않는지 매번 확인합니다.

## 운영 기준

- 알림 후보는 `validationStatus=passed`, `availability=active`, `isHidden=false`, `linkType=official*`, `finalUrl=http(s)` 조건을 통과해야 합니다.
- 사용자 이동은 외부 URL을 직접 노출하지 않고 `/go/news/[id]`를 거칩니다.
- 검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 공식 혜택 알림 후보에서 제외합니다.
- 알림 발송 전에는 `npm run official:alerts:report`와 `/api/benefits/official-alerts` 결과를 함께 확인합니다.

## 이슈

- Critical 이슈 없음

