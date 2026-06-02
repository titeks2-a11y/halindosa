# 스토어 제출 Blocker

## 제출 단계

- [ ] Play Console signed AAB 업로드
- [ ] Play Console Data Safety / Content Rating
- [ ] Play Console pre-launch report
- [ ] App Store Connect Archive 업로드
- [ ] App Store Connect App Privacy / Review Notes
- [ ] 공개 개인정보처리방침/고객지원 URL
- [ ] Android/iOS 실기기 QA
- [ ] 스토어 스크린샷 업로드
- [ ] OAuth Provider / Redirect URL 설정

## 차단 요약

- 발생 콘솔 또는 기기:
- 차단된 항목:
- 기대한 상태:
- 실제 상태:

## 관련 산출물

- 기준 커밋:
- `docs/STORE_MANUAL_CHECKLIST.md` 항목 ID:
- `docs/STORE_CONSOLE_FIELDS.md` 관련 입력값:
- `docs/STORE_HANDOFF_REPORT.md` 관련 섹션:
- `docs/DEVICE_QA_MANIFEST.md` 또는 `docs/STORE_SCREENSHOT_MANIFEST.md` 관련 항목:

## 재현 또는 확인 순서

1.
2.
3.

## 현재 판단

- [ ] 코드 수정 필요
- [ ] 문서 수정 필요
- [ ] 공개 URL/DNS/배포 설정 필요
- [ ] Play Console 또는 App Store Connect 수동 설정 필요
- [ ] Android Studio/Xcode signing 또는 archive 필요
- [ ] OAuth/Supabase Provider 설정 필요

## 민감정보 주의

이슈에는 keystore 비밀번호, OAuth client secret, Supabase service-role key, `.env` 값, tester password, 주문번호, 주소, 결제 정보, 인증 코드를 올리지 마세요.

콘솔 화면을 캡처할 때도 secret, access token, 이메일 주소, 결제/주문 정보가 보이지 않게 가려 주세요.
