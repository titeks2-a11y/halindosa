# 할인도사 Known Issues

Generated: 2026-06-07T16:42:07.749Z
Branch: codex/12h-product-ux-growth-hardening
Commit: 9445c0a7
Working tree: M DEVICE_QA_REPORT.md;  M PUBLIC_URL_REPORT.md;  M RELEASE_NOTES.json;  M RELEASE_NOTES.md;  M STORE_CONSOLE_FIELDS.json;  M STORE_HANDOFF_REPORT.md;  M STORE_MANUAL_CHECKLIST.json;  M STORE_MANUAL_CHECKLIST.md;  M STORE_PACKET_REPORT.md;  M STORE_SCREENSHOTS_REPORT.md;  M STORE_SUBMISSION_REPORT.md;  M SUPPORT_PLAYBOOK.json;  M SUPPORT_PLAYBOOK.md;  M docs/DEVICE_QA_REPORT.md;  M docs/PUBLIC_URL_REPORT.md;  M docs/RELEASE_NOTES.md;  M docs/STORE_CONSOLE_FIELDS.md;  M docs/STORE_HANDOFF_REPORT.md;  M docs/STORE_MANUAL_CHECKLIST.md;  M docs/STORE_PACKET_REPORT.md;  M docs/STORE_SCREENSHOTS_REPORT.md;  M docs/STORE_SUBMISSION_REPORT.md;  M docs/SUPPORT_PLAYBOOK.md

## Critical

- 없음. 현재 자동 검증 기준에서 링크, 검색, 이미지, 외부 이동 치명 이슈는 발견되지 않았습니다.

## Current Readiness Snapshot

- Visible curated deals: 140
- Direct product or official benefit links: 140/140
- Manual link review needed: 0
- Explicit product images: 93/140 (66%)
- Fallback image backlog: 47
- Official benefit official images: 70/105
- Public URL report: manual public-domain checks remain
- Device QA report: manual device checks remain

## Operational Risks

- 상품 이미지 중 실상품 이미지가 아닌 카테고리 fallback이 남아 있습니다. 현재 명시/파생 상품 이미지 93/140개(66%), fallback 47개이며, 운영 목표 60%까지 추가 보강 0개 기준으로 관리합니다.
- 공식 혜택 이미지는 공식 OG/schema/페이지 이미지 70/105개, 생성 placeholder 35개 기준입니다. placeholder는 실제 상품 사진처럼 보이지 않는 안전 썸네일입니다.
- 무료 혜택/쿠폰/이벤트는 공식 혜택 신청 페이지가 정상 목적지일 수 있습니다. 상품형 특가로 오인되지 않도록 카피와 dealType 구분을 유지해야 합니다.
- Lighthouse 실측은 로컬 정적 하네스가 아니라 배포 URL 기준으로 추가 확인해야 합니다.
- signed AAB 최종 업로드와 App Store/Play Store 심사 답변은 계정 소유자가 콘솔에서 직접 실행해야 합니다.
- 실제 Android/iOS 기기 QA, 외부 브라우저 이동, 공유 시트, OAuth redirect는 자동 완료로 표시하지 말고 DEVICE_QA 기록에 수동 증빙을 남겨야 합니다.
- Playwright 스크린샷 회귀 테스트는 아직 별도 의존성으로 도입하지 않았습니다. 현재는 모바일 UX doctor, 정적 UI rules, smoke, SEO/performance/link/image 하네스로 회귀를 막고 있습니다.

## Next Improvements

- 제휴 피드 또는 공식 API 연결 시 verify:links와 동일한 기준으로 ingest 전 링크를 차단합니다.
- 클릭 상위 fallback 썸네일부터 실제 상품 이미지로 단계적으로 교체합니다.
- 배포 URL에서 모바일 Lighthouse, Android WebView 터치, 소셜 로그인 redirect를 별도 수동 QA합니다.
- 스토어 스크린샷 촬영 후 STORE_SCREENSHOTS_REPORT의 Pending manual capture 항목을 실제 캡처 증빙으로 교체합니다.
- Playwright 또는 Browser 기반 실제 모바일 스크린샷 회귀 테스트는 별도 브랜치에서 도입합니다.

## Sensitive Data Rule

- 이 문서에는 keystore password, OAuth client secret, Supabase service-role key, `.env` 값, 주문번호, 주소, 결제정보를 기록하지 않습니다.
