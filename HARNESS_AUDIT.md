# 할인도사 Harness Audit

Generated: 2026-06-02

## Expanded Harness Gates

- `lint`: TypeScript/React/Next.js lint gate
- `build`: Next.js production build
- `verify:links`: 직접 구매/공식 혜택 URL 검증, 검색/홈/커뮤니티 링크 차단
- `test:external-links`: 새 탭, `noopener noreferrer`, `/go` 구매 이동, `window.open`, Capacitor Browser 규칙 검사
- `test:images`: 상품 이미지 존재, lazy loading, async decoding, object-cover, 카테고리 fallback 검사
- `test:search`: 생활형 검색어, alias, 추천 검색어 품질 검사
- `test:ui`: 모바일 탭, compact filter, 구매 CTA 등 UI 규칙 검사
- `test:seo`: manifest, sitemap, robots, Product JSON-LD 구조 검사
- `test:perf`: 정적 성능 예산과 초기 렌더 수 검사
- `smoke:local`: 로컬 서버 기반 핵심 API/페이지 smoke
- `release:doctor`: Play Store/Capacitor/정책/문서 출시 준비 gate

## Commercial Policy

- 할인도사는 검증된 구매처 또는 공식 혜택 신청 페이지를 기본 노출한다.
- 검색 결과 URL은 fallback 내부 구조로만 보관하고 기본 상품 목록에는 노출하지 않는다.
- 사용자 화면을 가리는 내부 이동 대신 새 탭/외부 브라우저 이동을 유지한다.
- 하네스 실패 시 다음 기능으로 넘어가지 않고 원인을 수정한다.
