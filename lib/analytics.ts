import { findDealById, getDeals } from "@/lib/dealService";
import { getLinkReviewQueue, summarizeDealQuality } from "@/lib/deals/quality";
import { getPriceInsight } from "@/lib/priceHistory";
import type { Deal, DealBenefitType } from "@/types/deal";

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

function buildLaunchReadiness(linkQuality: ReturnType<typeof summarizeDealQuality>) {
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (linkQuality.verifiedRate < 80) {
    blockers.push("직접 구매 링크 확인율 80% 미만");
    nextActions.push("클릭 상위 상품부터 실제 상품 상세 URL로 보강");
  }

  if (linkQuality.needsReviewLinks > 0) {
    blockers.push(`링크 검수 대기 ${linkQuality.needsReviewLinks}개`);
    nextActions.push("검색 fallback 상품을 운영 링크 검수 큐에서 처리");
  }

  if (linkQuality.brokenLinks + linkQuality.soldOutLinks > 0) {
    blockers.push("품절 또는 오류 가능 링크 존재");
    nextActions.push("품절/오류 링크는 노출 종료 또는 대체 상품으로 교체");
  }

  if (!blockers.length) {
    return {
      phase: "출시 가능 후보",
      summary: "구매 링크와 품질 검수 기준이 출시 기준을 충족했습니다.",
      blockers,
      nextActions: ["스토어 계정에서 signed AAB, 스크린샷, 공개 정책 URL을 최종 확인"]
    };
  }

  return {
    phase: linkQuality.verifiedRate >= 80 ? "비공개 테스트 후보" : "운영 보강 필요",
    summary: "스토어 내부 테스트는 가능하지만, 공개 출시 전 링크 검수 보강이 필요합니다.",
    blockers,
    nextActions
  };
}

const benefitLabels: Record<DealBenefitType, string> = {
  discount: "오늘특가",
  freebie: "무료혜택",
  coupon: "쿠폰",
  freeShipping: "무료배송",
  experience: "체험단",
  event: "이벤트",
  point: "포인트",
  convenienceStore: "편의점",
  mart: "마트",
  foodDelivery: "배달/외식"
};

function summarizeBenefitQuality(deals: Deal[]) {
  const now = Date.now();
  const activeDeals = deals.filter((deal) => !deal.isExpired && new Date(deal.expireAt).getTime() > now);
  const verifiedDeals = deals.filter((deal) => deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified);
  const freeBenefitDeals = deals.filter((deal) =>
    ["freebie", "coupon", "freeShipping", "experience", "event", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType)
  );
  const typeCounts = new Map<DealBenefitType, number>();
  const typeVerifiedCounts = new Map<DealBenefitType, number>();

  for (const deal of deals) {
    typeCounts.set(deal.dealType, (typeCounts.get(deal.dealType) ?? 0) + 1);

    if (deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified) {
      typeVerifiedCounts.set(deal.dealType, (typeVerifiedCounts.get(deal.dealType) ?? 0) + 1);
    }
  }

  const typeBreakdown = Array.from(typeCounts.entries())
    .map(([type, count]) => {
      const verified = typeVerifiedCounts.get(type) ?? 0;

      return {
        type,
        label: benefitLabels[type],
        count,
        verified,
        verifiedRate: Math.round((verified / count) * 100)
      };
    })
    .sort((a, b) => b.count - a.count || b.verifiedRate - a.verifiedRate);

  const reportCount = deals.reduce((sum, deal) => sum + deal.reportCount, 0);
  const checkedAtValues = deals
    .map((deal) => deal.lastVerifiedAt ?? deal.verifiedAt ?? deal.checkedAt ?? deal.priceCheckedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  const latestCheckedAt = checkedAtValues.length ? new Date(Math.max(...checkedAtValues)).toISOString() : new Date().toISOString();

  return {
    total: deals.length,
    activeCount: activeDeals.length,
    freeBenefitCount: freeBenefitDeals.length,
    verifiedCount: verifiedDeals.length,
    verifiedRate: Math.round((verifiedDeals.length / deals.length) * 100),
    typeBreakdown,
    reportCount,
    needsReviewCount: deals.filter((deal) => !deal.purchaseLinkVerified || deal.reportCount > 0 || deal.isSoldOut || deal.isExpired).length,
    latestCheckedAt
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
  const launchReadiness = buildLaunchReadiness(linkQuality);
  const linkReviewQueue = getLinkReviewQueue(deals, 8);
  const benefitQuality = summarizeBenefitQuality(deals);
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
    benefitQuality,
    launchReadiness,
    linkReviewQueue
  };
}
