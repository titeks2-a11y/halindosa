# 할인도사 Admin System Design

## 목적

운영자가 검증된 할인 정보를 빠르게 등록하고, 잘못된 가격/품절/광고 정보를 안전하게 관리하는 내부 도구를 설계한다.

## 핵심 기능

- 특가 등록: 상품명, 판매처, 가격, 배송, 카테고리, 태그, 이미지, 링크, 종료 시각 입력
- 특가 수정: 가격, 배송, 종료 시각, 노출 상태, 추천 여부 수정
- 특가 종료: 품절, 가격 변경, 기간 종료, 신고 누적 사유로 종료 처리
- 카테고리 관리: 기본 카테고리, 노출 순서, 추천 문구 관리
- 배너 관리: 오늘의 특가 배너, 시즌 이벤트, 공지 배너 관리
- 공지사항 관리: 점검, 정책 변경, 운영 안내 등록
- 광고 관리: 제휴 링크, 브랜드 광고, 프리미엄 노출 슬롯 관리

## 권한 구조

- Viewer: 지표와 신고 큐 조회
- Editor: 특가 등록/수정/종료
- Marketer: 배너, 광고, 추천 슬롯 관리
- Admin: 권한, 정책, 데이터 소스 관리

## Supabase 기준 DB 초안

- `deals`: canonical Deal 필드, 상태, 검수 상태, source, created_by, updated_by
- `deal_price_snapshots`: deal_id, price, coupon, shipping, captured_at
- `categories`: name, slug, sort_order, is_active
- `banners`: title, image_url, target_url, starts_at, ends_at, is_active
- `notices`: title, body, published_at, is_active
- `ad_slots`: slot_key, deal_id, campaign_name, disclosure, starts_at, ends_at
- `audit_logs`: actor_id, action, entity_type, entity_id, payload, created_at

## 운영 플로우

1. 외부 피드 또는 수동 입력을 dry-run 검증한다.
2. 중복 상품, 비정상 가격, 금지 카테고리를 필터링한다.
3. Editor가 노출 문구와 링크를 검수한다.
4. Admin 또는 Marketer가 홈/카테고리 노출 슬롯을 확정한다.
5. 신고 또는 가격 변동 발생 시 종료/수정 처리한다.

## V1.0 범위

현재 앱에는 실제 DB 저장을 연결하지 않는다. `/admin`과 dry-run API는 운영 설계 검증용이며, 실제 출시 전 Supabase 또는 서버 API로 대체한다.
