# 공식 소스 온보딩 우선순위

- 생성 시각: 2026-06-10T19:46:55.391Z
- 공식 소스 후보: 212개
- 접근 가능: 186개
- 보호/권한 확인 필요: 26개
- 차단 live 이슈: 0개
- 관찰 live 이슈: 0개
- feed 설정 완료 소스: 0개

## 운영 원칙

- 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 운영 feed로 연결합니다.
- 검색 결과, 커뮤니티 원문, 블로그 글, 쇼핑몰 메인 페이지는 사용자 finalUrl로 쓰지 않습니다.
- guarded 소스는 무단 크롤링하지 않고 공식 제휴 또는 수동 승인 매핑으로만 운영합니다.

## 다음 연결 우선순위 TOP 10

| 순위 | 소스 | Provider | 상태 | 점수 | 다음 액션 |
| --- | --- | --- | --- | ---: | --- |
| 1 | CJ ONE 공식 신규가입 축하 쿠폰 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 BENEFIT_REFRESH_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 2 | 도미노피자 공식 할인 및 제휴 혜택 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 DEAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 3 | 해피포인트 공식 쿠폰·모바일 혜택 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 PUBLIC_COUPON_FEED_URLS 또는 BENEFIT_REFRESH_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 4 | 해피포인트 공식 제휴 할인 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 5 | KFC 공식 신규 회원 쿠폰 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 6 | LG U+ 공식 유플투쁠 월간 혜택 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 BENEFIT_REFRESH_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 7 | LG U+ 공식 멤버십 제휴사 혜택 | official_event | request_partner_or_api | 90 | 보호 페이지를 자동 수집하지 말고 공식 API/RSS/제휴 담당자 승인 feed 요청 |
| 8 | L.POINT 공식 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 9 | 네이버페이 카페 현장결제 포인트 혜택 | official_event | connect_official_feed | 90 | OFFICIAL_EVENT_FEED_URLS 또는 BENEFIT_REFRESH_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |
| 10 | OK캐쉬백 공식 이벤트 혜택 | public_coupon | connect_official_feed | 90 | PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결 |

## 환경변수 연결 템플릿

운영자는 아래 env key별로 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 연결합니다. 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.

| Env key | 후보 | 접근 가능 | 보호/승인 필요 | 대표 후보 |
| --- | ---: | ---: | ---: | --- |
| OFFICIAL_EVENT_FEED_URLS | 178 | 157 | 21 | CJ ONE 공식 신규가입 축하 쿠폰 / 도미노피자 공식 할인 및 제휴 혜택 / 해피포인트 공식 쿠폰·모바일 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 |
| PUBLIC_COUPON_FEED_URLS | 132 | 115 | 17 | 해피포인트 공식 쿠폰·모바일 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / LG U+ 공식 멤버십 제휴사 혜택 / L.POINT 공식 혜택 |
| BENEFIT_REFRESH_FEED_URLS | 121 | 108 | 13 | CJ ONE 공식 신규가입 축하 쿠폰 / 해피포인트 공식 쿠폰·모바일 혜택 / LG U+ 공식 유플투쁠 월간 혜택 / LG U+ 공식 멤버십 제휴사 혜택 / 네이버페이 카페 현장결제 포인트 혜택 |
| DEAL_EVENT_FEED_URLS | 38 | 33 | 5 | 도미노피자 공식 할인 및 제휴 혜택 / CU 공식 1+1·2+1 행사상품 / 이마트24 공식 이벤트·행사 / GS25 행사상품과 카드 할인 / LG전자 공식 혜택·이벤트 허브 |
| DEAL_EVENT_NEWS_FEED_URLS | 15 | 14 | 1 | KFC 공식 딜리버리 무료배송 혜택 / 롯데잇츠 공식 월간 쿠폰 혜택 / 요기요 배달 쿠폰 이벤트 / 던킨 공식 프로모션 목록 / 파스쿠찌 공식 이벤트·제휴 혜택 |
| DEAL_NEWS_FEED_URLS | 11 | 7 | 4 | 문화가 있는 날 공식 혜택 / 복지로 공식 복지서비스·신청 혜택 / 한국관광공사 공식 여행 혜택 / 고용24 직업훈련·국민내일배움카드 공식 지원 / BC카드 공식 혜택 안내 |

```env
# 할인도사 공식 혜택 feed 연결 템플릿
# 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 입력하세요.
# 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.
# 여러 URL은 줄바꿈, 쉼표, 세미콜론, JSON 배열 형식 중 하나로 관리할 수 있습니다.

# OFFICIAL_EVENT_FEED_URLS
# 후보 178개 · 접근 가능 157개 · 보호/승인 필요 21개
# 대표 후보: CJ ONE 공식 신규가입 축하 쿠폰 / 도미노피자 공식 할인 및 제휴 혜택 / 해피포인트 공식 쿠폰·모바일 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택
OFFICIAL_EVENT_FEED_URLS=

# PUBLIC_COUPON_FEED_URLS
# 후보 132개 · 접근 가능 115개 · 보호/승인 필요 17개
# 대표 후보: 해피포인트 공식 쿠폰·모바일 혜택 / 해피포인트 공식 제휴 할인 혜택 / KFC 공식 신규 회원 쿠폰 혜택 / LG U+ 공식 멤버십 제휴사 혜택 / L.POINT 공식 혜택
PUBLIC_COUPON_FEED_URLS=

# BENEFIT_REFRESH_FEED_URLS
# 후보 121개 · 접근 가능 108개 · 보호/승인 필요 13개
# 대표 후보: CJ ONE 공식 신규가입 축하 쿠폰 / 해피포인트 공식 쿠폰·모바일 혜택 / LG U+ 공식 유플투쁠 월간 혜택 / LG U+ 공식 멤버십 제휴사 혜택 / 네이버페이 카페 현장결제 포인트 혜택
BENEFIT_REFRESH_FEED_URLS=

# DEAL_EVENT_FEED_URLS
# 후보 38개 · 접근 가능 33개 · 보호/승인 필요 5개
# 대표 후보: 도미노피자 공식 할인 및 제휴 혜택 / CU 공식 1+1·2+1 행사상품 / 이마트24 공식 이벤트·행사 / GS25 행사상품과 카드 할인 / LG전자 공식 혜택·이벤트 허브
DEAL_EVENT_FEED_URLS=

# DEAL_EVENT_NEWS_FEED_URLS
# 후보 15개 · 접근 가능 14개 · 보호/승인 필요 1개
# 대표 후보: KFC 공식 딜리버리 무료배송 혜택 / 롯데잇츠 공식 월간 쿠폰 혜택 / 요기요 배달 쿠폰 이벤트 / 던킨 공식 프로모션 목록 / 파스쿠찌 공식 이벤트·제휴 혜택
DEAL_EVENT_NEWS_FEED_URLS=

# DEAL_NEWS_FEED_URLS
# 후보 11개 · 접근 가능 7개 · 보호/승인 필요 4개
# 대표 후보: 문화가 있는 날 공식 혜택 / 복지로 공식 복지서비스·신청 혜택 / 한국관광공사 공식 여행 혜택 / 고용24 직업훈련·국민내일배움카드 공식 지원 / BC카드 공식 혜택 안내
DEAL_NEWS_FEED_URLS=

```

## 운영 시작 묶음

무료혜택, 쿠폰, 편의점/마트, 여행/문화처럼 사용자가 매일 확인할 이유가 큰 영역부터 공식 feed를 연결합니다.

| 묶음 | 후보 | 접근 가능 | 보호/승인 필요 | 우선 env | 다음 액션 |
| --- | ---: | ---: | ---: | --- | --- |
| 무료혜택·0원딜 우선 연결 | 8 | 7 | 1 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | PUBLIC_COUPON_FEED_URLS부터 공식 JSON/RSS/Atom 또는 승인 파트너 feed 연결 |
| 쿠폰·브랜드 이벤트 우선 연결 | 8 | 7 | 1 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | OFFICIAL_EVENT_FEED_URLS부터 공식 JSON/RSS/Atom 또는 승인 파트너 feed 연결 |
| 편의점·마트 행사 우선 연결 | 8 | 7 | 1 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | OFFICIAL_EVENT_FEED_URLS부터 공식 JSON/RSS/Atom 또는 승인 파트너 feed 연결 |
| 여행·문화 무료/할인 우선 연결 | 8 | 8 | 0 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | PUBLIC_COUPON_FEED_URLS부터 공식 JSON/RSS/Atom 또는 승인 파트너 feed 연결 |

### 묶음별 TOP 후보

#### 무료혜택·0원딜 우선 연결

무료샘플, 무료체험, 공공 무료 혜택, 멤버십 무료 쿠폰처럼 매일 방문 이유가 되는 feed 후보입니다.

| 순위 | 소스 | 카테고리 | Live | Env | Guardrail |
| --- | --- | --- | --- | --- | --- |
| 3 | 해피포인트 공식 쿠폰·모바일 혜택 | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 4 | 해피포인트 공식 제휴 할인 혜택 | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 5 | KFC 공식 신규 회원 쿠폰 혜택 | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 13 | 요기요 공식 룰렛 쿠폰 프로모션 | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 32 | 네이버페이 공식 온라인 쿠폰함 | 카드/멤버십 / 무료혜택 / 식품/생필품 / 패션/뷰티 | reachable | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |

#### 쿠폰·브랜드 이벤트 우선 연결

첫 구매, 브랜드 쿠폰, 카드/멤버십, 외식/배달 쿠폰처럼 전환율이 높은 공식 이벤트 후보입니다.

| 순위 | 소스 | 카테고리 | Live | Env | Guardrail |
| --- | --- | --- | --- | --- | --- |
| 3 | 해피포인트 공식 쿠폰·모바일 혜택 | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 5 | KFC 공식 신규 회원 쿠폰 혜택 | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 13 | 요기요 공식 룰렛 쿠폰 프로모션 | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 91 | 할리스 공식 이벤트·쿠폰 | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 35 | 피자헛 공식 회원 쿠폰 혜택 | 외식/배달 / 무료혜택 / 카드/멤버십 | guarded | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |

#### 편의점·마트 행사 우선 연결

1+1, 2+1, 장보기, 무료배송, 마트 행사처럼 반복 확인 수요가 큰 생활 밀착 feed 후보입니다.

| 순위 | 소스 | 카테고리 | Live | Env | Guardrail |
| --- | --- | --- | --- | --- | --- |
| 15 | CU 공식 1+1·2+1 행사상품 | 마트/편의점 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 82 | SSG닷컴 공식 장보기 행사 | 식품/생필품 / 마트/편의점 | reachable | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 20 | 이마트24 공식 이벤트·행사 | 마트/편의점 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 21 | GS25 행사상품과 카드 할인 | 마트/편의점 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 124 | 롯데마트 공식 행사·쿠폰 혜택 | 식품/생필품 / 마트/편의점 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |

#### 여행·문화 무료/할인 우선 연결

항공권, 숙박, 영화, 전시, 문화 무료/할인 혜택처럼 쇼핑몰 밖 유입을 만들 수 있는 후보입니다.

| 순위 | 소스 | 카테고리 | Live | Env | Guardrail |
| --- | --- | --- | --- | --- | --- |
| 16 | 문화가 있는 날 공식 혜택 | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 17 | 문화가 있는 날 공식 월간 프로그램 목록 | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 18 | 문화포털 공식 문화초대이벤트 | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 36 | 서울시 한양도성 역사 무료 해설 체험 | 정부/공공혜택 / 영화/문화 / 무료혜택 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 37 | 서울시 공공서비스예약 무료 체험·교육 | 정부/공공혜택 / 영화/문화 / 무료혜택 | reachable | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |

## 전체 큐

| 순위 | ID | 카테고리 | Live | HTTP | Env | Guardrail |
| --- | --- | --- | --- | ---: | --- | --- |
| 1 | cjone-signup-welcome-coupon | 무료혜택 / 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 2 | dominos-official-discount-benefits | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 3 | happy-point-official-coupons | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 4 | happypoint-alliance-benefits | 카드/멤버십 / 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 5 | kfc-new-member-coupon-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 6 | lguplus-benefit-plus-monthly | 무료혜택 / 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 7 | lguplus-membership-affiliate-perks | 카드/멤버십 / 무료혜택 / 외식/배달 / 영화/문화 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 8 | lpoint-benefits | 카드/멤버십 / 무료혜택 / 마트/편의점 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 9 | naverpay-cafe-point-benefit | 무료혜택 / 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 10 | okcashbag-event-benefits | 카드/멤버십 / 무료혜택 / 마트/편의점 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 11 | skt-tmembership-official-benefits | 카드/멤버십 / 무료혜택 / 외식/배달 / 영화/문화 | guarded | 401 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 12 | starbucks-rewards-official-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 13 | yogiyo-official-roulette-promotion | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 14 | baemin-official-free-delivery-club-event | 무료혜택 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 15 | cu-plus-official-monthly-benefit | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 16 | culture-day | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 17 | culture-day-monthly-official-program-list | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 18 | culture-portal-invite-events | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 19 | dunkin-monthly-combo-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 20 | emart24-official-events | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 21 | gs25-event-goods | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 22 | kfc-delivery-free | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 23 | kt-membership-daldal-benefit | 무료혜택 / 카드/멤버십 / 외식/배달 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 24 | lge-official-benefit-event-hub | 디지털/가전 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 25 | lguplus-lifecare-benefit-event | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 26 | lguplus-official-ongoing-benefit-event | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 27 | lotteeatz-coupon-center | 무료혜택 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 28 | lotteeatz-monthly-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 29 | mcdonalds-happy-snack-free-drink | 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 30 | naver-official-event-hub | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 31 | naverpay-official-campaign-all | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 32 | naverpay-online-coupon-home | 카드/멤버십 / 무료혜택 / 식품/생필품 / 패션/뷰티 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 33 | okcashbag-welcome-point-event | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 34 | payco-partyplus-coupon-guide | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 35 | pizzahut-member-free-coupon-benefit | 외식/배달 / 무료혜택 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 36 | seoul-hanyangdoseong-free-history-tour-202606 | 정부/공공혜택 / 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 37 | seoul-public-reservation-free-experience | 정부/공공혜택 / 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 38 | seven-eleven-official-events | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 39 | shinhansolpay-first-signup-point | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 40 | sktmembership-daily-mission-point | 무료혜택 / 카드/멤버십 / 외식/배달 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 41 | amoremall-official-benefit-events | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 42 | amoremall-official-event-list | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 43 | amoremall-try-before-buy-sample | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 44 | bokjiro-official-welfare-services | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 45 | cjthemarket-official-events | 식품/생필품 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 46 | cjthemarket-random-lucky-coupon-daily-2026 | 식품/생필품 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 47 | cjthemarket-welcome-coupon-free-shipping-2026 | 식품/생필품 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 48 | coupang-official-benefit-coupon-center | 무료혜택 / 식품/생필품 / 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 49 | daisomall-signup-benefit | 무료혜택 / 식품/생필품 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 50 | ebs-family-free-learning-services | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 51 | gov24-benefit-alert-service | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 52 | guro-picnic-garden-free-reservation-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 53 | hansung-baekje-conservation-family-free-202607 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 54 | ichallenge-baby-free-trial-kit-202606 | 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 55 | innisfree-sample-market | 무료혜택 / 패션/뷰티 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 56 | kmooc-art-face-emotion-free-course-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 57 | kmooc-computer-graphics-free-course-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 58 | kmooc-dynamics-free-course-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 59 | kmooc-machine-learning-free-course-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 60 | kmooc-media-literacy-free-course-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 61 | kmooc-official-free-courses | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 62 | lghnh-official-event | 무료혜택 / 패션/뷰티 / 식품/생필품 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 63 | mnuri-benefit | 정부/공공혜택 / 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 64 | momq-official-event-list | 무료혜택 / 식품/생필품 / 패션/뷰티 | reachable | 200 | BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 65 | naverpay-benefit | 카드/멤버십 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 66 | powderroom-official-campaign | 무료혜택 / 패션/뷰티 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 67 | purina-official-event-list | 무료혜택 / 식품/생필품 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 68 | purina-zero-won-official-event | 무료혜택 / 식품/생필품 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 69 | seoul-baekje-kids-museum-free-exhibit-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 70 | seoul-dongdaemun-forest-family-free-2026 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 71 | seoul-dongdaemun-water-sports-free-class-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 72 | seoul-futurelab-battlebot-free-experience-202606 | 정부/공공혜택 / 디지털/가전 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 73 | seoul-history-kids-museum-free-visit-2026 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 74 | seoul-history-museum-guide-free-2026 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 75 | seoul-life-museum-ompang-free-kids-2026 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 76 | seoul-plant-hospital-free-care-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 77 | seoul-sagajeong-forest-play-free-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 78 | seoul-seoseoul-lake-green-free-kids-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 79 | seoul-ujangsan-forest-healing-free-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 80 | seoul-worldcup-silkworm-free-experience-202606 | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 81 | seoul-youth-policy-free-support-guide | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 82 | ssg-event-main | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 83 | visitkorea-travel-week | 여행/숙박 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 84 | work24-training-card-issue-guide | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 85 | work24-training-support-official | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 86 | yogiyo-event | 외식/배달 | reachable | 200 | DEAL_EVENT_NEWS_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 87 | cjone-mobile-events | 카드/멤버십 / 외식/배달 / 영화/문화 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 88 | baskinrobbins-official-event-list | 외식/배달 / 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 89 | bhc-ecoupon | 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 90 | dunkin-official-promotion-list | 외식/배달 / 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 91 | hollys-official-event-coupon | 외식/배달 / 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 92 | kurly-beauty-sample-product | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 93 | kurly-living-free-shipping-product | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 94 | parisbaguette-official-promotions | 외식/배달 / 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 95 | pascucci-official-event-list | 외식/배달 / 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 96 | jejuair-events | 여행/숙박 | guarded | 503 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 97 | amoremall-official-payment-benefit | 패션/뷰티 / 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 98 | auction-official-ecoupon-event | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 99 | baemin-academy-events | 외식/배달 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 100 | baskinrobbins-events | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 101 | bccard-benefit-official-center | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 102 | culture-seoul-official-events | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 103 | daisomall-official-events | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 104 | dunkin-donut-fryday-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 105 | dunkin-membership-partner-benefits | 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 106 | dunkin-official-event-benefits | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 107 | ebs-lifelong-school-free-courses | 정부/공공혜택 / 무료혜택 / 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 108 | ediya-official-events | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 109 | everland-official-event | 무료혜택 / 영화/문화 / 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 110 | gs25-hyeja-bread-tosspay-plusone-202606 | 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 111 | hangang-seoul-official-free-events | 영화/문화 / 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 112 | hpoint-official-event-point-coupon | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 113 | kakaopay-membership-usage-official-guide | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 114 | kakaopay-payment-point-official-benefit | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 115 | kbpay-official-event-point-coupon | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 116 | krispykreme-wednesday-event | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 117 | kt-membership-official-benefit | 카드/멤버십 / 외식/배달 / 영화/문화 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 118 | kt-official-ongoing-event-list | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 119 | kt-yogo-mobile-official-benefit | 카드/멤버십 / 무료혜택 / 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 120 | kurly-digital-free-shipping-product | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 121 | kurly-fashion-free-shipping-product | 패션/뷰티 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 122 | kyochon-official-events | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 123 | lguplus-ongoing-membership-event | 카드/멤버십 / 무료혜택 / 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 124 | lottemart-official-benefits | 식품/생필품 / 마트/편의점 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 125 | lotteworld-official-benefit | 무료혜택 / 영화/문화 / 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 126 | lotteworld-official-benefits | 영화/문화 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 127 | lpoint-card-events | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 128 | lpoint-official-daily-missions | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 129 | mcdonalds-happysnack | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 130 | mega-mgc-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 131 | mega-mgc-official-events | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 132 | megabox-events | 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 133 | megabox-membership-official-benefit | 영화/문화 / 무료혜택 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 134 | megabox-vip-lounge-official-benefit | 영화/문화 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 135 | momq-new-member-welcome-benefit | 무료혜택 / 식품/생필품 / 카드/멤버십 | reachable | 200 | BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 136 | momstouch-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 137 | national-museum-official-exhibition | 영화/문화 / 무료혜택 / 정부/공공혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 138 | okcashbag-brand-events | 카드/멤버십 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 139 | okcashbag-shopping-point-official-benefit | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 140 | parisbaguette-promotion | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 141 | payco-official-benefit-events | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 142 | payco-promotion-code-official-guide | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 143 | payco-reward-official-point-benefit | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 144 | pizzahut-luckydraw-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 145 | popeyes-official-event-coupon | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 146 | shinhancard-annual-fee-cashback-202606 | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 147 | shinhancard-utility-autopay-cashback-202606 | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 148 | sktmembership-benefit-brand-list | 카드/멤버십 / 외식/배달 / 마트/편의점 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 149 | starbucks-campaign | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 150 | toss-official-benefit-feed | 카드/멤버십 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 151 | tossfeed-tosspay-official-promotion | 무료혜택 / 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 152 | tworld-membership | 카드/멤버십 / 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 153 | uplus-membership-official-benefit | 카드/멤버십 / 외식/배달 / 영화/문화 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 154 | aquaplanet-official-events | 영화/문화 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 155 | bccard-events | 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 156 | cgv-events | 영화/문화 / 무료혜택 | guarded | 403 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 157 | danawa-official-events | 디지털/가전 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 158 | drg-official-event-board | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 159 | emart-event-main | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 160 | everland-official-special-offers | 영화/문화 / 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 161 | hanacard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 162 | happypoint-membership-official-benefit-guide | 카드/멤버십 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 163 | himart-lpoint-membership-benefit | 디지털/가전 / 카드/멤버십 / 무료혜택 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 164 | homeplus-event | 식품/생필품 / 마트/편의점 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 165 | homeplus-membership-official-coupon | 마트/편의점 / 식품/생필품 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 166 | ikea-official-offers | 식품/생필품 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 167 | innisfree-event-coupon | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 168 | kakaopay-benefits-faq-official-coupon | 카드/멤버십 / 무료혜택 | guarded | 500 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 169 | kakaopay-membership-benefits | 카드/멤버십 / 무료혜택 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 170 | kbcard-events | 카드/멤버십 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 171 | kmooc-ai-teaching-innovation-free-course | 정부/공공혜택 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 172 | kmooc-blockchain-digital-asset-free-course | 정부/공공혜택 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 173 | kocw-official-open-course | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 174 | kosaf-scholarship-support | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 175 | lottecard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 176 | lottecinema-events | 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 177 | lottecinema-lpoint-membership-benefit | 영화/문화 / 카드/멤버십 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 178 | lotteon-lohbs-official-event | 식품/생필품 / 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 179 | mois-subsidy24-official-guide | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 180 | musinsa-online-coupon-2026 | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 181 | naturecollection-official-events | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 182 | naverplus-membership-official-benefit | 카드/멤버십 / 무료혜택 | guarded | 200 | PUBLIC_COUPON_FEED_URLS / DEAL_NEWS_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 183 | okcashbag-service-official-point-guide | 카드/멤버십 / 무료혜택 | guarded | 0 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 184 | powderroom-review-event | 패션/뷰티 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 185 | roundlab-official-event-board | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 186 | royalcanin-kr-official-events | 식품/생필품 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 187 | royalcanin-start-of-life-campaign | 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 188 | samsung-members-official-benefit | 디지털/가전 / 무료혜택 / 카드/멤버십 | guarded | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 189 | samsungcard-official-event-benefit | 카드/멤버십 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 190 | seoul-lifelong-learning-4050-intro | 정부/공공혜택 / 무료혜택 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 191 | subway-official-promotion | 외식/배달 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 192 | tenbyten-official-events | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 193 | thefaceshop-official-events | 패션/뷰티 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 194 | todayhouse-official-season-promotion | 무료혜택 / 식품/생필품 / 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 195 | twosome-heart-app-membership | 외식/배달 / 무료혜택 | guarded | 403 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 196 | yanolja-official-promotion | 여행/숙박 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 197 | apple-certified-refurbished | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 198 | eastarjet-official-events | 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 199 | elevenst-official-shocking-deal | 식품/생필품 / 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 200 | gmarket-official-coupon-event | 패션/뷰티 / 무료혜택 | guarded | 403 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 201 | himart-events | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 202 | hmall-official-events | 패션/뷰티 / 식품/생필품 | reachable | 200 | DEAL_NEWS_FEED_URLS / DEAL_EVENT_NEWS_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 203 | koreanair-promotion | 여행/숙박 | reachable | 200 | DEAL_EVENT_NEWS_FEED_URLS / OFFICIAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 204 | lottehotel-official-offers | 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 205 | musinsa-fashion-festa | 패션/뷰티 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 206 | oliveyoung-events | 패션/뷰티 / 무료혜택 | guarded | 403 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 207 | samsung-shop-event | 디지털/가전 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 208 | twayair-official-events | 여행/숙박 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 209 | airbusan-official-events | 여행/숙박 | guarded | 403 | OFFICIAL_EVENT_FEED_URLS / DEAL_EVENT_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |
| 210 | coupang-eats-official-benefits | 외식/배달 / 무료혜택 | reachable | 200 | OFFICIAL_EVENT_FEED_URLS / PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 211 | eventhouse-approved-event-discovery | 무료혜택 / 영화/문화 | reachable | 200 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기 |
| 212 | suto-approved-event-discovery | 무료혜택 | guarded | 403 | PUBLIC_COUPON_FEED_URLS / BENEFIT_REFRESH_FEED_URLS | 무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용 |

## 재생성

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:onboarding:plan
```
