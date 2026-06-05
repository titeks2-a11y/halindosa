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
  return String(value || "routine_rotation_review").trim() || "routine_rotation_review";
}

function readOpenUserRevalidationReports() {
  const localReports = readJson("data/dealReports.local.json")?.reports ?? [];
  const operationOverrides = readJson("data/dealOperationOverrides.local.json") ?? {};
  const candidates = new Map();
  const revalidationReasons = new Set(["link_error", "sold_out", "expired"]);

  for (const report of Array.isArray(localReports) ? localReports : []) {
    const dealId = String(report.dealId || "").trim();
    const reason = String(report.reason || "").trim();
    const status = String(report.status || "open").trim();
    if (!dealId || !revalidationReasons.has(reason) || !["open", "reviewing"].includes(status)) continue;

    const previous = candidates.get(dealId);
    candidates.set(dealId, {
      id: dealId,
      reason: `user_report_${reason}`,
      status,
      reportedAt: report.updatedAt || report.receivedAt || new Date().toISOString(),
      reportCount: (previous?.reportCount ?? 0) + 1
    });
  }

  for (const [dealId, entry] of Object.entries(operationOverrides.revalidate ?? {})) {
    if (!dealId || operationOverrides.hidden?.[dealId]) continue;
    const previous = candidates.get(dealId);
    candidates.set(dealId, {
      id: dealId,
      reason: entry?.reason || previous?.reason || "operator_revalidation",
      status: previous?.status || "reviewing",
      reportedAt: entry?.updatedAt || previous?.reportedAt || new Date().toISOString(),
      reportCount: previous?.reportCount ?? 1
    });
  }

  return candidates;
}

function classify(item, liveFailure, userReport) {
  if (userReport) {
    return {
      severity: "review",
      action: "사용자 신고가 접수된 링크입니다. 판매처 상세 페이지, 품절/종료 여부, 최종 가격을 우선 재검증"
    };
  }

  const reason = normalizeReason(liveFailure?.reason || item.revalidationReason || item.validationReason);
  const status = Number(liveFailure?.status || item.liveProbe?.status || 0);

  if (
    item.isHidden === true ||
    item.publishable !== true ||
    item.validationStatus !== "passed" ||
    item.availability !== "active" ||
    item.linkType === "search" ||
    item.linkType === "seller_search"
  ) {
    return {
      severity: "block",
      action: "노출 차단 상태를 유지하고 실제 구매/신청 상세 URL로 교체"
    };
  }

  if (status === 404 || status === 410 || status >= 500 || reason.includes("sold_out") || reason.includes("unavailable")) {
    return {
      severity: "block",
      action: "즉시 재검증 후 품절/종료 또는 대체 상세 URL 반영"
    };
  }

  if (reason === "robots_or_access_blocked" || reason === "http_429") {
    return {
      severity: "review",
      action: "공식 API, 제휴 피드, 실기기 수동 확인으로 상세 링크 유지 여부 확인"
    };
  }

  if (reason === "request_failed" || reason === "timeout") {
    return {
      severity: "watch",
      action: "다음 refresh:deals 실행에서 우선 재확인"
    };
  }

  if (item.liveProbe?.finalUrlChanged === true || item.finalUrlChanged === true) {
    return {
      severity: "review",
      action: "최종 도착 URL을 finalUrl로 반영할지 검토"
    };
  }

  return {
    severity: "routine",
    action: "정기 순환 검수"
  };
}

function scoreFor(item, liveFailure, severity, userReport) {
  const base = Number(item.revalidationPriority ?? item.priorityScore ?? 0);
  const status = Number(liveFailure?.status || item.liveProbe?.status || 0);
  const reason = normalizeReason(liveFailure?.reason || item.revalidationReason || item.validationReason);
  let score = 100 - Math.min(100, base);

  if (userReport) score += 850 + Math.min(120, Number(userReport.reportCount || 1) * 20);
  if (severity === "block") score += 1000;
  if (severity === "review") score += 500;
  if (severity === "watch") score += 250;
  if (status === 404 || status === 410 || status >= 500) score += 300;
  if (reason === "robots_or_access_blocked") score += 90;
  if (reason === "http_429") score += 70;
  if (reason === "request_failed" || reason === "timeout") score += 60;
  if (item.checks?.priceSignal === false) score += 15;
  if (item.checks?.purchaseActionSignal === false) score += 15;
  if (item.verificationEvidenceTier === "live_content_confirmed") score -= 40;

  return Math.max(0, Math.round(score));
}

const linkReport = readJson("reports/link-validation.json");
const exposureReport = readJson("reports/exposure-policy.json");
const launchGateReport = readJson("reports/link-launch-gate.json");

if (!linkReport || !Array.isArray(linkReport.auditedItems)) {
  console.error("Missing reports/link-validation.json. Run npm run verify:links first.");
  process.exit(1);
}

const liveFailuresById = new Map((linkReport.liveProbe?.failures ?? []).map((item) => [item.id, item]));
const auditedItems = linkReport.auditedItems;
const userReportsById = readOpenUserRevalidationReports();

const queue = auditedItems
  .map((item) => {
    const liveFailure = liveFailuresById.get(item.id);
    const userReport = userReportsById.get(item.id);
    const classification = classify(item, liveFailure, userReport);
    const reason = userReport?.reason || normalizeReason(liveFailure?.reason || item.revalidationReason || item.validationReason);

    return {
      id: item.id,
      title: item.title,
      mallName: item.mallName,
      category: item.category,
      host: hostOf(item.finalUrl || item.originalUrl),
      finalUrl: item.finalUrl,
      linkType: item.linkType,
      availability: item.availability,
      validationStatus: item.validationStatus,
      publishable: item.publishable === true,
      isHidden: item.isHidden === true,
      evidenceTier: item.verificationEvidenceTier || "",
      liveStatus: liveFailure?.status ?? item.liveProbe?.status ?? null,
      liveReason: reason,
      userReportReason: userReport?.reason ?? "",
      userReportCount: userReport?.reportCount ?? 0,
      userReportedAt: userReport?.reportedAt ?? "",
      contentMatch: item.checks?.contentMatch === true,
      priceSignal: item.checks?.priceSignal === true,
      purchaseActionSignal: item.checks?.purchaseActionSignal === true,
      lastCheckedAt: item.lastCheckedAt,
      priority: scoreFor(item, liveFailure, classification.severity, userReport),
      severity: classification.severity,
      action: classification.action
    };
  })
  .filter((item) => item.severity !== "routine" || item.priority >= 80)
  .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id, "en"));

const counts = queue.reduce(
  (acc, item) => {
    acc[item.severity] = (acc[item.severity] ?? 0) + 1;
    acc.byReason[item.liveReason] = (acc.byReason[item.liveReason] ?? 0) + 1;
    if (item.host) acc.byHost[item.host] = (acc.byHost[item.host] ?? 0) + 1;
    return acc;
  },
  { block: 0, review: 0, watch: 0, routine: 0, byReason: {}, byHost: {} }
);

const report = {
  ok: counts.block === 0 && (launchGateReport?.ok ?? true) === true,
  generatedAt: new Date().toISOString(),
  sourceReports: {
    linkValidation: linkReport.generatedAt ?? null,
    exposurePolicy: exposureReport?.generatedAt ?? null,
    linkLaunchGate: launchGateReport?.generatedAt ?? null
  },
  summary: {
    auditedItems: auditedItems.length,
    publishableItems: linkReport.publishableDeals ?? auditedItems.filter((item) => item.publishable === true && item.isHidden !== true).length,
    hiddenItems: linkReport.hiddenCount ?? auditedItems.filter((item) => item.isHidden).length,
    exposedSearchLinks: linkReport.exposedSearchLinks ?? 0,
    exposedSoldOutLinks: linkReport.exposedSoldOutLinks ?? 0,
    exposedBrokenLinks: linkReport.exposedBrokenLinks ?? 0,
    blockingRevalidationItems: counts.block,
    userReportedItems: userReportsById.size,
    reviewItems: counts.review,
    watchItems: counts.watch,
    routineItems: counts.routine,
    queueItems: queue.length
  },
  liveProbeReviewSummary: linkReport.liveProbeReviewSummary ?? {},
  counts,
  topQueue: queue.slice(0, 50)
};

const markdownRows = report.topQueue
  .slice(0, 30)
  .map(
    (item) =>
      `| ${item.severity} | ${item.id} | ${item.mallName} | ${item.title.replace(/\|/g, "/")} | ${item.liveStatus ?? "-"} | ${item.liveReason} | ${item.action} |`
  )
  .join("\n");

const markdown = `# Link Revalidation Priority

Generated: ${report.generatedAt}

Status: ${report.ok ? "PASS" : "REVIEW REQUIRED"}

## Summary

- Audited items: ${report.summary.auditedItems}
- Publishable items: ${report.summary.publishableItems}
- Hidden items: ${report.summary.hiddenItems}
- Exposed search links: ${report.summary.exposedSearchLinks}
- Exposed sold-out links: ${report.summary.exposedSoldOutLinks}
- Exposed broken links: ${report.summary.exposedBrokenLinks}
- Blocking revalidation items: ${report.summary.blockingRevalidationItems}
- User reported revalidation items: ${report.summary.userReportedItems}
- Review items: ${report.summary.reviewItems}
- Watch items: ${report.summary.watchItems}
- Queue items: ${report.summary.queueItems}

## Operating Rule

Customer-visible links stay publishable only when the launch gate has zero exposed search, sold-out, broken, invalid, and non-publishable links. Access-protected 403/429 responses are not automatically hidden, but they are queued for official API, partner feed, or device-level revalidation.

## Top Revalidation Queue

| Severity | ID | Mall | Title | Live status | Reason | Action |
| --- | --- | --- | --- | --- | --- | --- |
${markdownRows || "| routine | none | - | No priority revalidation items | - | - | 현 상태 유지 |"}
`;

writeFileSync(join(reportsDir, "link-revalidation-priority.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "LINK_REVALIDATION_PRIORITY.md"), markdown, "utf8");

if (!report.ok) {
  console.error("Link revalidation priority report found blocking items.");
  console.error(`- Blocking items: ${report.summary.blockingRevalidationItems}`);
  process.exit(1);
}

console.log("Link revalidation priority report passed.");
console.log(`- Publishable items: ${report.summary.publishableItems}/${report.summary.auditedItems}`);
console.log(`- Blocking revalidation items: ${report.summary.blockingRevalidationItems}`);
console.log(`- Review items: ${report.summary.reviewItems}`);
console.log(`- Watch items: ${report.summary.watchItems}`);
console.log("- reports/link-revalidation-priority.json");
console.log("- docs/LINK_REVALIDATION_PRIORITY.md");
