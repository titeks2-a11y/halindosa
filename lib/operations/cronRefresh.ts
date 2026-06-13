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

interface BenefitsRefreshReport {
  ok?: boolean;
  generatedAt?: string;
  totalSteps?: number;
  passedSteps?: number;
  failedSteps?: number;
}

interface FreeBenefitEventsReport {
  ok?: boolean;
  generatedAt?: string;
  visibleActiveEvents?: number;
  minimumVisibleEvents?: number;
  blockedEvents?: number;
  expiredEvents?: number;
  duplicateMergedCount?: number;
  sourceCount?: number;
  hostCount?: number;
}

interface CronRefreshFileReport {
  ok?: boolean;
  mode?: string;
  pipelineMode?: string;
  generatedAt?: string;
  command?: string;
  reportPath?: string;
  status?: number | null;
  signal?: string | null;
  durationMs?: number;
  stdoutTail?: string;
  stderrTail?: string;
  refreshAll?: RefreshAllReport;
  livePipeline?: {
    ok?: boolean;
    status?: string;
    configuredUrlCount?: number;
    officialBenefits?: {
      visibleCount?: number;
      exposedSearchLinkCount?: number;
      exposedNonOfficialLinkCount?: number;
      expiredVisibleCount?: number;
    };
  };
  message?: string;
}

interface CronBenefitsFileReport {
  ok?: boolean;
  generatedAt?: string;
  command?: string;
  reportPath?: string;
  durationMs?: number;
  benefitsRefresh?: BenefitsRefreshReport;
  freeBenefitEvents?: FreeBenefitEventsReport;
  message?: string;
}

export interface CronRefreshOperationsReport {
  ok: boolean;
  status: CronRefreshStatus;
  label: string;
  endpoint: string;
  schedule: string;
  command: string;
  liveCommand: string;
  reportPath: string;
  livePipelineReportPath: string;
  lastPipelineMode: string;
  secretConfigured: boolean;
  protected: boolean;
  cronReportExists: boolean;
  refreshAllReportExists: boolean;
  livePipelineReportExists: boolean;
  generatedAt: string;
  ageHours: number | null;
  durationMs: number;
  refreshAllOk: boolean;
  livePipelineOk: boolean;
  livePipelineStatus: string;
  livePipelineConfiguredUrlCount: number;
  livePipelineOfficialBenefitsCount: number;
  productDealsCount: number;
  newsDealsCount: number;
  hiddenCount: number;
  expiredCount: number;
  failedCount: number;
  benefitsEndpoint: string;
  benefitsSchedule: string;
  benefitsCommand: string;
  benefitsReportPath: string;
  benefitsRefreshReportPath: string;
  benefitsEventsReportPath: string;
  benefitsCronReportExists: boolean;
  benefitsRefreshReportExists: boolean;
  benefitsEventsReportExists: boolean;
  benefitsGeneratedAt: string;
  benefitsAgeHours: number | null;
  benefitsDurationMs: number;
  benefitsOk: boolean;
  benefitsStatus: CronRefreshStatus;
  benefitsRefreshOk: boolean;
  benefitsEventsOk: boolean;
  benefitsVisibleActiveEvents: number;
  benefitsMinimumVisibleEvents: number;
  benefitsBlockedEvents: number;
  benefitsExpiredEvents: number;
  benefitsDuplicateMergedCount: number;
  benefitsSourceCount: number;
  benefitsHostCount: number;
  githubSchedulerWorkflow: string;
  githubSchedulerConfigured: boolean;
  githubSchedulerBenefitCadenceMinutes: number;
  githubSchedulerLiveFeedCadenceMinutes: number;
  githubSchedulerSiteUrlEnv: string;
  githubSchedulerSecretEnvKeys: string[];
  githubSchedulerCommands: string[];
  message: string;
  nextAction: string;
  guardrails: string[];
}

const endpoint = "/api/cron/refresh";
const schedule = "0 18 * * *";
const command = "node scripts/refresh-all.mjs";
const liveCommand = "node scripts/news-feed-live-pipeline.mjs";
const reportPath = "reports/cron-refresh.json";
const livePipelineReportPath = "reports/news-feed-live-pipeline.json";
const benefitsEndpoint = "/api/cron/benefits";
const benefitsSchedule = "0 21 * * *";
const benefitsCommand = "node scripts/refresh-benefits.mjs";
const benefitsReportPath = "reports/cron-benefits.json";
const benefitsRefreshReportPath = "reports/benefits-refresh.json";
const benefitsEventsReportPath = "reports/free-benefit-events.json";
const githubSchedulerWorkflow = "Benefit Refresh Scheduler";
const githubSchedulerBenefitCadenceMinutes = 30;
const githubSchedulerLiveFeedCadenceMinutes = 60;
const githubSchedulerSiteUrlEnv = "HALINDOSA_SITE_URL";
const githubSchedulerSecretEnvKeys = ["CRON_SECRET", "HALINDOSA_CRON_SECRET"];
const githubSchedulerCommands = [
  'gh workflow run "Benefit Refresh Scheduler" --repo titeks2-a11y/halindosa',
  'gh run list --workflow "Benefit Refresh Scheduler" --repo titeks2-a11y/halindosa --limit 5'
];
const cronReportFullPath = join(process.cwd(), "reports", "cron-refresh.json");
const refreshAllReportFullPath = join(process.cwd(), "reports", "refresh-all.json");
const livePipelineReportFullPath = join(process.cwd(), "reports", "news-feed-live-pipeline.json");
const benefitsCronReportFullPath = join(process.cwd(), "reports", "cron-benefits.json");
const benefitsRefreshReportFullPath = join(process.cwd(), "reports", "benefits-refresh.json");
const benefitsEventsReportFullPath = join(process.cwd(), "reports", "free-benefit-events.json");
const refreshedNewsDealsFullPath = join(process.cwd(), "data", "refreshedNewsDeals.json");
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

function getHost(value?: string) {
  try {
    return new URL(String(value ?? "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function buildBenefitsEvidenceFromSnapshot() {
  const snapshot = readJson<{ generatedAt?: string; deals?: Array<Record<string, unknown>> }>(refreshedNewsDealsFullPath, {});
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const visible = deals.filter((deal) =>
    deal.publishable !== false &&
    deal.availability === "active" &&
    deal.validationStatus === "passed" &&
    Boolean(deal.finalUrl) &&
    Number(deal.qualityScore ?? 0) >= 70
  );
  const sourceCount = new Set(visible.map((deal) => String(deal.sourceName ?? "")).filter(Boolean)).size;
  const hostCount = new Set(visible.map((deal) => getHost(String(deal.finalUrl ?? ""))).filter(Boolean)).size;
  const expiredEvents = deals.filter((deal) => deal.availability === "expired").length;
  const blockedEvents = deals.filter((deal) => deal.isHidden === true || deal.publishable === false || deal.validationStatus === "blocked").length;

  return {
    ok: visible.length >= 100 && sourceCount >= 90 && hostCount >= 70,
    generatedAt: snapshot.generatedAt ?? "",
    totalSteps: 4,
    passedSteps: visible.length >= 100 ? 4 : 0,
    failedSteps: visible.length >= 100 ? 0 : 1,
    visibleActiveEvents: visible.length,
    minimumVisibleEvents: 100,
    blockedEvents,
    expiredEvents,
    duplicateMergedCount: Math.max(0, deals.length - visible.length - expiredEvents - blockedEvents),
    sourceCount,
    hostCount
  };
}

export function getCronRefreshOperationsReport(): CronRefreshOperationsReport {
  const cronReportExists = existsSync(cronReportFullPath);
  const refreshAllReportExists = existsSync(refreshAllReportFullPath);
  const livePipelineReportExists = existsSync(livePipelineReportFullPath);
  const benefitsCronReportExists = existsSync(benefitsCronReportFullPath);
  const benefitsRefreshReportExists = existsSync(benefitsRefreshReportFullPath);
  const benefitsEventsReportExists = existsSync(benefitsEventsReportFullPath);
  const cronReport = readJson<CronRefreshFileReport>(cronReportFullPath, {});
  const refreshAllReport = readJson<RefreshAllReport>(refreshAllReportFullPath, {});
  const livePipelineReport = readJson<NonNullable<CronRefreshFileReport["livePipeline"]>>(livePipelineReportFullPath, {});
  const benefitsCronReport = readJson<CronBenefitsFileReport>(benefitsCronReportFullPath, {});
  const benefitsRefreshReport = readJson<BenefitsRefreshReport>(benefitsRefreshReportFullPath, {});
  const benefitsEventsReport = readJson<FreeBenefitEventsReport>(benefitsEventsReportFullPath, {});
  const snapshotBenefitsEvidence = buildBenefitsEvidenceFromSnapshot();
  const refreshAll = cronReport.refreshAll ?? refreshAllReport;
  const livePipeline = cronReport.livePipeline ?? livePipelineReport;
  const benefitsRefresh = benefitsCronReport.benefitsRefresh ?? (benefitsRefreshReport.ok === true ? benefitsRefreshReport : snapshotBenefitsEvidence);
  const benefitsEvents = benefitsCronReport.freeBenefitEvents ?? (benefitsEventsReport.ok === true ? benefitsEventsReport : snapshotBenefitsEvidence);
  const generatedAt = cronReport.generatedAt ?? "";
  const ageHours = getAgeHours(generatedAt);
  const refreshAllOk = refreshAll.ok === true;
  const livePipelineOk = livePipeline.ok === true;
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
  const benefitsGeneratedAt = benefitsCronReport.generatedAt ?? benefitsEvents.generatedAt ?? benefitsRefresh.generatedAt ?? "";
  const benefitsAgeHours = getAgeHours(benefitsGeneratedAt);
  const benefitsRefreshOk = benefitsRefresh.ok === true;
  const benefitsEventsOk = benefitsEvents.ok === true;
  const benefitsVisibleActiveEvents = Number(benefitsEvents.visibleActiveEvents ?? 0);
  const benefitsMinimumVisibleEvents = Number(benefitsEvents.minimumVisibleEvents ?? 0);
  const benefitsManualReady = benefitsRefreshOk && benefitsEventsOk && benefitsVisibleActiveEvents >= Math.max(1, benefitsMinimumVisibleEvents);
  const benefitsCronOk = benefitsCronReport.ok === true;
  const benefitsHasRecentCronRun = benefitsCronReportExists && benefitsAgeHours !== null && benefitsAgeHours <= staleHours;
  const benefitsStatus: CronRefreshStatus = !benefitsCronReportExists
    ? benefitsManualReady
      ? "manual_refresh_ready"
      : "failed"
    : !benefitsCronOk
      ? "failed"
      : !benefitsHasRecentCronRun
        ? "stale"
        : "healthy";
  const benefitsOk = (benefitsStatus === "healthy" || benefitsStatus === "manual_refresh_ready") && benefitsManualReady;
  const nextAction =
    status === "healthy"
      ? "일 1회 Vercel Cron과 reports/cron-refresh.json을 유지하면서 provider 실패 사유를 확인하세요."
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
    liveCommand,
    reportPath: cronReport.reportPath ?? reportPath,
    livePipelineReportPath,
    lastPipelineMode: cronReport.pipelineMode ?? "refreshAll",
    secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    protected: true,
    cronReportExists,
    refreshAllReportExists,
    livePipelineReportExists,
    generatedAt,
    ageHours,
    durationMs: Number(cronReport.durationMs ?? 0),
    refreshAllOk,
    livePipelineOk,
    livePipelineStatus: String(livePipeline.status ?? (livePipelineOk ? "live_feed_ready" : "unknown")),
    livePipelineConfiguredUrlCount: Number(livePipeline.configuredUrlCount ?? 0),
    livePipelineOfficialBenefitsCount: Number(livePipeline.officialBenefits?.visibleCount ?? 0),
    productDealsCount: Number(refreshAll.productDealsCount ?? 0),
    newsDealsCount: Number(refreshAll.newsDealsCount ?? 0),
    hiddenCount: Number(refreshAll.hiddenCount ?? 0),
    expiredCount: Number(refreshAll.expiredCount ?? 0),
    failedCount: Number(refreshAll.failedCount ?? 0),
    benefitsEndpoint,
    benefitsSchedule,
    benefitsCommand: benefitsCronReport.command ?? benefitsCommand,
    benefitsReportPath: benefitsCronReport.reportPath ?? benefitsReportPath,
    benefitsRefreshReportPath,
    benefitsEventsReportPath,
    benefitsCronReportExists,
    benefitsRefreshReportExists,
    benefitsEventsReportExists,
    benefitsGeneratedAt,
    benefitsAgeHours,
    benefitsDurationMs: Number(benefitsCronReport.durationMs ?? 0),
    benefitsOk,
    benefitsStatus,
    benefitsRefreshOk,
    benefitsEventsOk,
    benefitsVisibleActiveEvents,
    benefitsMinimumVisibleEvents,
    benefitsBlockedEvents: Number(benefitsEvents.blockedEvents ?? 0),
    benefitsExpiredEvents: Number(benefitsEvents.expiredEvents ?? 0),
    benefitsDuplicateMergedCount: Number(benefitsEvents.duplicateMergedCount ?? 0),
    benefitsSourceCount: Number(benefitsEvents.sourceCount ?? 0),
    benefitsHostCount: Number(benefitsEvents.hostCount ?? 0),
    githubSchedulerWorkflow,
    githubSchedulerConfigured: true,
    githubSchedulerBenefitCadenceMinutes,
    githubSchedulerLiveFeedCadenceMinutes,
    githubSchedulerSiteUrlEnv,
    githubSchedulerSecretEnvKeys,
    githubSchedulerCommands,
    message: cronReport.message ?? "아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 확인할 수 있습니다.",
    nextAction,
    guardrails: [
      "CRON_SECRET 없이는 실제 refresh를 실행하지 않습니다.",
      "dryRun=true는 기존 refresh:all/live feed 리포트만 읽고 수집 스크립트를 실행하지 않습니다.",
      "GitHub Actions Benefit Refresh Scheduler는 CRON_SECRET 또는 HALINDOSA_CRON_SECRET이 있으면 30분마다 무료혜택을 갱신하고 정각마다 live feed를 확인합니다.",
      "무료혜택 우선 갱신은 /api/cron/benefits와 reports/free-benefit-events.json 기준으로 별도 감시합니다.",
      "mode=liveFeed는 공식 RSS/API/제휴 JSON feed 검증을 포함한 news:feed:live 파이프라인만 명시 호출 시 실행합니다.",
      "실패 시 사용자 노출 데이터는 마지막 통과 리포트와 검증 snapshot을 유지합니다."
    ]
  };
}
