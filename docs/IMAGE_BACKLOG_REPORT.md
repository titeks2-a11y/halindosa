# 할인도사 Image Backlog Report

Generated: npm run image:backlog:report
Status: ACTION_NEEDED

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | 140 |
| 명시 실상품 이미지 상품 수 | 93 |
| 보강 대기 상품 수 | 47 |
| 명시 이미지 커버리지 | 66% |
| 공개 운영 목표 커버리지 | 60% |
| 운영 성장 목표 커버리지 | 80% |
| 목표까지 추가 보강 | 0 |
| 운영 성장 목표까지 추가 보강 | 19 |
| 주간 보강 목표 | 12 |
| 주간 보강 배치 후보 | 12 |
| 판매처별 요청서 행 | 21 |
| 이미지 ready gate | productUrl + imageUrl/thumbnail + imageRights + priceCheckedAt |

## Operation Policy

- 카테고리 fallback 이미지는 화면 깨짐을 막는 안전장치이며, 출시 후 운영 품질 목표로 보지 않습니다.
- 신규 운영 피드와 제휴 피드는 실제 상품 또는 공식 혜택 상세 이미지 URL을 함께 제공해야 합니다.
- 이미 검증된 공식 상세 og:image/schema image/CDN 이미지는 `data/verifiedProductImages.ts`에서 관리하고 backlog에서 제외합니다.
- 운영 ready 이미지는 공식/제휴 피드 또는 판매처 상품 상세에서 권리 확인 가능한 이미지여야 합니다.
- 검색 결과 썸네일, 커뮤니티 캡처, 블로그 이미지, 무출처 이미지는 보강 완료로 인정하지 않습니다.
- 이미지 보강 행은 `sourceSafetyLevel=official_or_partner_only`, `imageReadyGate`, `requiredProviderFields`, `operatorChecklist`, `requestTemplate`를 포함해야 합니다.
- 공개 출시 최소선은 명시 실상품 이미지 60% 이상이고, 운영 성장 목표는 80%입니다. 최소선을 넘은 뒤에도 fallback 상품이 남아 있으면 매주 최대 12개를 보강합니다.
- 판매처별 backlog가 많은 경우 수동 이미지 검색보다 제휴/운영 피드의 `imageUrl`, 이미지 사용 권한, 최신 가격 기준 시각을 함께 확보합니다.
- 보강 우선순위는 클릭/찜이 많은 상품, 무료 혜택 상단 노출 상품, 카테고리 대표 상품 순서입니다.
- 이미지는 판매처 상세 페이지, 공식 제휴 피드, 브랜드가 제공한 이미지처럼 사용 권한을 확인할 수 있는 출처에서 확보합니다.
- `IMAGE_BACKLOG.csv`는 전체 보강 큐이며, 운영자는 `imageUrl` 또는 `thumbnail` 필드에 대표 이미지를 저장합니다.
- `IMAGE_BACKLOG_NEXT_BATCH.csv`는 이번 주 먼저 처리할 12개 상품만 분리한 실행 배치입니다.
- `IMAGE_BACKLOG_MALL_REQUESTS.csv`는 판매처별 imageUrl 확보 요청서이며, 제휴/운영 피드 담당자가 우선 처리할 판매처와 SLA를 정리합니다.

## Backlog By Category

- 쿠폰/이벤트: 13
- 생활용품: 9
- 식품: 6
- 뷰티: 4
- 기타: 3
- 여행/티켓: 3
- 전자기기: 3
- 편의점/마트: 3
- 가전: 2
- 육아: 1

## Backlog By Mall

- 쿠팡: 21
- 올리브영: 4
- 메가MGC커피: 2
- 카카오페이: 2
- 하이마트: 2
- 롯데시네마: 1
- 맥도날드: 1
- 메가박스: 1
- 무신사: 1
- 스타벅스: 1
- 신한카드: 1
- 오늘의집: 1
- 옥션: 1
- 카카오톡 선물하기: 1
- 티켓링크: 1
- 현대카드: 1
- 홈플러스: 1
- BC카드: 1
- BHC: 1
- CU: 1

## 이번 주 이미지 보강 배치

| Rank | ID | 판매처 | 상품명 | 우선순위 | Ready Gate | 운영 사유 |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | d013 | 하이마트 | 삼성 55형 4K UHD TV | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 2 | d014 | 쿠팡 | 애플워치 호환 스포츠 밴드 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 3 | d019 | 오늘의집 | 원목 수납장 3단 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 4 | d022 | 올리브영 | JMW BLDC 에어원 드라이어 MC4B03C | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 5 | d025 | 올리브영 | 선크림 1+1 기획 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 6 | d028 | 쿠팡 | 워터픽 나노 패밀리팩 구강세정기 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 7 | d030 | 쿠팡 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 8 | d031 | 쿠팡 | 원목 수납장 3단 다용도 월넛 유리 거실장 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 9 | d035 | 쿠팡 | 로켓프레시 친환경 토마토 2kg | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 10 | d040 | 올리브영 | 아이보들 CCP 크림 1+1 기획 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 11 | d044 | 옥션 | 국내산 냉동 블루베리 1kg | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 12 | d046 | 쿠팡 | 탐사수 무라벨 2L 24병 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |

## 판매처별 이미지 요청서

| 판매처 | 보강 대기 | 확보 방식 | 담당 | SLA | 샘플 ID | Ready Gate | 요청 액션 |
| --- | ---: | --- | --- | ---: | --- | --- | --- |
| 쿠팡 | 21 | partner_feed | 제휴/운영 피드 담당 | 3 | d014 | d028 | d030 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 쿠팡 운영 피드에 imageUrl 또는 thumbnail 필드 포함 요청 |
| 올리브영 | 4 | official_batch | 상품 운영 담당 | 5 | d022 | d025 | d040 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 올리브영 공식 상세 페이지 이미지 후보를 배치 검수 |
| 메가MGC커피 | 2 | manual_review | 데일리 검수 담당 | 7 | d076 | d117 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 메가MGC커피 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 카카오페이 | 2 | manual_review | 데일리 검수 담당 | 7 | d054 | d071 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 카카오페이 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 하이마트 | 2 | official_batch | 상품 운영 담당 | 5 | d013 | d084 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 하이마트 공식 상세 페이지 이미지 후보를 배치 검수 |
| 롯데시네마 | 1 | manual_review | 데일리 검수 담당 | 7 | d075 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 롯데시네마 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 맥도날드 | 1 | manual_review | 데일리 검수 담당 | 7 | d058 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 맥도날드 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 메가박스 | 1 | manual_review | 데일리 검수 담당 | 7 | d060 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 메가박스 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 무신사 | 1 | official_batch | 상품 운영 담당 | 5 | d116 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 무신사 공식 상세 페이지 이미지 후보를 배치 검수 |
| 스타벅스 | 1 | manual_review | 데일리 검수 담당 | 7 | d066 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 스타벅스 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 신한카드 | 1 | manual_review | 데일리 검수 담당 | 7 | d074 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 신한카드 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 오늘의집 | 1 | manual_review | 데일리 검수 담당 | 7 | d019 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 오늘의집 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 옥션 | 1 | manual_review | 데일리 검수 담당 | 7 | d044 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 옥션 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 카카오톡 선물하기 | 1 | manual_review | 데일리 검수 담당 | 7 | d077 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 카카오톡 선물하기 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 티켓링크 | 1 | manual_review | 데일리 검수 담당 | 7 | d078 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 티켓링크 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 현대카드 | 1 | manual_review | 데일리 검수 담당 | 7 | d073 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 현대카드 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 홈플러스 | 1 | manual_review | 데일리 검수 담당 | 7 | d063 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 홈플러스 클릭 상위 상품부터 대표 이미지 수동 보강 |
| BC카드 | 1 | manual_review | 데일리 검수 담당 | 7 | d053 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | BC카드 클릭 상위 상품부터 대표 이미지 수동 보강 |
| BHC | 1 | manual_review | 데일리 검수 담당 | 7 | d115 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | BHC 클릭 상위 상품부터 대표 이미지 수동 보강 |
| CU | 1 | manual_review | 데일리 검수 담당 | 7 | d061 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | CU 클릭 상위 상품부터 대표 이미지 수동 보강 |

## Priority Backlog

| Rank | ID | 판매처 | 카테고리 | 상품명 | 우선순위 | 운영 사유 | 이미지 후보 검색 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | d013 | 하이마트 | 가전 | 삼성 55형 4K UHD TV | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%EC%82%BC%EC%84%B1%2055%ED%98%95%204K%20UHD%20TV%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 2 | d014 | 쿠팡 | 전자기기 | 애플워치 호환 스포츠 밴드 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%95%A0%ED%94%8C%EC%9B%8C%EC%B9%98%20%ED%98%B8%ED%99%98%20%EC%8A%A4%ED%8F%AC%EC%B8%A0%20%EB%B0%B4%EB%93%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 3 | d019 | 오늘의집 | 생활용품 | 원목 수납장 3단 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A4%EB%8A%98%EC%9D%98%EC%A7%91%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 4 | d022 | 올리브영 | 뷰티 | JMW BLDC 에어원 드라이어 MC4B03C | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20JMW%20BLDC%20%EC%97%90%EC%96%B4%EC%9B%90%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EC%96%B4%20MC4B03C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 5 | d025 | 올리브영 | 뷰티 | 선크림 1+1 기획 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%84%A0%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 6 | d028 | 쿠팡 | 생활용품 | 워터픽 나노 패밀리팩 구강세정기 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%8C%ED%84%B0%ED%94%BD%20%EB%82%98%EB%85%B8%20%ED%8C%A8%EB%B0%80%EB%A6%AC%ED%8C%A9%20%EA%B5%AC%EA%B0%95%EC%84%B8%EC%A0%95%EA%B8%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 7 | d030 | 쿠팡 | 전자기기 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20Apple%202025%20%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%20A16%2011%EC%84%B8%EB%8C%80%20128GB%20Wi-Fi%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 8 | d031 | 쿠팡 | 생활용품 | 원목 수납장 3단 다용도 월넛 유리 거실장 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EB%8B%A4%EC%9A%A9%EB%8F%84%20%EC%9B%94%EB%84%9B%20%EC%9C%A0%EB%A6%AC%20%EA%B1%B0%EC%8B%A4%EC%9E%A5%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 9 | d035 | 쿠팡 | 식품 | 로켓프레시 친환경 토마토 2kg | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EB%A1%9C%EC%BC%93%ED%94%84%EB%A0%88%EC%8B%9C%20%EC%B9%9C%ED%99%98%EA%B2%BD%20%ED%86%A0%EB%A7%88%ED%86%A0%202kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 10 | d040 | 올리브영 | 뷰티 | 아이보들 CCP 크림 1+1 기획 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%95%84%EC%9D%B4%EB%B3%B4%EB%93%A4%20CCP%20%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 11 | d044 | 옥션 | 식품 | 국내산 냉동 블루베리 1kg | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A5%EC%85%98%20%EA%B5%AD%EB%82%B4%EC%82%B0%20%EB%83%89%EB%8F%99%20%EB%B8%94%EB%A3%A8%EB%B2%A0%EB%A6%AC%201kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 12 | d046 | 쿠팡 | 편의점/마트 | 탐사수 무라벨 2L 24병 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%83%90%EC%82%AC%EC%88%98%20%EB%AC%B4%EB%9D%BC%EB%B2%A8%202L%2024%EB%B3%91%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 13 | d050 | 올리브영 | 뷰티 | 멀티비타민 90정 기획세트 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EB%A9%80%ED%8B%B0%EB%B9%84%ED%83%80%EB%AF%BC%2090%EC%A0%95%20%EA%B8%B0%ED%9A%8D%EC%84%B8%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 14 | d053 | BC카드 | 쿠폰/이벤트 | BC카드 페이북 보너스 머니박스 이벤트 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=BC%EC%B9%B4%EB%93%9C%20BC%EC%B9%B4%EB%93%9C%20%ED%8E%98%EC%9D%B4%EB%B6%81%20%EB%B3%B4%EB%84%88%EC%8A%A4%20%EB%A8%B8%EB%8B%88%EB%B0%95%EC%8A%A4%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 15 | d054 | 카카오페이 | 쿠폰/이벤트 | 카카오페이 편의점 결제 2천원 쿠폰 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%ED%8E%B8%EC%9D%98%EC%A0%90%20%EA%B2%B0%EC%A0%9C%202%EC%B2%9C%EC%9B%90%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 16 | d057 | T멤버십 | 쿠폰/이벤트 | T멤버십 커피 무료 사이즈업 쿠폰 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=T%EB%A9%A4%EB%B2%84%EC%8B%AD%20T%EB%A9%A4%EB%B2%84%EC%8B%AD%20%EC%BB%A4%ED%94%BC%20%EB%AC%B4%EB%A3%8C%20%EC%82%AC%EC%9D%B4%EC%A6%88%EC%97%85%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 17 | d058 | 맥도날드 | 쿠폰/이벤트 | 맥도날드 공식 해피스낵 프로모션 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A7%A5%EB%8F%84%EB%82%A0%EB%93%9C%20%EB%A7%A5%EB%8F%84%EB%82%A0%EB%93%9C%20%EA%B3%B5%EC%8B%9D%20%ED%95%B4%ED%94%BC%EC%8A%A4%EB%82%B5%20%ED%94%84%EB%A1%9C%EB%AA%A8%EC%85%98%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 18 | d060 | 메가박스 | 여행/티켓 | 메가박스 공식 영화·문화 이벤트 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A9%94%EA%B0%80%EB%B0%95%EC%8A%A4%20%EB%A9%94%EA%B0%80%EB%B0%95%EC%8A%A4%20%EA%B3%B5%EC%8B%9D%20%EC%98%81%ED%99%94%C2%B7%EB%AC%B8%ED%99%94%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 19 | d061 | CU | 편의점/마트 | CU 커피·음료 1+1 모바일 쿠폰 행사 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=CU%20CU%20%EC%BB%A4%ED%94%BC%C2%B7%EC%9D%8C%EB%A3%8C%201%2B1%20%EB%AA%A8%EB%B0%94%EC%9D%BC%20%EC%BF%A0%ED%8F%B0%20%ED%96%89%EC%82%AC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 20 | d063 | 홈플러스 | 편의점/마트 | 홈플러스 AI 물가안정 프로젝트 장보기 특가 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%99%88%ED%94%8C%EB%9F%AC%EC%8A%A4%20%ED%99%88%ED%94%8C%EB%9F%AC%EC%8A%A4%20AI%20%EB%AC%BC%EA%B0%80%EC%95%88%EC%A0%95%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EC%9E%A5%EB%B3%B4%EA%B8%B0%20%ED%8A%B9%EA%B0%80%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 21 | d066 | 스타벅스 | 쿠폰/이벤트 | 스타벅스 앱 이벤트 음료 쿠폰 확인 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%8A%A4%ED%83%80%EB%B2%85%EC%8A%A4%20%EC%8A%A4%ED%83%80%EB%B2%85%EC%8A%A4%20%EC%95%B1%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%9D%8C%EB%A3%8C%20%EC%BF%A0%ED%8F%B0%20%ED%99%95%EC%9D%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 22 | d071 | 카카오페이 | 쿠폰/이벤트 | 카카오페이 멤버십 적립·쿠폰 혜택 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%EB%A9%A4%EB%B2%84%EC%8B%AD%20%EC%A0%81%EB%A6%BD%C2%B7%EC%BF%A0%ED%8F%B0%20%ED%98%9C%ED%83%9D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 23 | d073 | 현대카드 | 쿠폰/이벤트 | 현대카드 M포인트 외식·쇼핑 할인 혜택 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%98%84%EB%8C%80%EC%B9%B4%EB%93%9C%20%ED%98%84%EB%8C%80%EC%B9%B4%EB%93%9C%20M%ED%8F%AC%EC%9D%B8%ED%8A%B8%20%EC%99%B8%EC%8B%9D%C2%B7%EC%87%BC%ED%95%91%20%ED%95%A0%EC%9D%B8%20%ED%98%9C%ED%83%9D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 24 | d074 | 신한카드 | 쿠폰/이벤트 | 신한카드 생활비 캐시백 이벤트 모음 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C%20%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C%20%EC%83%9D%ED%99%9C%EB%B9%84%20%EC%BA%90%EC%8B%9C%EB%B0%B1%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EB%AA%A8%EC%9D%8C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 25 | d075 | 롯데시네마 | 여행/티켓 | 롯데시네마 시사회·영화 할인 이벤트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A1%AF%EB%8D%B0%EC%8B%9C%EB%84%A4%EB%A7%88%20%EB%A1%AF%EB%8D%B0%EC%8B%9C%EB%84%A4%EB%A7%88%20%EC%8B%9C%EC%82%AC%ED%9A%8C%C2%B7%EC%98%81%ED%99%94%20%ED%95%A0%EC%9D%B8%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 26 | d076 | 메가MGC커피 | 쿠폰/이벤트 | 메가MGC커피 앱 쿠폰·음료 이벤트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A9%94%EA%B0%80MGC%EC%BB%A4%ED%94%BC%20%EB%A9%94%EA%B0%80MGC%EC%BB%A4%ED%94%BC%20%EC%95%B1%20%EC%BF%A0%ED%8F%B0%C2%B7%EC%9D%8C%EB%A3%8C%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 27 | d077 | 카카오톡 선물하기 | 쿠폰/이벤트 | 카카오톡 선물하기 첫 구매 쿠폰 이벤트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%20%EC%84%A0%EB%AC%BC%ED%95%98%EA%B8%B0%20%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%20%EC%84%A0%EB%AC%BC%ED%95%98%EA%B8%B0%20%EC%B2%AB%20%EA%B5%AC%EB%A7%A4%20%EC%BF%A0%ED%8F%B0%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 28 | d078 | 티켓링크 | 여행/티켓 | 티켓링크 전시·공연 할인 이벤트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%8B%B0%EC%BC%93%EB%A7%81%ED%81%AC%20%ED%8B%B0%EC%BC%93%EB%A7%81%ED%81%AC%20%EC%A0%84%EC%8B%9C%C2%B7%EA%B3%B5%EC%97%B0%20%ED%95%A0%EC%9D%B8%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 29 | d079 | 쿠팡 | 생활용품 | 탐사 고평량 종이컵 디자인 380ml 100개입 | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%83%90%EC%82%AC%20%EA%B3%A0%ED%8F%89%EB%9F%89%20%EC%A2%85%EC%9D%B4%EC%BB%B5%20%EB%94%94%EC%9E%90%EC%9D%B8%20380ml%20100%EA%B0%9C%EC%9E%85%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 30 | d084 | 하이마트 | 가전 | LG 오브제 칸 스탠드에어컨 FQ18EK1HA1M | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20LG%20%EC%98%A4%EB%B8%8C%EC%A0%9C%20%EC%B9%B8%20%EC%8A%A4%ED%83%A0%EB%93%9C%EC%97%90%EC%96%B4%EC%BB%A8%20FQ18EK1HA1M%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 31 | d085 | 쿠팡 | 육아 | 하기스 2024 매직컴포트 팬티형 기저귀 5단계 84매 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%95%98%EA%B8%B0%EC%8A%A4%202024%20%EB%A7%A4%EC%A7%81%EC%BB%B4%ED%8F%AC%ED%8A%B8%20%ED%8C%AC%ED%8B%B0%ED%98%95%20%EA%B8%B0%EC%A0%80%EA%B7%80%205%EB%8B%A8%EA%B3%84%2084%EB%A7%A4%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 32 | d088 | 쿠팡 | 전자기기 | 샤오미 미밴드 9 스마트밴드 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%83%A4%EC%98%A4%EB%AF%B8%20%EB%AF%B8%EB%B0%B4%EB%93%9C%209%20%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%B0%B4%EB%93%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 33 | d091 | 쿠팡 | 식품 | 탐사수 1L 12개입 생수 | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%83%90%EC%82%AC%EC%88%98%201L%2012%EA%B0%9C%EC%9E%85%20%EC%83%9D%EC%88%98%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 34 | d100 | 쿠팡 | 생활용품 | 트리오 항균 주방세제 3kg 2개 | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%8A%B8%EB%A6%AC%EC%98%A4%20%ED%95%AD%EA%B7%A0%20%EC%A3%BC%EB%B0%A9%EC%84%B8%EC%A0%9C%203kg%202%EA%B0%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 35 | d104 | 쿠팡 | 생활용품 | 습기타파 대용량 제습제 280g 24개 | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%8A%B5%EA%B8%B0%ED%83%80%ED%8C%8C%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%A0%9C%EC%8A%B5%EC%A0%9C%20280g%2024%EA%B0%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 36 | d105 | 쿠팡 | 기타 | 모나미 153 볼펜 0.5mm 블랙 12자루 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EB%AA%A8%EB%82%98%EB%AF%B8%20153%20%EB%B3%BC%ED%8E%9C%200.5mm%20%EB%B8%94%EB%9E%99%2012%EC%9E%90%EB%A3%A8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 37 | d110 | 쿠팡 | 기타 | 모나미 153 볼펜 1.0mm Red 60개 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EB%AA%A8%EB%82%98%EB%AF%B8%20153%20%EB%B3%BC%ED%8E%9C%201.0mm%20Red%2060%EA%B0%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 38 | d113 | 쿠팡 | 기타 | 코멧 자동 장우산 2개 세트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%BD%94%EB%A9%A7%20%EC%9E%90%EB%8F%99%20%EC%9E%A5%EC%9A%B0%EC%82%B0%202%EA%B0%9C%20%EC%84%B8%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 39 | d115 | BHC | 쿠폰/이벤트 | BHC 앱 치킨 첫 주문 5천원 할인 쿠폰 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=BHC%20BHC%20%EC%95%B1%20%EC%B9%98%ED%82%A8%20%EC%B2%AB%20%EC%A3%BC%EB%AC%B8%205%EC%B2%9C%EC%9B%90%20%ED%95%A0%EC%9D%B8%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 40 | d116 | 무신사 | 쿠폰/이벤트 | 무신사 온라인 할인 쿠폰 2026 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%8B%A0%EC%82%AC%20%EB%AC%B4%EC%8B%A0%EC%82%AC%20%EC%98%A8%EB%9D%BC%EC%9D%B8%20%ED%95%A0%EC%9D%B8%20%EC%BF%A0%ED%8F%B0%202026%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |

## Generated Files

- Root CSV: `IMAGE_BACKLOG.csv`
- Next batch CSV: `IMAGE_BACKLOG_NEXT_BATCH.csv`
- Mall request CSV: `IMAGE_BACKLOG_MALL_REQUESTS.csv`
- Root JSON: `IMAGE_BACKLOG.json`
- Docs report: `docs/IMAGE_BACKLOG_REPORT.md`
