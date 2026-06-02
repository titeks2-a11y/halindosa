# 할인도사 Mobile UX Report

Generated: 2026-06-02

## Current Mobile Structure

1. 브랜드/상단 상태
2. compact 검색
3. 추천 검색어/최근 검색어
4. compact 필터 chip
5. 검증 링크 상품 리스트
6. 하단 탭 `홈`, `인기`, `카테고리`, `마이`

## Improvements Preserved

- 하단 탭 safe-area padding 유지
- 초기 홈 상품 렌더 제한 `INITIAL_HOME_DEAL_LIMIT = 12` 유지
- 상품 카드는 이미지, 쇼핑몰, 상품명, 할인/가격, 배송, 마감, 찜, 공유, 구매 CTA 중심으로 압축
- 상세 필터와 긴 분석 영역은 접힘/반응형 숨김 구조로 유지
- 구매 이동은 앱 화면을 덮지 않고 확인 시트 후 새 탭/외부 브라우저로 이동

## UX Guardrails

- 중복 검색창을 만들지 않는다.
- 첫 화면을 긴 설명 카드로 채우지 않는다.
- CTA는 손가락으로 누르기 쉬운 크기를 유지한다.
- 상품이 없는 검색 결과는 빈 상태와 추천 액션을 제공한다.

## Remaining Manual QA

- 실제 Android 기기에서 하단 탭과 구매 확인 시트가 겹치지 않는지 확인
- iOS Safari/WebView에서 safe-area inset 반영 확인
- 배포 URL 기준 390x844, 430x932, 768x1024 화면 스크린샷 회귀 확인
