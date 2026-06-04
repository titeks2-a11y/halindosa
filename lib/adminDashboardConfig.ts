export const adminLaunchChecklist = [
  { title: "제휴 고지", description: "광고/제휴 링크 여부를 상품 상세 및 이동 전 플로우에 명확히 표시" },
  { title: "데이터 권한", description: "공식 API, RSS, 제휴 피드 또는 허용된 수집 방식만 운영 데이터로 사용" },
  { title: "가격 이력", description: "가격 변동과 수집 시점을 저장해 허위 할인 리스크를 낮춤" },
  { title: "개인정보", description: "회원, 푸시, 분석 도구 연결 전 동의와 보관 기간을 정책에 반영" }
];

export const linkReviewPriorityLabels = {
  high: "우선",
  medium: "보강",
  low: "대기"
} as const;

export const linkReviewPriorityClassNames = {
  high: "bg-red-50 text-dossa-red",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600"
} as const;

export const decisionGuideOperationActions = {
  free: "무료 샘플, 체험단, 초대권의 수령 조건과 배송비를 먼저 보강",
  coupon: "최소 주문 금액, 중복 가능 여부, 결제수단 조건을 최신화",
  endingSoon: "마감 시간, 선착순 여부, 종료 신고를 우선 정리",
  verified: "검색 fallback 없이 상품·혜택 상세 URL을 검수"
} as const;

export const benefitOperationPriorityLabels = {
  high: "오늘 처리",
  medium: "이번 주 보강",
  low: "유지 관리"
} as const;

export const benefitOperationPriorityClassNames = {
  high: "bg-red-50 text-dossa-red",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700"
} as const;
