# 할인도사 Harness Report

Started: 2026-06-07T19:47:13.193Z
Finished: 2026-06-07T19:47:35.164Z
Status: PASS

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
| lint | PASS | 15.6s |
| test:mobile-ux | PASS | 0.6s |
| test:home-realtime | PASS | 4.7s |
| test:seo | PASS | 0.6s |
| test:perf | PASS | 0.5s |

## Step Output

### lint

```text
See streamed console output.
```

### test:mobile-ux

```text
See streamed console output.
```

### test:home-realtime

```text
See streamed console output.
```

### test:seo

```text
See streamed console output.
```

### test:perf

```text
See streamed console output.
```


## Policy

- 검증된 구매 링크만 기본 노출합니다.
- 구매 이동은 내부 /go 라우트를 거쳐 새 탭으로 열리게 유지합니다.
- 외부 링크는 opener 접근을 막고, 앱 화면을 덮지 않도록 새 탭/외부 브라우저 정책을 검사합니다.
- 상품 이미지는 고정 비율, lazy loading, fallback 정책을 검사합니다.
- 하단 탭은 홈, 인기, 카테고리, 마이 4개만 유지합니다.
- 모바일 첫 화면은 검색, compact 필터, 핵심 특가 리스트를 우선합니다.
