import { formatPrice } from "@/lib/format";
import type { BenefitVisitStreak } from "@/lib/benefitVisitStreak";
import type { Deal, DealBenefitType } from "@/types/deal";

export type FreeBenefitTabId = "all" | DealBenefitType;
export type BenefitSort = "recommended" | "endingSoon" | "popular" | "savings";
export type ClaimEffortFilter = "all" | "easy" | "condition" | "deadline";
export type FiveMinuteChecklistPreset = "freebie" | "coupon" | "freeShipping" | "endingSoon";

export const freeBenefitTabs: Array<{ id: FreeBenefitTabId; label: string }> = [
  { id: "all", label: "전체" },
  { id: "freebie", label: "무료 샘플" },
  { id: "experience", label: "체험단" },
  { id: "coupon", label: "쿠폰" },
  { id: "freeShipping", label: "무료배송" },
  { id: "point", label: "포인트" },
  { id: "convenienceStore", label: "편의점" },
  { id: "mart", label: "마트" },
  { id: "foodDelivery", label: "배달/외식" }
];

export const emptyVisitStreak: BenefitVisitStreak = {
  currentStreak: 0,
  totalVisits: 0,
  lastVisitedDate: "",
  visitedDates: []
};

export const fiveMinuteChecklist: Array<{
  title: string;
  description: string;
  preset: FiveMinuteChecklistPreset;
}> = [
  {
    title: "무료·0원 먼저 확인",
    description: "무료 샘플, 초대권, 체험단처럼 결제 부담이 낮은 혜택부터 봅니다.",
    preset: "freebie"
  },
  {
    title: "결제 전 쿠폰 적용",
    description: "첫 구매, 카드사, 브랜드 쿠폰 조건과 최소 주문 금액을 확인합니다.",
    preset: "coupon"
  },
  {
    title: "배송비 줄이기",
    description: "무료배송, 무배 쿠폰, 장보기 조건을 같이 보면 체감 절약이 커집니다.",
    preset: "freeShipping"
  },
  {
    title: "마감 전 다시 확인",
    description: "선착순, 기간 한정, 종료 예정 혜택은 판매처에서 최종 상태를 확인합니다.",
    preset: "endingSoon"
  }
];

export const benefitGuardrails: Array<[title: string, copy: string]> = [
  ["무료 혜택", "배송비, 체험단 조건, 회원가입 필요 여부를 먼저 확인"],
  ["쿠폰/포인트", "최소 주문 금액, 중복 적용, 적립 예정일을 확인"],
  ["편의점/마트", "행사 지점, 앱 쿠폰 발급 여부, 재고 변동 가능성 확인"],
  ["배달/외식", "지역, 시간대, 브랜드별 제외 메뉴와 결제 수단 조건 확인"]
];

export function getMinimumOrderLabel(deal: Deal) {
  if (!deal.minimumOrderAmount) return "최소 주문 없음";
  return `${formatPrice(deal.minimumOrderAmount)} 이상`;
}

export function getPriorityReason(deal: Deal, referenceNow: number) {
  const hoursLeft = (new Date(deal.expireAt).getTime() - referenceNow) / (60 * 60 * 1000);
  if (deal.isExpired) return "종료 가능성이 있어 판매처 상태를 먼저 확인하세요.";
  if (hoursLeft <= 6 || deal.isEndingSoon) return "마감 시간이 가까워 지금 먼저 확인할 혜택입니다.";
  if (deal.dealType === "freebie" || deal.dealType === "experience") return "비용 부담이 낮은 무료·체험 혜택입니다.";
  if (deal.dealType === "coupon" || deal.dealType === "foodDelivery") return "결제 전 쿠폰 조건을 먼저 챙기기 좋습니다.";
  if (deal.dealType === "point") return "출석체크나 페이 적립처럼 매일 반복 확인하기 좋습니다.";
  if (deal.isFreeShipping) return "배송비를 줄일 수 있어 생활비 절약 체감이 큽니다.";
  return "반응과 링크 상태가 좋은 혜택입니다.";
}

export function getPriorityScore(deal: Deal, referenceNow: number) {
  const hoursLeft = Math.max(0, (new Date(deal.expireAt).getTime() - referenceNow) / (60 * 60 * 1000));
  const urgencyScore = Math.max(0, 36 - hoursLeft) * 2;
  const benefitScore = deal.dealType === "freebie" || deal.dealType === "experience" ? 22 : deal.dealType === "coupon" || deal.dealType === "point" ? 16 : 8;
  const trustScore = deal.isVerified ? 12 : 0;
  const shippingScore = deal.isFreeShipping ? 8 : 0;
  const engagementScore = Math.min(20, deal.clickCount * 0.18 + deal.likeCount * 0.35);

  return urgencyScore + benefitScore + trustScore + shippingScore + engagementScore + deal.reliabilityScore * 0.08;
}
