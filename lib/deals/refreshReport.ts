import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RefreshProviderStat {
  provider: string;
  configured: boolean;
  feedUrls: number;
  fetchedCount: number;
  normalizedCount?: number;
  insertedCount?: number;
  updatedCount?: number;
  hiddenCount?: number;
  failedCount?: number;
  errorCount?: number;
  errors?: string[];
}

export interface RefreshDealsReport {
  generatedAt: string;
  ok: boolean;
  fetchedCount: number;
  normalizedCount: number;
  insertedCount: number;
  updatedCount: number;
  hiddenCount: number;
  failedCount: number;
  visibleCount: number;
  providerStats: RefreshProviderStat[];
  failureReasons: Record<string, number>;
  revalidationQueue: {
    total: number;
    matchedCount: number;
    missingCount: number;
    highPriorityIds: string[];
    reasons: Record<string, number>;
  };
}

const fallbackReport: RefreshDealsReport = {
  generatedAt: "",
  ok: false,
  fetchedCount: 0,
  normalizedCount: 0,
  insertedCount: 0,
  updatedCount: 0,
  hiddenCount: 0,
  failedCount: 0,
  visibleCount: 0,
  providerStats: [],
  failureReasons: {},
  revalidationQueue: {
    total: 0,
    matchedCount: 0,
    missingCount: 0,
    highPriorityIds: [],
    reasons: {}
  }
};

export function getRefreshDealsReport(): RefreshDealsReport {
  const reportPath = join(process.cwd(), "reports", "refresh-deals.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<RefreshDealsReport>;

    return {
      ...fallbackReport,
      ...report,
      providerStats: Array.isArray(report.providerStats) ? report.providerStats : [],
      failureReasons: report.failureReasons && typeof report.failureReasons === "object" ? report.failureReasons : {},
      revalidationQueue: {
        ...fallbackReport.revalidationQueue,
        ...(report.revalidationQueue && typeof report.revalidationQueue === "object" ? report.revalidationQueue : {}),
        highPriorityIds: Array.isArray(report.revalidationQueue?.highPriorityIds) ? report.revalidationQueue.highPriorityIds : []
      }
    };
  } catch {
    return fallbackReport;
  }
}
