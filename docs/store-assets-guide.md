# 할인도사 Play Store 이미지 준비 가이드

## 필수 이미지

### 앱 아이콘

- 규격: 512 x 512 PNG
- 초안 파일: `assets/store/play-store-icon-512.png`
- 원본 보관: `assets/store/halindosa-logo-source.jpg`
- 배경: 단색 또는 단순 패턴
- 권장 구성: 할인도사 도사 심볼을 중앙 확대 배치
- 금지: 작은 글자, 과도한 그림자, 스토어 배지, 가격 문구
- 현재 Android 리소스 위치:
  - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

### 기능 그래픽

- 규격: 1024 x 500 PNG 또는 JPG
- 초안 파일: `assets/store/feature-graphic-1024x500.png`
- 문구 예시: `놓치기 쉬운 특가를 한눈에`
- 화면 구성: 레드 브랜드 배경, 앱 홈 화면 일부, 대표 특가 카드 2~3개
- 주의: 실제 가격을 넣는 경우 스크린샷 시점 이후 가격 변동 가능성을 고려해 과장 문구를 피한다.

### 휴대전화 스크린샷

- 최소 2장, 권장 6장
- 권장 화면:
  1. 홈: 오늘의 추천 특가
  2. 카테고리: 식품/생활용품/디지털 탭
  3. 검색/필터: 무료배송, 핫딜, 마감임박 필터
  4. 상세: 가격, 배송, 유의사항, 구매 이동 버튼
  5. 찜: 관심 특가 목록
  6. 마이: 정책 링크와 앱 정보

## 캡처 기준

- Android Emulator 또는 실제 기기에서 촬영
- 권장 해상도: 1080 x 1920 이상
- 상태바와 내비게이션바가 너무 많은 공간을 차지하지 않도록 앱 화면이 잘 보이게 촬영
- 임의의 개인정보, 로그인 화면, 외부 판매처 결제 화면은 포함하지 않는다.

## 문구 기준

- 사용 가능:
  - `국내 특가 정보를 빠르게 확인`
  - `무료배송, 마감임박, 인기 특가를 한눈에`
  - `관심 특가는 찜 목록에 저장`
- 피해야 할 표현:
  - `무조건 최저가`
  - `100% 실시간 보장`
  - `공식 판매처 보장`
  - `수익 보장`, `투자`, `현금성 보상`

## 교체 절차

1. 최종 원본 이미지를 `assets/store/`에 보관한다.
2. 앱 아이콘은 Android Studio `Image Asset` 도구로 adaptive icon을 다시 생성한다.
3. 스플래시 이미지는 `android/app/src/main/res/drawable/splash.png`를 교체한다.
4. 교체 후 아래 명령을 순서대로 실행한다.

```bash
npm run build
npm run build:android
npm run cap:sync
npm run release:doctor
```

## 출시 전 확인

- Play Console 이미지가 실제 앱 화면과 크게 다르지 않은지 확인
- 가격, 할인율, 무료 문구가 오해를 만들지 않는지 확인
- 앱 아이콘이 작은 크기에서도 도사 심볼로 인식되는지 확인
- 기능 그래픽에 외부 쇼핑몰 로고를 무단으로 크게 사용하지 않았는지 확인

## App Store 이미지

### iOS 앱 아이콘

- 규격: 1024 x 1024 PNG
- 현재 위치: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
- 권장: Play Store 아이콘과 동일한 도사 심볼을 사용하되 투명 배경 없이 꽉 찬 정사각형 이미지로 준비
- 금지: 알파 채널, 작은 글자, 가격 문구, 스토어 배지

### iPhone 스크린샷

- App Store Connect에서 요구하는 기기 크기에 맞춰 최소 3장 이상 준비
- 권장 화면은 Play Store와 동일하게 홈, 검색/필터, 상세, 찜, 마이, 알림 순서
- iOS 상태바와 safe area에서 하단 탭이 잘리지 않는지 확인

### App Store 심사 문구

- `실시간` 표현은 앱 내부의 데이터 기준 시간과 함께 사용
- `최저가`는 확정 표현 대신 `가격 주목`, `가격 하락 신호`, `최근 기준 확인 필요`처럼 완화
- 외부 판매처 구매, 배송, 환불은 판매처 정책에 따른다는 안내를 스크린샷 설명과 앱 설명에 반영
