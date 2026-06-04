# 할인도사 상업화 진행 메모

## 현재 상태

- Next.js App Router, TypeScript, Tailwind CSS, Capacitor 기반 V2 상업 출시 후보
- 큐레이션 특가/혜택 140개와 실제 상품 상세 또는 공식 혜택 상세 URL 100% 검증 상태 유지
- `/api/deals`, `/api/health`, `/api/track`, `/api/metrics`, `/api/redirect/[id]` 구현
- `/admin` 운영 대시보드, `/terms`, `/privacy`, `robots.txt`, `sitemap.xml`, manifest 구현
- `ADMIN_EXPORT_TOKEN` 기반 관리자/export 보호 구조 구현
- 제휴 가능 쇼핑몰에는 redirect 단계에서 `sub_id`, `utm_*` 파라미터 부착
- `/deals/[id]` SEO 상세 페이지와 `/api/deals/[id]` 상세 API 구현
- `/reports`, `/api/reports` 가격/품절 오류 신고 흐름 구현
- `npm run harness`와 `npm run release:doctor`로 lint, build, 링크/이미지/검색/모바일/SEO/성능, smoke, 출시 문서/패키징 gate 자동 검증
- 보안 헤더, standalone build, Dockerfile, GitHub Actions CI, `npm run audit:commercial` 추가
- 민감 API에 request id와 in-memory rate limit 적용
- 분석/제휴 추적 동의 배너와 마이 탭 설정 구현
- 가격 이력, 가격 하락 신호, 구매 전 확인 문구, 링크 품질 안내 구현
- in-memory 신고 큐와 관리자 신고 목록 API 구현
- 파트너 피드 검증/정규화 dry-run API 구현. 검색 결과, 대표몰, 커뮤니티/블로그/뉴스 원문 단독 링크는 `needs_fix`로 차단
- `DEAL_DATA_MODE=hybrid` 기반 네이버 쇼핑 공식 API/파트너 JSON 피드/live fallback 구조 구현

## 운영 전 필수 결정

1. 데이터 권한
   - 공식 API, 제휴 피드, RSS, 허용된 수집 방식만 사용
   - 크롤링이 필요한 경우 각 쇼핑몰 약관, robots 정책, 제휴 계약을 먼저 확인
   - 네이버 쇼핑 검색은 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`이 있을 때만 호출

2. 수익화 구조
   - 제휴 링크 사용 시 광고/제휴 고지를 상품 카드 또는 이동 전 플로우에 표시
   - `AFFILIATE_SUB_ID`를 리다이렉트 경로에서 mall/deal별로 붙이는 구조로 확장

3. 저장소
   - Supabase/Postgres에 `deals`, `price_snapshots`, `analytics_events` 테이블 우선 생성
   - mock 데이터는 로컬 개발 fallback으로만 유지

4. 개인정보
   - 회원가입, 푸시 알림, 광고 분석 SDK 연결 전 동의 화면과 보관 기간 고지 필요
   - 찜 기능을 계정 기반으로 전환할 경우 사용자 삭제/내보내기 정책 필요

## 다음 구현 순서

1. Supabase 프로젝트 생성 및 `docs/supabase-schema.sql` 실행
2. `DEAL_DATA_MODE=production` 경로에 Supabase/API 저장소 provider 연결
3. `DEAL_FEED_URLS` 또는 네이버 쇼핑 API 결과를 Supabase upsert job으로 저장
4. 가격 변동 이력과 중복 제거 로직 추가
5. mock 가격 이력을 실제 `price_snapshots` 테이블 기반으로 교체
6. 고객 신고 큐는 `data/dealReports.local.json` fallback과 Supabase `deal_reports` service-role 저장 경로를 함께 사용한다. 다음 단계는 운영자 알림과 SLA 알림 자동화다.
7. 관리자 인증, CSV export 보호, 운영 로그 저장 유지 및 Supabase `admin_actions` 감사 로그 확대
8. 실제 약관/개인정보/광고 고지 법무 검토
9. 배포 파이프라인에서 `npm run audit:commercial`, `npm run harness`, `npm run release:doctor` 자동 실행
10. Docker image 또는 Vercel/Cloud Run 등 실제 호스팅 배포 연결
11. rate limit 저장소를 Redis/Upstash 등 공유 저장소로 교체
12. 실제 CMP 또는 쿠키 동의 플랫폼 도입 검토
13. `/api/admin/import` dry-run 결과를 Supabase upsert/price snapshot 저장으로 연결

## 배포 체크

- `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 설정
- 실시간 연동 사용 시 `DEAL_DATA_MODE=hybrid`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 또는 `DEAL_FEED_URLS` 설정
- `ADMIN_EXPORT_TOKEN`, `TRACKING_SALT`는 랜덤 값으로 교체
- `/api/health` 모니터링 연결
- `npm run lint`, `npm run build`, 주요 API HTTP 200 확인
- 개발 서버 또는 배포 URL에 대해 `npm run smoke` 통과
- `npm run audit:commercial`에서 npm audit 취약점 0개 확인
- `npm audit` 결과 확인 후 배포
