# Official Benefit Image Enrichment Report

Generated: 2026-06-09T20:22:16.804Z

| Metric | Value |
| --- | ---: |
| Visible official benefits | 130 |
| Newly found official images | 80 |
| Retained official image mappings | 109 |
| Failed probes | 50 |

## Failure Reasons

- no_meta_image: 29
- image_405: 2
- image_too_small: 4
- page_200_unknown: 3
- image_200: 2
- page_500_text/html; charset=utf-8: 1
- TypeError: 1
- page_401_text/html;charset=UTF-8: 1
- page_403_text/html: 1
- image_400: 1
- image_404: 3
- AbortError: 2

## Policy

- 공식 혜택 이미지는 `og:image`, `twitter:image`, `image_src`, JSON-LD `image` 후보만 사용합니다.
- favicon, noimage, placeholder, tracking pixel 계열 이미지는 제외합니다.
- 실패한 항목은 사용자 화면에서 생성 placeholder로 대체하며 실제 상품 사진처럼 가장하지 않습니다.
