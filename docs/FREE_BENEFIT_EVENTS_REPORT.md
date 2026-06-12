# Free Benefit Event Verification

Generated: 2026-06-12T06:05:50.610Z

| Metric | Value |
| --- | ---: |
| Raw deals | 197 |
| Candidate events | 197 |
| Deduped events | 197 |
| Visible active official events | 188 |
| Minimum visible events | 100 |
| No-purchase visible events | 162 |
| Purchase-required visible events | 26 |
| Blocked events | 0 |
| Expired events | 9 |
| Duplicate merged | 0 |
| Source diversity | 148 |
| Host diversity | 109 |
| Avg quality score | 100 |
| Avg freshness score | 100 |
| Avg official score | 96 |
| Avg urgency score | 41 |
| Avg reward score | 69 |

## Policy

- Only active official event, coupon, sample, free trial, point, public benefit, and free-shipping URLs can be visible.
- Search pages, homepages, community posts, news articles, private-network URLs, and expired/sold-out pages are blocked.
- Purchase-required events remain visible with lower priority and explicit condition metadata.

## Dedupe Policy

- Fields: brand, normalizedTitle, sourceDomain, benefitType, endDate, normalizedUrl
- URL normalization: lowercaseHost, stripWww, stripTrackingParams, stripHash, trimTrailingSlash, sortQueryParams
- Winner rule: highest qualityScore + priorityScore

## Dedupe Evidence

- No duplicate groups were merged in this snapshot.

## Dedupe Key Examples

- K-MOOC 블록체인·디지털 자산 공식 무료강좌: k-mooc | kmooc블록체인디지털자산공식무료강좌 | kmooc.kr | event | 2026-06-14
- GS25 드링킹 페스타 1+1·다량 구매 행사: gs25 | gs25드링킹페스타11다량구매행사 | gs25.gsretail.com | event | 2026-06-15
- K-MOOC 동역학 공식 무료강좌: k-mooc | kmooc동역학공식무료강좌 | kmooc.kr | event | 2026-06-15
- K-MOOC 예술적 얼굴과 감정조절 공식 무료강좌: k-mooc | kmooc예술적얼굴과감정조절공식무료강좌 | kmooc.kr | event | 2026-06-18
- K-MOOC 컴퓨터그래픽스 공식 무료강좌: k-mooc | kmooc컴퓨터그래픽스공식무료강좌 | kmooc.kr | event | 2026-06-21
- 서서울호수공원 유아 자연체험 6월 무료 예약: 서울특별시공공서비스예약 | 서서울호수공원유아자연체험6월무료예약 | yeyak.seoul.go.kr | event | 2026-06-25
- 우장산 청년 숲마실 힐링체험 5~6월 무료 예약: 서울특별시공공서비스예약 | 우장산청년숲마실힐링체험56월무료예약 | yeyak.seoul.go.kr | event | 2026-06-28
- 월드컵공원 누에 생태 체험 6월 무료 예약: 서울특별시공공서비스예약 | 월드컵공원누에생태체험6월무료예약 | yeyak.seoul.go.kr | event | 2026-06-29

## Problems

- None

