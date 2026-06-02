# 할인도사 Customer Support Guide

## 문의 유형

- 가격이 다름
- 품절 또는 링크 오류
- 배송 조건이 다름
- 부적절한 상품
- 앱 오류
- 개인정보/정책 문의
- 스토어 심사/제출 문의

## 응대 원칙

- 할인도사는 직접 판매자가 아니며 최종 가격과 배송은 판매처 기준임을 안내
- 오류 신고는 운영 검수 큐에 반영
- 개인정보 문의는 정책 페이지와 삭제 방법 안내
- 실제 응대 문구와 SLA는 `docs/SUPPORT_PLAYBOOK.md`와 `SUPPORT_PLAYBOOK.json`을 기준으로 사용
- 주문번호, 주소, 결제 정보, OAuth client secret, Supabase service-role key, keystore, `.env` 값은 공개 이슈나 응대 문서에 기록하지 않음

## 기본 답변

가격/재고는 판매처 사정에 따라 빠르게 변경될 수 있습니다. 신고해주신 정보는 운영자가 검토하여 수정 또는 종료 처리하겠습니다.

## 에스컬레이션

- 결제/환불: 판매처 고객센터 안내
- 개인정보: 운영 책임자 이메일로 전달
- 정책 리스크: 노출 중단 후 검토
- Play Console/App Store Connect 제출 문제: `store-submission-blocker` 이슈 템플릿과 `docs/STORE_MANUAL_CHECKLIST.md` 기준으로 확인
