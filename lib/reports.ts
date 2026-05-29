import { findDealById } from "@/lib/dealService";

export type ReportReason = "price_changed" | "sold_out" | "expired" | "wrong_info" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

const reportReasons = new Set<ReportReason>(["price_changed", "sold_out", "expired", "wrong_info", "other"]);
const reportStatuses = new Set<ReportStatus>(["open", "reviewing", "resolved", "dismissed"]);

export interface DealReportInput {
  dealId?: string;
  reason?: string;
  message?: string;
}

export interface DealReport {
  id: string;
  dealId: string;
  mall: string;
  title: string;
  reason: ReportReason;
  message: string;
  status: ReportStatus;
  receivedAt: string;
  updatedAt: string;
}

const reportStore = globalThis as typeof globalThis & {
  __halindosaReports?: DealReport[];
};

function getReportStore() {
  if (!reportStore.__halindosaReports) {
    reportStore.__halindosaReports = [];
  }

  return reportStore.__halindosaReports;
}

export function validateDealReport(input: DealReportInput) {
  if (!input.dealId || !findDealById(input.dealId)) {
    return {
      ok: false,
      status: 404,
      message: "유효하지 않은 특가 ID입니다."
    };
  }

  if (!input.reason || !reportReasons.has(input.reason as ReportReason)) {
    return {
      ok: false,
      status: 400,
      message: "신고 사유를 선택해주세요."
    };
  }

  return {
    ok: true,
    status: 200,
    message: "신고가 접수되었습니다."
  };
}

export function createDealReport(input: Required<Pick<DealReportInput, "dealId" | "reason">> & Pick<DealReportInput, "message">) {
  const deal = findDealById(input.dealId);
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    dealId: input.dealId,
    mall: deal?.mall ?? "unknown",
    title: deal?.title ?? "unknown",
    reason: input.reason as ReportReason,
    message: input.message?.trim() ?? "",
    status: "open" as ReportStatus,
    receivedAt: now,
    updatedAt: now
  } satisfies DealReport;
}

export function saveDealReport(report: DealReport) {
  const reports = getReportStore();
  reports.unshift(report);
  reportStore.__halindosaReports = reports.slice(0, 200);
  return report;
}

export function listDealReports(status?: string | null) {
  const reports = getReportStore();
  if (!status || status === "all") return reports;
  return reports.filter((report) => report.status === status);
}

export function getReportSummary() {
  const reports = getReportStore();

  return {
    total: reports.length,
    open: reports.filter((report) => report.status === "open").length,
    reviewing: reports.filter((report) => report.status === "reviewing").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
    dismissed: reports.filter((report) => report.status === "dismissed").length
  };
}

export function updateDealReportStatus(reportId: string, status: string) {
  if (!reportStatuses.has(status as ReportStatus)) {
    return null;
  }

  const reports = getReportStore();
  const report = reports.find((candidate) => candidate.id === reportId);

  if (!report) return null;

  report.status = status as ReportStatus;
  report.updatedAt = new Date().toISOString();
  return report;
}
