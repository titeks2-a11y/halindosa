import type { Deal, DealBenefitType } from "@/types/deal";

export type WeeklyBenefitSort = "recommended" | "endingSoon" | "popular" | "savings";

export interface WeeklyBenefitPreset {
  activeType: "all" | DealBenefitType;
  sort: WeeklyBenefitSort;
  query?: string;
  endingSoonOnly?: boolean;
  freeShippingOnly?: boolean;
  noSignupOnly?: boolean;
  firstComeOnly?: boolean;
  activeOnly?: boolean;
}

export interface WeeklyBenefitCalendarItem {
  day: "월" | "화" | "수" | "목" | "금" | "토" | "일";
  title: string;
  copy: string;
  count: number;
  operationNote: string;
  recommendedSurface: string;
  preset: WeeklyBenefitPreset;
}

function isEndingSoon(deal: Deal, referenceNow: number) {
  return deal.isEndingSoon || new Date(deal.expireAt).getTime() - referenceNow < 24 * 60 * 60 * 1000;
}

export function buildWeeklyBenefitCalendar(deals: Deal[], referenceNow = Date.now()): WeeklyBenefitCalendarItem[] {
  const pointDeals = deals.filter((deal) => deal.dealType === "point");
  const freeDeals = deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience");
  const couponDeals = deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery");
  const martDeals = deals.filter((deal) => deal.dealType === "mart" || deal.dealType === "convenienceStore" || deal.isFreeShipping);
  const endingDeals = deals.filter((deal) => isEndingSoon(deal, referenceNow));
  const verifiedWeekendDeals = deals.filter((deal) => (deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified) && !deal.isExpired && !deal.isSoldOut);
  const noSignupDeals = deals.filter((deal) => !deal.requiresSignup && !deal.isExpired && !deal.isSoldOut);

  return [
    {
      day: "월",
      title: "출석·포인트 적립",
      copy: "한 주 시작에 앱테크와 페이 적립 혜택을 먼저 챙깁니다.",
      count: pointDeals.length,
      operationNote: "월요일 오전에는 출석체크, 페이 리워드, 멤버십 포인트 조건을 최신 상태로 보강합니다.",
      recommendedSurface: "/free-benefits?type=point",
      preset: { activeType: "point", sort: "recommended", activeOnly: true }
    },
    {
      day: "화",
      title: "무료 샘플·체험단",
      copy: "신청형 혜택은 선착순이 많아 초반에 먼저 확인합니다.",
      count: freeDeals.length,
      operationNote: "무료 샘플, 체험단, 초대권 수량과 배송비 조건을 우선 점검합니다.",
      recommendedSurface: "/free-benefits?type=freebie",
      preset: { activeType: "freebie", sort: "recommended", firstComeOnly: true, activeOnly: true }
    },
    {
      day: "수",
      title: "쿠폰·배달 할인",
      copy: "외식, 배달, 첫 구매 쿠폰 조건을 결제 전에 점검합니다.",
      count: couponDeals.length,
      operationNote: "최소 주문금액, 중복 할인 가능 여부, 결제수단 제한을 사용자가 보기 쉽게 정리합니다.",
      recommendedSurface: "/free-benefits?type=coupon",
      preset: { activeType: "coupon", sort: "popular", activeOnly: true }
    },
    {
      day: "목",
      title: "마트·편의점 행사",
      copy: "주말 장보기 전 1+1, 마트 행사, 무배 조건을 모아봅니다.",
      count: martDeals.length,
      operationNote: "편의점 1+1, 마트 행사 기간, 지점 제한, 무료배송 조건을 목요일에 보강합니다.",
      recommendedSurface: "/free-benefits?type=mart",
      preset: { activeType: "mart", sort: "recommended", freeShippingOnly: true, activeOnly: true }
    },
    {
      day: "금",
      title: "마감 전 최종 확인",
      copy: "주말 전에 끝날 수 있는 혜택을 마감 임박순으로 정리합니다.",
      count: endingDeals.length,
      operationNote: "금요일에는 종료, 품절, 선착순 가능성을 재점검하고 신고 누적 항목을 먼저 정리합니다.",
      recommendedSurface: "/free-benefits?sort=endingSoon",
      preset: { activeType: "all", sort: "endingSoon", endingSoonOnly: true, firstComeOnly: true }
    },
    {
      day: "토",
      title: "실구매 특가 재확인",
      copy: "주말 구매 전 실제 상세 이동이 확인된 혜택과 상품을 다시 봅니다.",
      count: verifiedWeekendDeals.length,
      operationNote: "토요일에는 구매 상세 URL, 판매처 도메인, 가격 기준 시간을 다시 확인합니다.",
      recommendedSurface: "/?verifiedOnly=true",
      preset: { activeType: "all", sort: "popular", activeOnly: true }
    },
    {
      day: "일",
      title: "가입 없이 받을 혜택",
      copy: "새 주가 시작되기 전 비회원도 바로 확인할 수 있는 혜택을 정리합니다.",
      count: noSignupDeals.length,
      operationNote: "일요일에는 회원가입 없이 볼 수 있는 혜택과 다음 주 재방문 루틴을 정리합니다.",
      recommendedSurface: "/free-benefits?noSignup=true",
      preset: { activeType: "all", sort: "recommended", noSignupOnly: true, activeOnly: true }
    }
  ];
}
