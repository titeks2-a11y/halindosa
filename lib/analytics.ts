import { findDealById, getDeals } from "@/lib/dealService";
import { getLinkReviewQueue, summarizeDealQuality } from "@/lib/deals/quality";
import { getPriceInsight } from "@/lib/priceHistory";

export type AnalyticsEventType = "deal_click" | "favorite_add" | "favorite_remove" | "redirect_click";

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  dealId: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

const eventTypes = new Set<AnalyticsEventType>(["deal_click", "favorite_add", "favorite_remove", "redirect_click"]);

export function validateAnalyticsEvent(input: AnalyticsEventInput) {
  if (!input.eventType || !eventTypes.has(input.eventType)) {
    return {
      ok: false,
      status: 400,
      message: "지원하지 않는 이벤트 타입입니다."
    };
  }

  if (!input.dealId || !findDealById(input.dealId)) {
    return {
      ok: false,
      status: 404,
      message: "유효하지 않은 특가 ID입니다."
    };
  }

  return {
    ok: true,
    status: 200,
    message: "이벤트가 기록되었습니다."
  };
}

export function createAnalyticsEvent(input: AnalyticsEventInput) {
  return {
    id: crypto.randomUUID(),
    eventType: input.eventType,
    dealId: input.dealId,
    page: input.page ?? "unknown",
    metadata: input.metadata ?? {},
    receivedAt: new Date().toISOString()
  };
}

export async function getMockBusinessMetrics() {
  const { deals, updatedAt, source } = await getDeals();
  const hotDeals = deals.filter((deal) => deal.isHot);
  const endingSoonDeals = deals.filter((deal) => deal.isEndingSoon);
  const averageDiscount = Math.round(deals.reduce((sum, deal) => sum + deal.discountRate, 0) / deals.length);
  const potentialSavings = deals.reduce((sum, deal) => sum + deal.discountAmount, 0);
  const mallCount = new Set(deals.map((deal) => deal.mall)).size;
  const categoryCount = new Set(deals.map((deal) => deal.category)).size;
  const topDeals = [...deals].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 5);
  const priceInsights = deals.map(getPriceInsight);
  const lowestPriceDeals = priceInsights.filter((insight) => insight.isLowestPrice).length;
  const linkQuality = summarizeDealQuality(deals);
  const linkReviewQueue = getLinkReviewQueue(deals, 8);
  const averageConfidenceScore = Math.round(
    priceInsights.reduce((sum, insight) => sum + insight.confidenceScore, 0) / priceInsights.length
  );

  return {
    updatedAt,
    source,
    metrics: {
      totalDeals: deals.length,
      hotDeals: hotDeals.length,
      endingSoonDeals: endingSoonDeals.length,
      averageDiscount,
      potentialSavings,
      mallCount,
      categoryCount,
      lowestPriceDeals,
      averageConfidenceScore,
      verifiedLinkRate: linkQuality.verifiedRate,
      needsReviewLinks: linkQuality.needsReviewLinks,
      brokenLinks: linkQuality.brokenLinks,
      soldOutLinks: linkQuality.soldOutLinks,
      estimatedClickValue: hotDeals.length * 120 + endingSoonDeals.length * 90
    },
    topDeals,
    linkQuality,
    linkReviewQueue
  };
}
