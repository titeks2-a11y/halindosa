import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildPersonalizationReadiness } from "@/lib/analytics";
import { buildClaimEffortSummary } from "@/lib/deals/claimEffort";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { getCronRefreshOperationsReport } from "@/lib/operations/cronRefresh";
import { getOperationalEnvReadiness } from "@/lib/operations/envReadiness";
import { getOfficialSourceReadiness } from "@/lib/operations/sourceReadiness";

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
    const claimEffortSummary = buildClaimEffortSummary(result.deals);
    const claimEffortCounts = Object.fromEntries(
      claimEffortSummary.groups.map((group) => [group.effort, group.count])
    );
    const operationalEnvReadiness = getOperationalEnvReadiness();
    const cronRefresh = getCronRefreshOperationsReport();
    const sourceReadiness = getOfficialSourceReadiness();
    const newsOperations = getNewsOperationsReport();
    const officialBenefitReadyCategories = newsOperations.categoryCoverage.filter((item) => item.status === "ready").length;
    const officialBenefitWeakCategories = newsOperations.categoryCoverage.filter((item) => item.status !== "ready").length;
    const officialBenefitProviderRiskSummary = newsOperations.providerRiskSummary ?? { healthy: 0, watch: 0, danger: 0 };
    const officialBenefitFeedTransition = newsOperations.feedTransitionReadiness;
    const officialSourceReadinessOk =
      sourceReadiness.ok &&
      sourceReadiness.launchGateStatus === "passed" &&
      sourceReadiness.summary.blockedLiveIssues === 0 &&
      sourceReadiness.summary.feedEnvFailedCount === 0 &&
      sourceReadiness.gates.every((gate) => gate.ok);
    const officialBenefitProviderRiskOk = officialBenefitProviderRiskSummary.danger === 0;
    const officialBenefitGeneratedAt = Date.parse(newsOperations.generatedAt);
    const officialBenefitFreshnessHours = Number.isFinite(officialBenefitGeneratedAt)
      ? Math.round(((Date.now() - officialBenefitGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
      : 999;
    const officialBenefitFresh = officialBenefitFreshnessHours <= 24;
    const verifiedLinkRate = totalDeals ? Math.round((verifiedLinkDeals.length / totalDeals) * 100) : 0;
    const claimGuideRate = totalDeals ? Math.round((claimGuideReadyDeals.length / totalDeals) * 100) : 0;
    const operationalStatus =
      totalDeals >= 30 &&
      verifiedLinkRate >= 90 &&
      freeBenefitDeals.length >= 10 &&
      claimGuideRate >= 95 &&
      newsOperations.visibleCount >= 40 &&
      officialBenefitReadyCategories >= 10 &&
      officialBenefitFresh &&
      officialBenefitProviderRiskOk &&
      officialSourceReadinessOk
        ? "ready"
        : "needs_review";

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
        claimEffortReady: claimEffortSummary.groups.every((group) => group.count >= 1),
        claimEffortEasyCount: claimEffortCounts.easy ?? 0,
        claimEffortConditionCount: claimEffortCounts.condition ?? 0,
        claimEffortDeadlineCount: claimEffortCounts.deadline ?? 0,
        personalizationReadyRate: personalizationReadiness.averageReadyRate,
        personalizationQueuesReady: personalizationReadiness.readyInterestGroups,
        personalizationWeakQueues: personalizationReadiness.weakQueues.length,
        operationalEnvReadyRate: operationalEnvReadiness.readyRate,
        operationalEnvReadyGroups: operationalEnvReadiness.readyGroups,
        operationalEnvBlockingGroups: operationalEnvReadiness.blockingGroups.length,
        officialBenefitFresh,
        officialBenefitFreshnessHours,
        officialBenefitVisibleCount: newsOperations.visibleCount,
        officialBenefitReadyCategories,
        officialBenefitWeakCategories,
        officialBenefitHiddenCount: newsOperations.hiddenCount,
        officialBenefitFailedCount: newsOperations.failedCount,
        officialBenefitRefreshAllOk: newsOperations.refreshAll.ok,
        officialBenefitOperationalRisks: newsOperations.operationalRisks.length,
        officialBenefitProviderRiskOk,
        officialBenefitProviderHealthyCount: officialBenefitProviderRiskSummary.healthy,
        officialBenefitProviderWatchCount: officialBenefitProviderRiskSummary.watch,
        officialBenefitProviderDangerCount: officialBenefitProviderRiskSummary.danger,
        officialBenefitFeedTransitionStatus: officialBenefitFeedTransition.status,
        officialBenefitFeedReadinessRate: officialBenefitFeedTransition.readinessRate,
        officialBenefitFeedConfiguredProviders: officialBenefitFeedTransition.configuredProviders,
        officialBenefitFeedSeedOnlyProviders: officialBenefitFeedTransition.seedOnlyProviders,
        officialBenefitConfiguredFeedUrls: officialBenefitFeedTransition.configuredFeedUrls,
        officialBenefitFeedRecommendedEnvKeys: officialBenefitFeedTransition.recommendedNextEnvKeys.slice(0, 5),
        officialSourceReadinessOk,
        officialSourceLaunchGateStatus: sourceReadiness.launchGateStatus,
        officialSourceReadinessLabel: sourceReadiness.readinessLabel,
        officialSourceCandidates: sourceReadiness.summary.officialSourceCandidates,
        officialSourceReachableCount: sourceReadiness.summary.reachableSources,
        officialSourceGuardedCount: sourceReadiness.summary.guardedSources,
        officialSourceConfiguredFeedUrls: sourceReadiness.summary.configuredFeedUrls,
        officialSourceFeedEnvFailedCount: sourceReadiness.summary.feedEnvFailedCount,
        officialSourceBlockedLiveIssues: sourceReadiness.summary.blockedLiveIssues,
        officialSourceFailedGateCount: sourceReadiness.gates.filter((gate) => !gate.ok).length,
        cronRefreshStatus: cronRefresh.status,
        cronRefreshOk: cronRefresh.ok,
        cronRefreshProtected: cronRefresh.protected,
        cronRefreshSchedule: cronRefresh.schedule,
        cronRefreshLastRunAt: cronRefresh.generatedAt,
        cronRefreshAgeHours: cronRefresh.ageHours,
        cronRefreshReportPath: cronRefresh.reportPath,
        cronRefreshSecretConfigured: cronRefresh.secretConfigured,
        cronRefreshProductDealsCount: cronRefresh.productDealsCount,
        cronRefreshNewsDealsCount: cronRefresh.newsDealsCount,
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
