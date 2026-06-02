# 할인도사 스토어 심사 메모

이 문서는 Google Play Console, App Store Connect 제출 시 심사자 메모 또는 앱 심사 정보에 참고할 내용을 정리한 문서입니다. 실제 제출 화면에는 필요한 항목만 간결하게 옮겨 적습니다.

## 앱 접근 방식

- 할인도사는 회원가입 없이 홈, 카테고리, 검색, 상세, 찜, 알림, 마이 화면을 둘러볼 수 있습니다.
- 로그인은 선택 기능입니다. 사용자가 원하면 이메일 또는 소셜 로그인을 통해 찜한 특가, 최근 본 상품, 관심 카테고리를 계정 기준으로 이어볼 수 있습니다.
- 심사용 테스트 계정이 없어도 주요 화면과 특가 탐색, 판매처 이동 전 확인 화면을 검토할 수 있습니다.
- 테스트 계정은 필요하지 않습니다. OAuth Provider가 심사 환경에서 아직 켜져 있지 않아도 비회원 경로로 홈, 검색, 상세, 외부 판매처 이동 전 확인, 정책 페이지를 모두 확인할 수 있습니다.
- 로그인 실패나 Provider 미설정은 앱 접근 차단 사유가 아니며, 찜 동기화와 관심 카테고리 저장 같은 선택 기능에서만 로그인 안내가 표시됩니다.

## 심사자 확인 경로

1. 앱 실행 후 홈 화면에서 오늘의 특가와 구매 이동 안내를 확인합니다.
2. 검색창 또는 카테고리 탭에서 식품, 생활용품, 디지털, 뷰티 등 특가 목록을 확인합니다.
3. 상품 카드의 `상세 보기`를 눌러 가격, 배송, 유의사항, 구매 전 체크 항목을 확인합니다.
4. `구매 전 판매처 확인` 버튼을 누르면 외부 판매처 이동 전 확인 창이 먼저 표시됩니다.
5. `판매처로 이동`을 누르면 앱이 직접 결제를 처리하지 않고 외부 판매처 또는 브라우저로 이동합니다.
6. 마이 화면에서 개인정보처리방침, 이용약관, 서비스 안내, 기기 데이터 관리 경로를 확인합니다.

## 외부 구매 링크 안내

- 할인도사는 직접 상품을 판매하거나 결제를 처리하지 않습니다.
- 구매, 결제, 배송, 취소, 환불은 각 판매처 정책에 따라 처리됩니다.
- 앱은 `/go/[dealId]` 또는 `/api/redirect/[id]` 경로를 통해 클릭 로그와 제휴 확장 구조를 거친 뒤 외부 판매처로 이동합니다.
- 판매처 이동 전 확인 창에는 이동 예정 도메인, 링크 상태, 가격 기준 시간이 표시됩니다.
- 검색 결과 fallback 상품은 검증된 상품 상세 URL처럼 표시하지 않고, 구매 전 판매처 확인 안내를 유지합니다.

## 개인정보와 데이터 처리

- 비회원 사용 시 찜한 특가, 최근 본 상품, 가격 알림 조건은 기기 또는 브라우저 저장소에 저장됩니다.
- 로그인 사용자는 Supabase Auth 기반 계정 정보, 찜, 최근 본 상품, 관심 카테고리를 동기화할 수 있습니다.
- 앱 내 결제, 위치, 연락처, 사진, 카메라, 마이크 권한은 V1에서 사용하지 않습니다.
- 실제 푸시 알림 권한 요청은 V1에서 수행하지 않습니다. 알림 화면은 앱 안에서 확인하는 관심 알림 구조입니다.
- 분석 및 제휴 추적은 사용자가 마이 화면에서 동의 상태를 확인하고 관리할 수 있는 구조로 준비되어 있습니다.

## 스토어 심사 답변 초안

### Google Play 앱 액세스

비회원으로 대부분의 기능을 사용할 수 있습니다. 로그인은 찜한 특가와 관심 카테고리를 계정으로 이어보기 위한 선택 기능입니다. 심사자는 별도 계정 없이 홈, 검색, 카테고리, 상세, 찜, 알림, 마이 화면을 확인할 수 있습니다.

테스트 계정은 필요하지 않습니다. Play Console 앱 액세스 항목에는 “앱의 주요 기능은 로그인 없이 검토 가능하며, 로그인은 선택 기능입니다”라고 입력합니다. 심사자가 로그인을 시도하지 않아도 구매 이동 전 확인 화면과 개인정보처리방침, 이용약관, 서비스 안내를 확인할 수 있습니다.

### Google Play 데이터 보안

V1은 앱 내 결제를 제공하지 않고, 위치/카메라/마이크/연락처/사진 권한을 요청하지 않습니다. 선택 로그인 사용 시 이메일 계정 식별자와 사용자가 저장한 찜/최근 본 상품/관심 카테고리 데이터가 Supabase에 저장될 수 있습니다. 비회원 데이터는 기기 저장소에 보관되며 마이 화면에서 삭제할 수 있습니다.

### App Store Review Notes

The app can be reviewed without a required account. Login is optional and only used to sync saved deals, recent views, and preferred categories. The app does not sell products or process payments directly. Purchase buttons show a confirmation sheet first, then open an external seller page in the browser. The app does not request camera, microphone, location, contacts, photo library, or tracking permissions in V1.

No demo account is required. If social login providers are not enabled in the review environment, reviewers can still access the core app as a guest: Home, Search, Categories, Deal Detail, Favorites local state, Notifications overview, My Page, Privacy Policy, Terms, and external seller confirmation.

## 제출 전 확인

- [ ] 공개 개인정보처리방침 URL이 외부 네트워크에서 열림
- [ ] 비회원 상태에서 홈, 검색, 상세, 찜, 알림, 마이 화면 접근 가능
- [ ] 외부 판매처 이동 전 확인 창 표시
- [ ] 소셜 로그인 Provider를 운영 환경에서 켰다면 Redirect URL과 딥링크 복귀 확인
- [ ] 앱 설명과 스크린샷에 과장된 가격 보장 표현이 없음
