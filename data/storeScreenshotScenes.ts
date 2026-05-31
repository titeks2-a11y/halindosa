export interface StoreScreenshotScene {
  id: string;
  title: string;
  route: string;
  caption: string;
  focus: string[];
  checklist: string[];
}

export const storeScreenshotScenes: StoreScreenshotScene[] = [
  {
    id: "home",
    title: "오늘 먼저 볼 특가",
    route: "/",
    caption: "검증된 구매처와 인기 특가를 첫 화면에서 빠르게 확인",
    focus: ["오늘의 특가", "인기 TOP10", "구매 전 확인 안내"],
    checklist: ["내부 점수 노출 없음", "과장된 가격 보장 표현 없음", "첫 카드 이미지가 잘리지 않음"]
  },
  {
    id: "search",
    title: "검색과 필터",
    route: "/?q=%EC%83%88%EC%9A%B0%EA%B9%A1&sort=discount&verifiedOnly=true",
    caption: "원하는 상품, 판매처, 조건을 바로 좁혀보는 탐색 화면",
    focus: ["검색창", "정렬", "구매처 확인 필터"],
    checklist: ["검색어가 자연스럽게 보임", "필터 칩 줄바꿈 깨짐 없음", "결과 없음 상태가 아님"]
  },
  {
    id: "detail",
    title: "구매 전 상세 확인",
    route: "/deals/d014",
    caption: "가격 기준 시점, 배송, 유의사항, 판매처 이동 전 확인",
    focus: ["상품 이미지", "가격 정보", "구매 전 10초 체크"],
    checklist: ["판매처 이동 버튼이 보임", "개인정보나 결제 화면 없음", "예정 도메인 안내가 보임"]
  },
  {
    id: "favorites",
    title: "관심 특가 저장",
    route: "/favorites",
    caption: "찜한 특가를 다시 비교하고 정렬하는 화면",
    focus: ["찜 목록", "저장 상품 정렬", "구매 링크 확인 특가"],
    checklist: ["빈 상태도 어색하지 않음", "로그인 강제처럼 보이지 않음", "하단 탭이 잘리지 않음"]
  },
  {
    id: "notifications",
    title: "마감임박과 무료배송",
    route: "/notifications",
    caption: "권한 요청 전에도 앱 안에서 확인 가능한 알림 센터",
    focus: ["마감임박", "신규 특가", "무료배송 알림"],
    checklist: ["실제 푸시 발송처럼 오해되지 않음", "알림 카드 간격 안정", "권한 요청 버튼 없음"]
  },
  {
    id: "mypage",
    title: "정책과 설정",
    route: "/mypage",
    caption: "계정, 기기 데이터, 정책, 고객센터를 한곳에서 관리",
    focus: ["앱 설치 안내", "개인정보처리방침", "고객센터"],
    checklist: ["지원 이메일 노출", "정책 링크 노출", "홈 화면 추가/공유 안내 노출"]
  }
];
