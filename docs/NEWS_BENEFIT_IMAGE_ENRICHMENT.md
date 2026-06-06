# Official Benefit Image Enrichment Report

Generated: 2026-06-06T21:50:11.630Z

| Metric | Value |
| --- | ---: |
| Visible official benefits | 101 |
| Newly found official images | 63 |
| Retained official image mappings | 64 |
| Failed probes | 38 |

## Failure Reasons

- no_meta_image: 17
- image_too_small: 5
- page_403_text/html; charset=UTF-8: 3
- page_404_text/html; charset=UTF-8: 1
- page_403_text/html: 2
- page_200_unknown: 2
- image_200: 2
- image_404: 3
- AbortError: 3

## Policy

- 공식 혜택 이미지는 `og:image`, `twitter:image`, `image_src`, JSON-LD `image` 후보만 사용합니다.
- favicon, noimage, placeholder, tracking pixel 계열 이미지는 제외합니다.
- 실패한 항목은 사용자 화면에서 생성 placeholder로 대체하며 실제 상품 사진처럼 가장하지 않습니다.
