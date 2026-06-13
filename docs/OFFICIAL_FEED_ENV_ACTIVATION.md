# 공식 무료혜택 Feed Env 연결 가이드

- 생성 시각: 2026-06-13T12:04:51.786Z
- 템플릿 파일: `.env.official-feeds.example`
- 관리자 확인: `/admin`의 Feed Activation 패널

## 가장 먼저 할 일

1. `BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits`로 canary 연결을 먼저 확인합니다.
2. 브랜드/파트너와 승인된 JSON/RSS/Atom/API feed를 확보합니다.
3. 아래 우선순위 env key에 승인 endpoint를 넣습니다.
4. `npm run source:feed-env:doctor`, `npm run news:feed:canary`, `npm run refresh:benefits`, `npm run test:home-realtime` 순서로 확인합니다.

## 금지

- 공식 이벤트 HTML 페이지를 env feed 값으로 그대로 넣지 마세요. env에는 JSON/RSS/Atom/API feed만 넣습니다.
- 검색 결과, 커뮤니티, 블로그, 대표몰 메인, 로그인 없이는 내용이 없는 URL은 feed-env doctor에서 차단되어야 합니다.
- 운영 feed가 없을 때는 first-party canary line으로 파이프라인 연결만 검증하고, 실제 성장 전환은 승인 feed를 별도로 연결합니다.

## Env 우선순위

| 우선순위 | env key | 용도 | 상위 후보 | 예시 형식 |
| ---: | --- | --- | --- | --- |
| 1 | `BENEFIT_REFRESH_FEED_URLS` | 전체 무료혜택 승인 feed | NH농협카드 공식 진행 이벤트<br>롯데카드 공식 이벤트<br>이니스프리 공식 이벤트·쿠폰 혜택 | `https://approved-feed.example/benefit-refresh-feed-urls.json` |
| 2 | `OFFICIAL_EVENT_FEED_URLS` | 공식 이벤트 feed | 이니스프리 공식 이벤트·쿠폰 혜택<br>CJ ONE 공식 신규가입 축하 쿠폰<br>KFC 공식 신규 회원 쿠폰 혜택 | `https://approved-feed.example/official-event-feed-urls.json` |
| 3 | `PUBLIC_COUPON_FEED_URLS` | 쿠폰·멤버십 feed | NH농협카드 공식 진행 이벤트<br>롯데카드 공식 이벤트<br>이니스프리 공식 이벤트·쿠폰 혜택 | `https://approved-feed.example/public-coupon-feed-urls.json` |
| 4 | `BEAUTY_SAMPLE_FEED_URLS` | 뷰티 샘플·무료체험 feed | 이니스프리 공식 이벤트·쿠폰 혜택<br>마몽드 공식 이벤트·체험 혜택 | `https://approved-feed.example/beauty-sample-feed-urls.json` |
| 5 | `CONVENIENCE_BENEFIT_FEED_URLS` | 편의점·마트 feed | CU편의점택배 공식 진행 이벤트<br>CU 공식 1+1·2+1 행사상품<br>이마트24 공식 행사상품 혜택 | `https://approved-feed.example/convenience-benefit-feed-urls.json` |
| 6 | `PAY_POINT_BENEFIT_FEED_URLS` | 페이·포인트·캐시백 feed | NH농협카드 공식 진행 이벤트<br>롯데카드 공식 이벤트<br>CJ ONE 공식 득템프 이벤트 | `https://approved-feed.example/pay-point-benefit-feed-urls.json` |
| 7 | `CAFE_FRANCHISE_COUPON_FEED_URLS` | 카페·외식 쿠폰 feed | 롯데잇츠 공식 이벤트·쿠폰<br>도미노피자 공식 이벤트·제휴<br>버거킹 공식 진행 이벤트·쿠폰 | `https://approved-feed.example/cafe-franchise-coupon-feed-urls.json` |
| 8 | `TELECOM_MEMBERSHIP_FEED_URLS` | 통신사 멤버십 feed | LG U+ 공식 멤버십 제휴사 혜택<br>SKT T멤버십 공식 할인·무료 혜택<br>KT 공식 요고 모바일 가입 혜택 | `https://approved-feed.example/telecom-membership-feed-urls.json` |
| 9 | `SIGNUP_GIFT_FEED_URLS` | 신규가입 혜택 feed | CJ ONE 공식 신규가입 축하 쿠폰<br>맘큐 공식 신규회원 웰컴혜택<br>CU편의점택배 공식 진행 이벤트 | `https://approved-feed.example/signup-gift-feed-urls.json` |
| 10 | `PET_SAMPLE_FEED_URLS` | 반려동물 샘플 feed | 퓨리나 공식 반려동물 이벤트 목록<br>네츄럴코어 공식 이벤트 게시판<br>하림펫푸드 공식 EVENT 게시판 | `https://approved-feed.example/pet-sample-feed-urls.json` |

## 운영 검증 명령

```bash
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:benefits
npm run verify:benefits
npm run test:home-realtime
npm run smoke:local
npm run release:doctor
```
