# 할인도사 Image Verification Report

Generated: 2026-06-06T07:12:03.577Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| Checks | 10/10 |
| Explicit image line rate | 75% |
| Generated placeholder assets | 11 |

## Checks

- PASS deal image schema: Deal 표준 타입이 imageType과 qualityScore를 명시합니다.
- PASS normalizer image fields: 정규화 단계에서 imageType과 qualityScore를 모든 상품에 채우고 낮은 품질 항목을 publishable에서 제외합니다.
- PASS image type resolver: 이미지 resolver가 공식/생성/fallback 이미지를 구분합니다.
- PASS quality score image weighting: qualityScore가 최신성, 링크 검증, 이미지 타입, 신고/숨김 상태를 반영합니다.
- PASS ranking quality score: 홈/추천 랭킹에 qualityScore가 반영됩니다.
- PASS generated placeholder mapping: 11개 카테고리 생성 placeholder가 mock 데이터 fallback으로 연결되어 있습니다.
- PASS generated placeholder assets: 생성 placeholder는 gradient/icon 기반 SVG이며 실제 상품 사진을 가장하지 않습니다.
- PASS image rendering components: 주요 카드/피드 컴포넌트가 lazy loading, async decoding, object-cover, no-referrer를 유지합니다.
- PASS local image proxy: 로컬 개발에서 차단 가능성이 높은 이미지 호스트는 프록시 유틸을 통과합니다.
- PASS explicit image floor: 명시 이미지 또는 파생 가능 이미지 라인이 105/140개(75%)입니다.
