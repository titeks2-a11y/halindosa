import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceBreadthLane = {
  id: string;
  label: string;
  minimum: number;
  matchedCount: number;
  activeCount: number;
  staleCount: number;
  ok: boolean;
  sources: Array<{
    id: string;
    label: string;
    provider?: string;
    categories?: string[];
    officialUrl?: string;
    priority?: string;
    liveStatus?: string;
    liveReason?: string;
  }>;
};

export type SourceBreadthBrandSignal = {
  id: string;
  label: string;
  matchedCount: number;
  activeCount: number;
  ok: boolean;
  sources: Array<{
    id: string;
    label: string;
    officialUrl?: string;
    liveStatus?: string;
    liveReason?: string;
  }>;
};

export type SourceBreadthReport = {
  ok: boolean;
  generatedAt: string;
  catalogCount: number;
  requiredLaneCount: number;
  passedLaneCount: number;
  requiredBrandSignalCount: number;
  passedBrandSignalCount: number;
  minimumTotalActiveSources: number;
  liveReportStatus: string;
  consumerFirstPolicy?: {
    consumerBenefitSourceCount?: number;
    activeSourceCount?: number;
    consumerSourceRate?: number;
    minimumConsumerSourceRate?: number;
    highPriorityConsumerSourceCount?: number;
    minimumHighPriorityConsumerSources?: number;
    publicPolicySourceRate?: number;
    maximumPublicPolicySourceRate?: number;
    publicPolicyDefaultHandling?: string;
  };
  lanes: SourceBreadthLane[];
  brandSignals: SourceBreadthBrandSignal[];
  issues: string[];
  operatorNextActions: string[];
};

const fallbackReport: SourceBreadthReport = {
  ok: false,
  generatedAt: "",
  catalogCount: 0,
  requiredLaneCount: 0,
  passedLaneCount: 0,
  requiredBrandSignalCount: 0,
  passedBrandSignalCount: 0,
  minimumTotalActiveSources: 0,
  liveReportStatus: "missing",
  lanes: [],
  brandSignals: [],
  issues: ["reports/free-benefit-source-breadth.json 파일이 없습니다."],
  operatorNextActions: ["npm run source:breadth:doctor 실행 후 공식 무료혜택 소스 축 커버리지를 다시 확인하세요."]
};

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getFreeBenefitSourceBreadthReport(): SourceBreadthReport {
  return readJson<SourceBreadthReport>(join(process.cwd(), "reports", "free-benefit-source-breadth.json"), fallbackReport);
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.map(String).join(" | ") : String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function buildFreeBenefitSourceBreadthCsv(report: SourceBreadthReport) {
  const rows: string[][] = [["section", "id", "label", "status", "minimum", "activeCount", "matchedCount", "staleCount", "detail", "officialUrl"]];

  rows.push([
    "summary",
    "source_breadth",
    "무료혜택 소스 축 커버리지",
    report.ok ? "passed" : "review",
    String(report.requiredLaneCount),
    String(report.passedLaneCount),
    String(report.catalogCount),
    "0",
    `brandSignals=${report.passedBrandSignalCount}/${report.requiredBrandSignalCount}; live=${report.liveReportStatus}`,
    ""
  ]);

  for (const lane of report.lanes) {
    rows.push([
      "lane",
      lane.id,
      lane.label,
      lane.ok ? "passed" : "review",
      String(lane.minimum),
      String(lane.activeCount),
      String(lane.matchedCount),
      String(lane.staleCount),
      lane.sources.slice(0, 4).map((source) => source.label || source.id).join(" | "),
      ""
    ]);
  }

  for (const brand of report.brandSignals) {
    rows.push([
      "brand",
      brand.id,
      brand.label,
      brand.ok ? "covered" : "missing",
      "1",
      String(brand.activeCount),
      String(brand.matchedCount),
      "0",
      brand.sources.slice(0, 4).map((source) => source.label || source.id).join(" | "),
      brand.sources[0]?.officialUrl ?? ""
    ]);
  }

  for (const issue of report.issues) {
    rows.push(["issue", "source_breadth", "점검 필요", "review", "", "", "", "", issue, ""]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
