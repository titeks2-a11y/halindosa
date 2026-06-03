import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type CronRefreshStatus = "healthy" | "manual_refresh_ready" | "stale" | "failed";

interface RefreshAllReport {
  ok?: boolean;
  generatedAt?: string;
  productDealsCount?: number;
  newsDealsCount?: number;
  hiddenCount?: number;
  expiredCount?: number;
  failedCount?: number;
}

interface CronRefreshFileReport {
  ok?: boolean;
  mode?: string;
  generatedAt?: string;
  command?: string;
  reportPath?: string;
  status?: number | null;
  signal?: string | null;
  durationMs?: number;
  stdoutTail?: string;
  stderrTail?: string;
  refreshAll?: RefreshAllReport;
  message?: string;
}

export interface CronRefreshOperationsReport {
  ok: boolean;
  status: CronRefreshStatus;
  label: string;
  endpoint: string;
  schedule: string;
  command: string;
  reportPath: string;
  secretConfigured: boolean;
  protected: boolean;
  cronReportExists: boolean;
  refreshAllReportExists: boolean;
  generatedAt: string;
  ageHours: number | null;
  durationMs: number;
  refreshAllOk: boolean;
  productDealsCount: number;
  newsDealsCount: number;
  hiddenCount: number;
  expiredCount: number;
  failedCount: number;
  message: string;
  nextAction: string;
  guardrails: string[];
}

const endpoint = "/api/cron/refresh";
const schedule = "0 */6 * * *";
const command = "node scripts/refresh-all.mjs";
const reportPath = "reports/cron-refresh.json";
const cronReportFullPath = join(process.cwd(), "reports", "cron-refresh.json");
const refreshAllReportFullPath = join(process.cwd(), "reports", "refresh-all.json");
const staleHours = 12;

function readJson<T>(fullPath: string, fallback: T): T {
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function getAgeHours(isoDate?: string) {
  const timestamp = Date.parse(isoDate ?? "");
  if (!Number.isFinite(timestamp)) return null;
  return Math.round(((Date.now() - timestamp) / (60 * 60 * 1000)) * 10) / 10;
}

export function getCronRefreshOperationsReport(): CronRefreshOperationsReport {
  const cronReportExists = existsSync(cronReportFullPath);
  const refreshAllReportExists = existsSync(refreshAllReportFullPath);
  const cronReport = readJson<CronRefreshFileReport>(cronReportFullPath, {});
  const refreshAllReport = readJson<RefreshAllReport>(refreshAllReportFullPath, {});
  const refreshAll = cronReport.refreshAll ?? refreshAllReport;
  const generatedAt = cronReport.generatedAt ?? "";
  const ageHours = getAgeHours(generatedAt);
  const refreshAllOk = refreshAll.ok === true;
  const cronOk = cronReport.ok === true;
  const hasRecentCronRun = cronReportExists && ageHours !== null && ageHours <= staleHours;
  const status: CronRefreshStatus = !cronReportExists
    ? "manual_refresh_ready"
    : !cronOk
      ? "failed"
      : !hasRecentCronRun
        ? "stale"
        : "healthy";
  const label =
    status === "healthy"
      ? "자동 갱신 정상"
      : status === "manual_refresh_ready"
        ? "수동 갱신 기준 정상"
        : status === "stale"
          ? "cron 재실행 필요"
          : "cron 실패 확인";
  const nextAction =
    status === "healthy"
      ? "6시간 Vercel Cron과 reports/cron-refresh.json을 유지하면서 provider 실패 사유를 확인하세요."
      : status === "manual_refresh_ready"
        ? "배포 환경에 CRON_SECRET을 설정한 뒤 /api/cron/refresh를 1회 실행해 cron 리포트를 생성하세요."
        : status === "stale"
          ? "Vercel Cron 실행 이력과 CRON_SECRET 값을 확인하고 dry-run 후 실제 refresh를 재실행하세요."
          : "stderrTail, reports/refresh-all.json, provider 로그를 확인하고 실패한 단계를 먼저 복구하세요.";

  return {
    ok: (status === "healthy" || status === "manual_refresh_ready") && refreshAllOk,
    status,
    label,
    endpoint,
    schedule,
    command: cronReport.command ?? command,
    reportPath: cronReport.reportPath ?? reportPath,
    secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    protected: true,
    cronReportExists,
    refreshAllReportExists,
    generatedAt,
    ageHours,
    durationMs: Number(cronReport.durationMs ?? 0),
    refreshAllOk,
    productDealsCount: Number(refreshAll.productDealsCount ?? 0),
    newsDealsCount: Number(refreshAll.newsDealsCount ?? 0),
    hiddenCount: Number(refreshAll.hiddenCount ?? 0),
    expiredCount: Number(refreshAll.expiredCount ?? 0),
    failedCount: Number(refreshAll.failedCount ?? 0),
    message: cronReport.message ?? "아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 확인할 수 있습니다.",
    nextAction,
    guardrails: [
      "CRON_SECRET 없이는 실제 refresh를 실행하지 않습니다.",
      "dryRun=true는 reports/refresh-all.json만 읽고 수집 스크립트를 실행하지 않습니다.",
      "실패 시 사용자 노출 데이터는 마지막 통과 리포트와 검증 snapshot을 유지합니다."
    ]
  };
}
