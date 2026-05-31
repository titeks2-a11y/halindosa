import { findDealById } from "@/lib/dealService";
import { maxReportMessageLength } from "@/lib/reportConfig";

export type ReportReason = "price_changed" | "sold_out" | "expired" | "link_error" | "wrong_info" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportPriority = "high" | "medium" | "low";

const reportReasons = new Set<ReportReason>(["price_changed", "sold_out", "expired", "link_error", "wrong_info", "other"]);
const reportStatuses = new Set<ReportStatus>(["open", "reviewing", "resolved", "dismissed"]);

const reportReasonLabels: Record<ReportReason, string> = {
  price_changed: "가격 다름",
  sold_out: "품절",
  expired: "종료됨",
  link_error: "링크 오류",
  wrong_info: "정보 오류",
  other: "기타"
};

const reportStatusLabels: Record<ReportStatus, string> = {
  open: "미처리",
  reviewing: "검토중",
  resolved: "해결",
  dismissed: "기각"
};

const reportPriorityLabels: Record<ReportPriority, string> = {
  high: "우선 검수",
  medium: "일반 검수",
  low: "참고"
};

const reportPriorityByReason: Record<ReportReason, ReportPriority> = {
  price_changed: "medium",
  sold_out: "high",
  expired: "high",
  link_error: "high",
  wrong_info: "medium",
  other: "low"
};

const reportActionByReason: Record<ReportReason, string> = {
  price_changed: "판매처 최종가와 쿠폰 조건을 확인하고 표시 가격을 갱신하세요.",
  sold_out: "판매처 재고와 옵션 선택 가능 여부를 확인하고 품절이면 노출을 낮추세요.",
  expired: "행사 종료 여부를 확인하고 종료된 혜택은 하단 이동 또는 비노출 처리하세요.",
  link_error: "현재 이동 URL이 실제 상품 상세로 열리는지 확인하고 broken이면 링크를 교체하세요.",
  wrong_info: "쇼핑몰명, 배송비, 이미지, 태그, 혜택 조건을 판매처 기준으로 다시 확인하세요.",
  other: "사용자 메모를 읽고 필요한 경우 고객센터 답변 또는 운영 메모로 남기세요."
};

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
  priority: ReportPriority;
  recommendedAction: string;
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

  if ((input.message?.trim().length ?? 0) > maxReportMessageLength) {
    return {
      ok: false,
      status: 400,
      message: `추가 내용은 ${maxReportMessageLength}자 이내로 입력해주세요.`
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
    message: input.message?.trim().slice(0, maxReportMessageLength) ?? "",
    status: "open" as ReportStatus,
    priority: getReportPriority(input.reason as ReportReason),
    recommendedAction: getReportRecommendedAction(input.reason as ReportReason),
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

export function getReportReasonLabel(reason: ReportReason) {
  return reportReasonLabels[reason] ?? reason;
}

export function getReportStatusLabel(status: ReportStatus) {
  return reportStatusLabels[status] ?? status;
}

export function getReportPriority(reason: ReportReason) {
  return reportPriorityByReason[reason] ?? "low";
}

export function getReportPriorityLabel(priority: ReportPriority) {
  return reportPriorityLabels[priority] ?? priority;
}

export function getReportRecommendedAction(reason: ReportReason) {
  return reportActionByReason[reason] ?? reportActionByReason.other;
}
