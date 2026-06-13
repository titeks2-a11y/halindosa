import { isAdminProtectionEnabled } from "@/lib/adminAuth";

function appendQueryParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function adminHref(path: string, token: string | null | undefined, localPath = path) {
  if (!isAdminProtectionEnabled()) return localPath;
  return appendQueryParam(path, "token", token ?? "");
}

export function buildAdminDashboardHrefs(token: string | null | undefined) {
  return {
    adminExportHref: adminHref("/api/admin/export", token),
    dailyQueueApiHref: adminHref("/api/admin/daily-queue?limit=4", token),
    imageQueueApiHref: adminHref("/api/admin/image-queue", token),
    imageQueueCsvHref: adminHref("/api/admin/image-queue?format=csv", token),
    newsOperationsApiHref: adminHref("/api/admin/news-operations", token),
    newsOperationsCsvHref: adminHref("/api/admin/news-operations?format=csv", token),
    newsRevalidationPriorityApiHref: adminHref("/api/admin/news-revalidation-priority", token),
    newsRevalidationPriorityCsvHref: adminHref("/api/admin/news-revalidation-priority?format=csv", token),
    newsFeedPreviewApiHref: adminHref("/api/admin/news-feed-preview", token),
    newsFeedPreviewCsvHref: adminHref("/api/admin/news-feed-preview?format=csv", token),
    newsFeedCanaryApiHref: adminHref("/api/admin/news-feed-canary", token),
    newsFeedCanaryCsvHref: adminHref("/api/admin/news-feed-canary?format=csv", token),
    newsFeedLiveApiHref: adminHref("/api/admin/news-feed-live", token),
    newsFeedLiveCsvHref: adminHref("/api/admin/news-feed-live?format=csv", token),
    deploymentStatusApiHref: adminHref("/api/admin/deployment-status", token),
    deploymentStatusCsvHref: adminHref("/api/admin/deployment-status?format=csv", token),
    healthReadinessApiHref: adminHref("/api/admin/health-readiness", token),
    cronRefreshDryRunHref: adminHref("/api/cron/refresh?dryRun=true", token, "/api/cron/refresh?dryRun=true&token=local-admin"),
    cronLiveFeedDryRunHref: adminHref(
      "/api/cron/refresh?dryRun=true&mode=liveFeed",
      token,
      "/api/cron/refresh?dryRun=true&mode=liveFeed&token=local-admin"
    ),
    cronBenefitsDryRunHref: adminHref("/api/cron/benefits?dryRun=true", token, "/api/cron/benefits?dryRun=true&token=local-admin"),
    dailyOperationsApiHref: adminHref("/api/admin/daily-operations", token),
    dailyOperationsCsvHref: adminHref("/api/admin/daily-operations?format=csv", token),
    freeBenefitOperationsApiHref: adminHref("/api/admin/free-benefit-operations", token),
    freeBenefitOperationsCsvHref: adminHref("/api/admin/free-benefit-operations?format=csv", token),
    firstPartyFreeBenefitFeedApiHref: adminHref("/api/admin/first-party-free-benefit-feed", token),
    firstPartyFreeBenefitFeedCsvHref: adminHref("/api/admin/first-party-free-benefit-feed?format=csv", token),
    freeBenefitRankingApiHref: adminHref("/api/admin/free-benefit-ranking", token),
    freeBenefitRankingCsvHref: adminHref("/api/admin/free-benefit-ranking?format=csv", token),
    freeBenefitCollectionLanesApiHref: adminHref("/api/admin/free-benefit-collection-lanes", token),
    freeBenefitCollectionLanesCsvHref: adminHref("/api/admin/free-benefit-collection-lanes?format=csv", token),
    freeBenefitCategoryCoverageApiHref: adminHref("/api/admin/free-benefit-category-coverage", token),
    freeBenefitCategoryCoverageCsvHref: adminHref("/api/admin/free-benefit-category-coverage?format=csv", token),
    exposurePolicyApiHref: adminHref("/api/admin/exposure-policy", token),
    exposurePolicyCsvHref: adminHref("/api/admin/exposure-policy?format=csv", token),
    linkLaunchGateApiHref: adminHref("/api/admin/link-launch-gate", token),
    linkLaunchGateCsvHref: adminHref("/api/admin/link-launch-gate?format=csv", token),
    linkRevalidationPriorityApiHref: adminHref("/api/admin/link-revalidation-priority", token),
    linkRevalidationPriorityCsvHref: adminHref("/api/admin/link-revalidation-priority?format=csv", token),
    liveProbeReviewApiHref: adminHref("/api/admin/live-probe-review", token),
    liveProbeReviewCsvHref: adminHref("/api/admin/live-probe-review?format=csv", token),
    sourceLiveApiHref: adminHref("/api/admin/source-live", token),
    sourceLiveCsvHref: adminHref("/api/admin/source-live?format=csv", token),
    sourceBreadthApiHref: adminHref("/api/admin/source-breadth", token),
    sourceBreadthCsvHref: adminHref("/api/admin/source-breadth?format=csv", token),
    sourceOnboardingApiHref: adminHref("/api/admin/source-onboarding", token),
    sourceOnboardingCsvHref: adminHref("/api/admin/source-onboarding?format=csv", token),
    sourceOnboardingEnvHref: adminHref("/api/admin/source-onboarding?format=env", token),
    sourceStarterPackApiHref: adminHref("/api/admin/source-starter-pack", token),
    sourceStarterPackCsvHref: adminHref("/api/admin/source-starter-pack?format=csv", token),
    sourceStarterPackEnvHref: adminHref("/api/admin/source-starter-pack?format=env", token),
    sourceStarterPackVercelHref: adminHref("/api/admin/source-starter-pack?format=vercel", token),
    sourceStarterPackGithubHref: adminHref("/api/admin/source-starter-pack?format=github", token),
    sourceFeedHandoffApiHref: adminHref("/api/admin/source-feed-handoff", token),
    sourceFeedHandoffCsvHref: adminHref("/api/admin/source-feed-handoff?format=csv", token),
    sourceFeedHandoffMarkdownHref: adminHref("/api/admin/source-feed-handoff?format=md", token),
    sourceFeedActivationApiHref: adminHref("/api/admin/source-feed-activation", token),
    sourceFeedActivationCsvHref: adminHref("/api/admin/source-feed-activation?format=csv", token),
    sourceFeedActivationMarkdownHref: adminHref("/api/admin/source-feed-activation?format=md", token),
    sourceFeedEnvApiHref: adminHref("/api/admin/source-feed-env", token),
    sourceFeedEnvMarkdownHref: adminHref("/api/admin/source-feed-env?format=md", token),
    sourceReadinessApiHref: adminHref("/api/admin/source-readiness", token),
    sourceReadinessCsvHref: adminHref("/api/admin/source-readiness?format=csv", token),
    pushSendApiHref: adminHref("/api/admin/push/send", token),
    pushReadinessApiHref: adminHref("/api/admin/push-readiness", token),
    officialAlertsApiHref: adminHref("/api/admin/official-alerts", token),
    officialAlertsCsvHref: adminHref("/api/admin/official-alerts?format=csv", token)
  };
}
