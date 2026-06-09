import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface HealthReadinessCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface HealthReadinessReport {
  ok: boolean;
  generatedAt: string;
  score: number;
  thresholds: {
    productDealsCount: number;
    productVerificationRate: number;
    officialBenefits: number;
    newsCategories: number;
    minimumCategoryDealCount: number;
    freshnessHours: number;
    cronRefreshStaleHours?: number;
    newsFeedCanaryCadenceHours?: number;
    newsFeedCanaryStaleHours?: number;
  };
  product: {
    productDealsCount: number;
    visibleProducts: number;
    verifiedProductLinks: number;
    productVerificationRate: number;
    searchLinks: number;
    soldOutProducts: number;
    hiddenProducts: number;
    failedProducts: number;
    configuredProviders: string[];
  };
  officialBenefits: {
    visibleCount: number;
    hiddenCount: number;
    expiredCount: number;
    officialMissingCount: number;
    failedCount: number;
    freshnessHours: number;
    readyCategories: number;
    requiredCategories: number;
    minimumCategoryDealCount: number;
    missingCategories: string[];
    thinCategories: string[];
    categoryCounts: Record<string, number>;
    configuredProviders: string[];
    activeProviders: string[];
    sourceMix: {
      seedCount: number;
      feedItemCount: number;
      feedSuccessCount: number;
      collectedCount: number;
      configuredFeedUrls: number;
      feedItemRate: number;
      configuredEmptyFeedCount: number;
      configuredEmptyFeedProviders: string[];
    };
    providerStats: Array<{
      provider: string;
      source: string;
      configured: boolean;
      feedUrls: number;
      seedCount: number;
      feedItemCount: number;
      feedSuccessCount: number;
      collectedCount: number;
      feedItemRate: number;
      configuredEmptyFeed: boolean;
      fetchedCount: number;
      normalizedCount: number;
      visibleCount: number;
      hiddenCount: number;
      failedCount: number;
      expiredCount: number;
      officialMissingCount: number;
      errorCount: number;
    }>;
    providerRisks: Array<{
      provider: string;
      source: string;
      severity: "healthy" | "watch" | "danger";
      label: string;
      reason: string;
      visibleCount: number;
      issueCount: number;
      failureRate: number;
    }>;
    providerRiskSummary: {
      healthy: number;
      watch: number;
      danger: number;
    };
    feedCanary: {
      ok: boolean;
      generatedAt: string;
      status: string;
      freshnessStatus: string;
      freshnessLabel?: string;
      ageHours: number | null;
      cadenceHours?: number;
      staleHours: number;
      releaseBlocking: boolean;
      configuredFeedUrls: number;
      visibleCandidateCount: number;
      hiddenCandidateCount: number;
      errorCount: number;
      configuredEmptyFeedCount: number;
      officialLinkPromotedCount: number;
      failedProviders: Array<{ provider: string; status: string; action: string }>;
    };
  };
  refreshAll: {
    ok: boolean;
    generatedAt: string;
    insertedCount: number;
    updatedCount: number;
    hiddenCount: number;
    expiredCount: number;
    failedCount: number;
    failedSteps: string[];
    steps: Array<{
      name: string;
      ok: boolean;
      startedAt?: string;
      finishedAt?: string;
    }>;
  };
  cronRefresh: {
    ok: boolean;
    status: "healthy" | "manual_refresh_ready" | "stale" | "failed" | string;
    label: string;
    reportPath: string;
    reportExists: boolean;
    generatedAt: string;
    ageHours: number | null;
    command: string;
    schedule: string;
    protected: boolean;
    durationMs: number;
    productDealsCount: number;
    newsDealsCount: number;
    failedCount: number;
    message: string;
  };
  cronBenefits: {
    ok: boolean;
    status: "healthy" | "manual_refresh_ready" | "stale" | "failed" | string;
    reportPath: string;
    refreshReportPath: string;
    eventsReportPath: string;
    reportExists: boolean;
    generatedAt: string;
    ageHours: number | null;
    command: string;
    schedule: string;
    protected: boolean;
    visibleActiveEvents: number;
    minimumVisibleEvents: number;
    sourceCount: number;
    hostCount: number;
    blockedEvents: number;
    expiredEvents: number;
  };
  sourceReadiness: {
    ok: boolean;
    readinessLabel: string;
    launchGateStatus: string;
    officialSourceCandidates: number;
    reachableSources: number;
    guardedSources: number;
    configuredFeedUrls: number;
    visibleOfficialBenefits: number;
    consumerBenefitSourceCount: number;
    consumerSourceRate: number;
    highPriorityConsumerSourceCount: number;
    publicPolicySourceCount: number;
    publicPolicySourceRate: number;
    publicPolicyDefaultHandling: string;
    blockedLiveIssues: number;
    feedEnvFailedCount: number;
    failedGateCount: number;
    operatorNextActions: string[];
  };
  checks: HealthReadinessCheck[];
}

const fallbackReport: HealthReadinessReport = {
  ok: false,
  generatedAt: "",
  score: 0,
  thresholds: {
    productDealsCount: 140,
    productVerificationRate: 99,
    officialBenefits: 70,
    newsCategories: 10,
    minimumCategoryDealCount: 2,
    freshnessHours: 24,
    cronRefreshStaleHours: 12
  },
  product: {
    productDealsCount: 0,
    visibleProducts: 0,
    verifiedProductLinks: 0,
    productVerificationRate: 0,
    searchLinks: 0,
    soldOutProducts: 0,
    hiddenProducts: 0,
    failedProducts: 0,
    configuredProviders: []
  },
  officialBenefits: {
    visibleCount: 0,
    hiddenCount: 0,
    expiredCount: 0,
    officialMissingCount: 0,
    failedCount: 0,
    freshnessHours: Number.POSITIVE_INFINITY,
    readyCategories: 0,
    requiredCategories: 10,
    minimumCategoryDealCount: 2,
    missingCategories: [],
    thinCategories: [],
    categoryCounts: {},
    configuredProviders: [],
    activeProviders: [],
    sourceMix: {
      seedCount: 0,
      feedItemCount: 0,
      feedSuccessCount: 0,
      collectedCount: 0,
      configuredFeedUrls: 0,
      feedItemRate: 0,
      configuredEmptyFeedCount: 0,
      configuredEmptyFeedProviders: []
    },
    providerStats: [],
    providerRisks: [],
    providerRiskSummary: {
      healthy: 0,
      watch: 0,
      danger: 0
    },
    feedCanary: {
      ok: false,
      generatedAt: "",
      status: "missing",
      freshnessStatus: "missing",
      freshnessLabel: "리포트 생성 필요",
      ageHours: null,
      cadenceHours: 6,
      staleHours: 24,
      releaseBlocking: true,
      configuredFeedUrls: 0,
      visibleCandidateCount: 0,
      hiddenCandidateCount: 0,
      errorCount: 0,
      configuredEmptyFeedCount: 0,
      officialLinkPromotedCount: 0,
      failedProviders: []
    }
  },
  refreshAll: {
    ok: false,
    generatedAt: "",
    insertedCount: 0,
    updatedCount: 0,
    hiddenCount: 0,
    expiredCount: 0,
    failedCount: 0,
    failedSteps: [],
    steps: []
  },
  cronRefresh: {
    ok: false,
    status: "manual_refresh_ready",
    label: "수동 갱신 기준 정상",
    reportPath: "reports/cron-refresh.json",
    reportExists: false,
    generatedAt: "",
    ageHours: null,
    command: "node scripts/refresh-all.mjs",
    schedule: "0 18 * * *",
    protected: true,
    durationMs: 0,
    productDealsCount: 0,
    newsDealsCount: 0,
    failedCount: 0,
    message: "Run npm run refresh:all && npm run health:readiness before release review."
  },
  cronBenefits: {
    ok: false,
    status: "manual_refresh_ready",
    reportPath: "reports/cron-benefits.json",
    refreshReportPath: "reports/benefits-refresh.json",
    eventsReportPath: "reports/free-benefit-events.json",
    reportExists: false,
    generatedAt: "",
    ageHours: null,
    command: "node scripts/refresh-benefits.mjs",
    schedule: "0 21 * * *",
    protected: true,
    visibleActiveEvents: 0,
    minimumVisibleEvents: 100,
    sourceCount: 0,
    hostCount: 0,
    blockedEvents: 0,
    expiredEvents: 0
  },
  sourceReadiness: {
    ok: false,
    readinessLabel: "통합 준비도 리포트 생성 필요",
    launchGateStatus: "blocked",
    officialSourceCandidates: 0,
    reachableSources: 0,
    guardedSources: 0,
    configuredFeedUrls: 0,
    visibleOfficialBenefits: 0,
    consumerBenefitSourceCount: 0,
    consumerSourceRate: 0,
    highPriorityConsumerSourceCount: 0,
    publicPolicySourceCount: 0,
    publicPolicySourceRate: 0,
    publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested",
    blockedLiveIssues: 0,
    feedEnvFailedCount: 0,
    failedGateCount: 1,
    operatorNextActions: ["npm run source:readiness:report 실행 후 health:readiness를 다시 실행하세요."]
  },
  checks: [
    {
      name: "health readiness report",
      ok: false,
      detail: "Run npm run refresh:all && npm run health:readiness before release review."
    }
  ]
};

export function getHealthReadinessReport(): HealthReadinessReport {
  const reportPath = join(process.cwd(), "reports", "health-readiness.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<HealthReadinessReport>;

    return {
      ...fallbackReport,
      ...report,
      thresholds: { ...fallbackReport.thresholds, ...report.thresholds },
      product: { ...fallbackReport.product, ...report.product },
      officialBenefits: { ...fallbackReport.officialBenefits, ...report.officialBenefits },
      refreshAll: { ...fallbackReport.refreshAll, ...report.refreshAll },
      cronRefresh: { ...fallbackReport.cronRefresh, ...report.cronRefresh },
      cronBenefits: { ...fallbackReport.cronBenefits, ...report.cronBenefits },
      sourceReadiness: { ...fallbackReport.sourceReadiness, ...report.sourceReadiness },
      checks: Array.isArray(report.checks) ? report.checks : fallbackReport.checks
    };
  } catch {
    return fallbackReport;
  }
}
