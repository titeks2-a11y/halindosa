# 할인도사 Play Store Checklist

Generated: 2026-06-02

## Before Upload

- `npm run harness` PASS
- `npm run qa` PASS
- `npm run build:android` PASS
- `npm run cap:sync` PASS
- `npm run release:doctor` PASS
- Android Studio에서 signed AAB 생성
- Play Console에 개인정보처리방침 공개 URL 입력
- 앱 아이콘, feature graphic, 스크린샷 확인
- 테스트 트랙에서 실제 기기 설치 확인

## Store Listing

- 앱 이름: 할인도사
- 카테고리 추천: 쇼핑
- 짧은 설명: 국내 특가와 무료혜택을 빠르게 확인하는 할인 정보 앱
- 핵심 문구: 검증된 구매처/공식 혜택 링크 중심, 구매 전 최종 조건 확인 안내

## Data Safety

- V1 기준 회원가입 없이 열람 가능
- 찜/최근 본 상품은 기기 저장 또는 Supabase 계정 동기화 사용
- 실제 결제 정보는 수집하지 않음
- 푸시 알림, 광고 SDK, 분석 도구 도입 시 개인정보처리방침과 데이터 보안 섹션 재작성 필요

## Review Notes

- 외부 구매 링크는 판매처로 이동하며 할인도사는 결제 주체가 아님
- 가격/재고/쿠폰 조건은 판매처에서 최종 확인해야 함
- 제휴 링크가 적용될 경우 앱 내 고지와 스토어 문구를 유지해야 함

## Remaining Owner Tasks

- signed release keystore 관리
- Play Console 앱 서명 설정
- 실제 스토어 스크린샷 업로드
- 배포 URL Lighthouse 측정 결과 첨부
- 테스트 계정이 필요한 기능이 생기면 심사용 계정 제공
