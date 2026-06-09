import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceFeedEnvRow = {
  envKey: string;
  configuredValue: string;
  host: string;
  status: "passed" | "failed" | string;
  reason: string;
  matchedSources: Array<{
    id: string;
    label: string;
    provider: string;
    category: string[];
    officialUrl: string;
  }>;
  action: string;
};

export type SourceFeedEnvRegressionSample = {
  label: string;
  expectedStatus: string;
  expectedReason: string;
  actualStatus: string;
  actualReason: string;
  passed: boolean;
};

export type SourceFeedActivationLane = {
  id: string;
  label: string;
  envKeys: string[];
  candidateCount: number;
  reachableCount: number;
  guardedCount: number;
  firstAction: string;
  firstCandidates: Array<{
    id: string;
    label: string;
    officialUrl: string;
    liveStatus: string;
    recommendedEnvKeys: string[];
  }>;
};

export type SourceFeedEnvReadinessReport = {
  ok: boolean;
  generatedAt: string;
  checkedKeys: string[];
  configuredUrlCount: number;
  configuredKeyCount: number;
  passedCount: number;
  failedCount: number;
  allowedCatalogHosts: string[];
  approvedExtraHosts: string[];
  activationReadiness: {
    status: "seed_fallback_only" | "feed_configured" | string;
    starterPackAvailable: boolean;
    recommendedLaneCount: number;
    recommendedFirstLanes: SourceFeedActivationLane[];
    operatorChecklist: string[];
  };
  policy: {
    httpsOnly: boolean;
    machineReadableFeedRequired: boolean;
    officialCatalogHostOrApprovedPartnerHostRequired: boolean;
    blockedCommunityAndBlogHosts: string[];
    blockedSearchUrlPatterns: string[];
  };
  policyRegressionSamples: SourceFeedEnvRegressionSample[];
  rows: SourceFeedEnvRow[];
};

const fallbackReport: SourceFeedEnvReadinessReport = {
  ok: false,
  generatedAt: "",
  checkedKeys: [
    "DEAL_NEWS_FEED_URLS",
    "DEAL_NEWS_RSS_URLS",
    "DEAL_EVENT_NEWS_FEED_URLS",
    "OFFICIAL_EVENT_FEED_URLS",
    "DEAL_EVENT_FEED_URLS",
    "PUBLIC_COUPON_FEED_URLS",
    "BENEFIT_REFRESH_FEED_URLS"
  ],
  configuredUrlCount: 0,
  configuredKeyCount: 0,
  passedCount: 0,
  failedCount: 0,
  allowedCatalogHosts: [],
  approvedExtraHosts: [],
  activationReadiness: {
    status: "seed_fallback_only",
    starterPackAvailable: false,
    recommendedLaneCount: 0,
    recommendedFirstLanes: [],
    operatorChecklist: []
  },
  policy: {
    httpsOnly: true,
    machineReadableFeedRequired: true,
    officialCatalogHostOrApprovedPartnerHostRequired: true,
    blockedCommunityAndBlogHosts: [],
    blockedSearchUrlPatterns: []
  },
  policyRegressionSamples: [],
  rows: []
};

export function getOfficialSourceFeedEnvReadiness(): SourceFeedEnvReadinessReport {
  const reportPath = join(process.cwd(), "reports", "source-feed-env-readiness.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceFeedEnvReadinessReport>;

    return {
      ...fallbackReport,
      ...report,
      checkedKeys: Array.isArray(report.checkedKeys) ? report.checkedKeys : fallbackReport.checkedKeys,
      allowedCatalogHosts: Array.isArray(report.allowedCatalogHosts) ? report.allowedCatalogHosts : [],
      approvedExtraHosts: Array.isArray(report.approvedExtraHosts) ? report.approvedExtraHosts : [],
      activationReadiness: {
        ...fallbackReport.activationReadiness,
        ...(report.activationReadiness ?? {}),
        recommendedFirstLanes: Array.isArray(report.activationReadiness?.recommendedFirstLanes) ? report.activationReadiness.recommendedFirstLanes : [],
        operatorChecklist: Array.isArray(report.activationReadiness?.operatorChecklist) ? report.activationReadiness.operatorChecklist : []
      },
      policy: {
        ...fallbackReport.policy,
        ...(report.policy ?? {}),
        blockedCommunityAndBlogHosts: Array.isArray(report.policy?.blockedCommunityAndBlogHosts) ? report.policy.blockedCommunityAndBlogHosts : [],
        blockedSearchUrlPatterns: Array.isArray(report.policy?.blockedSearchUrlPatterns) ? report.policy.blockedSearchUrlPatterns : []
      },
      policyRegressionSamples: Array.isArray(report.policyRegressionSamples) ? report.policyRegressionSamples : [],
      rows: Array.isArray(report.rows) ? report.rows : []
    };
  } catch {
    return {
      ...fallbackReport,
      ok: false,
      rows: [
        {
          envKey: "source-feed-env-readiness",
          configuredValue: "reports/source-feed-env-readiness.json",
          host: "local-report",
          status: "failed",
          reason: "invalid_report",
          matchedSources: [],
          action: "npm run source:feed-env:doctor를 다시 실행해 공식 feed 환경변수 안전성 리포트를 재생성하세요."
        }
      ]
    };
  }
}
