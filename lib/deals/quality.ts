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

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function summarizeDealQuality(deals: Deal[]): DealQualitySummary {
  const total = deals.length;
  const verifiedLinks = deals.filter((deal) => deal.linkStatus === "verified").length;
  const directPurchaseLinks = deals.filter((deal) => deal.linkType === "direct_purchase" || deal.linkType === "affiliate").length;
  const needsReviewLinks = deals.filter((deal) => deal.linkStatus === "needs_review" || deal.linkType === "seller_search").length;
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
