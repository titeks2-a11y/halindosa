# Official Benefit Image Enrichment Report

Generated: 2026-06-06T17:52:45.805Z

| Metric | Value |
| --- | ---: |
| Visible official benefits | 91 |
| Newly found official images | 40 |
| Retained official image mappings | 41 |
| Failed probes | 51 |

## Failure Reasons

- no_meta_image: 36
- page_403_text/html; charset=UTF-8: 2
- page_404_text/html; charset=UTF-8: 1
- image_TypeError: 1
- page_403_text/html: 1
- page_200_unknown: 2
- image_200: 1
- image_404: 4
- AbortError: 3

## Policy

- 공식 혜택 이미지는 `og:image`, `twitter:image`, `image_src`, JSON-LD `image` 후보만 사용합니다.
- favicon, noimage, placeholder, tracking pixel 계열 이미지는 제외합니다.
- 실패한 항목은 사용자 화면에서 생성 placeholder로 대체하며 실제 상품 사진처럼 가장하지 않습니다.
