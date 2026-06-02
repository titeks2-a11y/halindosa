# 할인도사 Image Quality Report

Generated: 2026-06-02T12:53:26.401Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | 140 |
| 명시 이미지 상품 수 | 13 |
| 이미지 없는 상품 수 | 127 |
| 명시 이미지 커버리지 | 9% |
| 카테고리 fallback 적용 | 예 |
| 실제 렌더링 이미지 커버리지 | 100% |
| 로컬 이미지 수 | 10 |
| 원격 이미지 수 | 3 |

## Image Policy

- 상품 이미지는 고정 비율 컨테이너 안에서 object-cover로 렌더링합니다.
- 로컬 개발에서 일부 커뮤니티 CDN 이미지는 /api/image 프록시를 거칩니다.
- 이미지가 없는 상품은 카테고리별 할인도사 브랜드 썸네일을 자동 적용하되, 실제 운영 데이터에서는 상품 이미지 보강을 우선합니다.

## Local Images

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

## Issues

- 이미지 품질 치명 이슈 없음

## Warnings

- 경고 없음
