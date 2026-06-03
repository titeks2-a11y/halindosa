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
    freshnessHours: 24
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
    providerStats: []
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
      checks: Array.isArray(report.checks) ? report.checks : fallbackReport.checks
    };
  } catch {
    return fallbackReport;
  }
}
