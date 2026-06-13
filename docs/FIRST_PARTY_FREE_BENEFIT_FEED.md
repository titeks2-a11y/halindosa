# First-party 무료혜택 Feed 리포트

- 생성 시각: 2026-06-13T06:09:31.446Z
- feed endpoint: `/api/feeds/free-benefits`
- 원본 스냅샷: `data/refreshedNewsDeals.json`
- 상태: 통과

## 요약

- 전체 후보: 197개
- 사용자 노출 가능: 193개
- 소비자형 노출 가능: 162개
- 공공/교육성 보관 가능: 31개
- 제외/숨김 후보: 4개
- 검색 링크 후보: 0개
- 대표/메인 URL 후보: 0개
- 만료 후보: 0개
- 중복 그룹: 0개
- 공식 링크 비율: 100%
- 평균 품질 점수: 100점

## 무료혜택 카테고리

| 카테고리 | 수량 |
| --- | ---: |
| pointCashback | 130 |
| coupon | 129 |
| firstCome | 27 |
| sample | 16 |
| everyone | 13 |
| freeTrial | 12 |
| brandEvent | 11 |
| freeShipping | 10 |
| signup | 10 |
| gifticon | 5 |
| week | 4 |
| today | 1 |

## 소비자형 카테고리

| 카테고리 | 수량 |
| --- | ---: |
| coupon | 127 |
| pointCashback | 124 |
| sample | 16 |
| firstCome | 15 |
| everyone | 13 |
| freeShipping | 10 |
| signup | 10 |
| freeTrial | 9 |
| gifticon | 5 |
| brandEvent | 4 |
| week | 1 |

## 상위 공식 도메인

| 도메인 | 수량 |
| --- | ---: |
| yeyak.seoul.go.kr | 15 |
| kmooc.kr | 7 |
| gs25.gsretail.com | 5 |
| kurly.com | 5 |
| lguplus.com | 5 |
| culture.go.kr | 4 |
| dunkindonuts.co.kr | 4 |
| okcashbag.com | 4 |
| amoremall.com | 3 |
| happypointcard.com | 3 |
| lotteeatz.com | 3 |
| megabox.co.kr | 3 |
| payco.com | 3 |
| shinhancard.com | 3 |
| starbucks.co.kr | 3 |
| tworld.co.kr | 3 |
| yogiyo.co.kr | 3 |
| 11st.co.kr | 2 |
| baskinrobbins.co.kr | 2 |
| bccard.com | 2 |

## 소비자형 공식 도메인

| 도메인 | 수량 |
| --- | ---: |
| gs25.gsretail.com | 5 |
| kurly.com | 5 |
| lguplus.com | 5 |
| dunkindonuts.co.kr | 4 |
| okcashbag.com | 4 |
| amoremall.com | 3 |
| happypointcard.com | 3 |
| lotteeatz.com | 3 |
| megabox.co.kr | 3 |
| payco.com | 3 |
| shinhancard.com | 3 |
| starbucks.co.kr | 3 |
| tworld.co.kr | 3 |
| yogiyo.co.kr | 3 |
| 11st.co.kr | 2 |
| baskinrobbins.co.kr | 2 |
| bccard.com | 2 |
| card.kbcard.com | 2 |
| cjone.com | 2 |
| company.himart.co.kr | 2 |

## 홈 상단 추천 후보

| 브랜드 | 혜택 | 유형 | 마감 | 점수 |
| --- | --- | --- | --- | ---: |
| GS25 | GS25 드링킹 페스타 1+1·다량 구매 행사 | discount | 2026-06-15 | 100 |
| 던킨 | 던킨 공식 이달의 콤보 쿠폰 혜택 | coupon | 2026-06-21 | 100 |
| 무신사 | 무신사 패션 페스타 공식 혜택 | coupon | 2026-06-30 | 100 |
| 롯데ON | 롯데ON 롭스 공식 쿠폰 이벤트 | coupon | 2026-06-30 | 100 |
| GS25 | GS25 6월 신용카드 현장 할인 혜택 | card | 2026-06-30 | 100 |
| GS25 | GS25 행사상품 공식 목록 | discount | 2026-06-30 | 100 |
| 롯데잇츠 | 롯데잇츠 공식 외식 쿠폰 혜택 | coupon | 2026-06-30 | 100 |
| 신한카드 | 신한카드 신규 고객 첫 연회비 전액 캐시백 | card | 2026-06-30 | 100 |
| 신한카드 | 신한카드 생활요금 자동납부 캐시백·경품 혜택 | card | 2026-06-30 | 100 |
| GS25 | GS25 혜자로운빵 토스페이 1+1 공식 행사 | convenienceStore | 2026-06-30 | 100 |
| 토스 | 토스 공식 토스페이 할인·적립 혜택 | point | 2026-06-30 | 100 |
| 롯데잇츠 | 롯데잇츠 공식 받을 수 있는 쿠폰 | coupon | 2026-06-30 | 100 |

## 운영 원칙

- `/api/feeds/free-benefits`는 publishable, active, validationStatus=passed, 공식 URL 중심 혜택만 내보낸다.
- 검색 결과, 커뮤니티, 블로그, 뉴스, 쇼핑몰 대표/메인 URL은 사용자 CTA에 노출하지 않는다.
- 공공/교육성 혜택은 기본 홈 상위 노출보다 명시 필터 또는 별도 카테고리에서 다룬다.
- Vercel Production에 최신 커밋이 올라간 뒤 `BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits`를 smoke/starter feed로 연결할 수 있다.

