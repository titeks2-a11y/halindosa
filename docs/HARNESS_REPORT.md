# 할인도사 Harness Report

Started: 2026-06-09T20:36:04.134Z
Finished: 2026-06-09T20:36:25.149Z
Status: PASS

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
| lint | PASS | 17.0s |
| test:mobile-ux | PASS | 0.6s |
| home:realtime:doctor | PASS | 0.5s |
| security:check | PASS | 0.8s |
| benefit:priority:doctor | PASS | 0.5s |
| benefit:event:contract | PASS | 0.5s |
| test:seo | PASS | 0.5s |
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

### home:realtime:doctor

```text
See streamed console output.
```

### security:check

```text
See streamed console output.
```

### benefit:priority:doctor

```text
See streamed console output.
```

### benefit:event:contract

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
- 홈 상단 혜택은 쇼핑몰, 브랜드, 쿠폰, 샘플, 편의점/마트, 포인트처럼 사용자가 바로 클릭할 소비자형 혜택을 우선하고 공공/정책성 혜택은 낮은 우선순위로 분리합니다.
