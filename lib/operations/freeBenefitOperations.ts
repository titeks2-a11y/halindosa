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
  operatorActionQueue?: Array<{
    id?: string;
    priority?: "high" | "medium" | "low" | string;
    area?: string;
    title?: string;
    reason?: string;
    action?: string;
    href?: string;
    evidence?: string;
  }>;
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

interface OperationBenefitItem {
  id?: string;
  title?: string;
  summary?: string;
  category?: string;
  benefitType?: string;
  sourceName?: string;
  merchant?: string;
  mallName?: string;
  tags?: string[];
  publishable?: boolean;
  isHidden?: boolean;
  validationStatus?: string;
  validationReason?: string;
  availability?: string;
  linkType?: string;
  finalUrl?: string;
  expiresAt?: string;
  endDate?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  qualityScore?: number;
  priorityScore?: number;
  rewardScore?: number;
  freshnessScore?: number;
  officialScore?: number;
  urgencyScore?: number;
  requiresPurchase?: boolean;
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
  operatorActionQueue: [],
  topCandidates: []
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function countBy<T>(items: T[], selector: (item: T) => unknown) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = String(selector(item) || "미분류").trim() || "미분류";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")));
}

function average(items: OperationBenefitItem[], selector: (item: OperationBenefitItem) => unknown) {
  const values = items.map(selector).map(Number).filter(Number.isFinite);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getHost(value: unknown) {
  try {
    return new URL(String(value ?? "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isToday(value: unknown, now = new Date()) {
  const date = new Date(String(value ?? ""));
  if (!Number.isFinite(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

function isThisWeek(value: unknown, now = new Date()) {
  const date = new Date(String(value ?? ""));
  if (!Number.isFinite(date.getTime())) return false;
  const diffMs = date.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function isOfficialBenefitCandidate(item: OperationBenefitItem) {
  const text = [item.title, item.summary, item.category, item.benefitType, item.sourceName, (item.tags ?? []).join(" ")].join(" ");
  return /무료|0원|무배|무료배송|쿠폰|포인트|샘플|체험|초대|지원|증정|1\+1|2\+1|행사|이벤트|리워드|멤버십|카드|배달|편의점|마트/.test(text);
}

function isVisibleOfficialBenefit(item: OperationBenefitItem, now = Date.now()) {
  const endTime = Date.parse(String(item.expiresAt || item.endDate || ""));
  const expired = Number.isFinite(endTime) && endTime < now;
  return (
    item.publishable === true &&
    item.isHidden !== true &&
    item.validationStatus === "passed" &&
    item.availability === "active" &&
    String(item.linkType || "").startsWith("official") &&
    Boolean(item.finalUrl) &&
    !expired
  );
}

function buildOperatorActionQueue(report: FreeBenefitOperationsReport, visible: OperationBenefitItem[], now: Date) {
  const actions: NonNullable<FreeBenefitOperationsReport["operatorActionQueue"]> = [];
  const generatedAt = report.generatedAt || now.toISOString();
  const refreshAgeHours = Math.round(((now.getTime() - new Date(generatedAt).getTime()) / (60 * 60 * 1000)) * 10) / 10;
  const benefitTypeCounts = report.benefitTypeCounts ?? {};
  const requiredBenefitTypes = [
    ["freebie", "전원증정"],
    ["sample", "무료 샘플"],
    ["freeTrial", "무료체험"],
    ["coupon", "쿠폰"],
    ["gifticon", "기프티콘"],
    ["point", "포인트/캐시백"],
    ["freeShipping", "무료배송"],
    ["signup", "신규가입"],
    ["checkIn", "출석체크"],
    ["convenienceStore", "편의점"]
  ];
  const lowCoverageTypes = requiredBenefitTypes
    .map(([type, label]) => ({ type, label, count: Number(benefitTypeCounts[type] ?? 0) }))
    .filter((item) => item.count < 2);
  const todayCount = Number(report.totals?.todayEndingVisibleItems ?? 0);
  const weekCount = Number(report.totals?.thisWeekEndingVisibleItems ?? 0);
  const searchLinks = Number(report.qualityGates?.exposedSearchLinks ?? 0);
  const nonOfficialLinks = Number(report.qualityGates?.exposedNonOfficialLinks ?? 0);
  const brokenImages = Number(report.qualityGates?.brokenImages ?? 0);
  const excludedCount = Number(report.totals?.excludedOfficialBenefitItems ?? 0);

  if (refreshAgeHours > 6) {
    actions.push({
      id: "refresh-official-benefits",
      priority: refreshAgeHours >= 24 ? "high" : "medium",
      area: "수집 갱신",
      title: "공식 무료혜택 스냅샷 갱신",
      reason: `마지막 운영 리포트가 ${refreshAgeHours}시간 전입니다.`,
      action: "npm run refresh:benefits && npm run verify:freebies && npm run benefit:operations:report",
      href: "/api/admin/free-benefit-operations",
      evidence: generatedAt
    });
  }

  if (searchLinks > 0 || nonOfficialLinks > 0 || brokenImages > 0) {
    actions.push({
      id: "block-untrusted-benefit-links",
      priority: "high",
      area: "링크 품질",
      title: "비공식·검색·깨진 이미지 노출 차단",
      reason: `검색 ${searchLinks}건, 비공식 ${nonOfficialLinks}건, 깨진 이미지 ${brokenImages}건`,
      action: "실패 항목을 공식 이벤트 URL 또는 검증 이미지로 교체",
      href: "/admin",
      evidence: `search=${searchLinks}; nonOfficial=${nonOfficialLinks}; brokenImages=${brokenImages}`
    });
  }

  if (todayCount === 0 && weekCount > 0) {
    actions.push({
      id: "promote-week-deadline",
      priority: "low",
      area: "마감 편성",
      title: "이번주마감 대체 편성 활성",
      reason: "오늘마감 혜택은 0건이지만 이번주 마감 혜택이 있어 고객 화면은 대체 슬롯으로 유지됩니다.",
      action: "이번주마감 후보를 홈 마감임박 영역에 유지하고 오늘마감 0건 카피는 숨김",
      href: "/free-benefits?deadline=week",
      evidence: `today=${todayCount}; week=${weekCount}`
    });
  } else if (todayCount > 0) {
    actions.push({
      id: "review-today-deadline",
      priority: "high",
      area: "마감 편성",
      title: "오늘마감 무료혜택 우선 검수",
      reason: `오늘 종료되는 공식 혜택 ${todayCount}개를 클릭 전 재확인해야 합니다.`,
      action: "오늘마감 링크를 먼저 열어 종료 문구가 있으면 즉시 숨김 처리",
      href: "/free-benefits?deadline=today",
      evidence: `today=${todayCount}`
    });
  }

  if (lowCoverageTypes.length) {
    actions.push({
      id: "fill-benefit-type-gaps",
      priority: lowCoverageTypes.length >= 3 ? "medium" : "low",
      area: "카테고리 보강",
      title: "혜택 유형 공백 보강",
      reason: lowCoverageTypes.map((item) => `${item.label} ${item.count}개`).join(", "),
      action: "공식 소스 카탈로그와 feed env 후보에서 부족한 유형의 공식 이벤트 URL을 우선 추가",
      href: "/admin",
      evidence: lowCoverageTypes.map((item) => `${item.type}:${item.count}`).join("; ")
    });
  }

  if (excludedCount > 0) {
    actions.push({
      id: "review-hidden-benefits",
      priority: "medium",
      area: "제외 후보",
      title: "숨김 처리된 공식 혜택 후보 재검토",
      reason: `공식 혜택 후보 ${excludedCount}개가 노출 조건을 통과하지 못했습니다.`,
      action: "excludedReasons를 확인해 공식 URL 또는 마감일을 보강",
      href: "/api/admin/free-benefit-operations?format=csv",
      evidence: Object.entries(report.excludedReasons ?? {}).map(([name, count]) => `${name}:${count}`).join("; ")
    });
  }

  if (!actions.length) {
    actions.push({
      id: "maintain-high-quality-rotation",
      priority: "low",
      area: "홈 편성",
      title: "고품질 무료혜택 회전 편성 유지",
      reason: "검색·비공식·깨진 이미지가 0건이며 공식 무료혜택 풀이 안정적입니다.",
      action: "상위 후보를 브랜드 중복 없이 홈 무료혜택, 즉시 수령, 이번주마감 슬롯에 회전 노출",
      href: "/free-benefits",
      evidence: visible.slice(0, 3).map((item) => item.title).join(" / ")
    });
  }

  const weights: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => (weights[String(a.priority)] ?? 3) - (weights[String(b.priority)] ?? 3) || String(a.area).localeCompare(String(b.area), "ko")).slice(0, 8);
}

function buildRuntimeFreeBenefitOperationsReport(): FreeBenefitOperationsReport {
  const snapshotPath = join(process.cwd(), "data", "refreshedNewsDeals.json");
  if (!existsSync(snapshotPath)) return fallbackFreeBenefitOperationsReport;

  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as { generatedAt?: string; allDeals?: OperationBenefitItem[]; deals?: OperationBenefitItem[] };
    const now = new Date();
    const source = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : Array.isArray(snapshot.deals) ? snapshot.deals : [];
    const candidates = source.filter(isOfficialBenefitCandidate);
    const visible = candidates.filter((item) => isVisibleOfficialBenefit(item, now.getTime()));
    const excluded = candidates.filter((item) => !isVisibleOfficialBenefit(item, now.getTime()));
    const hosts = new Set(visible.map((item) => getHost(item.finalUrl)).filter(Boolean));
    const brands = new Set(visible.map((item) => String(item.merchant || item.mallName || item.sourceName || "").trim()).filter(Boolean));
    const topCandidates = visible
      .slice()
      .sort((a, b) => Number(b.qualityScore ?? b.priorityScore ?? 0) - Number(a.qualityScore ?? a.priorityScore ?? 0))
      .slice(0, 25)
      .map((item) => ({
        id: item.id,
        title: item.title,
        brand: item.merchant || item.mallName || item.sourceName || "",
        benefitType: item.benefitType || "event",
        category: item.category || "무료혜택",
        redirectUrl: `/go/news/${item.id}`,
        endDate: item.expiresAt || item.endDate || "",
        qualityScore: item.qualityScore ?? item.priorityScore ?? 0
      }));
    const excludedReasons = countBy(excluded, (item) => {
      if (item.isHidden === true) return "hidden";
      if (item.validationStatus !== "passed") return item.validationReason || item.validationStatus || "validation_failed";
      if (item.availability !== "active") return item.availability || "inactive";
      if (!String(item.linkType || "").startsWith("official")) return item.linkType || "non_official";
      if (!item.finalUrl) return "missing_final_url";
      const endTime = Date.parse(String(item.expiresAt || item.endDate || ""));
      if (Number.isFinite(endTime) && endTime < now.getTime()) return "expired";
      return "not_publishable";
    });
    const report: FreeBenefitOperationsReport = {
      ok: visible.length >= 100 && hosts.size >= 45,
      generatedAt: snapshot.generatedAt || now.toISOString(),
      totals: {
        visibleOfficialBenefitItems: visible.length,
        excludedOfficialBenefitItems: excluded.length,
        officialHosts: hosts.size,
        brands: brands.size,
        todayEndingVisibleItems: visible.filter((item) => isToday(item.expiresAt || item.endDate, now)).length,
        thisWeekEndingVisibleItems: visible.filter((item) => isThisWeek(item.expiresAt || item.endDate, now)).length
      },
      qualityGates: {
        exposedSearchLinks: visible.filter((item) => String(item.linkType || "").includes("search")).length,
        exposedNonOfficialLinks: visible.filter((item) => !String(item.linkType || "").startsWith("official")).length,
        brokenImages: 0,
        duplicateMergedCount: 0,
        expiredEvents: excludedReasons.expired ?? 0,
        blockedEvents: excludedReasons.hidden ?? 0
      },
      scoreAverages: {
        qualityScore: average(visible, (item) => item.qualityScore ?? item.priorityScore ?? 0),
        freshnessScore: average(visible, (item) => item.freshnessScore),
        officialScore: average(visible, (item) => item.officialScore),
        urgencyScore: average(visible, (item) => item.urgencyScore),
        rewardScore: average(visible, (item) => item.rewardScore)
      },
      categoryCounts: countBy(visible, (item) => item.category),
      benefitTypeCounts: countBy(visible, (item) => item.benefitType),
      excludedReasons,
      topCandidates
    };
    report.operatorActionQueue = buildOperatorActionQueue(report, visible, now);
    return report;
  } catch {
    return fallbackFreeBenefitOperationsReport;
  }
}

export function getFreeBenefitOperationsReport(): FreeBenefitOperationsReport {
  const reportPath = join(process.cwd(), "reports", "free-benefit-operations.json");
  if (!existsSync(reportPath)) return buildRuntimeFreeBenefitOperationsReport();

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as FreeBenefitOperationsReport;
    return report.ok === false && !report.generatedAt ? buildRuntimeFreeBenefitOperationsReport() : report;
  } catch {
    return buildRuntimeFreeBenefitOperationsReport();
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

  for (const item of report.operatorActionQueue ?? []) {
    rows.push(["operator_action", item.id ?? "", item.priority ?? "medium", item.area ?? "", `${item.title ?? ""}; ${item.reason ?? ""}; ${item.evidence ?? ""}`, item.action ?? item.href ?? ""]);
  }

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
