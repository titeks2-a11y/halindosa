# 할인도사 실기기 QA 기록 템플릿

이 문서는 Play Store 내부 테스트, 비공개 테스트, TestFlight 제출 전에 실제 기기 확인 결과를 남기기 위한 기록 양식입니다. 체크 항목 자체는 `docs/device-qa-checklist.md`를 기준으로 하고, 이 파일에는 누가 어떤 기기에서 어떤 결과를 확인했는지 기록합니다.

## 테스트 개요

| 항목 | 값 |
| --- | --- |
| 테스트 일시 |  |
| 테스트 담당자 |  |
| 기준 Git 커밋 |  |
| 앱 버전 | 1.0.0 |
| Android 빌드 | debug APK / signed AAB / internal test |
| iOS 빌드 | Simulator / TestFlight / Archive |
| 사용한 체크리스트 | `docs/device-qa-checklist.md` |

## Android 기기 기록

| 기기 | OS 버전 | 설치 경로 | 홈/탭 | 상세/외부링크 | 찜/최근본 | 로그인/OAuth | 신고/정책 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android Emulator |  | APK / AAB / Play internal | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대기 |
| 실제 Android 기기 1 |  | APK / AAB / Play internal | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대기 |
| 실제 Android 기기 2 |  | APK / AAB / Play internal | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대기 |

## iOS 기기 기록

| 기기 | OS 버전 | 설치 경로 | 홈/탭 | 상세/외부링크 | 찜/최근본 | 로그인/OAuth | 정책/권한 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone Simulator |  | Xcode Run | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대기 |
| 실제 iPhone |  | TestFlight / Xcode Run | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대기 |

## 구매 링크 샘플 검수

상위 노출 상품 10개 이상을 확인합니다. 실제 상품 상세 URL이면 `상세`, 공식 혜택/이벤트 상세 URL이면 `공식혜택`, 문제가 있으면 `차단/수정`으로 기록합니다. 검색 결과 URL은 기본 상품 목록 검수 샘플에서 통과로 처리하지 않습니다.

| 순서 | 상품 ID | 상품명 | 예상 도메인 | 실제 열린 도메인 | 링크 유형 | 결과 | 메모 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 2 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 3 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 4 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 5 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 6 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 7 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 8 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 9 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |
| 10 |  |  |  |  | 상세 / 공식혜택 / 차단 | 대기 |  |

## 스토어 제출 판정

- [ ] `npm run qa:release` 통과
- [ ] `npm run release:doctor` 통과
- [ ] `npm run store:metadata:doctor` 통과
- [ ] `npm run store:assets:doctor` 통과
- [ ] `npm run store:screenshots:doctor` 통과
- [ ] Android 실제 기기에서 외부 구매 링크 이동 확인
- [ ] iOS Simulator 또는 실제 iPhone에서 safe area와 외부 링크 확인
- [ ] 개인정보처리방침 공개 URL 확인
- [ ] Play Console pre-launch report 확인
- [ ] App Store Connect processing 확인

## 이슈 기록

| 우선순위 | 위치 | 현상 | 재현 단계 | 처리 상태 |
| --- | --- | --- | --- | --- |
| Critical / High / Medium / Low |  |  |  | 대기 |

## 최종 결론

- 출시 가능 여부: 대기
- 남은 Critical Issue: 없음 / 있음
- 다음 조치:
