import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface LinkValidationRevalidationItem {
  id: string;
  title: string;
  mallName: string;
  host: string;
  finalUrl: string;
  priority: number;
  reason: string;
  evidenceTier: string;
}

export interface LinkValidationReport {
  generatedAt: string;
  totalDeals: number;
  publishableDeals: number;
  exposedSearchLinks: number;
  exposedSoldOutLinks: number;
  exposedBrokenLinks: number;
  exposedInvalidUrls: number;
  liveProbe: {
    checked: number;
    passed: number;
    failed: number;
    robotsBlocked: number;
    timeout: number;
  };
  contentSignalSummary: {
    bodyChecked: number;
    contentMatched: number;
    accessibleContentMismatch: number;
    accessGuardBody: number;
    priceSignal: number;
    purchaseActionSignal: number;
  };
  verificationEvidenceSummary: {
    counts: Record<string, number>;
    liveConfirmed: number;
    sellerAccessProtected: number;
    transientNetwork: number;
    manualPatternVerified: number;
    blocked: number;
  };
  revalidationQueue: LinkValidationRevalidationItem[];
}

const fallbackReport: LinkValidationReport = {
  generatedAt: "",
  totalDeals: 0,
  publishableDeals: 0,
  exposedSearchLinks: 0,
  exposedSoldOutLinks: 0,
  exposedBrokenLinks: 0,
  exposedInvalidUrls: 0,
  liveProbe: {
    checked: 0,
    passed: 0,
    failed: 0,
    robotsBlocked: 0,
    timeout: 0
  },
  contentSignalSummary: {
    bodyChecked: 0,
    contentMatched: 0,
    accessibleContentMismatch: 0,
    accessGuardBody: 0,
    priceSignal: 0,
    purchaseActionSignal: 0
  },
  verificationEvidenceSummary: {
    counts: {},
    liveConfirmed: 0,
    sellerAccessProtected: 0,
    transientNetwork: 0,
    manualPatternVerified: 0,
    blocked: 0
  },
  revalidationQueue: []
};

function readFirstExistingReport() {
  const candidatePaths = [join(process.cwd(), "reports", "link-validation.json"), join(process.cwd(), "LINK_VERIFICATION_RESULT.json")];
  const reportPath = candidatePaths.find((path) => existsSync(path));

  if (!reportPath) return null;

  try {
    return JSON.parse(readFileSync(reportPath, "utf8")) as Partial<LinkValidationReport>;
  } catch {
    return null;
  }
}

export function getLinkValidationReport(): LinkValidationReport {
  const report = readFirstExistingReport();
  if (!report) return fallbackReport;

  return {
    ...fallbackReport,
    ...report,
    liveProbe: {
      ...fallbackReport.liveProbe,
      ...(report.liveProbe && typeof report.liveProbe === "object" ? report.liveProbe : {})
    },
    contentSignalSummary: {
      ...fallbackReport.contentSignalSummary,
      ...(report.contentSignalSummary && typeof report.contentSignalSummary === "object" ? report.contentSignalSummary : {})
    },
    verificationEvidenceSummary: {
      ...fallbackReport.verificationEvidenceSummary,
      ...(report.verificationEvidenceSummary && typeof report.verificationEvidenceSummary === "object" ? report.verificationEvidenceSummary : {}),
      counts:
        report.verificationEvidenceSummary?.counts && typeof report.verificationEvidenceSummary.counts === "object"
          ? report.verificationEvidenceSummary.counts
          : {}
    },
    revalidationQueue: Array.isArray(report.revalidationQueue) ? report.revalidationQueue : []
  };
}
