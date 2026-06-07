import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function readJson(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeReason(value) {
  return String(value || "unknown").trim() || "unknown";
}

const manualEvidenceMaxAgeDays = Number(process.env.DEAL_MANUAL_EVIDENCE_MAX_AGE_DAYS ?? 7);
const dayMs = 24 * 60 * 60 * 1000;

function getEvidenceAgeDays(value, now = Date.now()) {
  const timestamp = Date.parse(String(value || ""));
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.round(((now - timestamp) / dayMs) * 10) / 10);
}

function getManualEvidenceStatus(value) {
  const ageDays = getEvidenceAgeDays(value);
  if (ageDays === null) return { status: "missing", ageDays: null, fresh: false };
  if (ageDays > manualEvidenceMaxAgeDays) return { status: "stale", ageDays, fresh: false };
  return { status: "fresh", ageDays, fresh: true };
}

function hasValidationEvidence(item) {
  const tier = String(item?.verificationEvidenceTier || "");
  return (
    item?.publishable === true &&
    item?.validationStatus === "passed" &&
    /manual_verified|live_content_confirmed|seller_access_protected/.test(tier)
  );
}

function getEffectiveManualEvidenceStatus(item) {
  const evidenceStatus = getManualEvidenceStatus(item?.lastCheckedAt);
  if (evidenceStatus.fresh || !hasValidationEvidence(item)) return evidenceStatus;
  return {
    status: "fresh",
    ageDays: evidenceStatus.ageDays,
    fresh: true,
    source: "current_validation_report"
  };
}

function classifyLiveFailure(failure, item) {
  const status = Number(failure?.status || item?.liveProbe?.status || 0);
  const reason = normalizeReason(failure?.reason || item?.liveProbe?.reason || item?.validationReason);
  const unavailablePattern = String(failure?.unavailablePattern || item?.liveProbe?.unavailablePattern || "");
  const isAlreadyQuarantined = item?.isHidden === true || item?.publishable !== true;
  const evidenceStatus = getEffectiveManualEvidenceStatus(item);
  const hasFreshManualEvidence = evidenceStatus.fresh && /manual_verified|live_content_confirmed/.test(String(item?.verificationEvidenceTier || ""));
  const isTransientServerOrNetworkWithEvidence =
    hasFreshManualEvidence &&
    (status === 0 || status >= 500 || reason === "request_failed" || reason === "timeout" || reason === "fetch_error");
  const isTransientTimeoutWithEvidence = reason === "timeout" && status === 0 && hasFreshManualEvidence;
  const isHardFailure =
    status === 404 ||
    status === 410 ||
    (status >= 500 && !isTransientServerOrNetworkWithEvidence) ||
    (reason === "timeout" && !isTransientTimeoutWithEvidence) ||
    reason.includes("sold_out") ||
    reason.includes("unavailable") ||
    Boolean(unavailablePattern);

  if (isTransientServerOrNetworkWithEvidence) {
    return {
      severity: "watch",
      retryMode: status >= 500 ? "backoff_retry" : "network_retry",
      recommendedAction:
        status >= 500
          ? "일시 서버 오류입니다. fresh manual evidence를 유지하고 backoff retry 후 official API 또는 partner feed로 대조"
          : "일시 네트워크 실패입니다. fresh manual evidence를 유지하되 다음 refresh:deals에서 우선 재시도"
    };
  }

  if (isTransientTimeoutWithEvidence) {
    return {
      severity: "watch",
      retryMode: "network_retry",
      recommendedAction: "일시 timeout입니다. fresh manual evidence를 유지하되 다음 refresh:deals에서 우선 재시도"
    };
  }

  if (isHardFailure && isAlreadyQuarantined) {
    return {
      severity: "quarantine",
      retryMode: "remove_or_replace",
      recommendedAction: "사용자 노출 차단 상태를 유지하고 실제 구매 상세 URL 또는 공식 신청 상세 URL로 교체"
    };
  }

  if (isHardFailure) {
    return {
      severity: "blocker",
      retryMode: "remove_or_replace",
      recommendedAction: "노출을 즉시 중단하고 실제 구매 상세 URL 또는 공식 신청 상세 URL로 교체"
    };
  }

  if (reason === "http_429") {
    return {
      severity: "review",
      retryMode: "backoff_retry",
      recommendedAction: "backoff retry 후에도 막히면 official API, partner feed, manual device check 순서로 재확인"
    };
  }

  if (reason === "robots_or_access_blocked") {
    return {
      severity: "review",
      retryMode: "official_api_or_partner_feed",
      recommendedAction: "official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행"
    };
  }

  if (reason === "request_failed") {
    return {
      severity: "watch",
      retryMode: "network_retry",
      recommendedAction: "다음 refresh:deals에서 우선 재시도하고 반복 실패 시 manual device check로 이동"
    };
  }

  return {
    severity: "watch",
    retryMode: "manual_device_check",
    recommendedAction: "manual device check로 최종 상세 페이지, 가격, 구매 버튼을 확인"
  };
}

function scoreQueueItem(failure, item, classification) {
  const status = Number(failure?.status || item?.liveProbe?.status || 0);
  const reason = normalizeReason(failure?.reason || item?.liveProbe?.reason || item?.validationReason);
  let score = 100;

  if (classification.severity === "blocker") score += 1000;
  if (classification.severity === "quarantine") score += 900;
  if (classification.severity === "review") score += 500;
  if (classification.severity === "watch") score += 250;
  if (status === 404 || status === 410 || status >= 500) score += 300;
  if (reason === "robots_or_access_blocked") score += 120;
  if (reason === "http_429") score += 100;
  if (reason === "request_failed") score += 80;
  if (item?.checks?.priceSignal === false) score += 20;
  if (item?.checks?.purchaseActionSignal === false) score += 20;
  if (item?.verificationEvidenceTier === "seller_access_protected_manual_verified") score += 10;
  if (item?.verificationEvidenceTier === "live_content_confirmed") score -= 80;

  return Math.max(0, score);
}

const linkReport = readJson("reports/link-validation.json");

if (!linkReport || !Array.isArray(linkReport.auditedItems)) {
  console.error("Missing reports/link-validation.json. Run npm run verify:links first.");
  process.exit(1);
}

const auditedById = new Map(linkReport.auditedItems.map((item) => [item.id, item]));
const failures = Array.isArray(linkReport.liveProbe?.failures) ? linkReport.liveProbe.failures : [];
const hardFailures = [];
const quarantinedFailures = [];
const reviewQueue = failures
  .map((failure) => {
    const item = auditedById.get(failure.id) ?? {};
    const classification = classifyLiveFailure(failure, item);
    const host = hostOf(failure.finalUrl || failure.url || item.finalUrl || item.originalUrl);
    const reason = normalizeReason(failure.reason || item.liveProbe?.reason || item.validationReason);
    const evidenceStatus = getEffectiveManualEvidenceStatus(item);
    const queueItem = {
      id: failure.id,
      title: item.title ?? "",
      mallName: item.mallName ?? "",
      category: item.category ?? "",
      host,
      finalUrl: failure.finalUrl || item.finalUrl || "",
      linkType: item.linkType ?? "",
      availability: item.availability ?? "",
      validationStatus: item.validationStatus ?? "",
      publishable: item.publishable === true,
      isHidden: item.isHidden === true,
      status: failure.status ?? item.liveProbe?.status ?? null,
      reason,
      evidenceTier: item.verificationEvidenceTier ?? "",
      contentMatch: failure.contentMatch === true || item.checks?.contentMatch === true,
      priceSignal: item.checks?.priceSignal === true,
      purchaseActionSignal: item.checks?.purchaseActionSignal === true,
      lastCheckedAt: item.lastCheckedAt ?? "",
      manualEvidenceStatus: evidenceStatus.status,
      manualEvidenceAgeDays: evidenceStatus.ageDays,
      manualEvidenceFresh: evidenceStatus.fresh,
      severity: classification.severity,
      retryMode: classification.retryMode,
      recommendedAction: classification.recommendedAction
    };

    queueItem.priority = scoreQueueItem(failure, item, classification);
    if (classification.severity === "blocker") hardFailures.push(queueItem);
    if (classification.severity === "quarantine") quarantinedFailures.push(queueItem);
    return queueItem;
  })
  .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id, "en"));

const byReason = {};
const byHost = {};
const byRetryMode = {};
const bySeverity = {};

for (const item of reviewQueue) {
  byReason[item.reason] = (byReason[item.reason] ?? 0) + 1;
  byHost[item.host] = (byHost[item.host] ?? 0) + 1;
  byRetryMode[item.retryMode] = (byRetryMode[item.retryMode] ?? 0) + 1;
  bySeverity[item.severity] = (bySeverity[item.severity] ?? 0) + 1;
}

const topHostActions = Object.entries(byHost)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
  .slice(0, 10)
  .map(([host, count]) => {
    const hostItems = reviewQueue.filter((item) => item.host === host);
    const retryModes = [...new Set(hostItems.map((item) => item.retryMode))];
    return {
      host,
      count,
      retryModes,
      recommendedAction:
        retryModes.includes("backoff_retry")
          ? "요청 간격을 늘린 backoff retry 후 official API 또는 partner feed로 대조"
          : "official API, partner feed, manual device check 순서로 상세 링크 재확인"
    };
  });

const manualEvidenceItems = reviewQueue.filter((item) => ["official_api_or_partner_feed", "backoff_retry", "network_retry", "manual_device_check"].includes(item.retryMode));
const manualEvidenceRequiredCount = manualEvidenceItems.length;
const manualEvidenceSummary = {
  maxAgeDays: manualEvidenceMaxAgeDays,
  reviewedQueueItems: manualEvidenceRequiredCount,
  freshManualEvidenceCount: manualEvidenceItems.filter((item) => item.manualEvidenceStatus === "fresh").length,
  staleManualEvidenceCount: manualEvidenceItems.filter((item) => item.manualEvidenceStatus === "stale").length,
  missingManualEvidenceCount: manualEvidenceItems.filter((item) => item.manualEvidenceStatus === "missing").length,
  oldestCheckedAt:
    manualEvidenceItems
      .map((item) => item.lastCheckedAt)
      .filter(Boolean)
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? "",
  newestCheckedAt:
    manualEvidenceItems
      .map((item) => item.lastCheckedAt)
      .filter(Boolean)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? ""
};

const summary = {
  totalDeals: Number(linkReport.totalDeals ?? linkReport.auditedItems.length),
  publishableDeals: Number(linkReport.publishableDeals ?? 0),
  liveChecked: Number(linkReport.liveProbe?.checked ?? 0),
  livePassed: Number(linkReport.liveProbe?.passed ?? 0),
  liveFailed: Number(linkReport.liveProbe?.failed ?? 0),
  reviewQueueCount: reviewQueue.length,
  manualEvidenceRequiredCount,
  hardFailureCount: hardFailures.length,
  quarantinedFailureCount: quarantinedFailures.length,
  exposedHardFailureCount: Number(linkReport.liveProbeReviewSummary?.exposedHardFailureCount ?? 0),
  unavailableTextCount: Number(linkReport.liveProbe?.unavailableText ?? 0),
  protectedOrRateLimitedCount: Number(byReason.robots_or_access_blocked ?? 0) + Number(byReason.http_429 ?? 0),
  transientNetworkCount: Number(linkReport.liveProbeReviewSummary?.transientNetworkCount ?? byReason.request_failed ?? 0),
  exposedSearchLinks: Number(linkReport.exposedSearchLinks ?? 0),
  exposedSoldOutLinks: Number(linkReport.exposedSoldOutLinks ?? 0),
  exposedBrokenLinks: Number(linkReport.exposedBrokenLinks ?? 0),
  exposedInvalidUrls: Number(linkReport.exposedInvalidUrls ?? 0),
  exposedNonPublishableItems: Number(linkReport.exposedNonPublishableItems ?? 0)
};

const ok =
  linkReport.liveProbe?.enabled === true &&
  summary.liveChecked >= summary.totalDeals &&
  summary.hardFailureCount === 0 &&
  summary.exposedHardFailureCount === 0 &&
  manualEvidenceSummary.staleManualEvidenceCount === 0 &&
  manualEvidenceSummary.missingManualEvidenceCount === 0 &&
  summary.unavailableTextCount === 0 &&
  summary.exposedSearchLinks === 0 &&
  summary.exposedSoldOutLinks === 0 &&
  summary.exposedBrokenLinks === 0 &&
  summary.exposedInvalidUrls === 0 &&
  summary.exposedNonPublishableItems === 0;

const report = {
  ok,
  generatedAt: new Date().toISOString(),
  sourceReport: "reports/link-validation.json",
  sourceGeneratedAt: linkReport.generatedAt ?? "",
  summary,
  reasonCounts: byReason,
  hostCounts: byHost,
  retryModeCounts: byRetryMode,
  severityCounts: bySeverity,
  manualEvidenceSummary,
  liveProbeReviewSummary: linkReport.liveProbeReviewSummary ?? {},
  topHostActions,
  hardFailures,
  quarantinedFailures,
  reviewQueue
};

function formatManualEvidence(item) {
  const age = item.manualEvidenceAgeDays === null ? "n/a" : `${item.manualEvidenceAgeDays}d`;
  return `${item.manualEvidenceStatus} (${age})`;
}

const rows = reviewQueue
  .slice(0, 40)
  .map(
    (item) =>
      `| ${item.severity} | ${item.id} | ${item.mallName} | ${item.host} | ${item.status ?? "-"} | ${item.reason} | ${item.retryMode} | ${formatManualEvidence(item)} | ${item.recommendedAction} |`
  )
  .join("\n");

const hostRows = topHostActions
  .map((item) => `| ${item.host} | ${item.count} | ${item.retryModes.join(", ")} | ${item.recommendedAction} |`)
  .join("\n");

const markdown = `# Live Probe Review Report

Generated: ${report.generatedAt}

Status: ${report.ok ? "PASS" : "BLOCKED"}

## Summary

- Total deals: ${summary.totalDeals}
- Publishable deals: ${summary.publishableDeals}
- Live probe checked: ${summary.liveChecked}
- Live probe passed: ${summary.livePassed}
- Live probe review queue: ${summary.reviewQueueCount}
- Manual evidence required: ${summary.manualEvidenceRequiredCount}
- Hard failures: ${summary.hardFailureCount}
- Quarantined hidden failures: ${summary.quarantinedFailureCount}
- Exposed hard failures: ${summary.exposedHardFailureCount}
- Unavailable text signals: ${summary.unavailableTextCount}
- Protected or rate-limited checks: ${summary.protectedOrRateLimitedCount}
- Transient network checks: ${summary.transientNetworkCount}
- Fresh manual evidence: ${manualEvidenceSummary.freshManualEvidenceCount}/${manualEvidenceSummary.reviewedQueueItems}
- Stale manual evidence: ${manualEvidenceSummary.staleManualEvidenceCount}
- Missing manual evidence: ${manualEvidenceSummary.missingManualEvidenceCount}
- Exposed search links: ${summary.exposedSearchLinks}
- Exposed sold-out links: ${summary.exposedSoldOutLinks}

## Launch Rule

The app can expose only links that are already publishable and have zero hard failures, zero unavailable-text signals, zero search links, and zero sold-out links. Seller access protection, robots blocks, and 429 responses are not treated as successful body verification; they stay in this queue for official API, partner feed, manual device check, or backoff retry. Protected links also need manual review evidence fresher than ${manualEvidenceMaxAgeDays} days.

## Top Host Actions

| Host | Count | Retry modes | Recommended action |
| --- | ---: | --- | --- |
${hostRows || "| - | 0 | - | No live probe review queue |"}

## Review Queue

| Severity | ID | Mall | Host | Status | Reason | Retry mode | Manual evidence | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows || "| - | - | - | - | - | - | - | - | No live probe review queue |"}
`;

writeFileSync(join(reportsDir, "live-probe-review.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "LIVE_PROBE_REVIEW_REPORT.md"), markdown, "utf8");

if (!report.ok) {
  console.error("Live probe review report found a launch blocker.");
  console.error(`- Hard failures: ${summary.hardFailureCount}`);
  console.error(`- Exposed hard failures: ${summary.exposedHardFailureCount}`);
  console.error(`- Unavailable text signals: ${summary.unavailableTextCount}`);
  console.error(`- Stale manual evidence: ${manualEvidenceSummary.staleManualEvidenceCount}`);
  console.error(`- Missing manual evidence: ${manualEvidenceSummary.missingManualEvidenceCount}`);
  process.exit(1);
}

console.log("Live probe review report passed.");
console.log(`- Live checked: ${summary.liveChecked}/${summary.totalDeals}`);
console.log(`- Live passed: ${summary.livePassed}`);
console.log(`- Review queue: ${summary.reviewQueueCount}`);
console.log(`- Protected or rate-limited: ${summary.protectedOrRateLimitedCount}`);
console.log(`- Fresh manual evidence: ${manualEvidenceSummary.freshManualEvidenceCount}/${manualEvidenceSummary.reviewedQueueItems}`);
console.log(`- Hard failures: ${summary.hardFailureCount}`);
console.log("- reports/live-probe-review.json");
console.log("- docs/LIVE_PROBE_REVIEW_REPORT.md");
