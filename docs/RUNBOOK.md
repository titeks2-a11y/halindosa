# 할인도사 운영 런북

## 로컬 검증

```bash
npm install
npm run lint
npm run build
npm run audit:commercial
npm run dev
npm run smoke
```

## 주요 헬스 체크

- 메인: `GET /`
- 특가 API: `GET /api/deals?limit=3`
- 실시간 특가 API: `GET /api/deals?q=노트북%20특가&sort=latest`
- 헬스체크: `GET /api/health`
- 운영 지표: `GET /api/metrics`
- 상세 API: `GET /api/deals/d001`
- 가격 이력: 상세 API의 `priceHistory`, `priceInsight` 필드 확인
- 신고 API: `POST /api/reports`
- 신고 큐: `GET /api/admin/reports?token=$ADMIN_EXPORT_TOKEN`
- 피드 dry-run: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
- 리다이렉트: `GET /api/redirect/d001?from=runbook`
- 제휴/판매처 fallback 상태: `GET /api/affiliate/status`
- 관리자: `GET /admin?token=$ADMIN_EXPORT_TOKEN`
- CSV export: `GET /api/admin/export?token=$ADMIN_EXPORT_TOKEN`
  - 링크 검수 작업에 필요한 `linkStatus`, `linkType`, `reviewPriority`, `reviewAction`, `reviewReason`, `purchaseConfidence`, `checkedAt`, `finalPurchaseUrl` 필드를 함께 내보낸다.
  - 운영자는 CSV를 스프레드시트로 열어 우선 검수 상품부터 실제 상품 상세 URL을 보강하고, 다음 피드 import 전에 원본 데이터의 `productUrl` 또는 `finalPurchaseUrl`에 반영한다.
- 피드 dry-run import: `POST /api/admin/import?token=$ADMIN_EXPORT_TOKEN`
  - 신규/보강 피드는 `affiliateUrl` → `finalPurchaseUrl` → `productUrl` → `purchaseUrl` → `link` → `originalUrl` → `searchUrl` 순서로 실제 구매 이동 URL을 판정한다.
  - `linkSummary.verified`와 `linkSummary.needsReview`를 확인해 출시 전 실제 상품 상세 URL 비율을 관리한다.

## 자동 smoke test

개발 서버가 실행 중인 상태에서 아래 명령으로 핵심 상업화 경로를 한 번에 확인합니다.

```bash
npm run smoke
```

다른 주소를 검증하려면 `SMOKE_BASE_URL`을 지정합니다.

```bash
SMOKE_BASE_URL=https://example.com npm run smoke
```

검증 범위:

- 메인 페이지
- 특가 목록/상세 API
- 헬스체크/운영 지표 API
- 신고/트래킹 API
- 제휴 리다이렉트 URL 파라미터
- 더미 또는 커뮤니티 링크는 판매처 검색 URL로 fallback
- CSV export
- sitemap/robots/manifest

## 검색/링크 검증 운영

- 검색 로직은 `lib/deals/search.ts`의 `dealMatchesSearch`를 기준으로 한다.
- 상품명, 브랜드, 쇼핑몰명, 카테고리, 혜택 유형, 태그, 혜택 요약을 함께 검색한다.
- 한글 띄어쓰기 차이는 정규화한다. 예: `애플 워치`는 `애플워치` 상품과 매칭되어야 한다.
- 홈 화면 검색 상태는 URL query parameter로 유지된다. 배포 후 `/?q=애플%20워치`처럼 직접 진입해도 같은 결과가 나와야 한다.
- `npm run verify:links`는 `data/mockDeals.ts`의 전체 상품 ID와 `data/verifiedPurchaseLinks.ts`의 실제 구매 URL 매핑을 비교한다.
- 검증 스크립트는 커뮤니티, placeholder, 쇼핑몰 메인, 검색/카테고리 URL을 실패로 처리한다.
- 구매 이동 버튼은 `/go/[dealId]` 또는 `/api/redirect/[id]` 추적 경로를 거쳐 새 탭/외부 브라우저로 열린다.
- 내부 화면 이동용 링크는 `Link`를 사용하고, 상품 구매 이동은 `window.open(..., "_blank", "noopener,noreferrer")` 또는 Capacitor Browser를 사용한다.

## 보안/배포 가드레일

- `npm run audit:commercial`은 high/critical 취약점이 있으면 실패합니다.
- `next.config.mjs`에는 웹 배포용 기본 보안 헤더와 `output: "standalone"`이 설정되어 있습니다. Capacitor 정적 export 빌드에서는 적용되지 않는 headers 설정을 자동 제외합니다.
- 신고/트래킹/리다이렉트/export API는 `X-Request-Id`, `X-RateLimit-*` 헤더를 반환합니다.
- 현재 rate limit는 in-memory 방식입니다. 다중 인스턴스 운영 시 Redis, Upstash, Supabase Edge Function 등 공유 저장소로 교체해야 합니다.
- 분석/제휴 추적은 브라우저 localStorage의 `halindosa:consent` 설정을 기준으로 클라이언트에서 제어합니다.
- `Dockerfile`은 standalone output을 사용해 production image를 만듭니다.
- `.github/workflows/ci.yml`은 install, lint, build, commercial audit, health wait, smoke test를 실행합니다.

Docker 로컬 검증 예시:

```bash
docker build -t halindosa .
docker run --rm -p 3000:3000 --env-file .env.example halindosa
```

## 배포 후 확인

1. `NEXT_PUBLIC_SITE_URL`이 실제 도메인인지 확인
2. `robots.txt`, `sitemap.xml`, `manifest.webmanifest` 응답 확인
3. `/api/health` 모니터링 등록
4. `ADMIN_EXPORT_TOKEN`을 설정하고 `/admin` 접근 보호 확인
5. 제휴 링크 연결 시 광고 고지 문구와 약관 갱신
6. `SMOKE_BASE_URL`로 배포 URL을 지정해 `npm run smoke` 실행
7. Docker 또는 호스팅 플랫폼의 환경변수에 `.env.example` 항목 반영

## 장애 대응

- 데이터 공급자가 실패하면 `DEAL_DATA_MODE=mock`으로 fallback
- 리다이렉트 장애 시 `/api/track`과 `/api/redirect/[id]` 로그를 먼저 확인
- 가격 오류 신고가 들어오면 `price_snapshots` 기준으로 수집 시점과 판매처 조건 확인
- `/reports?dealId=...` 신고가 증가하면 해당 mall/source 공급자 품질을 점검
- `/api/admin/reports`에서 신고 상태를 `open`, `reviewing`, `resolved`, `dismissed`로 관리
- 상세 페이지의 가격 신뢰도는 현재 mock 이력 기반입니다. 운영 DB 전환 후 `price_snapshots`로 계산해야 합니다.
- 신규 제휴/공식 피드는 `/api/admin/import` dry-run을 통과한 뒤 DB 저장 파이프라인에 연결합니다.
- 네이버 쇼핑 공식 API를 쓰려면 `DEAL_DATA_MODE=hybrid`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 설정합니다. 키가 없거나 API 장애가 있으면 기본 큐레이션 fallback으로 화면을 유지합니다.
- 별도 제휴 JSON 피드는 `DEAL_FEED_URLS=https://.../feed.json,https://.../feed2.json` 형태로 연결합니다.
