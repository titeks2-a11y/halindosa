import { findDealById, getDeals } from "@/lib/dealService";
import { buildPersonalizedBenefitQueue } from "@/lib/deals/personalizedBenefitQueue";
import { getLinkReviewQueue, summarizeDealQuality } from "@/lib/deals/quality";
import { getOperationalEnvReadiness } from "@/lib/operations/envReadiness";
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
  const typeActiveCounts = new Map<DealBenefitType, number>();
  const typeReviewCounts = new Map<DealBenefitType, number>();
  const typeReportCounts = new Map<DealBenefitType, number>();

  for (const deal of deals) {
    typeCounts.set(deal.dealType, (typeCounts.get(deal.dealType) ?? 0) + 1);

    if (deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified) {
      typeVerifiedCounts.set(deal.dealType, (typeVerifiedCounts.get(deal.dealType) ?? 0) + 1);
    }

    if (!deal.isExpired && new Date(deal.expireAt).getTime() > now) {
      typeActiveCounts.set(deal.dealType, (typeActiveCounts.get(deal.dealType) ?? 0) + 1);
    }

    if (!deal.purchaseLinkVerified || deal.reportCount > 0 || deal.isSoldOut || deal.isExpired) {
      typeReviewCounts.set(deal.dealType, (typeReviewCounts.get(deal.dealType) ?? 0) + 1);
    }

    typeReportCounts.set(deal.dealType, (typeReportCounts.get(deal.dealType) ?? 0) + deal.reportCount);
  }

  const typeBreakdown = Array.from(typeCounts.entries())
    .map(([type, count]) => {
      const verified = typeVerifiedCounts.get(type) ?? 0;
      const review = typeReviewCounts.get(type) ?? 0;

      return {
        type,
        label: benefitLabels[type],
        count,
        verified,
        active: typeActiveCounts.get(type) ?? 0,
        review,
        reports: typeReportCounts.get(type) ?? 0,
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

  const actionQueue = typeBreakdown
    .map((item) => {
      const reviewWeight = item.review * 12;
      const reportWeight = item.reports * 18;
      const lowCoverageWeight = item.verifiedRate < 90 ? 25 : item.verifiedRate < 100 ? 10 : 0;
      const activeWeight = item.active === 0 ? 15 : 0;
      const priorityScore = reviewWeight + reportWeight + lowCoverageWeight + activeWeight;
      const reason =
        item.reports > 0
          ? "신고가 접수된 혜택을 먼저 확인"
          : item.review > 0
            ? "종료·품절·링크 보강 대상을 점검"
            : item.verifiedRate < 100
              ? "구매처 확인율을 출시 기준까지 보강"
              : item.active === 0
                ? "진행 중인 혜택을 새로 확보"
                : "운영 상태 유지";
      const action =
        item.reports > 0
          ? "신고 내용 확인 후 노출 유지 또는 종료 처리"
          : item.review > 0
            ? "링크와 종료일을 재확인하고 필요 시 대체 혜택 등록"
            : item.verifiedRate < 100
              ? "실제 신청/구매 상세 URL을 추가 검수"
              : item.active === 0
                ? "공식 혜택 피드에서 신규 진행 혜택 보강"
                : "오늘 노출 기준 그대로 유지";

      const priority = (priorityScore >= 40 ? "high" : priorityScore >= 15 ? "medium" : "low") as "high" | "medium" | "low";

      return {
        ...item,
        priorityScore,
        priority,
        reason,
        action
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || b.count - a.count)
    .slice(0, 5);
  const conditionAudit = typeBreakdown
    .map((item) => {
      const scopedDeals = deals.filter((deal) => deal.dealType === item.type);
      const sourceReady = scopedDeals.filter((deal) => Boolean(deal.sourceName && deal.sourceUrl)).length;
      const shippingReady = scopedDeals.filter((deal) => Boolean(deal.shippingFee || deal.shipping)).length;
      const signupReady = scopedDeals.filter((deal) => typeof deal.requiresSignup === "boolean").length;
      const firstComeReady = scopedDeals.filter((deal) => typeof deal.isFirstComeFirstServed === "boolean").length;
      const couponReady = scopedDeals.filter((deal) => {
        if (deal.dealType === "coupon" || deal.dealType === "foodDelivery" || deal.dealType === "point") {
          return Boolean(deal.couponCondition || deal.minimumOrderAmount || deal.isStackable !== undefined);
        }

        return true;
      }).length;
      const readySignals = sourceReady + shippingReady + signupReady + firstComeReady + couponReady;
      const totalSignals = Math.max(1, scopedDeals.length * 5);
      const readinessRate = Math.round((readySignals / totalSignals) * 100);
      const missingSignals = [
        sourceReady < scopedDeals.length ? "제공처 URL" : "",
        shippingReady < scopedDeals.length ? "배송비 조건" : "",
        signupReady < scopedDeals.length ? "가입 필요 여부" : "",
        firstComeReady < scopedDeals.length ? "선착순 여부" : "",
        couponReady < scopedDeals.length ? "쿠폰/최소금액 조건" : ""
      ].filter(Boolean);

      return {
        type: item.type,
        label: item.label,
        count: scopedDeals.length,
        readinessRate,
        sourceReady,
        shippingReady,
        signupReady,
        firstComeReady,
        couponReady,
        missingSignals,
        action: missingSignals.length
          ? `${item.label} 카드에 ${missingSignals.slice(0, 2).join(", ")} 정보를 보강`
          : `${item.label} 조건 정보 유지`
      };
    })
    .sort((a, b) => a.readinessRate - b.readinessRate || b.count - a.count)
    .slice(0, 6);
  const conditionOperationQueue = typeBreakdown
    .map((item) => {
      const scopedDeals = deals.filter((deal) => deal.dealType === item.type);
      const missingClaimGuideCount = scopedDeals.filter(
        (deal) =>
          !Array.isArray(deal.eligibilityChecklist) ||
          deal.eligibilityChecklist.length < 4 ||
          !Array.isArray(deal.claimSteps) ||
          deal.claimSteps.length < 3 ||
          !deal.claimWarning
      ).length;
      const needsVerificationCount = scopedDeals.filter(
        (deal) =>
          !deal.purchaseLinkVerified ||
          deal.linkStatus !== "verified" ||
          !deal.sourceUrl ||
          deal.reportCount > 0 ||
          deal.isExpired ||
          deal.isSoldOut
      ).length;
      const endingSoonCount = scopedDeals.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - now < 24 * 60 * 60 * 1000).length;
      const readyCount = scopedDeals.length - Math.max(missingClaimGuideCount, needsVerificationCount);
      const supplyGapCount = Math.max(0, 3 - scopedDeals.length);
      const priorityScore = missingClaimGuideCount * 18 + needsVerificationCount * 16 + endingSoonCount * 6 + supplyGapCount * 12;
      const priority = (priorityScore >= 36 ? "high" : priorityScore >= 12 ? "medium" : "low") as "high" | "medium" | "low";
      const action =
        missingClaimGuideCount > 0
          ? "수령 전 체크와 신청 단계를 먼저 보강"
          : needsVerificationCount > 0
            ? "종료·신고·링크 상태를 재확인"
            : supplyGapCount > 0
              ? "공식 혜택 3개 이상 확보"
              : endingSoonCount > 0
                ? "마감 전 대체 혜택을 함께 준비"
                : "현재 조건과 링크 상태 유지";

      return {
        type: item.type,
        label: item.label,
        count: scopedDeals.length,
        readyCount: Math.max(0, readyCount),
        missingClaimGuideCount,
        needsVerificationCount,
        endingSoonCount,
        supplyGapCount,
        priority,
        priorityScore,
        action
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || b.needsVerificationCount - a.needsVerificationCount || b.count - a.count)
    .slice(0, 6);

  return {
    total: deals.length,
    activeCount: activeDeals.length,
    freeBenefitCount: freeBenefitDeals.length,
    verifiedCount: verifiedDeals.length,
    verifiedRate: Math.round((verifiedDeals.length / deals.length) * 100),
    typeBreakdown,
    actionQueue,
    conditionAudit,
    conditionOperationQueue,
    reportCount,
    needsReviewCount: deals.filter((deal) => !deal.purchaseLinkVerified || deal.reportCount > 0 || deal.isSoldOut || deal.isExpired).length,
    latestCheckedAt
  };
}

function buildBenefitRetentionPlan(deals: Deal[], benefitQuality: ReturnType<typeof summarizeBenefitQuality>) {
  const now = Date.now();
  const endingSoonCount = deals.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - now < 24 * 60 * 60 * 1000).length;
  const verifiedBenefitCount = deals.filter(
    (deal) =>
      (deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified) &&
      ["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType)
  ).length;
  const dailyRoutineSlots = [
    {
      key: "free-first",
      label: "무료·체험 먼저",
      target: "무료 샘플, 체험단, 0원 혜택",
      count: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
      recommendedSurface: "/free-benefits?dealType=freebie&sort=recommended"
    },
    {
      key: "coupon-before-pay",
      label: "결제 전 쿠폰",
      target: "쇼핑몰, 배달, 카드, 브랜드 쿠폰",
      count: deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery").length,
      recommendedSurface: "/free-benefits?dealType=coupon&sort=popular"
    },
    {
      key: "point-apptech",
      label: "출석·포인트",
      target: "앱테크, 페이 적립, 멤버십 포인트",
      count: deals.filter((deal) => deal.dealType === "point").length,
      recommendedSurface: "/free-benefits?dealType=point&sort=latest"
    },
    {
      key: "mart-convenience",
      label: "마트·편의점",
      target: "1+1, 2+1, 장보기, 무료배송",
      count: deals.filter((deal) => deal.dealType === "mart" || deal.dealType === "convenienceStore" || deal.isFreeShipping).length,
      recommendedSurface: "/free-benefits?dealType=mart&freeShippingOnly=true"
    },
    {
      key: "ending-check",
      label: "마감 전 확인",
      target: "마감임박, 선착순, 종료 예정 혜택",
      count: endingSoonCount,
      recommendedSurface: "/?endingSoon=true&sort=endingSoon"
    }
  ];
  const activeRoutineSlots = dailyRoutineSlots.filter((slot) => slot.count > 0).length;
  const weakSlots = dailyRoutineSlots.filter((slot) => slot.count < 3);
  const retentionScore = Math.min(
    100,
    Math.round(
      activeRoutineSlots * 14 +
        Math.min(20, verifiedBenefitCount * 0.6) +
        Math.min(15, benefitQuality.activeCount * 0.2) +
        Math.min(10, endingSoonCount * 0.8)
    )
  );

  return {
    dailyRoutineSlots,
    activeRoutineSlots,
    weeklyRoutineReady: activeRoutineSlots >= 5 && retentionScore >= 80,
    verifiedBenefitCount,
    endingSoonCount,
    retentionScore,
    weakSlots,
    nextActions: weakSlots.length
      ? weakSlots.map((slot) => `${slot.label} 영역에 공식 혜택 3개 이상 보강`)
      : ["홈 출석 체크, 무료 혜택 캘린더, 알림 큐를 유지하며 실제 클릭 데이터를 확인"]
  };
}

export function buildPersonalizationReadiness(deals: Deal[]) {
  const interestGroups = [
    { key: "free-coupon", label: "무료·쿠폰 관심", interests: ["무료/체험", "쿠폰/이벤트"] },
    { key: "living-food", label: "생활·식품 관심", interests: ["생활용품", "식품"] },
    { key: "digital-family", label: "디지털·육아 관심", interests: ["디지털", "육아"] },
    { key: "travel-beauty", label: "여행·뷰티 관심", interests: ["여행", "뷰티"] }
  ];
  const queues = interestGroups.map((group) => {
    const queue = buildPersonalizedBenefitQueue(deals, {
      interests: group.interests,
      limit: 6
    });
    const verifiedCount = queue.items.filter((item) => item.purchaseLinkVerified).length;
    const freeOrCouponCount = queue.items.filter((item) => ["freebie", "coupon", "experience", "point", "foodDelivery"].includes(item.dealType)).length;
    const readyRate = queue.items.length ? Math.round(((verifiedCount + freeOrCouponCount) / (queue.items.length * 2)) * 100) : 0;

    return {
      ...group,
      recommendedDeals: queue.items.length,
      interestMatchedDeals: queue.summary.interestMatchedDeals,
      verifiedCount,
      freeOrCouponCount,
      readyRate,
      sampleDeal: queue.items[0]?.title ?? "",
      action:
        queue.items.length < 4
          ? `${group.label} 추천 후보를 4개 이상 확보`
          : readyRate < 80
            ? `${group.label} 추천의 실제 링크와 무료·쿠폰 혜택 비중 보강`
            : `${group.label} 추천 큐 유지`
    };
  });
  const averageReadyRate = Math.round(queues.reduce((sum, queue) => sum + queue.readyRate, 0) / queues.length);
  const weakQueues = queues.filter((queue) => queue.recommendedDeals < 4 || queue.readyRate < 80);

  return {
    averageReadyRate,
    ready: averageReadyRate >= 80 && weakQueues.length === 0,
    totalInterestGroups: queues.length,
    readyInterestGroups: queues.length - weakQueues.length,
    queues,
    weakQueues,
    nextActions: weakQueues.length
      ? weakQueues.map((queue) => queue.action)
      : ["홈, 알림, 무료혜택 개인화 큐를 같은 기준으로 유지하고 실제 클릭/찜 데이터를 확인"]
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
  const benefitRetention = buildBenefitRetentionPlan(deals, benefitQuality);
  const personalizationReadiness = buildPersonalizationReadiness(deals);
  const operationalEnvReadiness = getOperationalEnvReadiness();
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
    benefitRetention,
    personalizationReadiness,
    operationalEnvReadiness,
    launchReadiness,
    linkReviewQueue
  };
}
