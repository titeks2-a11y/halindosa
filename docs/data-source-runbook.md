# 할인도사 Data Source Runbook

## 목적

V1.0은 mock 데이터를 기본으로 사용하지만, 운영 전환 시 공식 API, RSS, 제휴 피드, 허용된 수집 방식만 연결한다.

## 모드

- `mock`: 기본 큐레이션 데이터
- `staging`: live/provider dry-run 검증
- `production`: 공식 운영 API 연결 예정
- `hybrid`: 외부 후보 + mock fallback

환경 변수:

```bash
DEAL_DATA_MODE=mock
```

## 상태 확인

```bash
GET /api/sources
GET /api/health
GET /api/metrics
```

`/api/sources`는 공급원별 상태, 신뢰도, 현재 deal 수를 반환한다.

## 운영 전환 순서

1. 신규 공급원을 `/api/admin/import` dry-run으로 검증
2. 필수 필드, URL, 가격, 카테고리, 종료 시각 확인
3. `Deal` canonical 필드로 정규화
4. 테스트 서버에서 `DEAL_DATA_MODE=staging`
5. smoke와 release doctor 통과 확인
6. 운영 API 또는 DB 저장 경로 연결
7. `DEAL_DATA_MODE=production`

## 중단 기준

- 가격이 원가보다 높거나 0원 이하
- 링크가 http/https가 아님
- 성인/주류/의약품성 상품
- 출처 권한이 불명확한 크롤링
- 제휴/광고 고지를 할 수 없는 캠페인
