# 공식 혜택 Feed Canary

운영 환경변수에 연결된 실시간 공식 feed가 실제로 살아 있고, 사용자 노출 가능한 공식 혜택 후보를 만들 수 있는지 확인하는 canary 리포트입니다.

- 생성 시각: 2026-06-06T12:27:36.650Z
- 상태: seed_fallback_only
- 신선도: fresh · age 0h · stale 기준 24h
- Provider: 4개
- 연결된 feed URL: 0개
- 수집 후보: 0개
- 노출 가능 후보: 0개
- 숨김 후보: 0개
- 오류: 0개
- 설정 feed 공백: 0개
- 뉴스 본문 공식 링크 승격: 0개

## Provider별 상태

| Provider | 상태 | Feed URL | 수집 | 노출 | 숨김 | 오류 | 공식 링크 승격 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| news | seed_fallback_only | 0 | 0 | 0 | 0 | 0 | 0 |
| event_news | seed_fallback_only | 0 | 0 | 0 | 0 | 0 | 0 |
| official_event | seed_fallback_only | 0 | 0 | 0 | 0 | 0 | 0 |
| public_coupon | seed_fallback_only | 0 | 0 | 0 | 0 | 0 | 0 |

## 다음 액션

- 아직 운영 feed URL이 없어 seed fallback만 검사했습니다.
- OFFICIAL_EVENT_FEED_URLS 또는 PUBLIC_COUPON_FEED_URLS에 공식 JSON/RSS/Atom feed를 연결한 뒤 npm run news:feed:canary를 다시 실행하세요.
- 무단 HTML 크롤링 대신 공식 API, RSS, Atom, 승인된 파트너 JSON만 연결하세요.

## 운영 API

- JSON: `GET /api/admin/news-feed-canary`
- CSV: `GET /api/admin/news-feed-canary?format=csv`
- 운영 화면: `/admin`의 공식 피드 전환 준비도에서 `canary JSON`, `canary CSV` 버튼으로 확인합니다.

## 검증 명령

```bash
npm run news:feed:canary
npm run refresh:news
npm run verify:news
npm run refresh:all
```
