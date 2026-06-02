# 할인도사 Known Issues

Generated: 2026-06-02

## Critical

- 없음. 현재 자동 검증 기준에서 링크, 검색, 이미지, 외부 이동 치명 이슈는 발견되지 않았다.

## Operational Risks

- 상품 이미지 중 실상품 이미지가 아닌 카테고리 fallback이 많다. 앱 화면은 깨지지 않지만, 운영 전환 시 실제 상품 이미지 공급률을 높여야 한다.
- 31개 혜택 URL은 상품 상세가 아니라 공식 이벤트/혜택 신청 페이지다. 무료 혜택/쿠폰/이벤트 카테고리에서는 정상이나, 상품형 특가로 오인되지 않게 카피를 유지해야 한다.
- Lighthouse 실측은 로컬 정적 하네스가 아니라 배포 URL 기준으로 추가 확인해야 한다.
- signed AAB 최종 업로드와 앱스토어/플레이스토어 심사 답변은 계정 소유자가 Android Studio/Play Console에서 최종 실행해야 한다.

## Next Improvements

- 제휴 피드 또는 공식 API 연결 시 `verify:links`와 동일한 기준으로 ingest 전 링크를 차단한다.
- 카테고리 fallback 이미지를 실제 상품 이미지로 단계적으로 교체한다.
- 배포 URL에서 모바일 Lighthouse, 실제 Android WebView 터치 테스트, 소셜 로그인 redirect를 별도 수동 QA한다.
