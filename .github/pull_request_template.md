## Summary

- 변경 목적:
- 사용자에게 보이는 변화:
- 운영/출시 영향:

## Release Safety Checklist

- [ ] `npm run harness` 통과 또는 실패 원인과 보완 계획 기록
- [ ] `npm run test:env` 통과
- [ ] `npm run public:url:doctor` 통과
- [ ] `npm run release:doctor` 통과
- [ ] 상품/혜택 링크는 실제 상품 상세 URL 또는 공식 혜택 상세 URL만 사용
- [ ] 검색 결과, 대표몰, 커뮤니티/블로그/뉴스 원문 단독 링크를 구매 링크로 노출하지 않음
- [ ] 외부 링크는 새 탭/외부 브라우저로 열리며 `noopener noreferrer` 또는 내부 `/go` 추적 경로를 유지
- [ ] 개인정보, 환경변수, keystore, `.env*`, 서비스 키를 커밋하지 않음
- [ ] 비회원 사용자가 홈, 검색, 카테고리, 상세, 찜, 알림, 마이, 정책 페이지를 볼 수 있음
- [ ] 로그인/소셜 로그인 변경 시 `docs/OAUTH_SETUP.md`, `docs/DEEPLINK_AUTH.md`, 개인정보처리방침/이용약관 영향 확인
- [ ] Play Store/App Store 문구에 과장된 최저가/가격 보장 표현을 추가하지 않음
- [ ] 모바일 390px 폭에서 하단 탭바가 콘텐츠를 가리지 않음

## Verification Evidence

- Harness report artifact 또는 `docs/HARNESS_REPORT.md`:
- Release evidence:
- Device QA record, if release-facing:
- Link coverage report, if deal data changed:

## Store Review Notes

- 테스트 계정 필요 여부: 기본값은 필요 없음
- 외부 구매/혜택 이동 경로 변경 여부:
- 데이터 수집/삭제/동의 흐름 변경 여부:
