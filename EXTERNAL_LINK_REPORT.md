# 할인도사 External Link Safety Report

Generated: 2026-06-07T00:18:39.392Z
Status: PASS

## Summary

| Metric | Value |
| --- | ---: |
| 검사 파일 수 | 280 |
| 새 탭 링크 수 | 66 |
| /go 구매 링크 수 | 9 |
| window.open 호출 수 | 4 |
| Capacitor Browser 호출 수 | 4 |

## Policy

- 상품 상세, 구매 CTA, 외부 이동은 새 탭 또는 앱 외부 브라우저로 열립니다.
- 새 탭 링크는 opener 접근을 막기 위해 noopener noreferrer를 사용합니다.
- href="#", 빈 href, javascript: 링크는 허용하지 않습니다.

## Issues

- 외부 링크 정책 위반 없음

## Warnings

- 경고 없음
