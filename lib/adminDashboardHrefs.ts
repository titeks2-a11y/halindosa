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
    healthReadinessApiHref: adminHref("/api/admin/health-readiness", token),
    cronRefreshDryRunHref: adminHref("/api/cron/refresh?dryRun=true", token, "/api/cron/refresh?dryRun=true&token=local-admin"),
    cronLiveFeedDryRunHref: adminHref(
      "/api/cron/refresh?dryRun=true&mode=liveFeed",
      token,
      "/api/cron/refresh?dryRun=true&mode=liveFeed&token=local-admin"
    ),
    dailyOperationsApiHref: adminHref("/api/admin/daily-operations", token),
    dailyOperationsCsvHref: adminHref("/api/admin/daily-operations?format=csv", token),
    exposurePolicyApiHref: adminHref("/api/admin/exposure-policy", token),
    exposurePolicyCsvHref: adminHref("/api/admin/exposure-policy?format=csv", token),
    linkLaunchGateApiHref: adminHref("/api/admin/link-launch-gate", token),
    linkLaunchGateCsvHref: adminHref("/api/admin/link-launch-gate?format=csv", token),
    linkRevalidationPriorityApiHref: adminHref("/api/admin/link-revalidation-priority", token),
    linkRevalidationPriorityCsvHref: adminHref("/api/admin/link-revalidation-priority?format=csv", token),
    sourceLiveApiHref: adminHref("/api/admin/source-live", token),
    sourceLiveCsvHref: adminHref("/api/admin/source-live?format=csv", token),
    sourceOnboardingApiHref: adminHref("/api/admin/source-onboarding", token),
    sourceOnboardingCsvHref: adminHref("/api/admin/source-onboarding?format=csv", token),
    sourceOnboardingEnvHref: adminHref("/api/admin/source-onboarding?format=env", token),
    sourceFeedEnvApiHref: adminHref("/api/admin/source-feed-env", token),
    sourceReadinessApiHref: adminHref("/api/admin/source-readiness", token),
    sourceReadinessCsvHref: adminHref("/api/admin/source-readiness?format=csv", token),
    pushSendApiHref: adminHref("/api/admin/push/send", token),
    pushReadinessApiHref: adminHref("/api/admin/push-readiness", token),
    officialAlertsApiHref: adminHref("/api/admin/official-alerts", token),
    officialAlertsCsvHref: adminHref("/api/admin/official-alerts?format=csv", token)
  };
}
