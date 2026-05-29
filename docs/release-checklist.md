# 할인도사 출시 체크리스트

## 빌드 전

- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run build:android`
- [ ] `npm run cap:sync`
- [ ] `npm run android:doctor`
- [ ] `npm run android:debug`
- [ ] `npm run android:bundle`
- [ ] `npm run release:doctor`

## Android 설정

- [x] 앱 이름: 할인도사
- [x] 패키지명/applicationId: `com.halindosa.app`
- [x] versionCode: 1
- [x] versionName: 1.0.0
- [x] Capacitor webDir: `out`
- [x] 앱 아이콘 구조 준비
- [x] 스플래시 구조 준비
- [x] INTERNET 권한만 사용
- [ ] release keystore 생성
- [ ] signed AAB 생성
- [ ] `android/keystore.properties`는 로컬에만 보관
- [ ] `android/keystore.properties.example` 기준으로 서명 설정 확인

## Play Console

- [ ] 앱 등록
- [ ] 앱 카테고리: 쇼핑
- [ ] 짧은 설명 입력
- [ ] 긴 설명 입력
- [ ] 스크린샷 업로드
- [ ] 기능 그래픽 업로드
- [ ] 개인정보처리방침 URL 입력
- [ ] 데이터 보안 섹션 작성
- [ ] 콘텐츠 등급 설문 완료
- [ ] 테스트 트랙 생성
- [ ] 내부 테스트 업로드

## 출시 전 품질

- [ ] Android Studio Emulator 실행 확인
- [ ] 실제 기기 설치 확인
- [ ] 홈, 카테고리, 검색, 찜, 알림, 마이 화면 확인
- [ ] 외부 링크가 외부 브라우저 또는 Custom Tab으로 열리는지 확인
- [ ] 개인정보처리방침과 이용약관 접근 확인
- [ ] 앱 아이콘과 스플래시 확인
- [ ] 네트워크 오류 시 fallback 표시 확인

## 운영 전

- [ ] 실제 데이터 제공 방식 확정
- [ ] 공식 API, RSS, 제휴 피드, 허용된 수집 방식만 사용
- [ ] 제휴/광고 고지 문구 법무 검토
- [ ] 고객 문의 이메일 준비
- [ ] 개인정보처리방침 실제 도메인 배포
