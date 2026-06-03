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
    providerStats: Array<{
      provider: string;
      source: string;
      configured: boolean;
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
  checks: HealthReadinessCheck[];
}

const fallbackReport: HealthReadinessReport = {
  ok: false,
  generatedAt: "",
  score: 0,
  thresholds: {
    productDealsCount: 140,
    productVerificationRate: 99,
    officialBenefits: 25,
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
    providerStats: [],
    providerRisks: [],
    providerRiskSummary: {
      healthy: 0,
      watch: 0,
      danger: 0
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
    schedule: "0 */6 * * *",
    protected: true,
    durationMs: 0,
    productDealsCount: 0,
    newsDealsCount: 0,
    failedCount: 0,
    message: "Run npm run refresh:all && npm run health:readiness before release review."
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
      checks: Array.isArray(report.checks) ? report.checks : fallbackReport.checks
    };
  } catch {
    return fallbackReport;
  }
}
