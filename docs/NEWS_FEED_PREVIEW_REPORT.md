# 공식 혜택 Feed Preview

운영 feed를 연결하기 전 또는 연결 직후, 사용자 노출 전에 공식 링크 승격과 숨김 사유를 dry-run으로 확인하는 리포트입니다.

- 생성 시각: 2026-06-08T21:50:26.965Z
- 모드: contract_sample_preview
- Provider: 4개
- 수집 후보: 20개
- 노출 가능: 12개
- 숨김 후보: 0개
- 뉴스 본문 공식 링크 승격: 4개
- 검색 링크 노출: 0개
- 비공식 링크 노출: 0개

## Provider별 Preview

| Provider | 모드 | 후보 | 노출 | 숨김 | 공식 링크 승격 | 오류 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| news | local_contract_sample | 5 | 3 | 0 | 1 | 0 |
| event_news | local_contract_sample | 5 | 3 | 0 | 1 | 0 |
| official_event | local_contract_sample | 5 | 3 | 0 | 1 | 0 |
| public_coupon | local_contract_sample | 5 | 3 | 0 | 1 | 0 |

## 사용 방법

```bash
npm run news:preview
npm run news:preview -- --provider=official_event --url=https://official.example/feed.json
```

- `/admin`의 `공식 feed preview` 패널, `GET /api/admin/news-feed-preview`, `GET /api/admin/news-feed-preview?format=csv`에서도 같은 dry-run 결과를 확인할 수 있습니다.
- `/admin`의 `공식 뉴스·혜택 feed 붙여넣기 검증` 패널은 운영자가 받은 JSON/RSS 본문을 임의 URL 서버 fetch 없이 POST `/api/admin/news-feed-preview`로 검증합니다.
- 검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 사용자 노출에서 제외됩니다.
- RSS 본문 안 공식 이벤트 링크가 있으면 기사 링크는 sourceUrl로 남고 공식 링크가 finalUrl로 승격됩니다.
- 실제 반영 전에는 `npm run refresh:news && npm run verify:news && npm run refresh:all`을 다시 실행합니다.
