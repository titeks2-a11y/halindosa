import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import type { Deal, DealBenefitType } from "@/types/deal";

export type DailyBenefitSectionKey =
  | "free-first"
  | "coupon-before-pay"
  | "apptech-point"
  | "mart-convenience"
  | "ending-soon"
  | "verified-purchase";

export const todayBenefitSectionCopy: Record<DailyBenefitSectionKey, { title: string; description: string }> = {
  "free-first": {
    title: "무료로 먼저 받을 혜택",
    description: "무료 샘플, 체험단, 초대권처럼 결제 부담이 낮은 혜택을 먼저 확인합니다."
  },
  "coupon-before-pay": {
    title: "결제 전 챙길 쿠폰",
    description: "쇼핑몰, 배달, 카드, 브랜드 쿠폰처럼 구매 전에 조건을 확인할 혜택입니다."
  },
  "apptech-point": {
    title: "앱테크·포인트 적립",
    description: "출석체크, 페이 리워드, 멤버십 포인트처럼 매일 반복 확인하기 좋은 혜택입니다."
  },
  "mart-convenience": {
    title: "마트·편의점 생활 혜택",
    description: "1+1, 2+1, 무료배송, 장보기 쿠폰처럼 생활비 절약 체감이 큰 혜택입니다."
  },
  "ending-soon": {
    title: "마감 전 확인할 혜택",
    description: "선착순, 기간 한정, 종료 가능 혜택을 판매처에서 마지막으로 확인합니다."
  },
  "verified-purchase": {
    title: "구매처 바로 확인 특가",
    description: "검색 결과가 아니라 상품·혜택 상세 이동이 확인된 특가를 우선 보여줍니다."
  }
};

export function getBenefitHoursLeft(deal: Deal) {
  return Math.max(0, (new Date(deal.expireAt).getTime() - Date.now()) / (60 * 60 * 1000));
}

export function getDailyBenefitScore(deal: Deal) {
  const urgencyScore = Math.max(0, 36 - getBenefitHoursLeft(deal)) * 2.2;
  const freeScore = deal.salePrice === 0 || deal.dealType === "freebie" || deal.dealType === "experience" ? 24 : 0;
  const couponScore = deal.dealType === "coupon" || deal.dealType === "foodDelivery" || deal.dealType === "point" ? 16 : 0;
  const trustScore = deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified ? 18 : 0;
  const shippingScore = deal.isFreeShipping ? 8 : 0;
  const reactionScore = Math.min(24, deal.clickCount * 0.18 + deal.likeCount * 0.35 + deal.viewCount * 0.04);

  return urgencyScore + freeScore + couponScore + trustScore + shippingScore + reactionScore + deal.reliabilityScore * 0.1;
}

export function getDailyBenefitSectionDeals(key: DailyBenefitSectionKey, deals: Deal[]) {
  const benefitTypes: Partial<Record<DailyBenefitSectionKey, DealBenefitType[]>> = {
    "free-first": ["freebie", "experience", "freeShipping"],
    "coupon-before-pay": ["coupon", "foodDelivery"],
    "apptech-point": ["point"],
    "mart-convenience": ["convenienceStore", "mart", "freeShipping"]
  };

  if (key === "ending-soon") {
    return deals.filter((deal) => deal.isEndingSoon || getBenefitHoursLeft(deal) <= 24 || deal.isFirstComeFirstServed);
  }

  if (key === "verified-purchase") {
    return deals.filter((deal) => deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified);
  }

  const types = benefitTypes[key] ?? [];
  return deals.filter((deal) => types.includes(deal.dealType) || (key === "mart-convenience" && deal.isFreeShipping));
}

export function toDailyBenefitItem(deal: Deal) {
  return {
    id: deal.id,
    title: deal.title,
    mallName: deal.mallName,
    category: deal.category,
    dealType: deal.dealType,
    dealTypeLabel: getBenefitTypeLabel(deal.dealType),
    benefitSummary: deal.benefitSummary,
    salePrice: deal.salePrice,
    originalPrice: deal.originalPrice,
    discountRate: deal.discountRate,
    savingsAmount: deal.savingsAmount,
    thumbnail: deal.thumbnail,
    redirectUrl: `/go/${deal.id}`,
    detailUrl: `/deals/${deal.id}`,
    expireAt: deal.expireAt,
    isEndingSoon: deal.isEndingSoon || getBenefitHoursLeft(deal) <= 24,
    isFreeShipping: deal.isFreeShipping,
    requiresSignup: deal.requiresSignup,
    isFirstComeFirstServed: deal.isFirstComeFirstServed,
    linkStatus: deal.linkStatus,
    purchaseLinkVerified: deal.purchaseLinkVerified,
    claimCta: deal.claimCta,
    eligibilityChecklist: deal.eligibilityChecklist.slice(0, 4),
    claimSteps: deal.claimSteps.slice(0, 3),
    claimWarning: deal.claimWarning
  };
}

export function buildDailyBenefitSection(key: DailyBenefitSectionKey, deals: Deal[], limit: number) {
  const scopedDeals = getDailyBenefitSectionDeals(key, deals);
  const items = [...scopedDeals]
    .filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken")
    .sort((a, b) => getDailyBenefitScore(b) - getDailyBenefitScore(a) || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime())
    .slice(0, limit)
    .map(toDailyBenefitItem);

  return {
    key,
    ...todayBenefitSectionCopy[key],
    count: scopedDeals.length,
    items
  };
}

export function buildTodayBenefitQueue(deals: Deal[], limit = 6) {
  const sectionKeys: DailyBenefitSectionKey[] = [
    "free-first",
    "coupon-before-pay",
    "apptech-point",
    "mart-convenience",
    "ending-soon",
    "verified-purchase"
  ];
  const sections = sectionKeys.map((key) => buildDailyBenefitSection(key, deals, limit));

  return {
    audience: "guest",
    loginRequiredFor: ["찜 동기화", "가격 알림 저장", "관심 카테고리 개인화"],
    summary: {
      totalDeals: deals.length,
      activeDeals: deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken").length,
      freeBenefitDeals: getDailyBenefitSectionDeals("free-first", deals).length,
      couponDeals: getDailyBenefitSectionDeals("coupon-before-pay", deals).length,
      verifiedPurchaseDeals: getDailyBenefitSectionDeals("verified-purchase", deals).length
    },
    sections,
    notice: "최종 가격, 재고, 수령 조건은 판매처 화면에서 다시 확인하세요."
  };
}
