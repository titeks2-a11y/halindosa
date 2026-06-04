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

const reportResolutionPlans: Record<ReportReason, { userExpectation: string; operatorSla: string; queueLabel: string }> = {
  price_changed: {
    userExpectation: "판매처 최종가, 쿠폰 적용가, 옵션가를 비교해 표시 가격을 다시 확인합니다.",
    operatorSla: "영업일 24시간 이내 확인",
    queueLabel: "가격 기준 재확인"
  },
  sold_out: {
    userExpectation: "재고와 옵션 선택 가능 여부를 확인하고 품절 가능성이 높으면 노출을 낮춥니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "품절 노출 조정"
  },
  expired: {
    userExpectation: "쿠폰, 이벤트, 체험단 모집 종료 여부를 확인하고 종료된 혜택은 하단으로 이동합니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "종료 혜택 정리"
  },
  link_error: {
    userExpectation: "실제 상품/혜택 상세가 열리는지 확인하고 다른 페이지로 이동하면 링크를 교체합니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "링크 교체"
  },
  wrong_info: {
    userExpectation: "쇼핑몰명, 배송비, 이미지, 혜택 조건을 판매처 기준으로 다시 확인합니다.",
    operatorSla: "영업일 24시간 이내 확인",
    queueLabel: "정보 정정"
  },
  other: {
    userExpectation: "남겨주신 내용을 운영 메모로 확인하고 필요한 경우 고객센터 답변으로 이어갑니다.",
    operatorSla: "영업일 48시간 이내 확인",
    queueLabel: "운영 메모 확인"
  }
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
  userExpectation: string;
  operatorSla: string;
  queueLabel: string;
  receivedAt: string;
  updatedAt: string;
}

const reportStore = globalThis as typeof globalThis & {
  __halindosaReports?: DealReport[];
};

interface NodeStorage {
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void;
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) => void;
  dirname: (path: string) => string;
  join: (...paths: string[]) => string;
}

interface ServerRuntime {
  process?: {
    cwd?: () => string;
    getBuiltinModule?: (moduleName: string) => unknown;
    versions?: {
      node?: string;
    };
  };
}

function getNodeStorage(): NodeStorage | null {
  const runtime = globalThis as typeof globalThis & ServerRuntime;

  if (!runtime.process?.versions?.node || typeof window !== "undefined") {
    return null;
  }

  try {
    const fs = runtime.process.getBuiltinModule?.("fs") as Pick<NodeStorage, "existsSync" | "mkdirSync" | "readFileSync" | "writeFileSync"> | undefined;
    const path = runtime.process.getBuiltinModule?.("path") as Pick<NodeStorage, "dirname" | "join"> | undefined;
    if (!fs || !path) return null;

    return {
      existsSync: fs.existsSync,
      mkdirSync: fs.mkdirSync,
      readFileSync: fs.readFileSync,
      writeFileSync: fs.writeFileSync,
      dirname: path.dirname,
      join: path.join
    };
  } catch {
    return null;
  }
}

function getReportsPath(storage: NodeStorage) {
  const runtime = globalThis as typeof globalThis & ServerRuntime;
  const cwd = runtime.process?.cwd?.() ?? "";

  return storage.join(cwd, "data", "dealReports.local.json");
}

function normalizeReport(report: Partial<DealReport>): DealReport | null {
  if (!report.id || !report.dealId || !report.reason || !report.status) return null;

  const reason = reportReasons.has(report.reason as ReportReason) ? (report.reason as ReportReason) : "other";
  const status = reportStatuses.has(report.status as ReportStatus) ? (report.status as ReportStatus) : "open";
  const receivedAt = report.receivedAt || new Date().toISOString();

  return {
    id: report.id,
    dealId: report.dealId,
    mall: report.mall || "unknown",
    title: report.title || "unknown",
    reason,
    message: report.message?.slice(0, maxReportMessageLength) ?? "",
    status,
    priority: report.priority ?? getReportPriority(reason),
    recommendedAction: report.recommendedAction || getReportRecommendedAction(reason),
    userExpectation: report.userExpectation || getReportResolutionPlan(reason).userExpectation,
    operatorSla: report.operatorSla || getReportResolutionPlan(reason).operatorSla,
    queueLabel: report.queueLabel || getReportResolutionPlan(reason).queueLabel,
    receivedAt,
    updatedAt: report.updatedAt || receivedAt
  };
}

function readReportsFromDisk() {
  const storage = getNodeStorage();
  if (!storage) return [];

  try {
    const reportsPath = getReportsPath(storage);
    if (!storage.existsSync(reportsPath)) return [];
    const payload = JSON.parse(storage.readFileSync(reportsPath, "utf8")) as unknown;
    const reports = Array.isArray(payload) ? payload : Array.isArray((payload as { reports?: unknown[] })?.reports) ? (payload as { reports: unknown[] }).reports : [];

    return reports
      .map((report) => normalizeReport(report as Partial<DealReport>))
      .filter((report): report is DealReport => Boolean(report))
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, 200);
  } catch {
    return [];
  }
}

function writeReportsToDisk(reports: DealReport[]) {
  const storage = getNodeStorage();
  if (!storage) return;

  const reportsPath = getReportsPath(storage);
  storage.mkdirSync(storage.dirname(reportsPath), { recursive: true });
  storage.writeFileSync(
    reportsPath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        reports: reports.slice(0, 200)
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function getReportStore() {
  if (!reportStore.__halindosaReports) {
    reportStore.__halindosaReports = readReportsFromDisk();
  }

  return reportStore.__halindosaReports;
}

export function getReportStorageStatus() {
  const storage = getNodeStorage();
  const reportsPath = storage ? getReportsPath(storage) : "";

  return {
    localFile: Boolean(storage && reportsPath && storage.existsSync(reportsPath)),
    localPath: reportsPath,
    maxStoredReports: 200,
    persistence: storage ? "local_file" : "memory"
  };
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
    userExpectation: getReportResolutionPlan(input.reason as ReportReason).userExpectation,
    operatorSla: getReportResolutionPlan(input.reason as ReportReason).operatorSla,
    queueLabel: getReportResolutionPlan(input.reason as ReportReason).queueLabel,
    receivedAt: now,
    updatedAt: now
  } satisfies DealReport;
}

export function saveDealReport(report: DealReport) {
  const reports = getReportStore();
  reports.unshift(report);
  reportStore.__halindosaReports = reports.slice(0, 200);
  writeReportsToDisk(reportStore.__halindosaReports);
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
  writeReportsToDisk(reports);
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

export function getReportResolutionPlan(reason: ReportReason) {
  return reportResolutionPlans[reason] ?? reportResolutionPlans.other;
}
