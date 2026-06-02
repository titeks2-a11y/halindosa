# 할인도사 Link Policy

## 목적

할인도사는 사용자를 커뮤니티 게시글이나 쇼핑몰 메인으로 보내는 앱이 아니라, 가능한 경우 실제 구매 가능한 상품 상세 페이지로 안내하는 것을 기본 원칙으로 한다.

## 링크 상태

- `verified`: 상품 상세 URL 패턴을 통과한 구매 링크
- `needs_review`: 검색 결과, 카테고리, 미확인 HTTP 링크, 원본 링크 부재 등 운영 보강이 필요한 링크
- `sold_out`: 품절 또는 판매 종료 가능성이 있어 노출 종료 검토가 필요한 링크
- `broken`: 위험한 스킴, 오류 링크, 이동 불가 링크

## 링크 타입

- `direct_purchase`: 쇼핑몰 상품 상세 페이지
- `affiliate`: 제휴 파라미터 또는 제휴 템플릿이 적용될 수 있는 상품 상세 페이지
- `seller_search`: 직접 구매 URL이 없어 판매처 검색으로 대체한 링크
- `unavailable`: 이동 제한 대상

## 차단 기준

다음 링크는 구매 링크로 인정하지 않는다.

- `javascript:`, `data:`, `file:` 등 http/https가 아닌 URL
- `example.com` placeholder
- 쇼핑몰 메인, 검색 결과, 카테고리 목록
- 뽐뿌, 에펨코리아, 퀘이사존, 알구몬, 클리앙, 루리웹 등 커뮤니티 게시글 단독 링크
- 품절 또는 판매 종료로 확인된 링크

## 커뮤니티 출처 처리

커뮤니티 글은 `sourceUrl`, `sourceName`으로 분리한다. 운영 피드에서는 본문 안의 외부 쇼핑몰 상품 상세 URL만 `finalPurchaseUrl`로 저장한다. 직접 구매 URL을 찾지 못하면 `seller_search` 상태로 표시하고, 사용자에게 상품명과 가격 조건을 직접 확인하도록 안내한다.

## API 필드

`/api/deals`와 `/api/deals/[id]`는 다음 필드를 제공한다.

- `linkVerified`
- `finalUrl`
- `checkedAt`
- `purchaseConfidence`
- `purchaseStatus`
- `purchaseLinkVerified`
- `finalPurchaseUrl`
- `sourceUrl`
- `sourceName`

## 네트워크 검증

`probePurchaseLink`는 운영 배치나 관리자 재검증에서 사용할 수 있는 선택형 HTTP 확인 함수다. 최종 리다이렉트 URL, HTTP status, timeout, 404/500 계열 오류를 기록할 수 있다. V1 앱 런타임에서는 사용자 화면 속도를 위해 모든 상품을 매 요청마다 외부 호출하지 않고, 저장된 검증 결과와 패턴 기반 검증을 먼저 사용한다.

## 운영 기준

출시 전에는 `needs_review` 상품을 운영 대시보드의 링크 검수 큐에서 우선 보강한다. 제휴 피드나 공식 API가 연결되면 상품별 상세 URL을 먼저 저장하고, 검색 fallback은 기본 상품 목록에 노출하지 않는다.
