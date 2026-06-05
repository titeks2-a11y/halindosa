import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toCsv } from "@/lib/csv";

export interface LinkLaunchGateReport {
  ok: boolean;
  generatedAt: string;
  criteria: Record<string, number | boolean>;
  actual: {
    reportsPresent: boolean;
    auditedItems: number;
    exposedItems: number;
    hiddenItems: number;
    failedExposureItems: number;
    exposedSearchLinks: number;
    exposedSoldOutLinks: number;
    exposedBrokenLinks: number;
    exposedInvalidUrls: number;
    failedProducts: number;
    searchLinks: number;
    soldOutProducts: number;
    hiddenProducts: number;
    visibleProducts: number;
    verifiedPurchaseLinks: number;
    refreshOk: boolean;
    refreshVisibleCount: number;
    refreshFailedCount: number;
    liveHardFailures: number;
    sellerUnavailableSignals: number;
    releaseDoctorFailures: number;
  };
  policy: {
    version: number | null;
    exposurePolicy: {
      availability: string;
      validationStatus: string;
      isHidden: boolean;
      blockedLinkTypes: string[];
      finalUrlRequired: boolean;
    } | null;
    launchGate: Record<string, number> | null;
  };
  sourceReports: Record<string, string | null>;
  linkTypeCounts: Record<string, number>;
  availabilityCounts: Record<string, number>;
  validationStatusCounts: Record<string, number>;
  liveProbeReviewSummary: {
    status?: string;
    hardFailureCount?: number;
    exposedHardFailureCount?: number;
    exposedSellerUnavailableSignals?: number;
    transientNetworkCount?: number;
    accessProtectedCount?: number;
    sellerUnavailableSignals?: number;
    interpretation?: string;
  };
  failedExposureItems: Array<{
    id: string;
    title: string;
    mallName: string;
    linkType: string;
    availability: string;
    validationStatus: string;
    finalUrl: string;
    issues: string[];
  }>;
  hiddenItems: Array<{
    id: string;
    title: string;
    mallName: string;
    availability: string;
    validationStatus: string;
    validationReason: string;
  }>;
  issues: string[];
}

const fallbackReport: LinkLaunchGateReport = {
  ok: false,
  generatedAt: "",
  criteria: {
    reportsPresent: true,
    minimumAuditedItems: 140,
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    exposedBrokenLinks: 0,
    exposedInvalidUrls: 0,
    failedProductsAllowedWhenHidden: true,
    hiddenProductsAllowed: true,
    liveHardFailures: 0,
    sellerUnavailableSignals: 0,
    releaseDoctorFailures: 0
  },
  actual: {
    reportsPresent: false,
    auditedItems: 0,
    exposedItems: 0,
    hiddenItems: 0,
    failedExposureItems: 0,
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    exposedBrokenLinks: 0,
    exposedInvalidUrls: 0,
    failedProducts: 0,
    searchLinks: 0,
    soldOutProducts: 0,
    hiddenProducts: 0,
    visibleProducts: 0,
    verifiedPurchaseLinks: 0,
    refreshOk: false,
    refreshVisibleCount: 0,
    refreshFailedCount: 0,
    liveHardFailures: 0,
    sellerUnavailableSignals: 0,
    releaseDoctorFailures: 0
  },
  policy: {
    version: null,
    exposurePolicy: null,
    launchGate: null
  },
  sourceReports: {},
  linkTypeCounts: {},
  availabilityCounts: {},
  validationStatusCounts: {},
  liveProbeReviewSummary: {
    status: "missing_report",
    hardFailureCount: 0,
    exposedHardFailureCount: 0,
    exposedSellerUnavailableSignals: 0,
    sellerUnavailableSignals: 0,
    interpretation: "Run npm run link:launch:gate to generate the final launch link gate report."
  },
  failedExposureItems: [],
  hiddenItems: [],
  issues: ["reports/link-launch-gate.json is missing. Run npm run link:launch:gate."]
};

export function getLinkLaunchGateReport(): LinkLaunchGateReport {
  const path = join(process.cwd(), "reports", "link-launch-gate.json");
  if (!existsSync(path)) return fallbackReport;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as LinkLaunchGateReport;
  } catch {
    return {
      ...fallbackReport,
      issues: ["reports/link-launch-gate.json could not be parsed. Run npm run link:launch:gate."]
    };
  }
}

export function buildLinkLaunchGateCsv(report: LinkLaunchGateReport) {
  const summaryRows = [
    ["audited_items", "감사 상품", report.actual.auditedItems, report.actual.auditedItems >= Number(report.criteria.minimumAuditedItems ?? 140) ? "pass" : "block", "최종 출시 게이트 감사 대상", "npm run link:launch:gate"],
    ["exposed_items", "노출 상품", report.actual.exposedItems, report.ok ? "pass" : "review", "사용자에게 실제 노출되는 상품", "노출 정책 확인"],
    ["verified_purchase_links", "검증 구매 링크", report.actual.verifiedPurchaseLinks, report.actual.verifiedPurchaseLinks >= report.actual.exposedItems ? "pass" : "review", "구매 가능 링크 확인 수", "상품 상세 URL 보강"],
    ["exposed_search_links", "검색 링크 노출", report.actual.exposedSearchLinks, report.actual.exposedSearchLinks === 0 ? "pass" : "block", "검색 결과/대표몰 링크 노출", "즉시 숨김 또는 상세 URL 교체"],
    ["exposed_sold_out_links", "품절/종료 노출", report.actual.exposedSoldOutLinks, report.actual.exposedSoldOutLinks === 0 ? "pass" : "block", "품절/판매종료/이벤트종료 노출", "availability=sold_out 처리"],
    ["exposed_broken_links", "깨진 링크 노출", report.actual.exposedBrokenLinks, report.actual.exposedBrokenLinks === 0 ? "pass" : "block", "검증 실패 링크 노출", "링크 재검증"],
    ["exposed_invalid_urls", "잘못된 URL 노출", report.actual.exposedInvalidUrls, report.actual.exposedInvalidUrls === 0 ? "pass" : "block", "http/https가 아닌 finalUrl", "URL 정규화"],
    ["failed_exposure_items", "실패 노출 행", report.actual.failedExposureItems, report.actual.failedExposureItems === 0 ? "pass" : "block", "최종 노출 조건 위반 행", "CSV로 행별 조치"],
    ["hidden_products", "숨김 상품", report.actual.hiddenProducts, report.actual.hiddenProducts === 0 ? "pass" : "review", "숨김 처리된 상품", "복구 전 재검증"],
    ["live_hard_failures", "노출 라이브 강한 실패", report.actual.liveHardFailures, report.actual.liveHardFailures === 0 ? "pass" : "block", "고객 노출 404/410/5xx/품절 본문", "판매처 상세 URL 교체"],
    ["seller_unavailable_signals", "품절 본문 신호", report.actual.sellerUnavailableSignals, report.actual.sellerUnavailableSignals === 0 ? "pass" : "block", "판매처 품절/종료 문구", "노출 차단"]
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
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    issues: "",
    generatedAt: report.generatedAt
  }));

  const policyRows = [
    {
      section: "policy",
      key: "exposure_policy",
      label: "노출 정책",
      status: report.policy.exposurePolicy ? "pass" : "review",
      count: 1,
      reason: report.policy.exposurePolicy
        ? `availability=${report.policy.exposurePolicy.availability}; validation=${report.policy.exposurePolicy.validationStatus}; finalUrlRequired=${report.policy.exposurePolicy.finalUrlRequired}`
        : "정책 없음",
      action: "availability=active, validationStatus=passed, non-search finalUrl 유지",
      id: "",
      mallName: "",
      linkType: "",
      availability: report.policy.exposurePolicy?.availability ?? "",
      validationStatus: report.policy.exposurePolicy?.validationStatus ?? "",
      finalUrl: "",
      issues: "",
      generatedAt: report.generatedAt
    },
    {
      section: "policy",
      key: "live_probe_review",
      label: "라이브 검증 해석",
      status: Number(report.liveProbeReviewSummary.exposedHardFailureCount ?? report.liveProbeReviewSummary.hardFailureCount ?? 0) === 0 ? "pass" : "block",
      count: Number(report.liveProbeReviewSummary.exposedHardFailureCount ?? report.liveProbeReviewSummary.hardFailureCount ?? 0),
      reason: report.liveProbeReviewSummary.interpretation ?? "",
      action: "hard failure는 즉시 숨김, access protected는 공식 API/제휴 feed 또는 실기기 확인",
      id: "",
      mallName: "",
      linkType: "",
      availability: "",
      validationStatus: "",
      finalUrl: "",
      issues: "",
      generatedAt: report.generatedAt
    }
  ];

  const failedRows = (report.failedExposureItems.length
    ? report.failedExposureItems
    : [{ id: "none", title: "실패 노출 없음", mallName: "", linkType: "", availability: "", validationStatus: "", finalUrl: "", issues: [] }]
  ).map((item) => ({
    section: "failed_exposure_item",
    key: item.id,
    label: item.title,
    status: item.id === "none" ? "pass" : "block",
    count: item.id === "none" ? 0 : 1,
    reason: item.issues.join("; "),
    action: item.id === "none" ? "현 상태 유지" : "즉시 숨김 후 실제 상품 상세 URL로 교체",
    id: item.id,
    mallName: item.mallName,
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: item.finalUrl,
    issues: item.issues.join("; "),
    generatedAt: report.generatedAt
  }));

  const issueRows = (report.issues.length ? report.issues : ["none"]).map((issue) => ({
    section: "issue",
    key: issue === "none" ? "none" : "link_launch_gate_issue",
    label: issue === "none" ? "이슈 없음" : "이슈",
    status: issue === "none" ? "pass" : "block",
    count: issue === "none" ? 0 : 1,
    reason: issue === "none" ? "" : issue,
    action: issue === "none" ? "현 상태 유지" : "npm run link:launch:gate와 release:doctor 재실행",
    id: "",
    mallName: "",
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    issues: issue,
    generatedAt: report.generatedAt
  }));

  return toCsv([...summaryRows, ...policyRows, ...failedRows, ...issueRows]);
}
