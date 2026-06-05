import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toCsv } from "@/lib/csv";

export interface LiveProbeReviewQueueItem {
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
  status: number | null;
  reason: string;
  evidenceTier: string;
  contentMatch: boolean;
  priceSignal: boolean;
  purchaseActionSignal: boolean;
  lastCheckedAt: string;
  manualEvidenceStatus?: "fresh" | "stale" | "missing";
  manualEvidenceAgeDays?: number | null;
  manualEvidenceFresh?: boolean;
  severity: "blocker" | "quarantine" | "review" | "watch";
  retryMode: "remove_or_replace" | "official_api_or_partner_feed" | "backoff_retry" | "network_retry" | "manual_device_check";
  recommendedAction: string;
  priority: number;
}

export interface LiveProbeReviewReport {
  ok: boolean;
  generatedAt: string;
  sourceReport: string;
  sourceGeneratedAt: string;
  summary: {
    totalDeals: number;
    publishableDeals: number;
    liveChecked: number;
    livePassed: number;
    liveFailed: number;
    reviewQueueCount: number;
    hardFailureCount: number;
    quarantinedFailureCount?: number;
    exposedHardFailureCount: number;
    unavailableTextCount: number;
    protectedOrRateLimitedCount: number;
    transientNetworkCount: number;
    exposedSearchLinks: number;
    exposedSoldOutLinks: number;
    exposedBrokenLinks: number;
    exposedInvalidUrls: number;
    exposedNonPublishableItems: number;
  };
  reasonCounts: Record<string, number>;
  hostCounts: Record<string, number>;
  retryModeCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  manualEvidenceSummary?: {
    maxAgeDays: number;
    reviewedQueueItems: number;
    freshManualEvidenceCount: number;
    staleManualEvidenceCount: number;
    missingManualEvidenceCount: number;
    oldestCheckedAt: string;
    newestCheckedAt: string;
  };
  liveProbeReviewSummary: {
    status?: string;
    hardFailureCount?: number;
    exposedHardFailureCount?: number;
    transientNetworkCount?: number;
    accessProtectedCount?: number;
    interpretation?: string;
  };
  topHostActions: {
    host: string;
    count: number;
    retryModes: string[];
    recommendedAction: string;
  }[];
  hardFailures: LiveProbeReviewQueueItem[];
  quarantinedFailures?: LiveProbeReviewQueueItem[];
  reviewQueue: LiveProbeReviewQueueItem[];
}

const fallbackReport: LiveProbeReviewReport = {
  ok: false,
  generatedAt: "",
  sourceReport: "reports/link-validation.json",
  sourceGeneratedAt: "",
  summary: {
    totalDeals: 0,
    publishableDeals: 0,
    liveChecked: 0,
    livePassed: 0,
    liveFailed: 0,
    reviewQueueCount: 0,
    hardFailureCount: 0,
    quarantinedFailureCount: 0,
    exposedHardFailureCount: 0,
    unavailableTextCount: 0,
    protectedOrRateLimitedCount: 0,
    transientNetworkCount: 0,
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    exposedBrokenLinks: 0,
    exposedInvalidUrls: 0,
    exposedNonPublishableItems: 0
  },
  reasonCounts: {},
  hostCounts: {},
  retryModeCounts: {},
  severityCounts: {},
  manualEvidenceSummary: {
    maxAgeDays: 7,
    reviewedQueueItems: 0,
    freshManualEvidenceCount: 0,
    staleManualEvidenceCount: 0,
    missingManualEvidenceCount: 0,
    oldestCheckedAt: "",
    newestCheckedAt: ""
  },
  liveProbeReviewSummary: {
    status: "missing_report",
    interpretation: "Run npm run live:probe:review to generate the live probe review report."
  },
  topHostActions: [],
  hardFailures: [],
  quarantinedFailures: [],
  reviewQueue: []
};

export function getLiveProbeReviewReport(): LiveProbeReviewReport {
  const path = join(process.cwd(), "reports", "live-probe-review.json");
  if (!existsSync(path)) return fallbackReport;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as LiveProbeReviewReport;
  } catch {
    return {
      ...fallbackReport,
      liveProbeReviewSummary: {
        status: "parse_error",
        interpretation: "reports/live-probe-review.json could not be parsed. Run npm run live:probe:review."
      }
    };
  }
}

export function buildLiveProbeReviewCsv(report: LiveProbeReviewReport) {
  const summaryRows = [
    ["total_deals", "전체 상품", report.summary.totalDeals, "pass", "live probe 검증 대상", "verify:links 재실행"],
    ["publishable_deals", "노출 가능 상품", report.summary.publishableDeals, report.summary.publishableDeals >= 140 ? "pass" : "review", "사용자 노출 후보", "노출 정책 확인"],
    ["live_checked", "live probe 확인", report.summary.liveChecked, report.summary.liveChecked >= report.summary.totalDeals ? "pass" : "review", "HTTP/redirect 검증 수행 수", "verify:links:live 재실행"],
    ["live_passed", "본문 확인 통과", report.summary.livePassed, "pass", "본문/메타 검증 성공", "현 상태 유지"],
    ["hard_failures", "hard failure", report.summary.hardFailureCount, report.summary.hardFailureCount === 0 ? "pass" : "block", "404/410/5xx/timeout/품절 문구", "즉시 숨김 또는 상세 URL 교체"],
    ["quarantined_failures", "숨김 격리", report.summary.quarantinedFailureCount ?? 0, (report.summary.quarantinedFailureCount ?? 0) === 0 ? "pass" : "review", "이미 사용자 노출에서 제거된 실패", "복구 전 재검증"],
    ["exposed_hard_failures", "노출 hard failure", report.summary.exposedHardFailureCount, report.summary.exposedHardFailureCount === 0 ? "pass" : "block", "고객에게 보이는 강한 실패", "즉시 출시 차단"],
    ["unavailable_text", "품절/종료 문구", report.summary.unavailableTextCount, report.summary.unavailableTextCount === 0 ? "pass" : "block", "본문 품절/종료 감지", "노출 차단"],
    ["protected_or_rate_limited", "접근보호/429", report.summary.protectedOrRateLimitedCount, "review", "판매처 자동 차단", "official API/partner feed/manual device check"],
    ["transient_network", "일시 네트워크", report.summary.transientNetworkCount, report.summary.transientNetworkCount === 0 ? "pass" : "watch", "request_failed 등", "backoff retry"],
    [
      "fresh_manual_evidence",
      "신선한 수동 검수 증거",
      `${report.manualEvidenceSummary?.freshManualEvidenceCount ?? 0}/${report.manualEvidenceSummary?.reviewedQueueItems ?? 0}`,
      (report.manualEvidenceSummary?.staleManualEvidenceCount ?? 0) === 0 && (report.manualEvidenceSummary?.missingManualEvidenceCount ?? 0) === 0 ? "pass" : "block",
      `${report.manualEvidenceSummary?.maxAgeDays ?? 7}일 이내 수동 검수`,
      "stale/missing 항목은 재검수"
    ],
    ["stale_manual_evidence", "오래된 수동 검수", report.manualEvidenceSummary?.staleManualEvidenceCount ?? 0, (report.manualEvidenceSummary?.staleManualEvidenceCount ?? 0) === 0 ? "pass" : "block", "수동 검수 만료", "즉시 재검수"],
    ["missing_manual_evidence", "수동 검수 누락", report.manualEvidenceSummary?.missingManualEvidenceCount ?? 0, (report.manualEvidenceSummary?.missingManualEvidenceCount ?? 0) === 0 ? "pass" : "block", "checkedAt 없음", "즉시 재검수"],
    ["exposed_search_links", "검색 링크 노출", report.summary.exposedSearchLinks, report.summary.exposedSearchLinks === 0 ? "pass" : "block", "검색/목록 URL", "즉시 차단"],
    ["exposed_sold_out_links", "품절 노출", report.summary.exposedSoldOutLinks, report.summary.exposedSoldOutLinks === 0 ? "pass" : "block", "품절/종료 노출", "즉시 차단"],
    ["review_queue", "운영 큐", report.summary.reviewQueueCount, report.ok ? "pass" : "review", "처리할 live probe 큐", "우선순위 순 처리"]
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
    retryMode: "",
    liveStatus: "",
    liveReason: "",
    manualEvidenceStatus: "",
    manualEvidenceAgeDays: "",
    manualEvidenceFresh: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const queueRows = (report.reviewQueue.length
    ? report.reviewQueue
    : [
        {
          id: "none",
          title: "live probe 재검증 항목 없음",
          mallName: "",
          category: "",
          host: "",
          finalUrl: "",
          status: null,
          reason: "",
          severity: "watch",
          retryMode: "manual_device_check",
          recommendedAction: "현 상태 유지",
          manualEvidenceStatus: "fresh",
          manualEvidenceAgeDays: 0,
          manualEvidenceFresh: true,
          priority: 0
        }
      ]
  ).map((item) => ({
    section: "live_probe_queue",
    key: item.id,
    label: item.title,
    status: item.severity === "blocker" ? "block" : item.severity === "quarantine" ? "review" : item.severity,
    count: item.priority,
    reason: item.reason,
    action: item.recommendedAction,
    id: item.id,
    mallName: item.mallName,
    category: item.category,
    host: item.host,
    severity: item.severity,
    retryMode: item.retryMode,
    liveStatus: item.status ?? "",
    liveReason: item.reason,
    manualEvidenceStatus: item.manualEvidenceStatus ?? "",
    manualEvidenceAgeDays: item.manualEvidenceAgeDays ?? "",
    manualEvidenceFresh: item.manualEvidenceFresh === true ? "true" : item.manualEvidenceFresh === false ? "false" : "",
    finalUrl: item.finalUrl,
    generatedAt: report.generatedAt
  }));

  const hostRows = report.topHostActions.map((item) => ({
    section: "host_action",
    key: item.host,
    label: item.host,
    status: "review",
    count: item.count,
    reason: item.retryModes.join(" / "),
    action: item.recommendedAction,
    id: "",
    mallName: "",
    category: "",
    host: item.host,
    severity: "",
    retryMode: item.retryModes.join(" / "),
    liveStatus: "",
    liveReason: "",
    manualEvidenceStatus: "",
    manualEvidenceAgeDays: "",
    manualEvidenceFresh: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  return toCsv([...summaryRows, ...hostRows, ...queueRows]);
}
