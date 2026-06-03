import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type OfficialSourceLiveStatus = "reachable" | "guarded" | "needs_review" | "timeout" | "network_error" | "server_error" | "stale_or_removed";

export type OfficialSourceLiveRow = {
  id: string;
  label: string;
  provider: string;
  category: string[];
  priority: string;
  officialUrl: string;
  finalUrl: string;
  host: string;
  method: string;
  httpStatus: number;
  redirected: boolean;
  durationMs: number;
  checkedAt: string;
  status: OfficialSourceLiveStatus;
  reason: string;
  operatorAction: string;
};

export type OfficialSourceLiveReport = {
  ok: boolean;
  mode: string;
  generatedAt: string;
  timeoutMs: number;
  maxConcurrent: number;
  totalSources: number;
  reachableCount: number;
  guardedCount: number;
  needsReviewCount: number;
  timeoutCount: number;
  networkErrorCount: number;
  staleOrRemovedCount: number;
  highPrioritySources: number;
  highPriorityReachableOrGuarded: number;
  statusCounts: Record<string, number>;
  launchPolicy: string;
  operatorActions: string[];
  sources: OfficialSourceLiveRow[];
};

const fallbackReport: OfficialSourceLiveReport = {
  ok: false,
  mode: "missing_report",
  generatedAt: "",
  timeoutMs: 0,
  maxConcurrent: 0,
  totalSources: 0,
  reachableCount: 0,
  guardedCount: 0,
  needsReviewCount: 0,
  timeoutCount: 0,
  networkErrorCount: 0,
  staleOrRemovedCount: 0,
  highPrioritySources: 0,
  highPriorityReachableOrGuarded: 0,
  statusCounts: {},
  launchPolicy: "Run npm run source:live:doctor to generate the official source live readiness report.",
  operatorActions: ["npm run source:live:doctor 실행 후 공식 feed 전환 후보를 다시 확인합니다."],
  sources: []
};

export function getOfficialSourceLiveReport(): OfficialSourceLiveReport {
  const reportPath = join(process.cwd(), "reports", "official-source-live-check.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<OfficialSourceLiveReport>;
    return {
      ...fallbackReport,
      ...report,
      statusCounts: report.statusCounts ?? {},
      operatorActions: Array.isArray(report.operatorActions) ? report.operatorActions : fallbackReport.operatorActions,
      sources: Array.isArray(report.sources) ? (report.sources as OfficialSourceLiveRow[]) : []
    };
  } catch {
    return {
      ...fallbackReport,
      mode: "invalid_report",
      launchPolicy: "reports/official-source-live-check.json could not be parsed."
    };
  }
}
