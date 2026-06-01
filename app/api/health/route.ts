import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildPersonalizationReadiness } from "@/lib/analytics";
import { getOperationalEnvReadiness } from "@/lib/operations/envReadiness";

export async function GET() {
  const startedAt = Date.now();

  try {
    const result = await getDeals();
    const totalDeals = result.deals.length;
    const activeDeals = result.deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");
    const verifiedLinkDeals = result.deals.filter((deal) => deal.purchaseLinkVerified || deal.linkVerified || deal.isVerified);
    const freeBenefitDeals = result.deals.filter((deal) =>
      ["freebie", "coupon", "freeShipping", "experience", "event", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType)
    );
    const claimGuideReadyDeals = result.deals.filter(
      (deal) =>
        Array.isArray(deal.eligibilityChecklist) &&
        deal.eligibilityChecklist.length >= 4 &&
        Array.isArray(deal.claimSteps) &&
        deal.claimSteps.length >= 3 &&
        Boolean(deal.claimWarning)
    );
    const personalizationReadiness = buildPersonalizationReadiness(result.deals);
    const operationalEnvReadiness = getOperationalEnvReadiness();
    const verifiedLinkRate = totalDeals ? Math.round((verifiedLinkDeals.length / totalDeals) * 100) : 0;
    const claimGuideRate = totalDeals ? Math.round((claimGuideReadyDeals.length / totalDeals) * 100) : 0;
    const operationalStatus =
      totalDeals >= 30 && verifiedLinkRate >= 90 && freeBenefitDeals.length >= 10 && claimGuideRate >= 95 ? "ready" : "needs_review";

    return NextResponse.json({
      ok: true,
      status: "healthy",
      service: "halindosa",
      checks: {
        dealsProvider: totalDeals >= 1 ? "ok" : "empty",
        source: result.source,
        operationalStatus,
        verifiedLinkRate,
        claimGuideRate,
        personalizationReadyRate: personalizationReadiness.averageReadyRate,
        personalizationQueuesReady: personalizationReadiness.readyInterestGroups,
        personalizationWeakQueues: personalizationReadiness.weakQueues.length,
        operationalEnvReadyRate: operationalEnvReadiness.readyRate,
        operationalEnvReadyGroups: operationalEnvReadiness.readyGroups,
        operationalEnvBlockingGroups: operationalEnvReadiness.blockingGroups.length,
        activeDeals: activeDeals.length,
        freeBenefitDeals: freeBenefitDeals.length
      },
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        service: "halindosa",
        checks: {
          dealsProvider: "error"
        },
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}
