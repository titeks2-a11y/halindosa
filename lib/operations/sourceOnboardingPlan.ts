import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceOnboardingStatus =
  | "connect_official_feed"
  | "request_partner_or_api"
  | "feed_configured_verify"
  | "do_not_use_until_reviewed";

export type SourceOnboardingAction = {
  rank: number;
  id: string;
  label: string;
  provider: string;
  status: SourceOnboardingStatus;
  score: number;
  nextAction: string;
};

export type SourceOnboardingQueueRow = {
  rank: number;
  id: string;
  label: string;
  provider: string;
  category: string[];
  priority: "high" | "medium" | "low" | string;
  sourceType: string;
  officialUrl: string;
  liveStatus: string;
  httpStatus: number;
  configuredFeedUrls: number;
  recommendedEnvKeys: string[];
  onboardingStatus: SourceOnboardingStatus;
  score: number;
  reasons: string[];
  nextAction: string;
  guardrail: string;
};

export type SourceOnboardingEnvPlan = {
  envKey: string;
  status: "ready_to_connect" | "configured_verify" | string;
  configuredFeedUrls: number;
  candidateCount: number;
  reachableCandidates: number;
  guardedCandidates: number;
  topSources: Array<{
    id: string;
    label: string;
    provider: string;
    officialUrl: string;
    liveStatus: string;
    rank: number;
  }>;
  categories: string[];
  providers: string[];
  nextAction: string;
};

export type SourceOnboardingPlan = {
  ok: boolean;
  generatedAt: string;
  totalSources: number;
  reachableSources: number;
  guardedSources: number;
  blockedLiveIssues: number;
  configuredFeedSources: number;
  statusCounts: Record<string, number>;
  envPlan: SourceOnboardingEnvPlan[];
  envTemplate: string;
  topActions: SourceOnboardingAction[];
  guardrails: string[];
  queue: SourceOnboardingQueueRow[];
};

const fallbackPlan: SourceOnboardingPlan = {
  ok: false,
  generatedAt: "",
  totalSources: 0,
  reachableSources: 0,
  guardedSources: 0,
  blockedLiveIssues: 0,
  configuredFeedSources: 0,
  statusCounts: {},
  envPlan: [],
  envTemplate:
    "# reports/source-onboarding-env-template.env 파일이 없습니다.\n# npm run source:onboarding:plan 실행 후 공식 feed env 템플릿을 확인합니다.",
  topActions: [],
  guardrails: [
    "npm run source:catalog:report && npm run source:live:doctor && npm run source:onboarding:plan 실행 후 공식 소스 온보딩 큐를 확인합니다."
  ],
  queue: []
};

export function getOfficialSourceOnboardingPlan(): SourceOnboardingPlan {
  const reportPath = join(process.cwd(), "reports", "source-onboarding-plan.json");
  if (!existsSync(reportPath)) return fallbackPlan;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceOnboardingPlan>;

    return {
      ...fallbackPlan,
      ...report,
      statusCounts: report.statusCounts ?? {},
      envPlan: Array.isArray(report.envPlan) ? (report.envPlan as SourceOnboardingEnvPlan[]) : [],
      envTemplate: typeof report.envTemplate === "string" ? report.envTemplate : fallbackPlan.envTemplate,
      topActions: Array.isArray(report.topActions) ? (report.topActions as SourceOnboardingAction[]) : [],
      guardrails: Array.isArray(report.guardrails) ? report.guardrails : fallbackPlan.guardrails,
      queue: Array.isArray(report.queue) ? (report.queue as SourceOnboardingQueueRow[]) : []
    };
  } catch {
    return {
      ...fallbackPlan,
      ok: false,
      guardrails: ["reports/source-onboarding-plan.json 파싱에 실패했습니다. npm run source:onboarding:plan을 다시 실행하세요."]
    };
  }
}
