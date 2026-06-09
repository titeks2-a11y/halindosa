# 할인도사 Harness Report

Started: 2026-06-09T02:01:01.834Z
Finished: 2026-06-09T02:03:05.051Z
Status: PASS

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
| lint | PASS | 16.0s |
| build | PASS | 27.1s |
| verify:links | PASS | 3.1s |
| test:external-links | PASS | 0.6s |
| test:images | PASS | 0.5s |
| news:images:enrich | PASS | 9.1s |
| verify:images | PASS | 0.6s |
| image:operations:doctor | PASS | 0.5s |
| test:search | PASS | 7.6s |
| test:ui | PASS | 0.5s |
| test:mobile-ux | PASS | 0.5s |
| test:mobile-compact | PASS | 0.5s |
| home:realtime:doctor | PASS | 0.5s |
| test:home-realtime | PASS | 4.4s |
| test:seo | PASS | 0.6s |
| test:perf | PASS | 0.5s |
| security:check | PASS | 0.8s |
| benefit:event:contract | PASS | 0.5s |
| smoke:local | PASS | 47.6s |
| release:doctor | PASS | 1.8s |

## Step Output

### lint

```text
See streamed console output.
```

### build

```text
See streamed console output.
```

### verify:links

```text
See streamed console output.
```

### test:external-links

```text
See streamed console output.
```

### test:images

```text
See streamed console output.
```

### news:images:enrich

```text
See streamed console output.
```

### verify:images

```text
See streamed console output.
```

### image:operations:doctor

```text
See streamed console output.
```

### test:search

```text
See streamed console output.
```

### test:ui

```text
See streamed console output.
```

### test:mobile-ux

```text
See streamed console output.
```

### test:mobile-compact

```text
See streamed console output.
```

### home:realtime:doctor

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

### security:check

```text
See streamed console output.
```

### benefit:event:contract

```text
See streamed console output.
```

### smoke:local

```text
See streamed console output.
```

### release:doctor

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
