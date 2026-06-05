import { Deal } from "@/types/deal";
import {
  isPolicyBlockedHost,
  isPolicyHomeOnlyUrl,
  isPolicyPlaceholderHost,
  isPolicySearchLikeUrl
} from "@/lib/deals/linkQualityPolicy";

export interface DealQualitySummary {
  total: number;
  verifiedLinks: number;
  directPurchaseLinks: number;
  publishableLinks: number;
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

export interface DealExposureDecision {
  canExpose: boolean;
  availability: Deal["availability"];
  validationStatus: Deal["validationStatus"];
  validationCode: Deal["validationCode"];
  hasDestination: boolean;
  destinationUrl: string;
  issues: string[];
}

const linkStatusLabels: Record<Deal["linkStatus"], string> = {
  verified: "구매 페이지 확인",
  needs_review: "확인 필요",
  broken: "링크 오류",
  sold_out: "품절 가능성"
};

const linkTypeLabels: Record<Deal["linkType"], string> = {
  direct_purchase: "상품 구매 링크",
  seller_search: "링크 확인 필요",
  search: "검색 링크",
  affiliate: "제휴 구매 링크",
  unavailable: "이동 불가"
};

const hiddenLinkTypes = new Set<Deal["linkType"]>(["seller_search", "search", "unavailable"]);

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
  if (hiddenLinkTypes.has(deal.linkType)) return "상품 상세 URL 보강 필요";
  return "운영 확인 필요";
}

export function getLinkReviewPriority(deal: Pick<Deal, "linkStatus" | "linkType" | "popularityScore" | "purchaseConfidence" | "isHot" | "isEndingSoon">): LinkReviewQueueItem["reviewPriority"] {
  if (deal.linkStatus === "broken" || deal.linkStatus === "sold_out") return "high";
  if (deal.isHot || deal.isEndingSoon || deal.popularityScore >= 85 || deal.purchaseConfidence < 45) return "high";
  if (hiddenLinkTypes.has(deal.linkType) || deal.popularityScore >= 70) return "medium";
  return "low";
}

export function getLinkReviewReason(deal: Pick<Deal, "linkStatus" | "linkType" | "isHot" | "isEndingSoon" | "purchaseConfidence">) {
  if (deal.linkStatus === "broken") return "이동 실패 링크라 교체가 필요합니다.";
  if (deal.linkStatus === "sold_out") return "품절 가능성이 있어 노출 종료를 검토하세요.";
  if (hiddenLinkTypes.has(deal.linkType)) return "검색 결과 또는 이동 불가 링크입니다. 실제 상품 상세 URL을 보강하세요.";
  if (deal.isHot || deal.isEndingSoon) return "상단 노출 가능성이 높아 링크 정확도 확인이 필요합니다.";
  if (deal.purchaseConfidence < 50) return "구매 링크 신뢰도가 낮아 재확인이 필요합니다.";
  return "운영 확인이 필요한 링크입니다.";
}

type VisibilityInput = Pick<Deal, "linkStatus" | "linkType"> &
  Partial<
    Pick<
      Deal,
      | "availability"
      | "validationStatus"
      | "validationReason"
      | "isHidden"
      | "finalPurchaseUrl"
      | "finalUrl"
      | "purchaseLinkVerified"
      | "linkVerified"
      | "isExpired"
      | "isSoldOut"
      | "thumbnail"
      | "imageUrl"
      | "salePrice"
      | "price"
      | "originalPrice"
      | "discountRate"
      | "purchaseConfidence"
      | "reliabilityScore"
      | "lastCheckedAt"
      | "checkedAt"
      | "priceCheckedAt"
      | "publishable"
    >
  >;

export function isSearchLinkType(linkType: Deal["linkType"]) {
  return linkType === "seller_search" || linkType === "search";
}

export function resolveDealAvailability(deal: VisibilityInput): Deal["availability"] {
  if (deal.availability) return deal.availability;
  if (deal.isSoldOut || deal.linkStatus === "sold_out") return "sold_out";
  if (deal.isExpired) return "ended";
  if (deal.linkStatus === "verified" && !hiddenLinkTypes.has(deal.linkType)) return "active";
  return "unknown";
}

export function resolveDealValidationStatus(deal: VisibilityInput): Deal["validationStatus"] {
  if (deal.validationStatus) return deal.validationStatus;
  if (deal.linkStatus === "broken" || deal.linkStatus === "sold_out" || hiddenLinkTypes.has(deal.linkType)) return "failed";
  if (deal.linkStatus === "verified" && Boolean(deal.finalPurchaseUrl || deal.finalUrl)) return "passed";
  return "needs_review";
}

function parseHttpDestination(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

export function getDealExposureDecision(deal: VisibilityInput): DealExposureDecision {
  const availability = resolveDealAvailability(deal);
  const validationStatus = resolveDealValidationStatus(deal);
  const destinationKnown = "finalPurchaseUrl" in deal || "finalUrl" in deal;
  const destinationUrl = `${deal.finalPurchaseUrl || deal.finalUrl || ""}`.trim();
  const hasDestination = destinationKnown ? Boolean(destinationUrl) : true;
  const issues: string[] = [];

  if (deal.isHidden === true) issues.push("manual_hidden");
  if (deal.publishable === false) issues.push("publishable_false");
  if (availability !== "active") issues.push(`availability_${availability}`);
  if (validationStatus !== "passed") issues.push(`validation_${validationStatus}`);
  if (deal.linkStatus !== "verified") issues.push(`link_status_${deal.linkStatus}`);
  if (hiddenLinkTypes.has(deal.linkType)) issues.push(`link_type_${deal.linkType}`);
  if (!hasDestination) issues.push("missing_final_url");

  if (destinationKnown && destinationUrl) {
    const parsedUrl = parseHttpDestination(destinationUrl);

    if (!parsedUrl) {
      issues.push("unsafe_protocol_or_invalid_url");
    } else {
      const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

      if (isPolicyBlockedHost(host)) issues.push("blocked_or_community_host");
      if (isPolicyPlaceholderHost(host)) issues.push("placeholder_host");
      if (isPolicyHomeOnlyUrl(parsedUrl)) issues.push("home_or_landing_url");
      if (isPolicySearchLikeUrl(parsedUrl)) issues.push("search_or_category_url");
    }
  }
  const validationCode = getDealValidationCodeFromIssues(issues, availability, validationStatus);

  return {
    canExpose: issues.length === 0,
    availability,
    validationStatus,
    validationCode,
    hasDestination,
    destinationUrl,
    issues
  };
}

export function shouldHideDeal(deal: VisibilityInput) {
  return !getDealExposureDecision(deal).canExpose;
}

function getDealValidationCodeFromIssues(
  issues: string[],
  availability: Deal["availability"],
  validationStatus: Deal["validationStatus"]
): Deal["validationCode"] {
  if (!issues.length && availability === "active" && validationStatus === "passed") return "valid";
  if (issues.includes("manual_hidden") || issues.includes("publishable_false")) return "hidden";
  if (issues.includes("availability_sold_out")) return "sold_out";
  if (issues.includes("availability_ended")) return "stale";
  if (issues.some((issue) => issue === "link_type_search" || issue === "link_type_seller_search" || issue === "search_or_category_url")) {
    return "search_link";
  }
  if (issues.includes("home_or_landing_url")) return "homepage_link";
  if (issues.includes("blocked_or_community_host") || issues.includes("placeholder_host")) return "community_link";
  if (issues.includes("missing_final_url")) return "missing_final_url";
  if (issues.includes("unsafe_protocol_or_invalid_url")) return "unsafe_url";
  if (validationStatus === "needs_review") return "mismatch";
  return "invalid";
}

export function getDealValidationCode(deal: VisibilityInput) {
  return getDealExposureDecision(deal).validationCode;
}

export function getDealPriorityScore(deal: VisibilityInput) {
  let score = 50;

  if (deal.linkStatus === "verified" && !hiddenLinkTypes.has(deal.linkType)) score += deal.linkType === "affiliate" ? 24 : 20;
  if (deal.purchaseLinkVerified || deal.linkVerified) score += 10;
  if (deal.finalPurchaseUrl || deal.finalUrl) score += 8;
  if (deal.thumbnail || deal.imageUrl) score += 8;
  if ((deal.salePrice ?? deal.price ?? 0) > 0 && (deal.originalPrice ?? 0) >= (deal.salePrice ?? deal.price ?? 0)) score += 8;
  if ((deal.discountRate ?? 0) > 0) score += 5;
  if ((deal.purchaseConfidence ?? 0) >= 80) score += 6;
  if ((deal.reliabilityScore ?? 0) >= 90) score += 4;
  if (deal.lastCheckedAt || deal.checkedAt || deal.priceCheckedAt) score += 4;
  if (isSearchLinkType(deal.linkType)) score -= 45;
  if (deal.linkType === "unavailable") score -= 50;
  if (deal.linkStatus === "broken") score -= 55;
  if (deal.linkStatus === "sold_out" || deal.isSoldOut) score -= 60;
  if (deal.isExpired) score -= 55;
  if (shouldHideDeal(deal)) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isVerifiedPurchaseLink(deal: VisibilityInput) {
  return getDealExposureDecision(deal).canExpose;
}

export function isPubliclyVisibleDeal(deal: VisibilityInput) {
  return isVerifiedPurchaseLink(deal) && !shouldHideDeal(deal);
}

export function needsLinkReview(deal: Pick<Deal, "linkStatus" | "linkType">) {
  return !isVerifiedPurchaseLink(deal) || hiddenLinkTypes.has(deal.linkType);
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
  const publishableLinks = deals.filter((deal) => deal.publishable === true && isPubliclyVisibleDeal(deal)).length;
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
    publishableLinks,
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
