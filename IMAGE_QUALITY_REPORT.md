# 할인도사 Image Quality Report

Generated: 2026-06-03T09:56:23.794Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | 140 |
| 명시 이미지 상품 수 | 39 |
| 이미지 없는 상품 수 | 101 |
| 명시 이미지 커버리지 | 28% |
| 명시 이미지 최소 기준 | 25% |
| 카테고리 fallback 적용 | 예 |
| 실제 렌더링 이미지 커버리지 | 100% |
| 로컬 이미지 수 | 20 |
| 원격 이미지 수 | 33 |
| fallback 카테고리 수 | 11 |

## Image Policy

- 상품 이미지는 고정 비율 컨테이너 안에서 object-cover로 렌더링합니다.
- 로컬 개발에서 일부 커뮤니티 CDN 이미지는 /api/image 프록시를 거칩니다.
- 이미지가 없는 상품은 카테고리별 할인도사 브랜드 썸네일을 자동 적용하되, 실제 운영 데이터에서는 상품 이미지 보강을 우선합니다.
- G마켓 검증 구매 상세 URL은 상품 코드 기반 공식 이미지 CDN URL을 자동 파생해 category fallback보다 먼저 사용합니다.
- 홈 상단 랭킹은 실상품 이미지 보유 상품에 가산점을 주고 카테고리 fallback 상품의 상단 쏠림을 줄입니다.

## Local Images

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

## Image Backlog

운영자는 아래 상품부터 판매처 상세 페이지 또는 공식 제휴 피드의 대표 이미지를 확인해 `imageUrl` 또는 `thumbnail`에 보강합니다. 카테고리 fallback은 화면 안정장치이며, 신규 운영 피드 ready 조건으로 보지 않습니다.

| ID | 판매처 | 카테고리 | 상품명 | 이미지 후보 검색 |
| --- | --- | --- | --- | --- |
| d011 | SSG닷컴 | 식품 | 프리미엄 한우 불고기 600g | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%ED%95%9C%EC%9A%B0%20%EB%B6%88%EA%B3%A0%EA%B8%B0%20600g%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d013 | 하이마트 | 가전 | 삼성 55형 4K UHD TV | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%EC%82%BC%EC%84%B1%2055%ED%98%95%204K%20UHD%20TV%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d014 | 쿠팡 | 전자기기 | 애플워치 호환 스포츠 밴드 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%95%A0%ED%94%8C%EC%9B%8C%EC%B9%98%20%ED%98%B8%ED%99%98%20%EC%8A%A4%ED%8F%AC%EC%B8%A0%20%EB%B0%B4%EB%93%9C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d015 | 11번가 | 생활용품 | 대용량 캡슐세제 80개입 | [검색](https://search.shopping.naver.com/search/all?query=11%EB%B2%88%EA%B0%80%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%BA%A1%EC%8A%90%EC%84%B8%EC%A0%9C%2080%EA%B0%9C%EC%9E%85%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d018 | 마켓컬리 | 식품 | 무항생제 계란 30구 | [검색](https://search.shopping.naver.com/search/all?query=%EB%A7%88%EC%BC%93%EC%BB%AC%EB%A6%AC%20%EB%AC%B4%ED%95%AD%EC%83%9D%EC%A0%9C%20%EA%B3%84%EB%9E%80%2030%EA%B5%AC%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d019 | 오늘의집 | 생활용품 | 원목 수납장 3단 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%A4%EB%8A%98%EC%9D%98%EC%A7%91%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d020 | 무신사 | 의류 | 아웃도어 프로덕츠 3PACK 티셔츠 | [검색](https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%8B%A0%EC%82%AC%20%EC%95%84%EC%9B%83%EB%8F%84%EC%96%B4%20%ED%94%84%EB%A1%9C%EB%8D%95%EC%B8%A0%203PACK%20%ED%8B%B0%EC%85%94%EC%B8%A0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d021 | 인터파크투어 | 여행/티켓 | [제주] 제주투어패스 타임제로 자유이용권 | [검색](https://search.shopping.naver.com/search/all?query=%EC%9D%B8%ED%84%B0%ED%8C%8C%ED%81%AC%ED%88%AC%EC%96%B4%20%5B%EC%A0%9C%EC%A3%BC%5D%20%EC%A0%9C%EC%A3%BC%ED%88%AC%EC%96%B4%ED%8C%A8%EC%8A%A4%20%ED%83%80%EC%9E%84%EC%A0%9C%EB%A1%9C%20%EC%9E%90%EC%9C%A0%EC%9D%B4%EC%9A%A9%EA%B6%8C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d022 | 올리브영 | 뷰티 | JMW BLDC 에어원 드라이어 MC4B03C | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20JMW%20BLDC%20%EC%97%90%EC%96%B4%EC%9B%90%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EC%96%B4%20MC4B03C%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d023 | 아이프라브 | 기타 | 확장형 5휠 밸런스 큐브 캐리어 24인치 | [검색](https://search.shopping.naver.com/search/all?query=%EC%95%84%EC%9D%B4%ED%94%84%EB%9D%BC%EB%B8%8C%20%ED%99%95%EC%9E%A5%ED%98%95%205%ED%9C%A0%20%EB%B0%B8%EB%9F%B0%EC%8A%A4%20%ED%81%90%EB%B8%8C%20%EC%BA%90%EB%A6%AC%EC%96%B4%2024%EC%9D%B8%EC%B9%98%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d024 | SSG닷컴 | 식품 | 프리미엄 생수 2L 24병 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%EC%83%9D%EC%88%98%202L%2024%EB%B3%91%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d025 | 올리브영 | 뷰티 | 선크림 1+1 기획 | [검색](https://search.shopping.naver.com/search/all?query=%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%84%A0%ED%81%AC%EB%A6%BC%201%2B1%20%EA%B8%B0%ED%9A%8D%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d026 | 하이마트 | 전자기기 | 게이밍 노트북 RTX 특가 | [검색](https://search.shopping.naver.com/search/all?query=%ED%95%98%EC%9D%B4%EB%A7%88%ED%8A%B8%20%EA%B2%8C%EC%9D%B4%EB%B0%8D%20%EB%85%B8%ED%8A%B8%EB%B6%81%20RTX%20%ED%8A%B9%EA%B0%80%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d027 | GS SHOP | 육아 | 군 기저귀 프리미엄 팬티 대형 4팩 | [검색](https://search.shopping.naver.com/search/all?query=GS%20SHOP%20%EA%B5%B0%20%EA%B8%B0%EC%A0%80%EA%B7%80%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%ED%8C%AC%ED%8B%B0%20%EB%8C%80%ED%98%95%204%ED%8C%A9%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d028 | 쿠팡 | 생활용품 | 워터픽 나노 패밀리팩 구강세정기 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%8C%ED%84%B0%ED%94%BD%20%EB%82%98%EB%85%B8%20%ED%8C%A8%EB%B0%80%EB%A6%AC%ED%8C%A9%20%EA%B5%AC%EA%B0%95%EC%84%B8%EC%A0%95%EA%B8%B0%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d029 | SSG닷컴 | 가전 | 422 올스텐 에어프라이어 7L 대용량 | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20422%20%EC%98%AC%EC%8A%A4%ED%85%90%20%EC%97%90%EC%96%B4%ED%94%84%EB%9D%BC%EC%9D%B4%EC%96%B4%207L%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d030 | 쿠팡 | 전자기기 | Apple 2025 아이패드 A16 11세대 128GB Wi-Fi | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20Apple%202025%20%EC%95%84%EC%9D%B4%ED%8C%A8%EB%93%9C%20A16%2011%EC%84%B8%EB%8C%80%20128GB%20Wi-Fi%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d031 | 쿠팡 | 생활용품 | 원목 수납장 3단 다용도 월넛 유리 거실장 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BF%A0%ED%8C%A1%20%EC%9B%90%EB%AA%A9%20%EC%88%98%EB%82%A9%EC%9E%A5%203%EB%8B%A8%20%EB%8B%A4%EC%9A%A9%EB%8F%84%20%EC%9B%94%EB%84%9B%20%EC%9C%A0%EB%A6%AC%20%EA%B1%B0%EC%8B%A4%EC%9E%A5%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d032 | SSG닷컴 | 뷰티 | 명품 향수 50ml | [검색](https://search.shopping.naver.com/search/all?query=SSG%EB%8B%B7%EC%BB%B4%20%EB%AA%85%ED%92%88%20%ED%96%A5%EC%88%98%2050ml%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |
| d033 | 코레일관광 | 여행/티켓 | 부산 주말 KTX 연계 숙박 패키지 | [검색](https://search.shopping.naver.com/search/all?query=%EC%BD%94%EB%A0%88%EC%9D%BC%EA%B4%80%EA%B4%91%20%EB%B6%80%EC%82%B0%20%EC%A3%BC%EB%A7%90%20KTX%20%EC%97%B0%EA%B3%84%20%EC%88%99%EB%B0%95%20%ED%8C%A8%ED%82%A4%EC%A7%80%20%EC%83%81%ED%92%88%20%EC%9D%B4%EB%AF%B8%EC%A7%80) |

## Issues

- 이미지 품질 치명 이슈 없음

## Warnings

- 경고 없음
