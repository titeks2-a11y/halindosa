import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toCsv } from "@/lib/csv";

export interface NewsRevalidationPriorityQueueItem {
  id: string;
  title: string;
  merchant: string;
  category: string;
  benefitType: string;
  sourceName: string;
  provider: string;
  host: string;
  finalUrl: string;
  linkType: string;
  availability: string;
  validationStatus: string;
  publishable: boolean;
  isHidden: boolean;
  validationCode: string;
  validationReason: string;
  endDate: string;
  daysLeft: number;
  lastCheckedAt: string;
  severity: "block" | "review" | "watch" | "routine";
  reason: string;
  action: string;
  priority: number;
}

export interface NewsRevalidationPriorityReport {
  ok: boolean;
  generatedAt: string;
  sourceReports: {
    newsDeals: string | null;
    newsFreshness: string | null;
    officialBenefitAlerts: string | null;
  };
  summary: {
    totalItems: number;
    visibleItems: number;
    activeOfficialBenefits: number;
    hiddenItems: number;
    expiredItems: number;
    failedItems: number;
    officialMissingItems: number;
    exposedSearchLinks: number;
    exposedNonOfficialLinks: number;
    nonPublishableVisibleItems: number;
    renewalItems: number;
    watchItems: number;
    manualRevalidationItems: number;
    blockingItems: number;
    reviewItems: number;
    queueWatchItems: number;
    queueItems: number;
  };
  counts: {
    block: number;
    review: number;
    watch: number;
    routine: number;
    byReason: Record<string, number>;
    byHost: Record<string, number>;
  };
  freshness: {
    status: string;
    reportAgeHours: number | null;
    nextRefreshDueAt: string;
    staleAfterAt: string;
    expiringWithin14DaysCount: number;
    expiringWithin30DaysCount: number;
  };
  topQueue: NewsRevalidationPriorityQueueItem[];
}

const fallbackReport: NewsRevalidationPriorityReport = {
  ok: false,
  generatedAt: "",
  sourceReports: {
    newsDeals: null,
    newsFreshness: null,
    officialBenefitAlerts: null
  },
  summary: {
    totalItems: 0,
    visibleItems: 0,
    activeOfficialBenefits: 0,
    hiddenItems: 0,
    expiredItems: 0,
    failedItems: 0,
    officialMissingItems: 0,
    exposedSearchLinks: 0,
    exposedNonOfficialLinks: 0,
    nonPublishableVisibleItems: 0,
    renewalItems: 0,
    watchItems: 0,
    manualRevalidationItems: 0,
    blockingItems: 0,
    reviewItems: 0,
    queueWatchItems: 0,
    queueItems: 0
  },
  counts: {
    block: 0,
    review: 0,
    watch: 0,
    routine: 0,
    byReason: {},
    byHost: {}
  },
  freshness: {
    status: "missing_report",
    reportAgeHours: null,
    nextRefreshDueAt: "",
    staleAfterAt: "",
    expiringWithin14DaysCount: 0,
    expiringWithin30DaysCount: 0
  },
  topQueue: []
};

export function getNewsRevalidationPriorityReport(): NewsRevalidationPriorityReport {
  const path = join(process.cwd(), "reports", "news-revalidation-priority.json");
  if (!existsSync(path)) return fallbackReport;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as NewsRevalidationPriorityReport;
  } catch {
    return {
      ...fallbackReport,
      freshness: {
        ...fallbackReport.freshness,
        status: "parse_error"
      }
    };
  }
}

export function buildNewsRevalidationPriorityCsv(report: NewsRevalidationPriorityReport) {
  const summaryRows = [
    ["total_items", "전체 공식 혜택", report.summary.totalItems, report.summary.totalItems >= 40 ? "pass" : "review", "검증 대상 공식 혜택", "refresh:news 재실행"],
    ["visible_items", "노출 공식 혜택", report.summary.visibleItems, report.summary.visibleItems >= 40 ? "pass" : "review", "사용자 공개 후보", "카테고리 커버리지 확인"],
    ["active_official_benefits", "활성 공식 혜택", report.summary.activeOfficialBenefits, report.summary.activeOfficialBenefits >= 40 ? "pass" : "review", "알림/추천 후보", "official:alerts:report 재실행"],
    ["hidden_items", "숨김 혜택", report.summary.hiddenItems, report.summary.hiddenItems === 0 ? "pass" : "review", "숨김/수동 차단 항목", "복구 전 재검증"],
    ["expired_items", "종료 혜택", report.summary.expiredItems, report.summary.expiredItems === 0 ? "pass" : "block", "종료 이벤트 노출", "대체 공식 혜택 준비"],
    ["failed_items", "검증 실패", report.summary.failedItems, report.summary.failedItems === 0 ? "pass" : "block", "검증 실패 공식 혜택", "finalUrl/조건 수정"],
    ["official_missing_items", "공식 URL 누락", report.summary.officialMissingItems, report.summary.officialMissingItems === 0 ? "pass" : "block", "공식 finalUrl 누락", "사용자 노출 금지"],
    ["exposed_search_links", "검색 링크 노출", report.summary.exposedSearchLinks, report.summary.exposedSearchLinks === 0 ? "pass" : "block", "검색/결과 링크 노출", "즉시 차단"],
    ["exposed_non_official_links", "비공식 링크 노출", report.summary.exposedNonOfficialLinks, report.summary.exposedNonOfficialLinks === 0 ? "pass" : "block", "뉴스/커뮤니티/비공식 링크", "공식 링크 교체"],
    ["blocking_items", "차단 재검증", report.summary.blockingItems, report.summary.blockingItems === 0 ? "pass" : "block", "출시 차단 공식 혜택", "노출 전 처리"],
    ["renewal_items", "14일 내 종료", report.summary.renewalItems, report.summary.renewalItems === 0 ? "pass" : "review", "대체 준비 혜택", "공식 대체 링크 준비"],
    ["watch_items", "30일 내 관찰", report.summary.watchItems, report.summary.watchItems === 0 ? "pass" : "watch", "종료일 관찰 혜택", "다음 refresh 우선"],
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
    sourceName: "",
    provider: "",
    category: "",
    host: "",
    severity: "",
    liveReason: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const queueRows = (report.topQueue.length
    ? report.topQueue
    : [
        {
          id: "none",
          title: "우선 재검증 항목 없음",
          sourceName: "",
          provider: "",
          category: "",
          host: "",
          finalUrl: "",
          reason: "",
          validationReason: "",
          priority: 0,
          severity: "routine" as const,
          action: "현 상태 유지"
        }
      ]
  ).map((item) => ({
    section: "official_benefit_revalidation_queue",
    key: item.id,
    label: item.title,
    status: item.severity === "block" ? "block" : item.severity === "review" ? "review" : item.severity === "watch" ? "watch" : "pass",
    count: item.priority,
    reason: item.reason,
    action: item.action,
    id: item.id,
    sourceName: item.sourceName,
    provider: item.provider,
    category: item.category,
    host: item.host,
    severity: item.severity,
    liveReason: item.validationReason,
    finalUrl: item.finalUrl,
    generatedAt: report.generatedAt
  }));

  const reasonRows = Object.entries(report.counts.byReason).map(([reason, count]) => ({
    section: "reason_count",
    key: reason,
    label: reason,
    status: reason.includes("expires") ? "watch" : reason.includes("manual") ? "review" : "pass",
    count,
    reason,
    action: "공식 혜택 운영 큐에서 처리",
    id: "",
    sourceName: "",
    provider: "",
    category: "",
    host: "",
    severity: "",
    liveReason: reason,
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  return toCsv([...summaryRows, ...queueRows, ...reasonRows]);
}
