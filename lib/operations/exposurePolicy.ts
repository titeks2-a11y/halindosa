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

export interface ExposurePolicyLiveProbeSummary {
  enabled: boolean;
  strict: boolean;
  bodyProbe: boolean;
  timeoutMs: number;
  checked: number;
  passed: number;
  failed: number;
  redirected: number;
  finalUrlChanged: number;
  http404: number;
  http410: number;
  http5xx: number;
  timeout: number;
  robotsBlocked: number;
  unavailableText: number;
  failures: Array<{
    id?: string;
    reason?: string;
    finalUrl?: string;
  }>;
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
  liveProbe: ExposurePolicyLiveProbeSummary;
  liveProbeFailureReasonCounts: Record<string, number>;
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
  liveProbe: {
    enabled: false,
    strict: false,
    bodyProbe: false,
    timeoutMs: 0,
    checked: 0,
    passed: 0,
    failed: 0,
    redirected: 0,
    finalUrlChanged: 0,
    http404: 0,
    http410: 0,
    http5xx: 0,
    timeout: 0,
    robotsBlocked: 0,
    unavailableText: 0,
    failures: []
  },
  liveProbeFailureReasonCounts: {},
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

  const liveProbeRows = [
    {
      key: "enabled",
      label: "라이브 HTTP 검증",
      count: report.liveProbe.enabled ? 1 : 0,
      status: report.liveProbe.enabled ? "live" : "static",
      reason: report.liveProbe.enabled ? "redirect/status/body probe enabled" : "정적 URL 정책 검증 모드",
      action: report.liveProbe.enabled ? "실패 항목 우선 보강" : "운영 전 npm run verify:links:live 실행"
    },
    {
      key: "checked",
      label: "실시간 검사 수",
      count: report.liveProbe.checked,
      status: report.liveProbe.failed > 0 ? "review" : "pass",
      reason: `pass ${report.liveProbe.passed} / fail ${report.liveProbe.failed}`,
      action: report.liveProbe.failed > 0 ? "liveProbe failures 확인" : "현 상태 유지"
    },
    {
      key: "redirected",
      label: "리다이렉트 감지",
      count: report.liveProbe.redirected,
      status: report.liveProbe.finalUrlChanged > 0 ? "review" : "pass",
      reason: `final URL changed ${report.liveProbe.finalUrlChanged}`,
      action: report.liveProbe.finalUrlChanged > 0 ? "최종 도착 URL을 finalUrl로 반영 검토" : "현 상태 유지"
    },
    {
      key: "http_failures",
      label: "HTTP 실패 신호",
      count: report.liveProbe.http404 + report.liveProbe.http410 + report.liveProbe.http5xx + report.liveProbe.timeout + report.liveProbe.robotsBlocked,
      status: report.liveProbe.http404 + report.liveProbe.http410 + report.liveProbe.http5xx + report.liveProbe.timeout + report.liveProbe.robotsBlocked > 0 ? "review" : "pass",
      reason: `404 ${report.liveProbe.http404}, 410 ${report.liveProbe.http410}, 5xx ${report.liveProbe.http5xx}, timeout ${report.liveProbe.timeout}, robots ${report.liveProbe.robotsBlocked}`,
      action: "실패 URL은 숨김 또는 판매처 상세 URL 보강"
    },
    {
      key: "unavailable_text",
      label: "품절/종료 문구",
      count: report.liveProbe.unavailableText,
      status: report.liveProbe.unavailableText > 0 ? "block" : "pass",
      reason: "본문 품절, 판매종료, 이벤트종료 문구 감지",
      action: report.liveProbe.unavailableText > 0 ? "availability=sold_out 처리" : "현 상태 유지"
    }
  ].map((item) => ({
    section: "live_probe",
    key: item.key,
    label: item.label,
    status: item.status,
    count: item.count,
    reason: item.reason,
    action: item.action,
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    generatedAt: report.generatedAt,
    liveProbeEnabled: report.liveProbe.enabled,
    liveProbeStrict: report.liveProbe.strict,
    liveProbeBodyProbe: report.liveProbe.bodyProbe,
    liveProbeTimeoutMs: report.liveProbe.timeoutMs
  }));

  const liveProbeReasonEntries: Array<[string, number]> = Object.keys(report.liveProbeFailureReasonCounts).length
    ? Object.entries(report.liveProbeFailureReasonCounts)
    : [["none", 0]];

  const liveProbeReasonRows = liveProbeReasonEntries.map(([reason, count]) => ({
    section: "live_probe_reason",
    key: reason,
    label: reason === "none" ? "실패 사유 없음" : reason,
    status: reason === "none" ? "pass" : reason.includes("robots") || reason.includes("429") ? "access_limited" : "review",
    count,
    reason: reason === "none" ? "" : "라이브 HTTP 검증 실패 사유 분포",
    action: reason === "none" ? "현 상태 유지" : reason.includes("robots") || reason.includes("429") ? "공식 API/제휴 피드 또는 브라우저 수동 확인으로 보완" : "URL 보강 또는 숨김 후보 검토",
    linkType: "",
    availability: "",
    validationStatus: "",
    finalUrl: "",
    generatedAt: report.generatedAt,
    liveProbeEnabled: report.liveProbe.enabled
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

  return toCsv([...summaryRows, ...countRows, ...issueRows, ...badRows, ...hiddenRows, ...liveProbeRows, ...liveProbeReasonRows, ...auditedRows]);
}
