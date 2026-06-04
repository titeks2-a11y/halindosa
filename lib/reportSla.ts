import { getReportReasonLabel, type DealReport, type ReportReason } from "@/lib/reports";

export type ReportSlaSeverity = "clear" | "watch" | "due_soon" | "overdue";
export type ReportOperationRecommendation = "hide" | "revalidate" | "review";

export interface ReportSlaItem {
  id: string;
  dealId: string;
  title: string;
  reason: ReportReason;
  reasonLabel: string;
  status: DealReport["status"];
  priority: DealReport["priority"];
  receivedAt: string;
  ageMinutes: number;
  ageLabel: string;
  slaHours: number;
  dueAt: string;
  severity: ReportSlaSeverity;
  recommendedOperationAction: ReportOperationRecommendation;
  recommendedAction: string;
}

export interface ReportSlaSummary {
  active: number;
  urgent: number;
  dueSoon: number;
  overdue: number;
  slaTargetMet: boolean;
  oldestAgeHours: number;
  nextAction: string;
  priorityReports: ReportSlaItem[];
}

const activeStatuses = new Set<DealReport["status"]>(["open", "reviewing"]);

const slaHoursByReason: Record<ReportReason, number> = {
  sold_out: 6,
  expired: 6,
  link_error: 6,
  price_changed: 24,
  wrong_info: 24,
  other: 48
};

const operationByReason: Record<ReportReason, ReportOperationRecommendation> = {
  sold_out: "hide",
  expired: "hide",
  link_error: "hide",
  price_changed: "revalidate",
  wrong_info: "revalidate",
  other: "review"
};

function parseTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

function formatAge(minutes: number) {
  if (minutes < 60) return `${minutes}분 경과`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours}시간 ${restMinutes}분 경과` : `${hours}시간 경과`;
}

function getSlaSeverity(report: DealReport, ageMinutes: number, slaHours: number): ReportSlaSeverity {
  if (!activeStatuses.has(report.status)) return "clear";
  const slaMinutes = slaHours * 60;
  if (ageMinutes >= slaMinutes) return "overdue";
  if (ageMinutes >= Math.floor(slaMinutes * 0.75)) return "due_soon";
  return report.priority === "high" ? "watch" : "clear";
}

function compareSlaItems(a: ReportSlaItem, b: ReportSlaItem) {
  const severityRank: Record<ReportSlaSeverity, number> = {
    overdue: 4,
    due_soon: 3,
    watch: 2,
    clear: 1
  };
  const priorityRank = { high: 3, medium: 2, low: 1 };

  return (
    severityRank[b.severity] - severityRank[a.severity] ||
    priorityRank[b.priority] - priorityRank[a.priority] ||
    b.ageMinutes - a.ageMinutes
  );
}

export function buildReportSlaSummary(reports: DealReport[], now = new Date()): ReportSlaSummary {
  const nowTime = now.getTime();
  const activeReports = reports.filter((report) => activeStatuses.has(report.status));
  const items = activeReports.map((report) => {
    const slaHours = slaHoursByReason[report.reason] ?? slaHoursByReason.other;
    const receivedTime = parseTime(report.receivedAt);
    const ageMinutes = Math.max(0, Math.floor((nowTime - receivedTime) / 60_000));
    const dueAt = new Date(receivedTime + slaHours * 60 * 60 * 1000).toISOString();
    const severity = getSlaSeverity(report, ageMinutes, slaHours);

    return {
      id: report.id,
      dealId: report.dealId,
      title: report.title,
      reason: report.reason,
      reasonLabel: getReportReasonLabel(report.reason),
      status: report.status,
      priority: report.priority,
      receivedAt: report.receivedAt,
      ageMinutes,
      ageLabel: formatAge(ageMinutes),
      slaHours,
      dueAt,
      severity,
      recommendedOperationAction: operationByReason[report.reason] ?? "review",
      recommendedAction: report.recommendedAction
    } satisfies ReportSlaItem;
  });

  const urgent = items.filter((item) => item.priority === "high").length;
  const dueSoon = items.filter((item) => item.severity === "due_soon").length;
  const overdue = items.filter((item) => item.severity === "overdue").length;
  const oldestAgeHours = items.length ? Math.round(Math.max(...items.map((item) => item.ageMinutes)) / 60) : 0;
  const priorityReports = [...items]
    .sort(compareSlaItems)
    .filter((item) => item.severity !== "clear" || item.priority === "high")
    .slice(0, 8);

  const nextAction =
    overdue > 0
      ? `SLA 초과 신고 ${overdue}건을 먼저 숨김 또는 재검증 처리하세요.`
      : dueSoon > 0
        ? `SLA 임박 신고 ${dueSoon}건을 다음 운영 순서로 배정하세요.`
        : urgent > 0
          ? `우선 검수 신고 ${urgent}건을 6시간 기준으로 추적하세요.`
          : "현재 신고 SLA는 정상입니다. 신규 링크 오류와 품절 신고만 계속 감시하세요.";

  return {
    active: activeReports.length,
    urgent,
    dueSoon,
    overdue,
    slaTargetMet: overdue === 0,
    oldestAgeHours,
    nextAction,
    priorityReports
  };
}
