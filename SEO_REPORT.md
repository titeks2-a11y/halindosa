# 할인도사 SEO Report

Generated: 2026-06-02

## Current SEO Structure

- 홈 metadata, Open Graph, manifest, canonical 설정 유지
- 상품 상세 페이지 동적 metadata 유지
- 상품 상세 Product JSON-LD 유지
- sitemap/robots 자동 생성 유지
- 개인정보처리방침, 이용약관, 서비스 안내, 지원 페이지 sitemap 포함

## Product Indexing Policy

- 기본 노출 상품은 검증 구매 링크 또는 공식 혜택 링크가 있는 상품만 유지한다.
- 검색/카테고리/메인/커뮤니티 의심 링크는 `verify:links`에서 실패 처리한다.
- 만료/품절/검증 실패 상품이 운영 데이터에 들어올 경우 UI 기본 목록과 sitemap 후보에서 제외하는 정책을 유지한다.

## Open Graph Notes

- 상품 실이미지가 있는 경우 해당 이미지를 우선 사용한다.
- 카테고리 fallback 이미지는 화면 안정성을 위한 대체 이미지이며, 실제 배포 전 대표 OG 이미지는 별도 브랜드 이미지로 운영하는 것이 좋다.

## Validation

- `npm run test:seo`로 구조화 데이터, sitemap, robots, 주요 metadata를 점검한다.
- 배포 후 Search Console/Naver Search Advisor 등록과 실제 canonical 확인이 필요하다.
