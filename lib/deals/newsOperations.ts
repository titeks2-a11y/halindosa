import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { applyNewsDealOverrides, readNewsDealOverrides } from "@/lib/deals/newsOverrides";
import type { NewsDeal } from "@/types/newsDeal";

interface NewsDealSnapshot {
  generatedAt?: string;
  source?: string;
  allDeals?: NewsDeal[];
  deals?: NewsDeal[];
  hiddenDeals?: NewsDeal[];
  providerStats?: ProviderStat[];
}

interface ProviderStat {
  provider: string;
  source?: string;
  configured?: boolean;
  feedUrls?: number;
  fetchedCount?: number;
  normalizedCount?: number;
  visibleCount?: number;
  hiddenCount?: number;
  failedCount?: number;
  expiredCount?: number;
  officialMissingCount?: number;
  errorCount?: number;
  errors?: string[];
}

interface NewsDealsReport {
  ok?: boolean;
  generatedAt?: string;
  totalCount?: number;
  visibleCount?: number;
  hiddenCount?: number;
  expiredCount?: number;
  officialMissingCount?: number;
  failedCount?: number;
  providerStats?: ProviderStat[];
  failureReasons?: Record<string, number>;
  failureReasonTop10?: Array<{ reason: string; count: number }>;
  hiddenDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  expiredDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  officialMissingDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  recentLogs?: Array<{
    dealId: string;
    provider: string;
    title: string;
    status: string;
    reason: string;
    finalUrl: string;
    checkedAt: string;
  }>;
  manualActions?: Array<{ action: string; label: string; description: string }>;
}

interface RefreshAllReport {
  ok?: boolean;
  generatedAt?: string;
  productDealsCount?: number;
  newsDealsCount?: number;
  insertedCount?: number;
  updatedCount?: number;
  hiddenCount?: number;
  expiredCount?: number;
  failedCount?: number;
  steps?: Array<{ name: string; ok: boolean; status: number; startedAt: string; finishedAt: string }>;
}

const refreshedNewsDealsPath = join(process.cwd(), "data", "refreshedNewsDeals.json");
const newsDealsReportPath = join(process.cwd(), "reports", "news-deals.json");
const refreshAllReportPath = join(process.cwd(), "reports", "refresh-all.json");

function readJson<T>(fullPath: string, fallback: T): T {
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function sortLatestLogs(logs: NonNullable<NewsDealsReport["recentLogs"]>) {
  return [...logs].sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt)).slice(0, 20);
}

export function getNewsOperationsReport() {
  const snapshot = readJson<NewsDealSnapshot>(refreshedNewsDealsPath, {});
  const report = readJson<NewsDealsReport>(newsDealsReportPath, {});
  const refreshAll = readJson<RefreshAllReport>(refreshAllReportPath, {});
  const overrides = readNewsDealOverrides();
  const allDeals = snapshot.allDeals?.length ? snapshot.allDeals : [...(snapshot.deals ?? []), ...(snapshot.hiddenDeals ?? [])] as NewsDeal[];
  const visibleDeals = applyNewsDealOverrides(snapshot.deals ?? []);
  const hiddenByReport = report.hiddenDeals ?? [];
  const manualHiddenDeals = Object.entries(overrides.hidden).map(([id, entry]) => ({
    id,
    title: allDeals.find((deal) => deal.id === id)?.title ?? id,
    hiddenReason: `manual_hidden:${entry.reason}`,
    lastCheckedAt: entry.updatedAt
  }));
  const providerStats = report.providerStats?.length ? report.providerStats : (snapshot.providerStats ?? []);
  const recentLogs = sortLatestLogs(report.recentLogs ?? []);
  const failureReasonTop10 = report.failureReasonTop10?.length
    ? report.failureReasonTop10
    : Object.entries(report.failureReasons ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([reason, count]) => ({ reason, count }));

  return {
    ok: report.ok !== false && refreshAll.ok !== false,
    generatedAt: report.generatedAt ?? snapshot.generatedAt ?? new Date().toISOString(),
    snapshotSource: snapshot.source ?? "seed",
    totalCount: report.totalCount ?? allDeals.length,
    visibleCount: visibleDeals.length,
    hiddenCount: (report.hiddenCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    expiredCount: report.expiredCount ?? 0,
    officialMissingCount: report.officialMissingCount ?? 0,
    failedCount: (report.failedCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    providerStats,
    failureReasonTop10,
    hiddenDeals: [...manualHiddenDeals, ...hiddenByReport].slice(0, 20),
    expiredDeals: report.expiredDeals ?? [],
    officialMissingDeals: report.officialMissingDeals ?? [],
    recentLogs,
    manualActions: report.manualActions ?? [
      { action: "hide", label: "수동 숨김", description: "링크 오류, 종료, 조건 불명확 항목을 즉시 제외" },
      { action: "restore", label: "수동 복구", description: "재검증 후 사용자 노출 후보로 복구" },
      { action: "revalidate", label: "링크 재검증", description: "refresh:all로 전체 링크 상태를 다시 확인" }
    ],
    overrides: {
      hiddenCount: Object.keys(overrides.hidden).length,
      recentAudit: overrides.auditLog.slice(0, 10)
    },
    refreshAll: {
      ok: refreshAll.ok ?? false,
      generatedAt: refreshAll.generatedAt ?? "",
      productDealsCount: refreshAll.productDealsCount ?? 0,
      newsDealsCount: refreshAll.newsDealsCount ?? 0,
      hiddenCount: refreshAll.hiddenCount ?? 0,
      expiredCount: refreshAll.expiredCount ?? 0,
      failedCount: refreshAll.failedCount ?? 0,
      steps: refreshAll.steps ?? []
    }
  };
}
