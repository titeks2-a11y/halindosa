import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { toCsv } from "@/lib/csv";

export interface ExposurePolicySummary {
  auditedItems: number;
  exposedItems: number;
  hiddenItems: number;
  badExposedItems: number;
  searchLinksExposed: number;
  soldOutExposed: number;
  failedExposed: number;
  averagePriorityScore: number;
}

export interface ExposurePolicyReport {
  ok: boolean;
  generatedAt: string;
  summary: ExposurePolicySummary;
  linkTypeCounts: Record<string, number>;
  availabilityCounts: Record<string, number>;
  validationStatusCounts: Record<string, number>;
  exposurePolicy: {
    availability: string;
    validationStatus: string;
    isHidden: boolean;
    blockedLinkTypes: string[];
    finalUrlRequired: boolean;
  } | null;
  auditedItems: Array<{
    id: string;
    source: string;
    originalUrl: string;
    finalUrl: string;
    linkType: string;
    availability: string;
    validationStatus: string;
    validationReason: string;
    lastCheckedAt: string;
    priorityScore: number;
    isHidden: boolean;
    host: string;
    evidence: string;
    httpUrl: boolean;
    searchLikeUrl: boolean;
    productDetailUrl: boolean;
    officialBenefitUrl: boolean;
    unavailableText: boolean;
    liveProbeOk: boolean | null;
    liveProbeReason: string;
  }>;
  badExposedItems: Array<{
    id: string;
    linkType: string;
    availability: string;
    validationStatus: string;
    finalUrl: string;
    validationReason: string;
  }>;
  hiddenItems: Array<{
    id: string;
    linkType: string;
    availability: string;
    validationStatus: string;
    validationReason: string;
  }>;
  sourceReports: {
    linkValidationGeneratedAt: string | null;
    productQualityGeneratedAt: string | null;
    refreshAllGeneratedAt: string | null;
  };
  issues: string[];
}

const fallbackReport: ExposurePolicyReport = {
  ok: false,
  generatedAt: "",
  summary: {
    auditedItems: 0,
    exposedItems: 0,
    hiddenItems: 0,
    badExposedItems: 0,
    searchLinksExposed: 0,
    soldOutExposed: 0,
    failedExposed: 0,
    averagePriorityScore: 0
  },
  linkTypeCounts: {},
  availabilityCounts: {},
  validationStatusCounts: {},
  exposurePolicy: null,
  auditedItems: [],
  badExposedItems: [],
  hiddenItems: [],
  sourceReports: {
    linkValidationGeneratedAt: null,
    productQualityGeneratedAt: null,
    refreshAllGeneratedAt: null
  },
  issues: ["reports/exposure-policy.json is missing. Run npm run exposure:doctor."]
};

export function getExposurePolicyReport(): ExposurePolicyReport {
  const path = join(process.cwd(), "reports", "exposure-policy.json");
  if (!existsSync(path)) return fallbackReport;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as ExposurePolicyReport;
  } catch {
    return {
      ...fallbackReport,
      issues: ["reports/exposure-policy.json could not be parsed. Run npm run exposure:doctor."]
    };
  }
}

export function buildExposurePolicyCsv(report: ExposurePolicyReport) {
  const summaryRows = [
    ["audited_items", "감사 상품", report.summary.auditedItems, report.ok ? "pass" : "review", "전체 노출 후보", "reports/exposure-policy.json 확인"],
    ["exposed_items", "노출 가능", report.summary.exposedItems, "pass", "사용자 노출 정책 통과", "노출 조건 유지"],
    ["bad_exposed_items", "문제 노출", report.summary.badExposedItems, report.summary.badExposedItems > 0 ? "block" : "pass", "검색/품절/실패 링크 노출 수", "0건 유지"],
    ["search_links_exposed", "검색 링크 노출", report.summary.searchLinksExposed, report.summary.searchLinksExposed > 0 ? "block" : "pass", "검색 결과 URL 노출 수", "검색 링크 숨김 처리"],
    ["sold_out_exposed", "품절 링크 노출", report.summary.soldOutExposed, report.summary.soldOutExposed > 0 ? "block" : "pass", "품절/종료 URL 노출 수", "품절 상품 숨김 처리"],
    ["failed_exposed", "검증 실패 노출", report.summary.failedExposed, report.summary.failedExposed > 0 ? "block" : "pass", "검증 실패 URL 노출 수", "finalUrl 보강 또는 숨김"],
    ["average_priority_score", "평균 우선순위", report.summary.averagePriorityScore, report.summary.averagePriorityScore >= 80 ? "pass" : "review", "우선순위 품질 점수", "저점 상품 보강"]
  ].map(([key, label, count, status, reason, action]) => ({
    section: "summary",
    key,
    label,
    status,
    count,
    reason,
    action,
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const countRows = [
    ...Object.entries(report.linkTypeCounts).map(([key, count]) => ({
      section: "link_type",
      key,
      label: key,
      status: ["search", "seller_search", "unavailable"].includes(key) ? "block" : "pass",
      count,
      reason: "linkType 분포",
      action: ["search", "seller_search", "unavailable"].includes(key) ? "노출 차단 확인" : "정책 통과 유지",
      linkType: key,
      availability: "",
      validationStatus: "",
      finalUrl: "",
      generatedAt: report.generatedAt
    })),
    ...Object.entries(report.availabilityCounts).map(([key, count]) => ({
      section: "availability",
      key,
      label: key,
      status: key === "active" ? "pass" : "block",
      count,
      reason: "availability 분포",
      action: key === "active" ? "판매 가능 상태 유지" : "노출 차단 확인",
      linkType: "",
      availability: key,
      validationStatus: "",
      finalUrl: "",
      generatedAt: report.generatedAt
    })),
    ...Object.entries(report.validationStatusCounts).map(([key, count]) => ({
      section: "validation_status",
      key,
      label: key,
      status: key === "passed" ? "pass" : "block",
      count,
      reason: "validationStatus 분포",
      action: key === "passed" ? "검증 통과 유지" : "URL 재검증 또는 숨김",
      linkType: "",
      availability: "",
      validationStatus: key,
      finalUrl: "",
      generatedAt: report.generatedAt
    }))
  ];

  const issueRows = (report.issues.length ? report.issues : ["none"]).map((issue) => ({
    section: "issue",
    key: issue === "none" ? "none" : "exposure_policy_issue",
    label: issue === "none" ? "이슈 없음" : "이슈",
    status: issue === "none" ? "pass" : "review",
    count: issue === "none" ? 0 : 1,
    reason: issue === "none" ? "" : issue,
    action: issue === "none" ? "현재 조치 없음" : "release:doctor와 exposure:doctor 재실행",
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const badRows = (report.badExposedItems.length ? report.badExposedItems : [{ id: "none", linkType: "", availability: "", validationStatus: "", finalUrl: "", validationReason: "" }]).map((item) => ({
    section: "bad_exposed_item",
    key: item.id,
    label: item.id === "none" ? "문제 노출 없음" : item.id,
    status: item.id === "none" ? "pass" : "block",
    count: item.id === "none" ? 0 : 1,
    reason: item.validationReason,
    action: item.id === "none" ? "문제 노출 0건 유지" : "즉시 숨김 처리 후 링크 보강",
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: item.finalUrl,
    generatedAt: report.generatedAt
  }));

  const hiddenRows = (report.hiddenItems.length ? report.hiddenItems : [{ id: "none", linkType: "", availability: "", validationStatus: "", validationReason: "" }]).map((item) => ({
    section: "hidden_item",
    key: item.id,
    label: item.id === "none" ? "숨김 후보 없음" : item.id,
    status: item.id === "none" ? "pass" : "hidden",
    count: item.id === "none" ? 0 : 1,
    reason: item.validationReason,
    action: item.id === "none" ? "숨김 후보 0건 유지" : "복구 전 판매 가능/공식 링크 재검증",
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: "",
    generatedAt: report.generatedAt
  }));

  const auditedRows = (report.auditedItems.length ? report.auditedItems : [{
    id: "none",
    source: "",
    originalUrl: "",
    finalUrl: "",
    linkType: "",
    availability: "",
    validationStatus: "",
    validationReason: "",
    lastCheckedAt: "",
    priorityScore: 0,
    isHidden: false,
    host: "",
    evidence: "",
    httpUrl: false,
    searchLikeUrl: false,
    productDetailUrl: false,
    officialBenefitUrl: false,
    unavailableText: false,
    liveProbeOk: null,
    liveProbeReason: ""
  }]).map((item) => ({
    section: "audited_item",
    key: item.id,
    label: item.host || item.id,
    status: item.isHidden || item.validationStatus !== "passed" || item.availability !== "active" || item.searchLikeUrl ? "review" : "pass",
    count: 1,
    reason: item.validationReason,
    action: item.isHidden || item.validationStatus !== "passed" || item.availability !== "active" || item.searchLikeUrl ? "노출 전 URL 보강 또는 숨김 유지" : "노출 가능 상태 유지",
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: item.finalUrl,
    generatedAt: report.generatedAt,
    source: item.source,
    originalUrl: item.originalUrl,
    lastCheckedAt: item.lastCheckedAt,
    priorityScore: item.priorityScore,
    isHidden: item.isHidden,
    host: item.host,
    evidence: item.evidence,
    httpUrl: item.httpUrl,
    searchLikeUrl: item.searchLikeUrl,
    productDetailUrl: item.productDetailUrl,
    officialBenefitUrl: item.officialBenefitUrl,
    unavailableText: item.unavailableText,
    liveProbeOk: item.liveProbeOk,
    liveProbeReason: item.liveProbeReason
  }));

  return toCsv([...summaryRows, ...countRows, ...issueRows, ...badRows, ...hiddenRows, ...auditedRows]);
}
