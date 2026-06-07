# 공식 혜택 feed 전환 리포트

이 문서는 할인도사가 seed fallback에서 공식 API/RSS/제휴 JSON feed 운영으로 전환할 때 필요한 provider별 상태를 요약합니다.

- 생성 시각: 2026-06-07T00:33:44.010Z
- 상태: seed fallback 운영 (seed_launch_ready)
- 전환 준비율: 0%
- Provider: 0/4개 연결
- Seed fallback: 4개
- Feed URL: 0개
- 출시 차단 Provider: 0개

## Provider별 전환 상태

| Provider | 라벨 | 모드 | 노출 | 이슈 | 위험도 | 우선 env | 다음 액션 |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| news | 뉴스·보도자료 | seed fallback | 4 | 0 | seed 운영 | DEAL_NEWS_FEED_URLS, DEAL_NEWS_RSS_URLS | 공식 보도자료 RSS 또는 승인 JSON feed를 연결하고 finalUrl은 공식 혜택 페이지로만 유지 |
| event_news | 이벤트 뉴스 | seed fallback | 6 | 0 | seed 운영 | DEAL_EVENT_NEWS_FEED_URLS | 뉴스 원문은 sourceUrl로만 보관하고 사용자 이동 finalUrl은 공식 이벤트 상세로 교체 |
| official_event | 공식 이벤트·혜택 | seed fallback | 56 | 0 | seed 운영 | OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS | 상용 운영 전 가장 먼저 공식 이벤트 feed를 연결해 seed 의존도 축소 |
| public_coupon | 공공·쿠폰·무료혜택 | seed fallback | 35 | 0 | seed 운영 | PUBLIC_COUPON_FEED_URLS | 무료·쿠폰·포인트 혜택은 공식 수령 페이지가 있는 feed만 연결 |

## 다음 연결 우선순위

1. `OFFICIAL_EVENT_FEED_URLS`
2. `DEAL_EVENT_FEED_URLS`
3. `PUBLIC_COUPON_FEED_URLS`
4. `DEAL_NEWS_FEED_URLS`
5. `DEAL_NEWS_RSS_URLS`
6. `DEAL_EVENT_NEWS_FEED_URLS`

## 운영 가드레일

- 공식 API/RSS/Atom/제휴 JSON feed만 연결합니다.
- 뉴스·커뮤니티 원문은 sourceUrl로만 보관하고 사용자 이동 finalUrl은 공식 이벤트·쿠폰·구매 페이지로 제한합니다.
- 검색 결과 URL, 종료 이벤트, 공식 링크 누락 항목은 verify:news와 refresh:all에서 노출 제외합니다.

## 검증 명령

```bash
npm run news:feed:doctor && npm run refresh:all && npm run verify:news && npm run release:doctor
```

