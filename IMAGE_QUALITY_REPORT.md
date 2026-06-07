# 할인도사 Image Quality Report

Generated: 2026-06-07T18:41:45.206Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | 140 |
| 명시 이미지 상품 수 | 93 |
| 이미지 없는 상품 수 | 47 |
| 명시 이미지 커버리지 | 66% |
| 명시 이미지 최소 기준 | 25% |
| 카테고리 fallback 적용 | 예 |
| 혜택 유형 fallback 적용 | 예 |
| 실제 렌더링 이미지 커버리지 | 100% |
| 로컬 이미지 수 | 26 |
| 원격 이미지 수 | 89 |
| fallback 카테고리 수 | 10 |

## Image Policy

- 상품 이미지는 고정 비율 컨테이너 안에서 object-cover로 렌더링합니다.
- 로컬 개발에서 일부 커뮤니티 CDN 이미지는 /api/image 프록시를 거칩니다.
- 이미지가 없는 상품은 카테고리별 할인도사 브랜드 썸네일을 자동 적용하되, 실제 운영 데이터에서는 상품 이미지 보강을 우선합니다.
- G마켓 검증 구매 상세 URL은 상품 코드 기반 공식 이미지 CDN URL을 자동 파생해 category fallback보다 먼저 사용합니다.
- 공식 상세 페이지에서 검증한 og:image, schema image, 공식 CDN 이미지는 verifiedProductImages 매핑으로 category fallback보다 먼저 사용합니다.
- 홈 상단 랭킹은 실상품 이미지 보유 상품에 가산점을 주고 카테고리 fallback 상품의 상단 쏠림을 줄입니다.

## Local Images

- /deal-images/benefit-coupon.svg
- /deal-images/benefit-delivery.svg
- /deal-images/benefit-experience.svg
- /deal-images/benefit-freebie.svg
- /deal-images/benefit-mart.svg
- /deal-images/benefit-point.svg
- /deal-images/category-appliance.svg
- /deal-images/category-baby.svg
- /deal-images/category-beauty.svg
- /deal-images/category-coupon.svg
- /deal-images/category-digital.svg
- /deal-images/category-etc.svg
- /deal-images/category-fashion.svg
- /deal-images/category-food.svg
- /deal-images/category-living.svg
- /deal-images/category-travel.svg
- /deal-images/live-707648.jpg
- /deal-images/live-707782.jpg
- /deal-images/live-707783.jpg
- /deal-images/live-707784.jpg
- /deal-images/live-707785.jpg
- /deal-images/live-707786.jpg
- /deal-images/live-707787.jpg
- /deal-images/live-707788.jpg
- /deal-images/live-707790.jpg
- /deal-images/live-707791.jpg

## Fallback By Category

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

## Image Backlog

운영자는 아래 상품부터 판매처 상세 페이지 또는 공식 제휴 피드의 대표 이미지를 확인해 `imageUrl` 또는 `thumbnail`에 보강합니다. 카테고리 fallback은 화면 안정장치이며, 신규 운영 피드 ready 조건으로 보지 않습니다.

| ID | 판매처 | 카테고리 | 상품명 | 이미지 후보 검색 |
| --- | --- | --- | --- | --- |
| d013 | 하이마트 | 가전 | 삼성 55형 4K UHD TV | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%EC%82%BC%EC%84%B1%2055%ED%98%95%204K%20UHD%20TV%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d014 | 쿠팡 | 전자기기 | 애플워치 호환 스포츠 밴드 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%95%A0%ED%94%8C%EC%9B%8C%EC%B9%98%20%ED%98%B8%ED%99%98%20%EC%8A%A4%ED%8F%AC%EC%B8%A0%20%EB%B0%B4%EB%93%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d019 | 오늘의집 | 생활용품 | 원목 수납장 3단 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A4%EB%8A%98%EC%9D%98%EC%A7%91%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d022 | 올리브영 | 뷰티 | JMW BLDC 에어원 드라이어 MC4B03C | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20JMW%20BLDC%20%EC%97%90%EC%96%B4%EC%9B%90%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EC%96%B4%20MC4B03C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d025 | 올리브영 | 뷰티 | 선크림 1+1 기획 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%84%A0%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d028 | 쿠팡 | 생활용품 | 워터픽 나노 패밀리팩 구강세정기 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%8C%ED%84%B0%ED%94%BD%20%EB%82%98%EB%85%B8%20%ED%8C%A8%EB%B0%80%EB%A6%AC%ED%8C%A9%20%EA%B5%AC%EA%B0%95%EC%84%B8%EC%A0%95%EA%B8%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d030 | 쿠팡 | 전자기기 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20Apple%202025%20%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%20A16%2011%EC%84%B8%EB%8C%80%20128GB%20Wi-Fi%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d031 | 쿠팡 | 생활용품 | 원목 수납장 3단 다용도 월넛 유리 거실장 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EB%8B%A4%EC%9A%A9%EB%8F%84%20%EC%9B%94%EB%84%9B%20%EC%9C%A0%EB%A6%AC%20%EA%B1%B0%EC%8B%A4%EC%9E%A5%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d035 | 쿠팡 | 식품 | 로켓프레시 친환경 토마토 2kg | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EB%A1%9C%EC%BC%93%ED%94%84%EB%A0%88%EC%8B%9C%20%EC%B9%9C%ED%99%98%EA%B2%BD%20%ED%86%A0%EB%A7%88%ED%86%A0%202kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d040 | 올리브영 | 뷰티 | 아이보들 CCP 크림 1+1 기획 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%95%84%EC%9D%B4%EB%B3%B4%EB%93%A4%20CCP%20%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d044 | 옥션 | 식품 | 국내산 냉동 블루베리 1kg | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A5%EC%85%98%20%EA%B5%AD%EB%82%B4%EC%82%B0%20%EB%83%89%EB%8F%99%20%EB%B8%94%EB%A3%A8%EB%B2%A0%EB%A6%AC%201kg%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d046 | 쿠팡 | 편의점/마트 | 탐사수 무라벨 2L 24병 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%ED%83%90%EC%82%AC%EC%88%98%20%EB%AC%B4%EB%9D%BC%EB%B2%A8%202L%2024%EB%B3%91%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d050 | 올리브영 | 뷰티 | 멀티비타민 90정 기획세트 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EB%A9%80%ED%8B%B0%EB%B9%84%ED%83%80%EB%AF%BC%2090%EC%A0%95%20%EA%B8%B0%ED%9A%8D%EC%84%B8%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d053 | BC카드 | 쿠폰/이벤트 | BC카드 페이북 보너스 머니박스 이벤트 | [검색](https://search.shopping.naver.com/search/all?query=BC%EC%B9%B4%EB%93%9C%20BC%EC%B9%B4%EB%93%9C%20%ED%8E%98%EC%9D%B4%EB%B6%81%20%EB%B3%B4%EB%84%88%EC%8A%A4%20%EB%A8%B8%EB%8B%88%EB%B0%95%EC%8A%A4%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d054 | 카카오페이 | 쿠폰/이벤트 | 카카오페이 편의점 결제 2천원 쿠폰 | [검색](https://search.shopping.naver.com/search/all?query=%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%20%ED%8E%B8%EC%9D%98%EC%A0%90%20%EA%B2%B0%EC%A0%9C%202%EC%B2%9C%EC%9B%90%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d057 | T멤버십 | 쿠폰/이벤트 | T멤버십 커피 무료 사이즈업 쿠폰 | [검색](https://search.shopping.naver.com/search/all?query=T%EB%A9%A4%EB%B2%84%EC%8B%AD%20T%EB%A9%A4%EB%B2%84%EC%8B%AD%20%EC%BB%A4%ED%94%BC%20%EB%AC%B4%EB%A3%8C%20%EC%82%AC%EC%9D%B4%EC%A6%88%EC%97%85%20%EC%BF%A0%ED%8F%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d058 | 맥도날드 | 쿠폰/이벤트 | 맥도날드 공식 해피스낵 프로모션 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A7%A5%EB%8F%84%EB%82%A0%EB%93%9C%20%EB%A7%A5%EB%8F%84%EB%82%A0%EB%93%9C%20%EA%B3%B5%EC%8B%9D%20%ED%95%B4%ED%94%BC%EC%8A%A4%EB%82%B5%20%ED%94%84%EB%A1%9C%EB%AA%A8%EC%85%98%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d060 | 메가박스 | 여행/티켓 | 메가박스 공식 영화·문화 이벤트 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A9%94%EA%B0%80%EB%B0%95%EC%8A%A4%20%EB%A9%94%EA%B0%80%EB%B0%95%EC%8A%A4%20%EA%B3%B5%EC%8B%9D%20%EC%98%81%ED%99%94%C2%B7%EB%AC%B8%ED%99%94%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d061 | CU | 편의점/마트 | CU 커피·음료 1+1 모바일 쿠폰 행사 | [검색](https://search.shopping.naver.com/search/all?query=CU%20CU%20%EC%BB%A4%ED%94%BC%C2%B7%EC%9D%8C%EB%A3%8C%201%2B1%20%EB%AA%A8%EB%B0%94%EC%9D%BC%20%EC%BF%A0%ED%8F%B0%20%ED%96%89%EC%82%AC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d063 | 홈플러스 | 편의점/마트 | 홈플러스 AI 물가안정 프로젝트 장보기 특가 | [검색](https://search.shopping.naver.com/search/all?query=%ED%99%88%ED%94%8C%EB%9F%AC%EC%8A%A4%20%ED%99%88%ED%94%8C%EB%9F%AC%EC%8A%A4%20AI%20%EB%AC%BC%EA%B0%80%EC%95%88%EC%A0%95%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EC%9E%A5%EB%B3%B4%EA%B8%B0%20%ED%8A%B9%EA%B0%80%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |

## Issues

- 이미지 품질 치명 이슈 없음

## Warnings

- 경고 없음
