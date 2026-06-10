import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceStarterPackCandidate = {
  id: string;
  label: string;
  provider: string;
  categories: string[];
  officialUrl: string;
  preferredEnvKeys: string[];
  integrationMethod?: string;
  liveStatus: string;
  liveReason?: string;
  httpStatus?: number | null;
  score: number;
  reasons: string[];
  feedConnectionAction: string;
  guardrail: string;
};

export type SourceStarterPackLane = {
  id: string;
  label: string;
  envKeys: string[];
  categories: string[];
  keywords: string[];
  audience?: string;
  optional?: boolean;
  candidateCount: number;
  reachableCount: number;
  guardedCount: number;
  firstAction: string;
  candidates: SourceStarterPackCandidate[];
};

export type SourceStarterPackReport = {
  ok: boolean;
  generatedAt: string;
  catalogCount: number;
  packs: SourceStarterPackLane[];
  summary: {
    totalCandidates: number;
    reachableCandidates: number;
    guardedCandidates: number;
    envKeys: string[];
  };
  issues: string[];
  envTemplate: string;
};

const fallbackReport: SourceStarterPackReport = {
  ok: false,
  generatedAt: "",
  catalogCount: 0,
  packs: [],
  summary: {
    totalCandidates: 0,
    reachableCandidates: 0,
    guardedCandidates: 0,
    envKeys: []
  },
  issues: ["reports/free-benefit-feed-starter-pack.json 파일이 없습니다."],
  envTemplate: [
    "# 할인도사 무료혜택 운영 feed starter pack",
    "# npm run source:starter:pack 실행 후 다시 확인하세요.",
    "BENEFIT_REFRESH_FEED_URLS=",
    "PUBLIC_COUPON_FEED_URLS=",
    "OFFICIAL_EVENT_FEED_URLS=",
    "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS="
  ].join("\n")
};

function readText(path: string, fallback: string) {
  if (!existsSync(path)) return fallback;
  try {
    return readFileSync(path, "utf8");
  } catch {
    return fallback;
  }
}

export function getFreeBenefitSourceStarterPack(): SourceStarterPackReport {
  const reportPath = join(process.cwd(), "reports", "free-benefit-feed-starter-pack.json");
  const envPath = join(process.cwd(), "reports", "free-benefit-feed-starter-pack.env");

  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceStarterPackReport>;
    const summary = {
      ...fallbackReport.summary,
      ...(report.summary ?? {}),
      envKeys: Array.isArray(report.summary?.envKeys) ? report.summary.envKeys : []
    };

    return {
      ...fallbackReport,
      ...report,
      ok: report.ok === true,
      generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : "",
      catalogCount: Number(report.catalogCount ?? 0),
      packs: Array.isArray(report.packs) ? report.packs : [],
      summary,
      issues: Array.isArray(report.issues) ? report.issues : [],
      envTemplate: readText(envPath, fallbackReport.envTemplate)
    };
  } catch {
    return {
      ...fallbackReport,
      issues: ["reports/free-benefit-feed-starter-pack.json 파싱에 실패했습니다."]
    };
  }
}
