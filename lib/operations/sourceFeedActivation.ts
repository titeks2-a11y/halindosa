import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceFeedActivationCheck = {
  name: string;
  ok: boolean;
  detail: string;
  action: string;
};

export type SourceFeedActivationCandidate = {
  id: string;
  label: string;
  lane: string;
  provider: string;
  categories: string[];
  officialUrl: string;
  preferredEnvKeys: string[];
  liveStatus: string;
  httpStatus?: number | null;
  score: number;
  feedConnectionAction: string;
  guardrail: string;
};

export type SourceFeedEnvTemplateRow = {
  envKey: string;
  label: string;
  priority: number;
  requiredFormat: string;
  exampleValue: string;
  candidateIds: string[];
  candidateLabels: string[];
  note: string;
};

export type SourceFeedEnvTemplate = {
  firstPartyCanaryEnvLine: string;
  docsPath: string;
  examplePath: string;
  productionEnvKeys: string[];
  rows: SourceFeedEnvTemplateRow[];
  warnings: string[];
};

export type SourceFeedActivationReport = {
  ok: boolean;
  generatedAt: string;
  status: "seed_ready" | "live_feed_ready" | "needs_attention" | "failed" | string;
  configuredFeedUrls: number;
  configuredProviders: number;
  visibleCandidates: number;
  canaryStatus: string;
  requiredActivationCommands: string[];
  nextActions: string[];
  topActivationCandidates: SourceFeedActivationCandidate[];
  envTemplate: SourceFeedEnvTemplate;
  checks: SourceFeedActivationCheck[];
  markdown: string;
};

const fallbackMarkdown = [
  "# 무료혜택 Feed Activation 리포트",
  "",
  "`npm run source:activation:doctor` 실행 후 다시 확인하세요."
].join("\n");

const fallbackReport: SourceFeedActivationReport = {
  ok: false,
  generatedAt: "",
  status: "failed",
  configuredFeedUrls: 0,
  configuredProviders: 0,
  visibleCandidates: 0,
  canaryStatus: "unknown",
  requiredActivationCommands: ["npm run source:activation:doctor"],
  nextActions: ["npm run source:activation:doctor를 실행해 activation 리포트를 생성하세요."],
  topActivationCandidates: [],
  envTemplate: {
    firstPartyCanaryEnvLine: "BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits",
    docsPath: "docs/OFFICIAL_FEED_ENV_ACTIVATION.md",
    examplePath: ".env.official-feeds.example",
    productionEnvKeys: [],
    rows: [],
    warnings: ["activation 리포트를 먼저 생성하세요."]
  },
  checks: [
    {
      name: "activation-report",
      ok: false,
      detail: "reports/source-feed-activation.json 파일이 없습니다.",
      action: "npm run source:activation:doctor 실행"
    }
  ],
  markdown: fallbackMarkdown
};

function readText(path: string, fallback: string) {
  if (!existsSync(path)) return fallback;
  try {
    return readFileSync(path, "utf8");
  } catch {
    return fallback;
  }
}

function normalizeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getFreeBenefitSourceFeedActivation(): SourceFeedActivationReport {
  const reportPath = join(process.cwd(), "reports", "source-feed-activation.json");
  const markdownPath = join(process.cwd(), "docs", "SOURCE_FEED_ACTIVATION.md");

  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceFeedActivationReport>;
    return {
      ...fallbackReport,
      ...report,
      ok: report.ok === true,
      generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : "",
      status: typeof report.status === "string" ? report.status : fallbackReport.status,
      configuredFeedUrls: normalizeNumber(report.configuredFeedUrls),
      configuredProviders: normalizeNumber(report.configuredProviders),
      visibleCandidates: normalizeNumber(report.visibleCandidates),
      canaryStatus: typeof report.canaryStatus === "string" ? report.canaryStatus : "unknown",
      requiredActivationCommands: Array.isArray(report.requiredActivationCommands) ? report.requiredActivationCommands : [],
      nextActions: Array.isArray(report.nextActions) ? report.nextActions : [],
      topActivationCandidates: Array.isArray(report.topActivationCandidates) ? (report.topActivationCandidates as SourceFeedActivationCandidate[]) : [],
      envTemplate: typeof report.envTemplate === "object" && report.envTemplate ? (report.envTemplate as SourceFeedEnvTemplate) : fallbackReport.envTemplate,
      checks: Array.isArray(report.checks) ? report.checks : fallbackReport.checks,
      markdown: readText(markdownPath, fallbackMarkdown)
    };
  } catch {
    return {
      ...fallbackReport,
      checks: [
        {
          name: "activation-report",
          ok: false,
          detail: "reports/source-feed-activation.json 파싱에 실패했습니다.",
          action: "npm run source:activation:doctor 재실행"
        }
      ],
      markdown: readText(markdownPath, fallbackMarkdown)
    };
  }
}
