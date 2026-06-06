import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toCsv } from "@/lib/csv";

export interface LinkRevalidationQueueItem {
  id: string;
  title: string;
  mallName: string;
  category: string;
  host: string;
  finalUrl: string;
  linkType: string;
  availability: string;
  validationStatus: string;
  publishable: boolean;
  isHidden: boolean;
  evidenceTier: string;
  liveStatus: number | null;
  liveReason: string;
  userReportReason?: string;
  userReportCount?: number;
  userReportedAt?: string;
  contentMatch: boolean;
  priceSignal: boolean;
  purchaseActionSignal: boolean;
  lastCheckedAt: string;
  priority: number;
  severity: "block" | "quarantine" | "review" | "watch" | "routine";
  action: string;
}

export interface LinkRevalidationPriorityReport {
  ok: boolean;
  generatedAt: string;
  sourceReports: {
    linkValidation: string | null;
    exposurePolicy: string | null;
    linkLaunchGate: string | null;
  };
  summary: {
    auditedItems: number;
    publishableItems: number;
    hiddenItems: number;
    exposedSearchLinks: number;
    exposedSoldOutLinks: number;
    exposedBrokenLinks: number;
    blockingRevalidationItems: number;
    quarantinedRevalidationItems?: number;
    userReportedItems?: number;
    reviewItems: number;
    watchItems: number;
    routineItems: number;
    queueItems: number;
  };
  liveProbeReviewSummary: {
    status?: string;
    hardFailureCount?: number;
    exposedHardFailureCount?: number;
    exposedSellerUnavailableSignals?: number;
    transientNetworkCount?: number;
    accessProtectedCount?: number;
    sellerUnavailableSignals?: number;
    contentProbe?: {
      bodyChecked?: number;
      titleMetaChecked?: number;
      contentMatched?: number;
      contentMismatch?: number;
      accessibleContentMismatch?: number;
      accessGuardBody?: number;
      priceSignal?: number;
      purchaseActionSignal?: number;
      strict?: boolean;
    };
    interpretation?: string;
  };
  counts: {
    block: number;
    quarantine?: number;
    review: number;
    watch: number;
    routine: number;
    byReason: Record<string, number>;
    byHost: Record<string, number>;
  };
  topQueue: LinkRevalidationQueueItem[];
}

const fallbackReport: LinkRevalidationPriorityReport = {
  ok: false,
  generatedAt: "",
  sourceReports: {
    linkValidation: null,
    exposurePolicy: null,
    linkLaunchGate: null
  },
  summary: {
    auditedItems: 0,
    publishableItems: 0,
    hiddenItems: 0,
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    exposedBrokenLinks: 0,
    blockingRevalidationItems: 0,
    quarantinedRevalidationItems: 0,
    userReportedItems: 0,
    reviewItems: 0,
    watchItems: 0,
    routineItems: 0,
    queueItems: 0
  },
  liveProbeReviewSummary: {
    status: "missing_report",
    interpretation: "Run npm run link:revalidation:report to generate the link revalidation priority report."
  },
  counts: {
    block: 0,
    quarantine: 0,
    review: 0,
    watch: 0,
    routine: 0,
    byReason: {},
    byHost: {}
  },
  topQueue: []
};

export function getLinkRevalidationPriorityReport(): LinkRevalidationPriorityReport {
  const path = join(process.cwd(), "reports", "link-revalidation-priority.json");
  if (!existsSync(path)) return fallbackReport;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as LinkRevalidationPriorityReport;
  } catch {
    return {
      ...fallbackReport,
      liveProbeReviewSummary: {
        status: "parse_error",
        interpretation: "reports/link-revalidation-priority.json could not be parsed. Run npm run link:revalidation:report."
      }
    };
  }
}

export function buildLinkRevalidationPriorityCsv(report: LinkRevalidationPriorityReport) {
  const summaryRows = [
    ["audited_items", "감사 상품", report.summary.auditedItems, report.summary.auditedItems >= 140 ? "pass" : "review", "전체 검증 대상", "verify:links 재실행"],
    ["publishable_items", "노출 가능 상품", report.summary.publishableItems, report.summary.publishableItems >= 120 ? "pass" : "review", "검증 후 publishable=true 후보", "노출 정책 확인"],
    ["hidden_items", "숨김 상품", report.summary.hiddenItems, report.summary.hiddenItems === 0 ? "pass" : "review", "검증 실패/숨김 상품", "복구 전 재검증"],
    ["exposed_search_links", "검색 링크 노출", report.summary.exposedSearchLinks, report.summary.exposedSearchLinks === 0 ? "pass" : "block", "검색/대표몰 링크 노출", "즉시 차단"],
    ["exposed_sold_out_links", "품절/종료 노출", report.summary.exposedSoldOutLinks, report.summary.exposedSoldOutLinks === 0 ? "pass" : "block", "품절/종료 링크 노출", "availability=sold_out"],
    ["exposed_broken_links", "깨진 링크 노출", report.summary.exposedBrokenLinks, report.summary.exposedBrokenLinks === 0 ? "pass" : "block", "404/5xx/invalid 노출", "상세 URL 교체"],
    ["blocking_revalidation_items", "차단 재검증", report.summary.blockingRevalidationItems, report.summary.blockingRevalidationItems === 0 ? "pass" : "block", "즉시 노출 차단 대상", "출시 전 처리"],
    ["quarantined_revalidation_items", "숨김 격리", report.summary.quarantinedRevalidationItems ?? 0, (report.summary.quarantinedRevalidationItems ?? 0) === 0 ? "pass" : "review", "노출에서 제거된 실패 후보", "복구 전 재검증"],
    ["user_reported_items", "신고 우선 재검증", report.summary.userReportedItems ?? 0, (report.summary.userReportedItems ?? 0) === 0 ? "pass" : "review", "미처리 사용자 신고 기반 우선순위", "판매처 상세/품절/종료 우선 확인"],
    ["review_items", "검토 재검증", report.summary.reviewItems, report.summary.reviewItems === 0 ? "pass" : "review", "403/429 등 접근보호", "공식 API/제휴 피드/실기기 확인"],
    ["watch_items", "관찰 재검증", report.summary.watchItems, report.summary.watchItems === 0 ? "pass" : "watch", "일시 네트워크/timeout", "다음 refresh에서 우선 확인"],
    ["queue_items", "재검증 큐", report.summary.queueItems, report.ok ? "pass" : "review", "운영자 처리 후보", "우선순위 순 처리"]
  ].map(([key, label, count, status, reason, action]) => ({
    section: "summary",
    key,
    label,
    status,
    count,
    reason,
    action,
    id: "",
    mallName: "",
    category: "",
    host: "",
    severity: "",
    liveStatus: "",
    liveReason: "",
    userReportReason: "",
    userReportCount: "",
    userReportedAt: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const queueRows = (report.topQueue.length
    ? report.topQueue
    : [
        {
          id: "none",
          title: "우선 재검증 항목 없음",
          mallName: "",
          category: "",
          host: "",
          finalUrl: "",
          liveStatus: null,
          liveReason: "",
          userReportReason: "",
          userReportCount: 0,
          userReportedAt: "",
          priority: 0,
          severity: "routine",
          action: "현 상태 유지"
        }
      ]
  ).map((item) => ({
    section: "revalidation_queue",
    key: item.id,
    label: item.title,
    status: item.severity === "block" ? "block" : item.severity === "quarantine" ? "review" : item.severity === "review" ? "review" : item.severity === "watch" ? "watch" : "pass",
    count: item.priority,
    reason: item.liveReason,
    action: item.action,
    id: item.id,
    mallName: item.mallName,
    category: item.category,
    host: item.host,
    severity: item.severity,
    liveStatus: item.liveStatus ?? "",
    liveReason: item.liveReason,
    userReportReason: item.userReportReason ?? "",
    userReportCount: item.userReportCount ?? 0,
    userReportedAt: item.userReportedAt ?? "",
    finalUrl: item.finalUrl,
    generatedAt: report.generatedAt
  }));

  const reasonRows = Object.entries(report.counts.byReason).map(([reason, count]) => ({
    section: "reason_count",
    key: reason,
    label: reason,
    status: reason === "robots_or_access_blocked" || reason === "http_429" ? "review" : "watch",
    count,
    reason,
    action: "운영 큐에서 host별로 처리",
    id: "",
    mallName: "",
    category: "",
    host: "",
    severity: "",
    liveStatus: "",
    liveReason: reason,
    userReportReason: "",
    userReportCount: "",
    userReportedAt: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  return toCsv([...summaryRows, ...queueRows, ...reasonRows]);
}
