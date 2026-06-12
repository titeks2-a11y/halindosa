import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface DeploymentStatusProbe {
  origin?: string;
  ok?: boolean;
  status?: number;
  deployment?: {
    shortCommit?: string;
    branch?: string;
    url?: string;
  } | null;
  officialBenefitVisibleCount?: number | null;
  officialBenefitFresh?: boolean | null;
  officialBenefitFeedTransitionStatus?: string | null;
  officialSourceFeedActivationStatus?: string | null;
  officialBenefitConfiguredFeedUrls?: number | null;
  officialSourceFeedActivationConfiguredUrls?: number | null;
  officialBenefitFeedExternalItemCount?: number | null;
  freeBenefitCollectionLaneOk?: boolean | null;
}

export interface DeploymentStatusReport {
  generatedAt?: string;
  status?: "live" | "pending_deploy" | "degraded" | "missing" | string;
  branch?: string;
  currentShortCommit?: string;
  remoteMainShortCommit?: string;
  remoteBranchShortCommit?: string;
  deployedShortCommits?: string[];
  latestIsLive?: boolean;
  allOriginsHealthy?: boolean;
  feedMode?: string;
  configuredFeedUrlCount?: number;
  externalFeedItemCount?: number;
  probes?: DeploymentStatusProbe[];
  androidWebViewUpdate?: string;
  recommendedNextActions?: string[];
}

export const fallbackDeploymentStatusReport: DeploymentStatusReport = {
  generatedAt: "",
  status: "missing",
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? "",
  currentShortCommit: String(process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 8),
  deployedShortCommits: [],
  latestIsLive: false,
  allOriginsHealthy: false,
  feedMode: "unknown",
  configuredFeedUrlCount: 0,
  externalFeedItemCount: 0,
  probes: [],
  androidWebViewUpdate:
    "배포 상태 리포트가 아직 없습니다. `npm run deployment:status`를 실행해 운영 웹과 Android WebView 반영 상태를 확인하세요.",
  recommendedNextActions: ["npm run deployment:status", "npm run vercel:doctor"]
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

export function getDeploymentStatusReport(): DeploymentStatusReport {
  const reportPath = join(process.cwd(), "reports", "deployment-status.json");
  if (!existsSync(reportPath)) return fallbackDeploymentStatusReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as DeploymentStatusReport;
    return {
      ...fallbackDeploymentStatusReport,
      ...report,
      probes: Array.isArray(report.probes) ? report.probes : [],
      deployedShortCommits: Array.isArray(report.deployedShortCommits) ? report.deployedShortCommits : [],
      recommendedNextActions: Array.isArray(report.recommendedNextActions) ? report.recommendedNextActions : []
    };
  } catch {
    return fallbackDeploymentStatusReport;
  }
}

export function buildDeploymentStatusCsv(report: DeploymentStatusReport) {
  const rows: string[][] = [["section", "name", "status", "value", "detail", "action"]];

  rows.push(["summary", "status", report.status ?? "missing", report.currentShortCommit ?? "", "현재 로컬/리포트 커밋", "npm run deployment:status"]);
  rows.push(["summary", "latestIsLive", report.latestIsLive ? "passed" : "pending", String(report.latestIsLive ?? false), "운영 /api/health 배포 커밋 일치 여부", "npm run vercel:doctor"]);
  rows.push(["summary", "deployedShortCommits", report.allOriginsHealthy ? "healthy" : "degraded", (report.deployedShortCommits ?? []).join(";"), "halindosa.com 운영 배포 커밋", "GitHub Actions Vercel Production Deploy 확인"]);
  rows.push(["summary", "feedMode", report.feedMode ?? "unknown", String(report.configuredFeedUrlCount ?? 0), "공식 무료혜택 feed 연결 모드", "Vercel env 공식 feed URL 연결"]);
  rows.push(["summary", "externalFeedItemCount", "count", String(report.externalFeedItemCount ?? 0), "외부 feed에서 들어온 무료혜택 수", "refresh:benefits"]);
  rows.push(["android", "webviewUpdate", report.latestIsLive ? "live" : "pending", report.androidWebViewUpdate ?? "", "Android 앱은 운영 웹을 WebView로 로드", "네이티브 설정 변경 없으면 AAB 재업로드 불필요"]);

  for (const probe of report.probes ?? []) {
    rows.push([
      "probe",
      probe.origin ?? "",
      probe.ok ? "healthy" : "failed",
      String(probe.status ?? ""),
      `commit=${probe.deployment?.shortCommit ?? "unknown"}; benefits=${probe.officialBenefitVisibleCount ?? "unknown"}; fresh=${probe.officialBenefitFresh ?? "unknown"}; feed=${probe.officialBenefitFeedTransitionStatus ?? probe.officialSourceFeedActivationStatus ?? "unknown"}`,
      probe.deployment?.url ?? ""
    ]);
  }

  for (const action of report.recommendedNextActions ?? []) {
    rows.push(["next_action", "operator", "todo", "", action, "Vercel/GitHub Actions/환경변수 확인"]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
