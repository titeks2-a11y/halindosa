# 할인도사 Image Verification Report

Generated: 2026-06-06T15:40:10.564Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| Checks | 19/19 |
| Explicit image line rate | 66% |
| Renderable visible image rate | 100% |
| Official/derived image rate | 66% |
| Official/derived images | 93 |
| Generated placeholders | 47 |
| Missing image fallback | 0 |
| Generated placeholder assets | 11 |
| Official benefit renderable images | 78/78 |
| Official benefit OG/schema mappings | 35 |
| Official benefit official images | 35 |
| Official benefit generated images | 43 |
| Official benefit low quality | 0 |

## Checks

- PASS deal image schema: Deal 표준 타입이 imageType과 qualityScore를 명시합니다.
- PASS official benefit image schema: 공식 혜택 타입이 imageType과 qualityScore를 명시합니다.
- PASS official benefit image normalization: 공식 혜택 정규화 단계가 생성 placeholder와 qualityScore를 자동으로 채웁니다.
- PASS official benefit verified image mapping: 공식 혜택 35개가 OG/schema 이미지 매핑을 우선 사용합니다.
- PASS normalizer image fields: 정규화 단계에서 imageType과 qualityScore를 모든 상품에 채우고 낮은 품질 항목을 publishable에서 제외합니다.
- PASS image type resolver: 이미지 resolver가 공식/생성/fallback 이미지를 구분합니다.
- PASS quality score image weighting: qualityScore가 최신성, 링크 검증, 이미지 타입, 신고/숨김 상태를 반영합니다.
- PASS ranking quality score: 홈/추천 랭킹에 qualityScore가 반영됩니다.
- PASS generated placeholder mapping: 11개 카테고리 생성 placeholder가 mock 데이터 fallback으로 연결되어 있습니다.
- PASS generated placeholder assets: 생성 placeholder는 gradient/icon 기반 SVG이며 실제 상품 사진을 가장하지 않습니다.
- PASS image rendering components: 주요 카드/피드 컴포넌트가 lazy loading, async decoding, object-cover, no-referrer를 유지합니다.
- PASS local image proxy: 로컬 개발에서 차단 가능성이 높은 이미지 호스트는 프록시 유틸을 통과하고, 깨진 이미지는 카테고리 생성 placeholder로 대체됩니다.
- PASS runtime broken image fallback: 주요 카드/피드 컴포넌트가 이미지 로딩 실패 시 1회성 생성 placeholder로 자동 전환합니다.
- PASS explicit image floor: 명시 이미지 또는 파생 가능 이미지 라인이 93/140개(66%)입니다.
- PASS publishable image exposure audit: 노출 상품 140개 모두 공식/파생/생성 이미지로 렌더링 가능합니다.
- PASS official image operating floor: 공식/파생 이미지 비율이 66%입니다.
- PASS official benefit image exposure audit: 공식 혜택 78개 모두 렌더 가능한 이미지와 qualityScore 70 이상을 갖습니다.
- PASS official benefit image operating floor: 공식 혜택 35/78개가 공식 OG/schema 이미지를 사용합니다.
- PASS verified product image priority: 검증된 공식 상품/혜택 이미지가 명시 이미지와 생성 placeholder보다 먼저 적용됩니다.
