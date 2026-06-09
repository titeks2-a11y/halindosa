import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceReadinessGate = {
  name: string;
  ok: boolean;
  status: "passed" | "failed" | string;
  detail: string;
  action: string;
};

export type SourceReadinessEnvPlan = {
  envKey: string;
  status: string;
  configuredFeedUrls: number;
  candidateCount: number;
  reachableCandidates: number;
  guardedCandidates: number;
  nextAction: string;
};

export type SourceReadinessRiskSource = {
  id: string;
  label: string;
  provider: string;
  officialUrl?: string;
  finalUrl?: string;
  reason?: string;
  httpStatus?: number;
  status: string;
  operatorAction: string;
};

export type SourceReadinessReport = {
  ok: boolean;
  generatedAt: string;
  readinessLabel: string;
  launchGateStatus: "passed" | "blocked" | string;
  summary: {
    officialSourceCandidates: number;
    highPrioritySources: number;
    reachableSources: number;
    guardedSources: number;
    blockedLiveIssues: number;
    configuredFeedUrls: number;
    feedEnvConfiguredUrlCount: number;
    feedEnvFailedCount: number;
    policyRegressionFailures: number;
    visibleOfficialBenefits: number;
    hiddenOfficialBenefits: number;
    expiredOfficialBenefits: number;
    newsFailedCount: number;
    refreshAllOk: boolean;
    productDealsCount: number;
    newsDealsCount: number;
    consumerBenefitSourceCount: number;
    consumerSourceRate: number;
    highPriorityConsumerSourceCount: number;
    publicPolicySourceCount: number;
    publicPolicySourceRate: number;
    publicPolicyDefaultHandling: string;
  };
  gates: SourceReadinessGate[];
  envPlan: SourceReadinessEnvPlan[];
  riskySources: SourceReadinessRiskSource[];
  operatorNextActions: string[];
  commands: string[];
};

const fallbackReport: SourceReadinessReport = {
  ok: false,
  generatedAt: "",
  readinessLabel: "통합 준비도 리포트 생성 필요",
  launchGateStatus: "blocked",
  summary: {
    officialSourceCandidates: 0,
    highPrioritySources: 0,
    reachableSources: 0,
    guardedSources: 0,
    blockedLiveIssues: 0,
    configuredFeedUrls: 0,
    feedEnvConfiguredUrlCount: 0,
    feedEnvFailedCount: 0,
    policyRegressionFailures: 0,
    visibleOfficialBenefits: 0,
    hiddenOfficialBenefits: 0,
    expiredOfficialBenefits: 0,
    newsFailedCount: 0,
    refreshAllOk: false,
    productDealsCount: 0,
    newsDealsCount: 0,
    consumerBenefitSourceCount: 0,
    consumerSourceRate: 0,
    highPriorityConsumerSourceCount: 0,
    publicPolicySourceCount: 0,
    publicPolicySourceRate: 0,
    publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested"
  },
  gates: [
    {
      name: "source readiness report",
      ok: false,
      status: "failed",
      detail: "reports/source-readiness.json 파일이 없습니다.",
      action: "npm run source:readiness:report를 실행하세요."
    }
  ],
  envPlan: [],
  riskySources: [],
  operatorNextActions: ["npm run source:readiness:report 실행 후 공식 소스 통합 준비도를 확인합니다."],
  commands: ["npm run source:readiness:report"]
};

export function getOfficialSourceReadiness(): SourceReadinessReport {
  const reportPath = join(process.cwd(), "reports", "source-readiness.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceReadinessReport>;

    return {
      ...fallbackReport,
      ...report,
      summary: {
        ...fallbackReport.summary,
        ...(report.summary ?? {})
      },
      gates: Array.isArray(report.gates) ? report.gates : fallbackReport.gates,
      envPlan: Array.isArray(report.envPlan) ? report.envPlan : [],
      riskySources: Array.isArray(report.riskySources) ? report.riskySources : [],
      operatorNextActions: Array.isArray(report.operatorNextActions) ? report.operatorNextActions : fallbackReport.operatorNextActions,
      commands: Array.isArray(report.commands) ? report.commands : fallbackReport.commands
    };
  } catch {
    return {
      ...fallbackReport,
      readinessLabel: "통합 준비도 리포트 파싱 실패",
      gates: [
        {
          name: "source readiness report",
          ok: false,
          status: "failed",
          detail: "reports/source-readiness.json 파싱에 실패했습니다.",
          action: "npm run source:readiness:report를 다시 실행하세요."
        }
      ]
    };
  }
}
