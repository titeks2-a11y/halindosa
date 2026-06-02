# 할인도사 24H Commercial Autopilot Start Audit

Generated: 2026-06-02
Branch: `codex/24h-commercial-autopilot-hardening`

## Current Baseline

- 상품 수: 140
- 검증 구매/혜택 URL: 140/140
- 상품 상세 URL: 109
- 공식 혜택/이벤트 URL: 31
- 검색/카테고리/메인/커뮤니티 의심 링크: 0
- 검색 품질: 생활형 키워드 43개 PASS
- 외부 링크 정책: 새 탭/외부 브라우저 안전 이동 PASS
- 이미지 렌더링 커버리지: 카테고리 fallback 적용 후 100%

## Priority Queue

1. 직접 구매/혜택 링크 검증 리포트 자동 생성
2. 외부 링크 새 탭, noopener, Capacitor Browser 정책 자동 검사
3. 이미지 fallback과 lazy loading 품질 검사
4. 검색 품질 리포트 자동 생성
5. 상용 하네스에 링크, 이미지, 검색, UI, SEO, 성능, 로컬 smoke, release doctor 통합
6. 최종 실행 결과와 남은 리스크 문서화

## Guardrails

- 검색 결과 링크, 쇼핑몰 메인, 커뮤니티 글은 기본 노출 대상에서 제외한다.
- 구매 이동은 `/go/[dealId]` 추적 경로를 유지하고 웹에서는 새 탭, 앱에서는 외부 브라우저로 연다.
- 이미지가 없는 상품도 카테고리별 할인도사 썸네일을 사용해 빈 카드처럼 보이지 않게 한다.
- 실제 운영 데이터에서는 카테고리 placeholder보다 상품 실이미지 보강을 우선한다.
