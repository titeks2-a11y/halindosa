# Store Screenshot Capture Manifest

Generated: npm run store:screenshots:manifest

This manifest turns the screenshot storyboard into concrete capture targets and file names. It is safe to commit because it contains no screenshots, credentials, account data, or store-console state.

## Capture Board

- Preview board: `/store-preview`
- Destination directory: `assets/store/screenshots`
- Required scenes: 6

## Required Viewports

| Platform | Width | Height | Note |
| --- | ---: | ---: | --- |
| Play Store phone | 1080 | 1920 | Android Emulator 또는 실제 기기에서 세로 화면으로 촬영 |
| App Store iPhone 6.7 | 1290 | 2796 | iPhone 15 Pro Max 계열 Simulator 또는 실제 기기 기준 |

## Scene File Names

| Order | Scene | Route | Play Store file | App Store file |
| ---: | --- | --- | --- | --- |
| 1 | 오늘 먼저 볼 특가 | `/` | `01-home-play-1080x1920.png` | `01-home-appstore-1290x2796.png` |
| 2 | 검색과 필터 | `/?q=%EC%83%88%EC%9A%B0%EA%B9%A1&sort=discount&verifiedOnly=true` | `02-search-play-1080x1920.png` | `02-search-appstore-1290x2796.png` |
| 3 | 구매 전 상세 확인 | `/deals/d014` | `03-detail-play-1080x1920.png` | `03-detail-appstore-1290x2796.png` |
| 4 | 관심 특가 저장 | `/favorites` | `04-favorites-play-1080x1920.png` | `04-favorites-appstore-1290x2796.png` |
| 5 | 마감임박과 무료배송 | `/notifications` | `05-notifications-play-1080x1920.png` | `05-notifications-appstore-1290x2796.png` |
| 6 | 정책과 설정 | `/mypage` | `06-mypage-play-1080x1920.png` | `06-mypage-appstore-1290x2796.png` |

## Per-scene Checklist

### 1. 오늘 먼저 볼 특가

- Route: `/`
- Caption: 검증된 구매처와 인기 특가를 첫 화면에서 빠르게 확인
- Focus: 오늘의 특가, 인기 TOP10, 구매 전 확인 안내
- Checklist: 내부 점수 노출 없음 / 과장된 가격 보장 표현 없음 / 첫 카드 이미지가 잘리지 않음

### 2. 검색과 필터

- Route: `/?q=%EC%83%88%EC%9A%B0%EA%B9%A1&sort=discount&verifiedOnly=true`
- Caption: 원하는 상품, 판매처, 조건을 바로 좁혀보는 탐색 화면
- Focus: 검색창, 정렬, 구매처 확인 필터
- Checklist: 검색어가 자연스럽게 보임 / 필터 칩 줄바꿈 깨짐 없음 / 결과 없음 상태가 아님

### 3. 구매 전 상세 확인

- Route: `/deals/d014`
- Caption: 가격 기준 시점, 배송, 유의사항, 판매처 이동 전 확인
- Focus: 상품 이미지, 가격 정보, 구매 전 10초 체크
- Checklist: 판매처 이동 버튼이 보임 / 개인정보나 결제 화면 없음 / 예정 도메인 안내가 보임

### 4. 관심 특가 저장

- Route: `/favorites`
- Caption: 찜한 특가를 다시 비교하고 정렬하는 화면
- Focus: 찜 목록, 저장 상품 정렬, 구매 링크 확인 특가
- Checklist: 빈 상태도 어색하지 않음 / 로그인 강제처럼 보이지 않음 / 하단 탭이 잘리지 않음

### 5. 마감임박과 무료배송

- Route: `/notifications`
- Caption: 권한 요청 전에도 앱 안에서 확인 가능한 알림 센터
- Focus: 마감임박, 신규 특가, 무료배송 알림
- Checklist: 실제 푸시 발송처럼 오해되지 않음 / 알림 카드 간격 안정 / 권한 요청 버튼 없음

### 6. 정책과 설정

- Route: `/mypage`
- Caption: 계정, 기기 데이터, 정책, 고객센터를 한곳에서 관리
- Focus: 앱 설치 안내, 개인정보처리방침, 고객센터
- Checklist: 지원 이메일 노출 / 정책 링크 노출 / 홈 화면 추가/공유 안내 노출


## Safety Checklist

- 외부 판매처 결제, 장바구니, 주문, 주소, 결제 화면을 포함하지 않는다.
- 실제 사용자 이메일, 프로필, 비밀번호, OAuth secret, .env, keystore, admin token을 포함하지 않는다.
- 무조건, 100%, 최저가 보장, 공식 판매처 보장 같은 심사 리스크 문구를 포함하지 않는다.
- 하단 탭, safe area, 검색 chip, 가격, CTA가 잘리지 않는지 확인한다.
- Play/App Store 등록 문구와 스크린샷 문구가 서로 모순되지 않는지 확인한다.

## Manual Work That Must Not Be Faked

- This manifest does not prove screenshots were captured or uploaded.
- Capture final screenshots only after the release build, public policy URLs, and store listing copy are settled.
- Review every uploaded screenshot in Play Console and App Store Connect before submission.
