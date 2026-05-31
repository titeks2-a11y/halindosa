import { Deal } from "@/types/deal";

export interface DealQualitySummary {
  total: number;
  verifiedLinks: number;
  directPurchaseLinks: number;
  needsReviewLinks: number;
  brokenLinks: number;
  soldOutLinks: number;
  verifiedRate: number;
  directPurchaseRate: number;
  averagePurchaseConfidence: number;
  generatedAt: string;
}

export interface LinkReviewQueueItem {
  id: string;
  title: string;
  mallName: string;
  category: Deal["category"];
  linkStatus: Deal["linkStatus"];
  linkType: Deal["linkType"];
  linkLabel: string;
  finalPurchaseUrl: string;
  purchaseConfidence: number;
  checkedAt: string;
  reviewPriority: "high" | "medium" | "low";
  reviewReason: string;
  popularityScore: number;
  expireAt: string;
}

export interface PurchaseTrustChecklistItem {
  label: string;
  value: string;
  tone: "good" | "caution" | "danger" | "neutral";
}

const linkStatusLabels: Record<Deal["linkStatus"], string> = {
  verified: "구매 페이지 확인",
  needs_review: "확인 필요",
  broken: "링크 오류",
  sold_out: "품절 가능성"
};

const linkTypeLabels: Record<Deal["linkType"], string> = {
  direct_purchase: "상품 구매 링크",
  seller_search: "판매처 검색 링크",
  affiliate: "제휴 구매 링크",
  unavailable: "이동 불가"
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function getLinkStatusLabel(status: Deal["linkStatus"]) {
  return linkStatusLabels[status] ?? status;
}

export function getLinkTypeLabel(type: Deal["linkType"]) {
  return linkTypeLabels[type] ?? type;
}

export function getLinkReviewActionLabel(deal: Pick<Deal, "linkStatus" | "linkType">) {
  if (deal.linkStatus === "broken") return "링크 교체 필요";
  if (deal.linkStatus === "sold_out") return "노출 종료 검토";
  if (deal.linkType === "seller_search") return "상품 상세 URL 보강 필요";
  return "운영 확인 필요";
}

export function getLinkReviewPriority(deal: Pick<Deal, "linkStatus" | "linkType" | "popularityScore" | "purchaseConfidence" | "isHot" | "isEndingSoon">): LinkReviewQueueItem["reviewPriority"] {
  if (deal.linkStatus === "broken" || deal.linkStatus === "sold_out") return "high";
  if (deal.isHot || deal.isEndingSoon || deal.popularityScore >= 85 || deal.purchaseConfidence < 45) return "high";
  if (deal.linkType === "seller_search" || deal.popularityScore >= 70) return "medium";
  return "low";
}

export function getLinkReviewReason(deal: Pick<Deal, "linkStatus" | "linkType" | "isHot" | "isEndingSoon" | "purchaseConfidence">) {
  if (deal.linkStatus === "broken") return "이동 실패 링크라 교체가 필요합니다.";
  if (deal.linkStatus === "sold_out") return "품절 가능성이 있어 노출 종료를 검토하세요.";
  if (deal.linkType === "seller_search") return "검색 결과 이동 상품입니다. 실제 상품 상세 URL을 보강하세요.";
  if (deal.isHot || deal.isEndingSoon) return "상단 노출 가능성이 높아 링크 정확도 확인이 필요합니다.";
  if (deal.purchaseConfidence < 50) return "구매 링크 신뢰도가 낮아 재확인이 필요합니다.";
  return "운영 확인이 필요한 링크입니다.";
}

export function isVerifiedPurchaseLink(deal: Pick<Deal, "linkStatus" | "linkType">) {
  return deal.linkStatus === "verified" && deal.linkType !== "seller_search" && deal.linkType !== "unavailable";
}

export function needsLinkReview(deal: Pick<Deal, "linkStatus" | "linkType">) {
  return !isVerifiedPurchaseLink(deal) || deal.linkType === "seller_search";
}

export function getLinkQualityScore(deal: Pick<Deal, "linkStatus" | "linkType">) {
  if (deal.linkStatus === "broken" || deal.linkStatus === "sold_out" || deal.linkType === "unavailable") return -40;
  if (isVerifiedPurchaseLink(deal)) return deal.linkType === "affiliate" ? 30 : 28;
  if (deal.linkType === "direct_purchase") return 16;
  if (needsLinkReview(deal)) return -10;
  return 0;
}

export function getDealQualityNotice(
  deal: Pick<Deal, "linkStatus" | "linkType" | "reportCount" | "isSoldOut" | "isExpired" | "isVerified" | "isEndingSoon">
) {
  if (deal.isSoldOut || deal.linkStatus === "sold_out") {
    return {
      label: "품절 확인 필요",
      description: "판매처 재고와 옵션 선택 가능 여부를 먼저 확인하세요.",
      tone: "warning" as const
    };
  }

  if (deal.isExpired) {
    return {
      label: "종료 확인 필요",
      description: "행사나 쿠폰이 종료됐을 수 있어 판매처 조건 확인이 필요합니다.",
      tone: "warning" as const
    };
  }

  if (deal.linkStatus === "broken" || deal.reportCount >= 3) {
    return {
      label: "운영 확인 중",
      description: "신고가 누적되어 링크와 가격 조건을 다시 확인하고 있습니다.",
      tone: "review" as const
    };
  }

  if (deal.isEndingSoon) {
    return {
      label: "마감 전 확인",
      description: "마감이 가까워 가격, 쿠폰, 재고가 빠르게 바뀔 수 있습니다.",
      tone: "urgent" as const
    };
  }

  if (isVerifiedPurchaseLink(deal) && deal.isVerified) {
    return {
      label: "판매처 링크 확인",
      description: "검색 결과가 아닌 판매처 상세 이동을 우선 확인한 혜택입니다.",
      tone: "verified" as const
    };
  }

  return {
    label: "구매 전 조건 확인",
    description: "최종 가격, 배송비, 쿠폰 조건은 판매처에서 다시 확인하세요.",
    tone: "neutral" as const
  };
}

export function getPurchaseTrustChecklist(
  deal: Pick<Deal, "linkStatus" | "linkType" | "reportCount" | "isSoldOut" | "isExpired" | "isVerified" | "isEndingSoon">
): PurchaseTrustChecklistItem[] {
  const linkTone =
    deal.linkStatus === "broken" || deal.linkType === "unavailable"
      ? "danger"
      : isVerifiedPurchaseLink(deal) && deal.isVerified
        ? "good"
        : "caution";

  const reportTone = deal.reportCount >= 3 ? "danger" : deal.reportCount > 0 ? "caution" : "good";
  const deadlineTone = deal.isSoldOut || deal.isExpired ? "danger" : deal.isEndingSoon ? "caution" : "good";

  return [
    {
      label: "판매처 링크",
      value: isVerifiedPurchaseLink(deal) && deal.isVerified ? "상세 이동 우선" : getLinkStatusLabel(deal.linkStatus),
      tone: linkTone
    },
    {
      label: "신고 상태",
      value: deal.reportCount > 0 ? `${deal.reportCount}건 확인 중` : "신고 없음",
      tone: reportTone
    },
    {
      label: "마감 상태",
      value: deal.isSoldOut ? "품절 가능성" : deal.isExpired ? "종료 확인" : deal.isEndingSoon ? "마감 임박" : "진행 중",
      tone: deadlineTone
    }
  ];
}

export function summarizeDealQuality(deals: Deal[]): DealQualitySummary {
  const total = deals.length;
  const verifiedLinks = deals.filter(isVerifiedPurchaseLink).length;
  const directPurchaseLinks = deals.filter((deal) => deal.linkType === "direct_purchase" || deal.linkType === "affiliate").length;
  const needsReviewLinks = deals.filter(needsLinkReview).length;
  const brokenLinks = deals.filter((deal) => deal.linkStatus === "broken").length;
  const soldOutLinks = deals.filter((deal) => deal.linkStatus === "sold_out").length;
  const averagePurchaseConfidence = total
    ? Math.round(deals.reduce((sum, deal) => sum + (deal.purchaseConfidence ?? 0), 0) / total)
    : 0;

  return {
    total,
    verifiedLinks,
    directPurchaseLinks,
    needsReviewLinks,
    brokenLinks,
    soldOutLinks,
    verifiedRate: percent(verifiedLinks, total),
    directPurchaseRate: percent(directPurchaseLinks, total),
    averagePurchaseConfidence,
    generatedAt: new Date().toISOString()
  };
}

export function getLinkReviewQueue(deals: Deal[], limit = 8): LinkReviewQueueItem[] {
  return deals
    .filter(needsLinkReview)
    .sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[getLinkReviewPriority(b)] - priorityWeight[getLinkReviewPriority(a)];
      if (priorityDiff !== 0) return priorityDiff;
      return b.popularityScore - a.popularityScore || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
    })
    .slice(0, limit)
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      mallName: deal.mallName,
      category: deal.category,
      linkStatus: deal.linkStatus,
      linkType: deal.linkType,
      linkLabel: deal.linkLabel,
      finalPurchaseUrl: deal.finalPurchaseUrl,
      purchaseConfidence: deal.purchaseConfidence,
      checkedAt: deal.checkedAt,
      reviewPriority: getLinkReviewPriority(deal),
      reviewReason: getLinkReviewReason(deal),
      popularityScore: deal.popularityScore,
      expireAt: deal.expireAt
    }));
}
