# 할인도사 Image Backlog Report

Generated: npm run image:backlog:report
Status: ACTION_NEEDED

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | 140 |
| 명시 실상품 이미지 상품 수 | 39 |
| 보강 대기 상품 수 | 101 |
| 명시 이미지 커버리지 | 28% |
| 공개 운영 목표 커버리지 | 60% |
| 목표까지 추가 보강 | 45 |
| 주간 보강 목표 | 24 |
| 주간 보강 배치 후보 | 24 |
| 판매처별 요청서 행 | 43 |
| 이미지 ready gate | productUrl + imageUrl/thumbnail + imageRights + priceCheckedAt |

## Operation Policy

- 카테고리 fallback 이미지는 화면 깨짐을 막는 안전장치이며, 출시 후 운영 품질 목표로 보지 않습니다.
- 신규 운영 피드와 제휴 피드는 실제 상품 또는 공식 혜택 상세 이미지 URL을 함께 제공해야 합니다.
- 운영 ready 이미지는 공식/제휴 피드 또는 판매처 상품 상세에서 권리 확인 가능한 이미지여야 합니다.
- 검색 결과 썸네일, 커뮤니티 캡처, 블로그 이미지, 무출처 이미지는 보강 완료로 인정하지 않습니다.
- 이미지 보강 행은 `sourceSafetyLevel=official_or_partner_only`, `imageReadyGate`, `requiredProviderFields`, `operatorChecklist`, `requestTemplate`를 포함해야 합니다.
- 공개 운영 전 목표는 명시 실상품 이미지 60% 이상이며, 목표 도달까지 매주 클릭 상위 fallback 상품 24개를 먼저 보강합니다.
- 판매처별 backlog가 많은 경우 수동 이미지 검색보다 제휴/운영 피드의 `imageUrl`, 이미지 사용 권한, 최신 가격 기준 시각을 함께 확보합니다.
- 보강 우선순위는 클릭/찜이 많은 상품, 무료 혜택 상단 노출 상품, 카테고리 대표 상품 순서입니다.
- 이미지는 판매처 상세 페이지, 공식 제휴 피드, 브랜드가 제공한 이미지처럼 사용 권한을 확인할 수 있는 출처에서 확보합니다.
- `IMAGE_BACKLOG.csv`는 전체 보강 큐이며, 운영자는 `imageUrl` 또는 `thumbnail` 필드에 대표 이미지를 저장합니다.
- `IMAGE_BACKLOG_NEXT_BATCH.csv`는 이번 주 먼저 처리할 24개 상품만 분리한 실행 배치입니다.
- `IMAGE_BACKLOG_MALL_REQUESTS.csv`는 판매처별 imageUrl 확보 요청서이며, 제휴/운영 피드 담당자가 우선 처리할 판매처와 SLA를 정리합니다.

## Backlog By Category

- 쿠폰/이벤트: 22
- 생활용품: 19
- 식품: 15
- 뷰티: 7
- 여행/티켓: 7
- 편의점/마트: 7
- 육아: 6
- 전자기기: 6
- 가전: 4
- 기타: 4
- 의류: 4

## Backlog By Mall

- 쿠팡: 21
- SSG닷컴: 13
- 11번가: 9
- 무신사: 5
- 하이마트: 5
- 올리브영: 4
- 마켓컬리: 3
- 메가MGC커피: 2
- 이마트몰: 2
- 인터파크투어: 2
- 카카오페이: 2
- GS SHOP: 2
- 네이버쇼핑: 1
- 네이버페이: 1
- 네이버플러스: 1
- 롯데시네마: 1
- 맘큐: 1
- 배달의민족: 1
- 세븐일레븐: 1
- 스타벅스: 1

## 이번 주 이미지 보강 배치

| Rank | ID | 판매처 | 상품명 | 우선순위 | Ready Gate | 운영 사유 |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | d011 | SSG닷컴 | 프리미엄 한우 불고기 600g | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 2 | d013 | 하이마트 | 삼성 55형 4K UHD TV | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 3 | d014 | 쿠팡 | 애플워치 호환 스포츠 밴드 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 4 | d015 | 11번가 | 대용량 캡슐세제 80개입 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 5 | d018 | 마켓컬리 | 무항생제 계란 30구 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 6 | d019 | 오늘의집 | 원목 수납장 3단 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 7 | d020 | 무신사 | 아웃도어 프로덕츠 3PACK 티셔츠 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 8 | d021 | 인터파크투어 | [제주] 제주투어패스 타임제로 자유이용권 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 9 | d022 | 올리브영 | JMW BLDC 에어원 드라이어 MC4B03C | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 10 | d023 | 아이프라브 | 확장형 5휠 밸런스 큐브 캐리어 24인치 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 11 | d024 | SSG닷컴 | 프리미엄 생수 2L 24병 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 12 | d025 | 올리브영 | 선크림 1+1 기획 | high | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 주간 보강 배치 상위 후보 |
| 13 | d026 | 하이마트 | HP 오멘 16-am0121TX RTX5070 게이밍노트북 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 14 | d027 | GS SHOP | 군 기저귀 프리미엄 밴드 대형 36P 4팩 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 15 | d028 | 쿠팡 | 워터픽 나노 패밀리팩 구강세정기 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 재방문 빈도가 높은 생활형 카테고리 |
| 16 | d029 | SSG닷컴 | 422 올스텐 에어프라이어 7L 대용량 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 17 | d030 | 쿠팡 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 18 | d031 | 쿠팡 | 원목 수납장 3단 다용도 월넛 유리 거실장 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 재방문 빈도가 높은 생활형 카테고리 |
| 19 | d032 | SSG닷컴 | 명품 향수 50ml | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 20 | d033 | 코레일관광 | 부산 주말 KTX 연계 숙박 패키지 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 21 | d035 | 쿠팡 | 로켓프레시 친환경 토마토 2kg | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 재방문 빈도가 높은 생활형 카테고리 |
| 22 | d036 | 하이마트 | 허밍 무선청소기 HML-VC2502W 물걸레 세트 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 23 | d037 | 무신사 | 더니트컴퍼니 수피마 에센셜 티셔츠 3PACK | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |
| 24 | d038 | GS SHOP | 군 기저귀 프리미엄 팬티 대형 32P 4팩 | medium | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 |

## 판매처별 이미지 요청서

| 판매처 | 보강 대기 | 확보 방식 | 담당 | SLA | 샘플 ID | Ready Gate | 요청 액션 |
| --- | ---: | --- | --- | ---: | --- | --- | --- |
| 쿠팡 | 21 | partner_feed | 제휴/운영 피드 담당 | 3 | d014 | d028 | d030 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 쿠팡 운영 피드에 imageUrl 또는 thumbnail 필드 포함 요청 |
| SSG닷컴 | 13 | partner_feed | 제휴/운영 피드 담당 | 3 | d011 | d024 | d029 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | SSG닷컴 운영 피드에 imageUrl 또는 thumbnail 필드 포함 요청 |
| 11번가 | 9 | partner_feed | 제휴/운영 피드 담당 | 3 | d015 | d048 | d081 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 11번가 운영 피드에 imageUrl 또는 thumbnail 필드 포함 요청 |
| 무신사 | 5 | official_batch | 상품 운영 담당 | 5 | d020 | d037 | d086 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 무신사 공식 상세 페이지 이미지 후보를 배치 검수 |
| 하이마트 | 5 | official_batch | 상품 운영 담당 | 5 | d013 | d026 | d036 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 하이마트 공식 상세 페이지 이미지 후보를 배치 검수 |
| 올리브영 | 4 | official_batch | 상품 운영 담당 | 5 | d022 | d025 | d040 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 올리브영 공식 상세 페이지 이미지 후보를 배치 검수 |
| 마켓컬리 | 3 | official_batch | 상품 운영 담당 | 5 | d018 | d082 | d095 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 마켓컬리 공식 상세 페이지 이미지 후보를 배치 검수 |
| 메가MGC커피 | 2 | manual_review | 데일리 검수 담당 | 7 | d076 | d117 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 메가MGC커피 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 이마트몰 | 2 | manual_review | 데일리 검수 담당 | 7 | d041 | d064 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 이마트몰 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 인터파크투어 | 2 | manual_review | 데일리 검수 담당 | 7 | d021 | d051 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 인터파크투어 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 카카오페이 | 2 | manual_review | 데일리 검수 담당 | 7 | d054 | d071 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 카카오페이 클릭 상위 상품부터 대표 이미지 수동 보강 |
| GS SHOP | 2 | manual_review | 데일리 검수 담당 | 7 | d027 | d038 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | GS SHOP 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 네이버쇼핑 | 1 | manual_review | 데일리 검수 담당 | 7 | d047 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 네이버쇼핑 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 네이버페이 | 1 | manual_review | 데일리 검수 담당 | 7 | d053 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 네이버페이 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 네이버플러스 | 1 | manual_review | 데일리 검수 담당 | 7 | d072 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 네이버플러스 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 롯데시네마 | 1 | manual_review | 데일리 검수 담당 | 7 | d075 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 롯데시네마 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 맘큐 | 1 | manual_review | 데일리 검수 담당 | 7 | d069 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 맘큐 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 배달의민족 | 1 | manual_review | 데일리 검수 담당 | 7 | d058 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 배달의민족 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 세븐일레븐 | 1 | manual_review | 데일리 검수 담당 | 7 | d062 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 세븐일레븐 클릭 상위 상품부터 대표 이미지 수동 보강 |
| 스타벅스 | 1 | manual_review | 데일리 검수 담당 | 7 | d066 | productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 | 스타벅스 클릭 상위 상품부터 대표 이미지 수동 보강 |

## Priority Backlog

| Rank | ID | 판매처 | 카테고리 | 상품명 | 우선순위 | 운영 사유 | 이미지 후보 검색 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | d011 | SSG닷컴 | 식품 | 프리미엄 한우 불고기 600g | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%ED%95%9C%EC%9A%B0%20%EB%B6%88%EA%B3%A0%EA%B8%B0%20600g%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 2 | d013 | 하이마트 | 가전 | 삼성 55형 4K UHD TV | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%EC%82%BC%EC%84%B1%2055%ED%98%95%204K%20UHD%20TV%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 3 | d014 | 쿠팡 | 전자기기 | 애플워치 호환 스포츠 밴드 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%95%A0%ED%94%8C%EC%9B%8C%EC%B9%98%20%ED%98%B8%ED%99%98%20%EC%8A%A4%ED%8F%AC%EC%B8%A0%20%EB%B0%B4%EB%93%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 4 | d015 | 11번가 | 생활용품 | 대용량 캡슐세제 80개입 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=11%EB%B2%88%EA%B0%80%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%BA%A1%EC%8A%90%EC%84%B8%EC%A0%9C%2080%EA%B0%9C%EC%9E%85%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 5 | d018 | 마켓컬리 | 식품 | 무항생제 계란 30구 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A7%88%EC%BC%93%EC%BB%AC%EB%A6%AC%20%EB%AC%B4%ED%95%AD%EC%83%9D%EC%A0%9C%20%EA%B3%84%EB%9E%80%2030%EA%B5%AC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 6 | d019 | 오늘의집 | 생활용품 | 원목 수납장 3단 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A4%EB%8A%98%EC%9D%98%EC%A7%91%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 7 | d020 | 무신사 | 의류 | 아웃도어 프로덕츠 3PACK 티셔츠 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%8B%A0%EC%82%AC%20%EC%95%84%EC%9B%83%EB%8F%84%EC%96%B4%20%ED%94%84%EB%A1%9C%EB%8D%95%EC%B8%A0%203PACK%20%ED%8B%B0%EC%85%94%EC%B8%A0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 8 | d021 | 인터파크투어 | 여행/티켓 | [제주] 제주투어패스 타임제로 자유이용권 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%9D%B8%ED%84%B0%ED%8C%8C%ED%81%AC%ED%88%AC%EC%96%B4%20%5B%EC%A0%9C%EC%A3%BC%5D%20%EC%A0%9C%EC%A3%BC%ED%88%AC%EC%96%B4%ED%8C%A8%EC%8A%A4%20%ED%83%80%EC%9E%84%EC%A0%9C%EB%A1%9C%20%EC%9E%90%EC%9C%A0%EC%9D%B4%EC%9A%A9%EA%B6%8C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 9 | d022 | 올리브영 | 뷰티 | JMW BLDC 에어원 드라이어 MC4B03C | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20JMW%20BLDC%20%EC%97%90%EC%96%B4%EC%9B%90%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EC%96%B4%20MC4B03C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 10 | d023 | 아이프라브 | 기타 | 확장형 5휠 밸런스 큐브 캐리어 24인치 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%95%84%EC%9D%B4%ED%94%84%EB%9D%BC%EB%B8%8C%20%ED%99%95%EC%9E%A5%ED%98%95%205%ED%9C%A0%20%EB%B0%B8%EB%9F%B0%EC%8A%A4%20%ED%81%90%EB%B8%8C%20%EC%BA%90%EB%A6%AC%EC%96%B4%2024%EC%9D%B8%EC%B9%98%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 11 | d024 | SSG닷컴 | 식품 | 프리미엄 생수 2L 24병 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%EC%83%9D%EC%88%98%202L%2024%EB%B3%91%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 12 | d025 | 올리브영 | 뷰티 | 선크림 1+1 기획 | high | 주간 보강 배치 상위 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%84%A0%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 13 | d026 | 하이마트 | 전자기기 | HP 오멘 16-am0121TX RTX5070 게이밍노트북 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20HP%20%EC%98%A4%EB%A9%98%2016-am0121TX%20RTX5070%20%EA%B2%8C%EC%9D%B4%EB%B0%8D%EB%85%B8%ED%8A%B8%EB%B6%81%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 14 | d027 | GS SHOP | 육아 | 군 기저귀 프리미엄 밴드 대형 36P 4팩 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=GS%20SHOP%20%EA%B5%B0%20%EA%B8%B0%EC%A0%80%EA%B7%80%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%EB%B0%B4%EB%93%9C%20%EB%8C%80%ED%98%95%2036P%204%ED%8C%A9%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 15 | d028 | 쿠팡 | 생활용품 | 워터픽 나노 패밀리팩 구강세정기 | medium | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%8C%ED%84%B0%ED%94%BD%20%EB%82%98%EB%85%B8%20%ED%8C%A8%EB%B0%80%EB%A6%AC%ED%8C%A9%20%EA%B5%AC%EA%B0%95%EC%84%B8%EC%A0%95%EA%B8%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 16 | d029 | SSG닷컴 | 가전 | 422 올스텐 에어프라이어 7L 대용량 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20422%20%EC%98%AC%EC%8A%A4%ED%85%90%20%EC%97%90%EC%96%B4%ED%94%84%EB%9D%BC%EC%9D%B4%EC%96%B4%207L%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 17 | d030 | 쿠팡 | 전자기기 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20Apple%202025%20%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%20A16%2011%EC%84%B8%EB%8C%80%20128GB%20Wi-Fi%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 18 | d031 | 쿠팡 | 생활용품 | 원목 수납장 3단 다용도 월넛 유리 거실장 | medium | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EB%8B%A4%EC%9A%A9%EB%8F%84%20%EC%9B%94%EB%84%9B%20%EC%9C%A0%EB%A6%AC%20%EA%B1%B0%EC%8B%A4%EC%9E%A5%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 19 | d032 | SSG닷컴 | 뷰티 | 명품 향수 50ml | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%EB%AA%85%ED%92%88%20%ED%96%A5%EC%88%98%2050ml%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 20 | d033 | 코레일관광 | 여행/티켓 | 부산 주말 KTX 연계 숙박 패키지 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BD%94%EB%A0%88%EC%9D%BC%EA%B4%80%EA%B4%91%20%EB%B6%80%EC%82%B0%20%EC%A3%BC%EB%A7%90%20KTX%20%EC%97%B0%EA%B3%84%20%EC%88%99%EB%B0%95%20%ED%8C%A8%ED%82%A4%EC%A7%80%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 21 | d035 | 쿠팡 | 식품 | 로켓프레시 친환경 토마토 2kg | medium | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EB%A1%9C%EC%BC%93%ED%94%84%EB%A0%88%EC%8B%9C%20%EC%B9%9C%ED%99%98%EA%B2%BD%20%ED%86%A0%EB%A7%88%ED%86%A0%202kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 22 | d036 | 하이마트 | 가전 | 허밍 무선청소기 HML-VC2502W 물걸레 세트 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%ED%97%88%EB%B0%8D%20%EB%AC%B4%EC%84%A0%EC%B2%AD%EC%86%8C%EA%B8%B0%20HML-VC2502W%20%EB%AC%BC%EA%B1%B8%EB%A0%88%20%EC%84%B8%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 23 | d037 | 무신사 | 의류 | 더니트컴퍼니 수피마 에센셜 티셔츠 3PACK | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%8B%A0%EC%82%AC%20%EB%8D%94%EB%8B%88%ED%8A%B8%EC%BB%B4%ED%8D%BC%EB%8B%88%20%EC%88%98%ED%94%BC%EB%A7%88%20%EC%97%90%EC%84%BC%EC%85%9C%20%ED%8B%B0%EC%85%94%EC%B8%A0%203PACK%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 24 | d038 | GS SHOP | 육아 | 군 기저귀 프리미엄 팬티 대형 32P 4팩 | medium | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=GS%20SHOP%20%EA%B5%B0%20%EA%B8%B0%EC%A0%80%EA%B7%80%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%ED%8C%AC%ED%8B%B0%20%EB%8C%80%ED%98%95%2032P%204%ED%8C%A9%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 25 | d039 | 인터파크 | 여행/티켓 | 뮤지컬 태권 날아올라 R석 타임세일 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%9D%B8%ED%84%B0%ED%8C%8C%ED%81%AC%20%EB%AE%A4%EC%A7%80%EC%BB%AC%20%ED%83%9C%EA%B6%8C%20%EB%82%A0%EC%95%84%EC%98%AC%EB%9D%BC%20R%EC%84%9D%20%ED%83%80%EC%9E%84%EC%84%B8%EC%9D%BC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 26 | d040 | 올리브영 | 뷰티 | 아이보들 CCP 크림 1+1 기획 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%95%84%EC%9D%B4%EB%B3%B4%EB%93%A4%20CCP%20%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 27 | d041 | 이마트몰 | 편의점/마트 | 노브랜드 물티슈 100매 20팩 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%9D%B4%EB%A7%88%ED%8A%B8%EB%AA%B0%20%EB%85%B8%EB%B8%8C%EB%9E%9C%EB%93%9C%20%EB%AC%BC%ED%8B%B0%EC%8A%88%20100%EB%A7%A4%2020%ED%8C%A9%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 28 | d042 | GS25 | 쿠폰/이벤트 | 편의점 도시락 1+1 모바일 쿠폰 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=GS25%20%ED%8E%B8%EC%9D%98%EC%A0%90%20%EB%8F%84%EC%8B%9C%EB%9D%BD%201%2B1%20%EB%AA%A8%EB%B0%94%EC%9D%BC%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 29 | d043 | 알리익스프레스 | 전자기기 | USB-C 100W 멀티 충전 케이블 3팩 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%95%8C%EB%A6%AC%EC%9D%B5%EC%8A%A4%ED%94%84%EB%A0%88%EC%8A%A4%20USB-C%20100W%20%EB%A9%80%ED%8B%B0%20%EC%B6%A9%EC%A0%84%20%EC%BC%80%EC%9D%B4%EB%B8%94%203%ED%8C%A9%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 30 | d044 | 옥션 | 식품 | 국내산 냉동 블루베리 1kg | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A5%EC%85%98%20%EA%B5%AD%EB%82%B4%EC%82%B0%20%EB%83%89%EB%8F%99%20%EB%B8%94%EB%A3%A8%EB%B2%A0%EB%A6%AC%201kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 31 | d045 | SSG닷컴 | 쿠폰/이벤트 | 스타벅스 아메리카노 모바일 교환권 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%EC%8A%A4%ED%83%80%EB%B2%85%EC%8A%A4%20%EC%95%84%EB%A9%94%EB%A6%AC%EC%B9%B4%EB%85%B8%20%EB%AA%A8%EB%B0%94%EC%9D%BC%20%EA%B5%90%ED%99%98%EA%B6%8C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 32 | d046 | 쿠팡 | 편의점/마트 | 탐사수 무라벨 2L 24병 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%83%90%EC%82%AC%EC%88%98%20%EB%AC%B4%EB%9D%BC%EB%B2%A8%202L%2024%EB%B3%91%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 33 | d047 | 네이버쇼핑 | 쿠폰/이벤트 | 주유권 5만원권 카드 청구할인 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%84%A4%EC%9D%B4%EB%B2%84%EC%87%BC%ED%95%91%20%EC%A3%BC%EC%9C%A0%EA%B6%8C%205%EB%A7%8C%EC%9B%90%EA%B6%8C%20%EC%B9%B4%EB%93%9C%20%EC%B2%AD%EA%B5%AC%ED%95%A0%EC%9D%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 34 | d048 | 11번가 | 육아 | 메듀즈 키즈 아쿠아샌들 젤리슈즈 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=11%EB%B2%88%EA%B0%80%20%EB%A9%94%EB%93%80%EC%A6%88%20%ED%82%A4%EC%A6%88%20%EC%95%84%EC%BF%A0%EC%95%84%EC%83%8C%EB%93%A4%20%EC%A0%A4%EB%A6%AC%EC%8A%88%EC%A6%88%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 35 | d050 | 올리브영 | 뷰티 | 멀티비타민 90정 기획세트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EB%A9%80%ED%8B%B0%EB%B9%84%ED%83%80%EB%AF%BC%2090%EC%A0%95%20%EA%B8%B0%ED%9A%8D%EC%84%B8%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 36 | d051 | 인터파크투어 | 여행/티켓 | 오사카 왕복 항공권 타임세일 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%9D%B8%ED%84%B0%ED%8C%8C%ED%81%AC%ED%88%AC%EC%96%B4%20%EC%98%A4%EC%82%AC%EC%B9%B4%20%EC%99%95%EB%B3%B5%20%ED%95%AD%EA%B3%B5%EA%B6%8C%20%ED%83%80%EC%9E%84%EC%84%B8%EC%9D%BC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 37 | d052 | SSG닷컴 | 생활용품 | 암막 커튼 2장 세트 와인 132x160cm | low | 재방문 빈도가 높은 생활형 카테고리 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%EC%95%94%EB%A7%89%20%EC%BB%A4%ED%8A%BC%202%EC%9E%A5%20%EC%84%B8%ED%8A%B8%20%EC%99%80%EC%9D%B8%20132x160cm%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 38 | d053 | 네이버페이 | 쿠폰/이벤트 | 네이버페이 첫 결제 3천 포인트 적립 이벤트 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EB%84%A4%EC%9D%B4%EB%B2%84%ED%8E%98%EC%9D%B4%20%EB%84%A4%EC%9D%B4%EB%B2%84%ED%8E%98%EC%9D%B4%20%EC%B2%AB%20%EA%B2%B0%EC%A0%9C%203%EC%B2%9C%20%ED%8F%AC%EC%9D%B8%ED%8A%B8%20%EC%A0%81%EB%A6%BD%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 39 | d054 | 카카오페이 | 쿠폰/이벤트 | 카카오페이 편의점 결제 2천원 쿠폰 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%ED%8E%B8%EC%9D%98%EC%A0%90%20%EA%B2%B0%EC%A0%9C%202%EC%B2%9C%EC%9B%90%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| 40 | d055 | 토스 | 쿠폰/이벤트 | 토스 출석체크 매일 포인트 적립 | low | 60% 출시 이미지 목표 달성을 위한 fallback 보강 후보 | [검색](https://search.shopping.naver.com/search/all?query=%ED%86%A0%EC%8A%A4%20%ED%86%A0%EC%8A%A4%20%EC%B6%9C%EC%84%9D%EC%B2%B4%ED%81%AC%20%EB%A7%A4%EC%9D%BC%20%ED%8F%AC%EC%9D%B8%ED%8A%B8%20%EC%A0%81%EB%A6%BD%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |

## Generated Files

- Root CSV: `IMAGE_BACKLOG.csv`
- Next batch CSV: `IMAGE_BACKLOG_NEXT_BATCH.csv`
- Mall request CSV: `IMAGE_BACKLOG_MALL_REQUESTS.csv`
- Root JSON: `IMAGE_BACKLOG.json`
- Docs report: `docs/IMAGE_BACKLOG_REPORT.md`
