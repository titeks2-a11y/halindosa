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
  popularityScore: number;
  expireAt: string;
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

export function summarizeDealQuality(deals: Deal[]): DealQualitySummary {
  const total = deals.length;
  const verifiedLinks = deals.filter(isVerifiedPurchaseLink).length;
  const directPurchaseLinks = deals.filter((deal) => deal.linkType === "direct_purchase" || deal.linkType === "affiliate").length;
  const needsReviewLinks = deals.filter(needsLinkReview).length;
  const brokenLinks = deals.filter((deal) => deal.linkStatus === "broken").length;
  const soldOutLinks = deals.filter((deal) => deal.linkStatus === "sold_out").length;

  return {
    total,
    verifiedLinks,
    directPurchaseLinks,
    needsReviewLinks,
    brokenLinks,
    soldOutLinks,
    verifiedRate: percent(verifiedLinks, total),
    directPurchaseRate: percent(directPurchaseLinks, total),
    generatedAt: new Date().toISOString()
  };
}

export function getLinkReviewQueue(deals: Deal[], limit = 8): LinkReviewQueueItem[] {
  return deals
    .filter(needsLinkReview)
    .sort((a, b) => b.popularityScore - a.popularityScore || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime())
    .slice(0, limit)
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      mallName: deal.mallName,
      category: deal.category,
      linkStatus: deal.linkStatus,
      linkType: deal.linkType,
      linkLabel: deal.linkLabel,
      popularityScore: deal.popularityScore,
      expireAt: deal.expireAt
    }));
}
