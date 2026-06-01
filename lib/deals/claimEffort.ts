import type { Deal } from "@/types/deal";

export type ClaimEffort = "easy" | "condition" | "deadline";

export const claimEffortCopy: Record<ClaimEffort, { label: string; description: string; action: string; href: string }> = {
  easy: {
    label: "간편 수령",
    description: "가입, 배송비, 쿠폰 조건 부담이 낮아 먼저 눌러볼 혜택입니다.",
    action: "간편 혜택만",
    href: "/free-benefits?effort=easy"
  },
  condition: {
    label: "조건 확인",
    description: "회원가입, 최소 주문, 쿠폰 조건, 배송비를 확인해야 하는 혜택입니다.",
    action: "조건 있는 혜택",
    href: "/free-benefits?effort=condition"
  },
  deadline: {
    label: "마감 주의",
    description: "선착순, 마감 임박, 종료 가능성이 있어 빨리 확인할 혜택입니다.",
    action: "마감 먼저",
    href: "/free-benefits?effort=deadline"
  }
};

export function getBenefitHoursLeftFrom(deal: Deal, referenceNow = Date.now()) {
  const expiresAt = new Date(deal.expireAt || deal.expiresAt).getTime();
  if (!Number.isFinite(expiresAt)) return Number.POSITIVE_INFINITY;
  return (expiresAt - referenceNow) / (60 * 60 * 1000);
}

export function getClaimEffort(deal: Deal, referenceNow = Date.now()): ClaimEffort {
  const hoursLeft = getBenefitHoursLeftFrom(deal, referenceNow);
  if (deal.isEndingSoon || deal.isFirstComeFirstServed || hoursLeft <= 12) return "deadline";
  if (deal.requiresSignup || deal.couponCondition || deal.minimumOrderAmount || (!deal.isFreeShipping && deal.shippingFee !== "무료배송" && deal.salePrice > 0)) {
    return "condition";
  }
  return "easy";
}

export function getClaimEffortLabel(effort: ClaimEffort) {
  return claimEffortCopy[effort].label;
}

export function getClaimEffortPriority(effort: ClaimEffort) {
  if (effort === "easy") return 1;
  if (effort === "deadline") return 2;
  return 3;
}

export function buildClaimEffortSummary(deals: Deal[], referenceNow = Date.now()) {
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");
  const groups = (Object.keys(claimEffortCopy) as ClaimEffort[]).map((effort) => {
    const matchedDeals = activeDeals.filter((deal) => getClaimEffort(deal, referenceNow) === effort);
    const sample = [...matchedDeals]
      .sort((a, b) => {
        const urgent = getBenefitHoursLeftFrom(a, referenceNow) - getBenefitHoursLeftFrom(b, referenceNow);
        if (effort === "deadline" && urgent !== 0) return urgent;
        return b.likeCount + b.clickCount - (a.likeCount + a.clickCount);
      })
      .slice(0, 5);

    return {
      effort,
      ...claimEffortCopy[effort],
      count: matchedDeals.length,
      items: sample.map((deal) => ({
        id: deal.id,
        title: deal.title,
        mallName: deal.mallName,
        dealType: deal.dealType,
        benefitSummary: deal.benefitSummary,
        isFirstComeFirstServed: deal.isFirstComeFirstServed,
        requiresSignup: deal.requiresSignup,
        shippingFee: deal.shippingFee,
        couponCondition: deal.couponCondition,
        expireAt: deal.expireAt,
        detailUrl: `/deals/${deal.id}`,
        redirectUrl: `/go/${deal.id}`
      }))
    };
  });

  return {
    totalActiveBenefits: activeDeals.length,
    groups,
    recommendedOrder: groups
      .filter((group) => group.count > 0)
      .sort((a, b) => getClaimEffortPriority(a.effort) - getClaimEffortPriority(b.effort))
      .map((group) => group.effort),
    notice: "비회원도 모든 혜택을 볼 수 있고, 판매처에서 최종 조건을 다시 확인해야 합니다."
  };
}
