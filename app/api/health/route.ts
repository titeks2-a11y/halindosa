import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildPersonalizationReadiness } from "@/lib/analytics";
import { buildClaimEffortSummary } from "@/lib/deals/claimEffort";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { getCronRefreshOperationsReport } from "@/lib/operations/cronRefresh";
import { getOperationalEnvReadiness } from "@/lib/operations/envReadiness";
import { getFreeBenefitSourceFeedActivation } from "@/lib/operations/sourceFeedActivation";
import { getOfficialSourceFeedEnvReadiness } from "@/lib/operations/sourceFeedEnvReadiness";
import { getOfficialSourceReadiness } from "@/lib/operations/sourceReadiness";
import { getDeploymentInfo } from "@/lib/deploymentInfo";
import { buildFreeBenefitRankingReport } from "@/lib/operations/freeBenefitRanking";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEventRuntimeReadiness,
  selectPublishableFreeBenefitEvents
} from "@/lib/freeBenefitEvents";

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
    const sourceFeedActivation = getFreeBenefitSourceFeedActivation();
    const sourceFeedEnvReadiness = getOfficialSourceFeedEnvReadiness();
    const newsOperations = getNewsOperationsReport();
    const freeBenefitRanking = buildFreeBenefitRankingReport();
    const referenceNow = Date.now();
    const healthFreeBenefitNewsDeals = getVisibleNewsDeals({
      limit: 240,
      sort: "priority",
      includePublicPolicy: false
    });
    const healthFreeBenefitEvents = selectPublishableFreeBenefitEvents(
      healthFreeBenefitNewsDeals.deals,
      180,
      referenceNow
    );
    const freeBenefitRuntimeReadiness = buildFreeBenefitEventRuntimeReadiness(
      healthFreeBenefitEvents,
      referenceNow
    );
    const freeBenefitCollectionLaneHealthyCount = freeBenefitRuntimeReadiness.collectionLanes.filter((lane) => lane.status === "healthy").length;
    const freeBenefitCollectionLaneThinCount = freeBenefitRuntimeReadiness.collectionLanes.filter((lane) => lane.status === "thin").length;
    const freeBenefitCollectionLaneEmptyCount = freeBenefitRuntimeReadiness.collectionLanes.filter((lane) => lane.status === "empty").length;
    const freeBenefitCollectionLaneOk =
      freeBenefitRuntimeReadiness.collectionLanes.length >= 8 &&
      freeBenefitCollectionLaneHealthyCount >= 6 &&
      freeBenefitCollectionLaneEmptyCount === 0;
    const officialBenefitReadyCategories = newsOperations.categoryCoverage.filter((item) => item.status === "ready").length;
    const officialBenefitWeakCategories = newsOperations.categoryCoverage.filter((item) => item.status !== "ready").length;
    const officialBenefitProviderRiskSummary = newsOperations.providerRiskSummary ?? { healthy: 0, watch: 0, danger: 0 };
    const officialBenefitFeedTransition = newsOperations.feedTransitionReadiness;
    const officialBenefitFeedCanaryOk = newsOperations.feedCanary.ok && !newsOperations.feedCanary.releaseBlocking;
    const officialSourceReadinessOk =
      sourceReadiness.ok &&
      sourceReadiness.launchGateStatus === "passed" &&
      sourceReadiness.summary.blockedLiveIssues === 0 &&
      sourceReadiness.summary.feedEnvFailedCount === 0 &&
      sourceReadiness.gates.every((gate) => gate.ok);
    const officialSourceFeedActivationOk =
      sourceFeedActivation.ok &&
      ["seed_ready", "live_feed_ready"].includes(sourceFeedActivation.status) &&
      sourceFeedActivation.checks.every((check) => check.ok);
    const officialBenefitProviderRiskOk = officialBenefitProviderRiskSummary.danger === 0;
    const officialBenefitGeneratedAt = Date.parse(newsOperations.generatedAt);
    const officialBenefitFreshnessHours = Number.isFinite(officialBenefitGeneratedAt)
      ? Math.round(((Date.now() - officialBenefitGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
      : 999;
    const officialBenefitFresh = officialBenefitFreshnessHours <= 24;
    const verifiedLinkRate = totalDeals ? Math.round((verifiedLinkDeals.length / totalDeals) * 100) : 0;
    const claimGuideRate = totalDeals ? Math.round((claimGuideReadyDeals.length / totalDeals) * 100) : 0;
    const officialBenefitFeedRecommendedEnvKeys = Array.from(
      new Set([
        ...officialBenefitFeedTransition.recommendedNextEnvKeys,
        ...sourceFeedEnvReadiness.activationReadiness.recommendedFirstLanes.flatMap((lane) => lane.envKeys),
        ...sourceFeedEnvReadiness.checkedKeys.filter((key) =>
          [
            "TELECOM_MEMBERSHIP_FEED_URLS",
            "CONVENIENCE_BENEFIT_FEED_URLS",
            "BEAUTY_SAMPLE_FEED_URLS",
            "CAFE_FRANCHISE_COUPON_FEED_URLS",
            "PAY_POINT_BENEFIT_FEED_URLS",
            "PET_SAMPLE_FEED_URLS",
            "SIGNUP_GIFT_FEED_URLS"
          ].includes(key)
        )
      ])
    ).slice(0, 12);
    const operationalStatus =
      totalDeals >= 30 &&
      verifiedLinkRate >= 90 &&
      freeBenefitDeals.length >= 10 &&
      claimGuideRate >= 95 &&
      newsOperations.visibleCount >= 70 &&
      officialBenefitReadyCategories >= 10 &&
      officialBenefitFresh &&
      officialBenefitProviderRiskOk &&
      officialSourceReadinessOk &&
      officialSourceFeedActivationOk &&
      officialBenefitFeedCanaryOk &&
      freeBenefitCollectionLaneOk
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
        homepageVisibleRenderGuard: true,
        homepageLoadingFallbackBlocked: true,
        freeBenefitRankingOk: freeBenefitRanking.ok,
        freeBenefitClaimReadyCount: freeBenefitRanking.claimReadyCount,
        freeBenefitTopClaimReadyCount: freeBenefitRanking.topClaimReadyCount,
        freeBenefitTopTypeDiversity: freeBenefitRanking.topBenefitTypeDiversity,
        freeBenefitExactDuplicateGroupCount: freeBenefitRanking.exactDuplicateGroupCount,
        freeBenefitMaxTopBrandRepeat: freeBenefitRanking.maxTopBrandRepeat,
        freeBenefitMaxTopDomainRepeat: freeBenefitRanking.maxTopDomainRepeat,
        freeBenefitRecentlyCheckedCount: freeBenefitRanking.operationalReadiness.recentlyCheckedCount,
        freeBenefitStaleCheckedCount: freeBenefitRanking.operationalReadiness.staleCheckedCount,
        freeBenefitMissingCheckedAtCount: freeBenefitRanking.operationalReadiness.missingCheckedAtCount,
        freeBenefitOfficialHostDiversity: freeBenefitRanking.operationalReadiness.officialHostDiversity,
        freeBenefitClaimReadyShare: freeBenefitRanking.operationalReadiness.claimReadyShare,
        freeBenefitAverageQualityScore: freeBenefitRanking.averageScores.quality,
        freeBenefitAverageFreshnessScore: freeBenefitRanking.averageScores.freshness,
        freeBenefitAverageOfficialScore: freeBenefitRanking.averageScores.official,
        freeBenefitAverageUrgencyScore: freeBenefitRanking.averageScores.urgency,
        freeBenefitAverageRewardScore: freeBenefitRanking.averageScores.reward,
        freeBenefitCollectionLaneOk,
        freeBenefitCollectionLaneCount: freeBenefitRuntimeReadiness.collectionLanes.length,
        freeBenefitCollectionLaneHealthyCount,
        freeBenefitCollectionLaneThinCount,
        freeBenefitCollectionLaneEmptyCount,
        freeBenefitCollectionLaneStatuses: freeBenefitRuntimeReadiness.collectionLanes.map((lane) => ({
          id: lane.id,
          label: lane.label,
          status: lane.status,
          envKey: lane.envKey,
          count: lane.count,
          officialCount: lane.officialCount,
          verifiedCount: lane.verifiedCount,
          noPurchaseCount: lane.noPurchaseCount,
          action: lane.action
        })),
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
        officialBenefitFeedSeedCount: officialBenefitFeedTransition.seedCount,
        officialBenefitFeedExternalItemCount: officialBenefitFeedTransition.feedItemCount,
        officialBenefitFeedSuccessCount: officialBenefitFeedTransition.feedSuccessCount,
        officialBenefitFeedCollectedCount: officialBenefitFeedTransition.collectedCount,
        officialBenefitFeedExternalItemRate: officialBenefitFeedTransition.feedItemRate,
        officialBenefitFeedConfiguredEmptyCount: officialBenefitFeedTransition.configuredEmptyFeedCount,
        officialBenefitFeedConfiguredEmptyProviders: officialBenefitFeedTransition.configuredEmptyFeedProviders,
        officialBenefitFeedRecommendedEnvKeys,
        officialBenefitFeedCanaryOk,
        officialBenefitFeedCanaryStatus: newsOperations.feedCanary.status,
        officialBenefitFeedCanaryFreshnessStatus: newsOperations.feedCanary.freshnessStatus,
        officialBenefitFeedCanaryAgeHours: newsOperations.feedCanary.ageHours,
        officialBenefitFeedCanaryStaleHours: newsOperations.feedCanary.staleHours,
        officialBenefitFeedCanaryReleaseBlocking: newsOperations.feedCanary.releaseBlocking,
        officialBenefitFeedCanaryConfiguredUrls: newsOperations.feedCanary.configuredFeedUrls,
        officialBenefitFeedCanaryVisibleCount: newsOperations.feedCanary.visibleCandidateCount,
        officialBenefitFeedCanaryErrorCount: newsOperations.feedCanary.errorCount,
        officialBenefitFeedCanaryConfiguredEmptyCount: newsOperations.feedCanary.configuredEmptyFeedCount,
        officialSourceReadinessOk,
        officialSourceFeedActivationOk,
        officialSourceFeedActivationStatus: sourceFeedActivation.status,
        officialSourceFeedActivationConfiguredUrls: sourceFeedActivation.configuredFeedUrls,
        officialSourceFeedActivationConfiguredProviders: sourceFeedActivation.configuredProviders,
        officialSourceFeedActivationVisibleCandidates: sourceFeedActivation.visibleCandidates,
        officialSourceFeedActivationCanaryStatus: sourceFeedActivation.canaryStatus,
        officialSourceFeedActivationPassedChecks: sourceFeedActivation.checks.filter((check) => check.ok).length,
        officialSourceFeedActivationTotalChecks: sourceFeedActivation.checks.length,
        officialSourceFeedActivationNextActions: sourceFeedActivation.nextActions.slice(0, 3),
        officialSourceLaunchGateStatus: sourceReadiness.launchGateStatus,
        officialSourceReadinessLabel: sourceReadiness.readinessLabel,
        officialSourceCandidates: sourceReadiness.summary.officialSourceCandidates,
        officialSourceReachableCount: sourceReadiness.summary.reachableSources,
        officialSourceGuardedCount: sourceReadiness.summary.guardedSources,
        officialSourceConsumerSourceRate: sourceReadiness.summary.consumerSourceRate,
        officialSourcePublicPolicySourceRate: sourceReadiness.summary.publicPolicySourceRate,
        officialSourceVisibleOfficialBenefits: sourceReadiness.summary.visibleOfficialBenefits,
        officialSourceConfiguredFeedUrls: sourceReadiness.summary.configuredFeedUrls,
        officialSourceFeedEnvConfiguredUrlCount: sourceFeedEnvReadiness.configuredUrlCount,
        officialSourceFeedEnvConfiguredKeyCount: sourceFeedEnvReadiness.configuredKeyCount,
        officialSourceFeedEnvRecommendedLaneCount: sourceFeedEnvReadiness.activationReadiness.recommendedLaneCount,
        officialSourceFeedEnvActivationStatus: sourceFeedEnvReadiness.activationReadiness.status,
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
        cronRefreshLastPipelineMode: cronRefresh.lastPipelineMode,
        cronRefreshLiveCommand: cronRefresh.liveCommand,
        cronRefreshLivePipelineOk: cronRefresh.livePipelineOk,
        cronRefreshLivePipelineStatus: cronRefresh.livePipelineStatus,
        cronRefreshLivePipelineReportPath: cronRefresh.livePipelineReportPath,
        cronRefreshLivePipelineOfficialBenefitsCount: cronRefresh.livePipelineOfficialBenefitsCount,
        cronRefreshLivePipelineConfiguredUrlCount: cronRefresh.livePipelineConfiguredUrlCount,
        cronRefreshProductDealsCount: cronRefresh.productDealsCount,
        cronRefreshNewsDealsCount: cronRefresh.newsDealsCount,
        cronBenefitsStatus: cronRefresh.benefitsStatus,
        cronBenefitsOk: cronRefresh.benefitsOk,
        cronBenefitsProtected: cronRefresh.protected,
        cronBenefitsSchedule: cronRefresh.benefitsSchedule,
        cronBenefitsLastRunAt: cronRefresh.benefitsGeneratedAt,
        cronBenefitsAgeHours: cronRefresh.benefitsAgeHours,
        cronBenefitsCommand: cronRefresh.benefitsCommand,
        cronBenefitsReportPath: cronRefresh.benefitsReportPath,
        cronBenefitsRefreshReportPath: cronRefresh.benefitsRefreshReportPath,
        cronBenefitsEventsReportPath: cronRefresh.benefitsEventsReportPath,
        cronBenefitsCronReportExists: cronRefresh.benefitsCronReportExists,
        cronBenefitsRefreshReportExists: cronRefresh.benefitsRefreshReportExists,
        cronBenefitsEventsReportExists: cronRefresh.benefitsEventsReportExists,
        cronBenefitsRefreshOk: cronRefresh.benefitsRefreshOk,
        cronBenefitsEventsOk: cronRefresh.benefitsEventsOk,
        cronBenefitsVisibleActiveEvents: cronRefresh.benefitsVisibleActiveEvents,
        cronBenefitsMinimumVisibleEvents: cronRefresh.benefitsMinimumVisibleEvents,
        cronBenefitsBlockedEvents: cronRefresh.benefitsBlockedEvents,
        cronBenefitsExpiredEvents: cronRefresh.benefitsExpiredEvents,
        cronBenefitsDuplicateMergedCount: cronRefresh.benefitsDuplicateMergedCount,
        cronBenefitsSourceCount: cronRefresh.benefitsSourceCount,
        cronBenefitsHostCount: cronRefresh.benefitsHostCount,
        activeDeals: activeDeals.length,
        freeBenefitDeals: freeBenefitDeals.length
      },
      deployment: getDeploymentInfo(),
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
