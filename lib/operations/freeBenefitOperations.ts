import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface FreeBenefitOperationsReport {
  ok?: boolean;
  generatedAt?: string;
  totals?: {
    visibleOfficialBenefitItems?: number;
    excludedOfficialBenefitItems?: number;
    officialHosts?: number;
    brands?: number;
    todayEndingVisibleItems?: number;
    thisWeekEndingVisibleItems?: number;
  };
  qualityGates?: {
    exposedSearchLinks?: number;
    exposedNonOfficialLinks?: number;
    brokenImages?: number;
    duplicateMergedCount?: number;
    expiredEvents?: number;
    blockedEvents?: number;
  };
  scoreAverages?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  benefitTypeCounts?: Record<string, number>;
  excludedReasons?: Record<string, number>;
  topCandidates?: Array<{
    id?: string;
    title?: string;
    brand?: string;
    benefitType?: string;
    category?: string;
    redirectUrl?: string;
    endDate?: string;
    qualityScore?: number;
  }>;
}

export const fallbackFreeBenefitOperationsReport: FreeBenefitOperationsReport = {
  ok: false,
  generatedAt: "",
  totals: {},
  qualityGates: {},
  scoreAverages: {},
  categoryCounts: {},
  benefitTypeCounts: {},
  excludedReasons: {},
  topCandidates: []
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

export function getFreeBenefitOperationsReport(): FreeBenefitOperationsReport {
  const reportPath = join(process.cwd(), "reports", "free-benefit-operations.json");
  if (!existsSync(reportPath)) return fallbackFreeBenefitOperationsReport;

  try {
    return JSON.parse(readFileSync(reportPath, "utf8")) as FreeBenefitOperationsReport;
  } catch {
    return fallbackFreeBenefitOperationsReport;
  }
}

export function buildFreeBenefitOperationsCsv(report: FreeBenefitOperationsReport) {
  const rows: string[][] = [["section", "name", "status", "value", "detail", "action"]];
  const totals = report.totals ?? {};
  const quality = report.qualityGates ?? {};

  rows.push(["summary", "visibleOfficialBenefitItems", report.ok ? "passed" : "failed", String(totals.visibleOfficialBenefitItems ?? 0), "노출 가능한 공식 무료혜택", "npm run benefit:operations:report"]);
  rows.push(["summary", "excludedOfficialBenefitItems", "count", String(totals.excludedOfficialBenefitItems ?? 0), "노출 제외 후보", "docs/FREE_BENEFIT_OPERATIONS_REPORT.md"]);
  rows.push(["summary", "officialHosts", "count", String(totals.officialHosts ?? 0), "공식 도메인 수", "npm run verify:freebies"]);
  rows.push(["summary", "brands", "count", String(totals.brands ?? 0), "브랜드/출처 수", "npm run refresh:benefits"]);
  rows.push(["quality", "exposedSearchLinks", Number(quality.exposedSearchLinks ?? 0) === 0 ? "passed" : "failed", String(quality.exposedSearchLinks ?? 0), "검색 링크 노출", "npm run benefit:operations:report"]);
  rows.push(["quality", "exposedNonOfficialLinks", Number(quality.exposedNonOfficialLinks ?? 0) === 0 ? "passed" : "failed", String(quality.exposedNonOfficialLinks ?? 0), "비공식 링크 노출", "npm run benefit:operations:report"]);
  rows.push(["quality", "brokenImages", Number(quality.brokenImages ?? 0) === 0 ? "passed" : "failed", String(quality.brokenImages ?? 0), "깨진 이미지", "npm run verify:freebies"]);
  rows.push(["deadline", "todayEndingVisibleItems", "count", String(totals.todayEndingVisibleItems ?? 0), "오늘 마감 공식 무료혜택", "/free-benefits?deadline=today"]);
  rows.push(["deadline", "thisWeekEndingVisibleItems", "count", String(totals.thisWeekEndingVisibleItems ?? 0), "이번주 마감 공식 무료혜택", "/free-benefits?deadline=week"]);

  for (const [name, count] of Object.entries(report.categoryCounts ?? {})) {
    rows.push(["category", name, "count", String(count), "카테고리별 노출 수", `/free-benefits?q=${name}`]);
  }

  for (const [name, count] of Object.entries(report.benefitTypeCounts ?? {})) {
    rows.push(["benefit_type", name, "count", String(count), "혜택 유형별 노출 수", `/free-benefits?eventType=${name}`]);
  }

  for (const [name, count] of Object.entries(report.excludedReasons ?? {})) {
    rows.push(["excluded_reason", name, "count", String(count), "노출 제외 사유", "링크/마감/공식성 재검증"]);
  }

  for (const item of report.topCandidates ?? []) {
    rows.push(["top_candidate", item.id ?? "", "candidate", String(item.qualityScore ?? ""), `${item.brand ?? ""}; ${item.title ?? ""}; ${item.benefitType ?? ""}; ${item.endDate ?? ""}`, item.redirectUrl ?? ""]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
