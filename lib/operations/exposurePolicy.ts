import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
