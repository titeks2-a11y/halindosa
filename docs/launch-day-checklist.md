# 할인도사 Launch Day Checklist

## 제출 24시간 전

- [ ] `npm run qa:release` 성공 결과 보관
- [ ] `npm run release:doctor` 성공 결과 보관
- [ ] `npm run public:url:doctor` 성공 결과 보관
- [ ] `/commercialization` 출시 준비 보드에서 구매 링크 확인율과 남은 링크 검수 수 확인
- [ ] 링크 검수 큐 상위 상품 10개 직접 판매처 이동 확인
- [ ] 개인정보처리방침/고객지원 공개 URL이 브라우저와 앱 WebView에서 열리는지 확인
- [ ] 공개 도메인에서 `/privacy`, `/support`, `/sitemap.xml`, `/robots.txt`가 외부 네트워크로 열리는지 확인
- [ ] Supabase OAuth Provider의 Google/Kakao Redirect URL 확인
- [ ] 고객 문의 이메일 수신 테스트

## Play Console 제출

- [ ] signed AAB 업로드
- [ ] 개인정보처리방침 공개 URL 입력
- [ ] 고객지원 공개 URL 또는 지원 이메일 입력
- [ ] 스크린샷 6장 업로드
- [ ] 기능 그래픽 업로드
- [ ] 데이터 보안 섹션 제출
- [ ] 콘텐츠 등급 설문 제출
- [ ] 내부 테스트 트랙 배포
- [ ] 실제 기기 2종 설치 확인
- [ ] 외부 링크/제휴 고지 확인
- [ ] 고객 문의 이메일 수신 확인
- [ ] Pre-launch report 오류, 정책 경고, 권한 경고 확인

## App Store Connect 제출

- [ ] Xcode Archive 생성
- [ ] Bundle Identifier `com.halindosa.app` 확인
- [ ] App Privacy 답변이 Supabase Auth 운영 여부와 일치하는지 확인
- [ ] `PrivacyInfo.xcprivacy` 번들 포함 확인
- [ ] iPhone 스크린샷 업로드
- [ ] 심사 메모에 외부 판매처 이동, 제휴 가능성, 계정 삭제 위치를 간단히 안내

## 출시 당일 운영 순서

1. 내부 테스트 트랙 또는 TestFlight에서 설치 확인
2. 홈, 검색, 카테고리, 찜, 마이, 정책 페이지를 순서대로 확인
3. 검수 완료 상품 3개와 공식 혜택 상세 URL 1개의 판매처 이동을 확인
4. 가격/품절 신고를 1건 접수하고 `/admin` 신고 큐에서 확인
5. 고객 문의 이메일 수신함과 스팸함 확인
6. Play Console 또는 App Store Connect 심사 메시지 알림 확인
7. 치명 오류가 있으면 앱 공개를 중단하고 `docs/RUNBOOK.md` 기준으로 롤백 또는 수정 배포

## 출시 당일 모니터링

- Play Console pre-launch report
- 앱 시작/홈 로딩
- 외부 링크 이동
- 신고 접수
- 주요 정책 페이지 접근
- OAuth 로그인 성공/실패 로그
- 링크 검수 큐 증가량
- 고객 문의 이메일

## 출시 후 72시간

- [ ] 설치 후 첫 화면 이탈 피드백 확인
- [ ] 신고가 들어온 상품은 24시간 안에 보강 또는 노출 종료
- [ ] 스토어 리뷰에 가격 오류/품절 관련 불만이 있는지 확인
- [ ] 개인정보/계정 삭제 문의가 들어오면 `docs/customer-support-guide.md` 기준으로 응대
- [ ] direct purchase URL 100% 기준을 유지하고 `needs_review` 상품은 기본 목록 노출 전 주간 운영 큐에서 보강
