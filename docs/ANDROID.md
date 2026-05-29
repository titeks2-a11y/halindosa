# 할인도사 Android 패키징

## 프로젝트 정보

- Framework: Next.js App Router + React + TypeScript
- Android wrapper: Capacitor
- App name: 할인도사
- Package name: `com.halindosa.app`
- Capacitor webDir: `out`

## 로컬 빌드 순서

```bash
npm install
npm run build
npm run build:android
npm run cap:sync
npm run android:doctor
npm run android:debug
npm run release:doctor
npm run cap:open
```

`android:doctor`, `android:debug`, `android:bundle`은 Windows에서 Android Studio 내장 JDK를 자동 탐지합니다.
기본 탐지 경로는 `C:\Program Files\Android\Android Studio\jbr`이며, 다른 위치에 설치했다면 `JAVA_HOME` 또는 `STUDIO_JDK`를 설정하세요.

## Android Studio 작업

1. `npm run cap:open` 또는 Android Studio에서 `android` 폴더를 직접 엽니다.
2. Android Studio가 안내하는 Gradle/JDK 설정을 완료합니다.
3. 에뮬레이터 또는 실제 기기를 선택하고 Run을 실행합니다.
4. Play Store 업로드 전 `Build > Generate Signed Bundle / APK`에서 Android App Bundle을 생성합니다.
5. 새 keystore를 만들거나 기존 keystore를 선택하고 release variant로 `.aab`를 생성합니다.

터미널에서 release bundle 태스크만 검증하려면 아래 명령을 사용할 수 있습니다.

```bash
npm run android:bundle
npm run release:doctor
```

## Release 서명 준비

Play Store 업로드용 AAB는 release 서명이 필요합니다. 안전한 기본 절차는 Android Studio의
`Build > Generate Signed Bundle / APK` 마법사를 사용하는 것입니다.

터미널 서명을 준비하려면 `android/keystore.properties.example`을
`android/keystore.properties`로 복사한 뒤 실제 keystore 경로와 비밀번호를 채웁니다.
`android/keystore.properties`와 `.jks` 파일은 `.gitignore` 대상이며 절대 커밋하지 않습니다.

```properties
storeFile=../release/halindosa-release.jks
storePassword=실제_비밀번호
keyAlias=halindosa
keyPassword=실제_비밀번호
```

서명 준비 후 아래 명령으로 AAB 생성 가능 여부를 확인합니다.

```bash
npm run android:bundle
npm run release:doctor
```

## 구현 메모

- Android 빌드는 Next API Routes를 포함하지 않는 정적 export를 사용합니다.
- 앱 첫 화면은 mock fallback 데이터를 포함해 오프라인 번들에서도 상품 카드가 보입니다.
- Android 뒤로가기는 하단 탭 화면에서는 홈으로 돌아가고, 홈에서는 OS 기본 뒤로가기/앱 종료 흐름을 따릅니다.
- 상품 구매 링크는 Capacitor Browser로 외부 브라우저에서 열립니다.
- 개인정보 처리방침 `/privacy`, 이용약관 `/terms`는 앱 하단 영역에서 접근할 수 있습니다.

## 주의 사항

- Play Store 업로드는 서명된 AAB가 필요합니다.
- 원시 `android\gradlew.bat assembleDebug`를 직접 실행하려면 `JAVA_HOME` 또는 `PATH`에 Java가 있어야 합니다.
- 이 프로젝트의 `npm run android:debug`는 Android Studio 내장 JDK를 찾아 임시 환경변수로 전달하므로 시스템 `JAVA_HOME` 없이도 동작합니다.
- 실제 운영 데이터는 서버 API 또는 허용된 제휴/공식 피드와 연결해야 하며, Android 정적 번들만으로 서버 API Route는 실행되지 않습니다.
