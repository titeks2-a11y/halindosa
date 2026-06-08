import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceFeedHandoffLane = {
  id: string;
  label: string;
  envKeys: string[];
  candidateCount: number;
  reachableCount: number;
  guardedCount: number;
  firstAction: string;
  firstReachableCandidates: Array<{
    label: string;
    provider: string;
    officialUrl: string;
    action: string;
  }>;
};

export type SourceFeedHandoffReport = {
  ok: boolean;
  generatedAt: string;
  starterPack: {
    ok: boolean;
    catalogCount: number;
    laneCount: number;
    totalCandidates: number;
    reachableCandidates: number;
    guardedCandidates: number;
  };
  feedEnv: {
    configuredFeedUrls: number;
    checkedKeys: string[];
    approvedExtraHosts: string[];
  };
  canary: {
    status: string;
    configuredFeedUrls: number;
    visibleCandidateCount: number;
  };
  transition: {
    status: string;
    configuredProviders: number;
    launchBlockingCount: number;
  };
  envKeys: string[];
  lanes: SourceFeedHandoffLane[];
  verificationCommands: string[];
  issues: string[];
  markdown: string;
};

const fallbackMarkdown = [
  "# 무료혜택 Feed 운영 핸드오프",
  "",
  "`npm run source:feed:handoff` 실행 후 다시 확인하세요."
].join("\n");

const fallbackReport: SourceFeedHandoffReport = {
  ok: false,
  generatedAt: "",
  starterPack: {
    ok: false,
    catalogCount: 0,
    laneCount: 0,
    totalCandidates: 0,
    reachableCandidates: 0,
    guardedCandidates: 0
  },
  feedEnv: {
    configuredFeedUrls: 0,
    checkedKeys: [],
    approvedExtraHosts: []
  },
  canary: {
    status: "unknown",
    configuredFeedUrls: 0,
    visibleCandidateCount: 0
  },
  transition: {
    status: "unknown",
    configuredProviders: 0,
    launchBlockingCount: 0
  },
  envKeys: [],
  lanes: [],
  verificationCommands: [],
  issues: ["reports/free-benefit-feed-handoff.json 파일이 없습니다."],
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

export function getFreeBenefitSourceFeedHandoff(): SourceFeedHandoffReport {
  const reportPath = join(process.cwd(), "reports", "free-benefit-feed-handoff.json");
  const markdownPath = join(process.cwd(), "docs", "FREE_BENEFIT_FEED_HANDOFF.md");

  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceFeedHandoffReport>;
    return {
      ...fallbackReport,
      ...report,
      ok: report.ok === true,
      generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : "",
      starterPack: {
        ...fallbackReport.starterPack,
        ...(report.starterPack ?? {})
      },
      feedEnv: {
        ...fallbackReport.feedEnv,
        ...(report.feedEnv ?? {})
      },
      canary: {
        ...fallbackReport.canary,
        ...(report.canary ?? {})
      },
      transition: {
        ...fallbackReport.transition,
        ...(report.transition ?? {})
      },
      envKeys: Array.isArray(report.envKeys) ? report.envKeys : [],
      lanes: Array.isArray(report.lanes) ? report.lanes : [],
      verificationCommands: Array.isArray(report.verificationCommands) ? report.verificationCommands : [],
      issues: Array.isArray(report.issues) ? report.issues : [],
      markdown: readText(markdownPath, fallbackMarkdown)
    };
  } catch {
    return {
      ...fallbackReport,
      issues: ["reports/free-benefit-feed-handoff.json 파싱에 실패했습니다."],
      markdown: readText(markdownPath, fallbackMarkdown)
    };
  }
}
