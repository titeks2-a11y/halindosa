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

function daysUntil(dateValue) {
  const timestamp = Date.parse(String(dateValue || ""));
  if (!Number.isFinite(timestamp)) return null;
  return Math.round(((timestamp - Date.now()) / (24 * 60 * 60 * 1000)) * 10) / 10;
}

function normalizeReason(value) {
  return String(value || "routine_official_benefit_review").trim() || "routine_official_benefit_review";
}

function severityRank(severity) {
  return { block: 0, review: 1, watch: 2, routine: 3 }[severity] ?? 4;
}

function readManualRevalidationActions() {
  const overrides = readJson("data/newsDealOverrides.local.json") ?? {};
  const rows = new Map();

  for (const [id, entry] of Object.entries(overrides.hidden ?? {})) {
    rows.set(id, {
      id,
      reason: `manual_hidden:${entry?.reason || "operator_hidden"}`,
      action: "hide",
      updatedAt: entry?.updatedAt || new Date().toISOString()
    });
  }

  for (const entry of Array.isArray(overrides.auditLog) ? overrides.auditLog : []) {
    if (entry?.action !== "revalidate" || !entry?.id) continue;
    const previous = rows.get(entry.id);
    rows.set(entry.id, {
      id: entry.id,
      reason: entry.reason || previous?.reason || "operator_revalidation",
      action: "revalidate",
      updatedAt: entry.createdAt || previous?.updatedAt || new Date().toISOString()
    });
  }

  return rows;
}

function buildQueueItemFromDeal(deal, source, severity, reason, action, priorityBoost = 0) {
  const finalUrl = deal.finalUrl || deal.eventUrl || deal.sourceUrl || deal.originalUrl || "";
  const checkedAt = deal.lastCheckedAt || source.checkedAt || new Date().toISOString();
  const endDaysLeft = daysUntil(deal.endDate);
  const baseScore = Number(deal.priorityScore ?? deal.confidenceScore ?? 0);
  const priority =
    priorityBoost +
    (severity === "block" ? 1000 : severity === "review" ? 600 : severity === "watch" ? 300 : 60) +
    Math.max(0, 110 - Math.min(100, baseScore)) +
    (typeof endDaysLeft === "number" && endDaysLeft <= 14 ? 80 : 0) +
    (typeof endDaysLeft === "number" && endDaysLeft <= 3 ? 180 : 0);

  return {
    id: deal.id || source.id,
    title: deal.title || source.title || "",
    merchant: deal.merchant || deal.mallName || "",
    category: deal.category || source.category || "",
    benefitType: deal.benefitType || "",
    sourceName: deal.sourceName || source.sourceName || "",
    provider: deal.provider || source.provider || "",
    host: hostOf(finalUrl) || deal.officialHost || "",
    finalUrl,
    linkType: deal.linkType || "",
    availability: deal.availability || "",
    validationStatus: deal.validationStatus || "",
    publishable: deal.publishable === true,
    isHidden: deal.isHidden === true,
    validationCode: deal.validationCode || "",
    validationReason: normalizeReason(deal.validationReason || source.reason),
    endDate: deal.endDate || source.endDate || "",
    daysLeft: typeof endDaysLeft === "number" ? endDaysLeft : Number(source.daysLeft ?? 999),
    lastCheckedAt: checkedAt,
    severity,
    reason,
    action,
    priority: Math.max(0, Math.round(priority))
  };
}

const newsReport = readJson("reports/news-deals.json");
const freshnessReport = readJson("reports/news-freshness.json");
const alertReport = readJson("reports/official-benefit-alerts.json");
const snapshot = readJson("data/refreshedNewsDeals.json");

if (!newsReport || !snapshot || !Array.isArray(snapshot.allDeals)) {
  console.error("Missing news deal reports. Run npm run refresh:news && npm run verify:news first.");
  process.exit(1);
}

const allDeals = snapshot.allDeals;
const dealsById = new Map(allDeals.map((deal) => [deal.id, deal]));
const manualActions = readManualRevalidationActions();
const queueById = new Map();

function upsertQueue(item) {
  if (!item.id) return;
  const previous = queueById.get(item.id);
  if (
    !previous ||
    item.priority > previous.priority ||
    severityRank(item.severity) < severityRank(previous.severity)
  ) {
    queueById.set(item.id, item);
  }
}

for (const deal of allDeals) {
  const reasons = [];
  if (deal.isHidden === true) reasons.push("hidden");
  if (deal.publishable !== true) reasons.push("not_publishable");
  if (deal.validationStatus !== "passed") reasons.push(deal.validationCode || "validation_failed");
  if (deal.availability !== "active") reasons.push(deal.availability || "not_active");
  if (deal.linkType === "search" || deal.linkType === "news_only" || deal.linkType === "community") reasons.push(`${deal.linkType}_link`);
  if (!deal.finalUrl) reasons.push("missing_final_url");

  if (reasons.length) {
    upsertQueue(
      buildQueueItemFromDeal(
        deal,
        {},
        "block",
        reasons.join(","),
        "사용자 노출을 차단하고 공식 구매/신청 상세 URL, 종료일, 혜택 조건을 재확인",
        500
      )
    );
  }
}

for (const item of Array.isArray(freshnessReport?.renewalQueue) ? freshnessReport.renewalQueue : []) {
  const deal = dealsById.get(item.id) ?? item;
  upsertQueue(
    buildQueueItemFromDeal(
      deal,
      item,
      "review",
      "expires_within_14_days",
      item.action || "14일 이내 종료 혜택입니다. 공식 페이지 종료 여부와 대체 혜택 후보를 우선 준비",
      220
    )
  );
}

for (const item of Array.isArray(freshnessReport?.watchQueue) ? freshnessReport.watchQueue : []) {
  const deal = dealsById.get(item.id) ?? item;
  upsertQueue(
    buildQueueItemFromDeal(
      deal,
      item,
      "watch",
      "expires_within_30_days",
      "30일 이내 종료 가능성이 있어 다음 refresh:news에서 우선 확인",
      120
    )
  );
}

for (const [id, manual] of manualActions.entries()) {
  const deal = dealsById.get(id) ?? { id, title: id, lastCheckedAt: manual.updatedAt };
  upsertQueue(
    buildQueueItemFromDeal(
      deal,
      manual,
      manual.action === "hide" ? "block" : "review",
      manual.reason,
      manual.action === "hide"
        ? "수동 숨김 상태입니다. 공식 finalUrl과 종료 여부 확인 전 노출 금지"
        : "운영자가 재검증을 요청한 공식 혜택입니다. 다음 refresh:all에서 우선 확인",
      700
    )
  );
}

for (const source of Array.isArray(newsReport.sourceTrustScores) ? newsReport.sourceTrustScores : []) {
  if (source.status === "trusted" && Number(source.trustScore ?? 0) >= 90) continue;
  const severity = source.status === "blocked" || Number(source.failedCount ?? 0) > 0 ? "block" : "review";
  upsertQueue({
    id: `source:${source.provider}:${source.sourceName}:${source.officialHost}`,
    title: source.sourceName,
    merchant: source.sourceName,
    category: source.categories?.[0] || "공식 혜택",
    benefitType: source.benefitTypes?.[0] || "",
    sourceName: source.sourceName,
    provider: source.provider,
    host: source.officialHost || "",
    finalUrl: source.officialHost ? `https://${source.officialHost}` : "",
    linkType: "source_trust",
    availability: "active",
    validationStatus: source.status,
    publishable: false,
    isHidden: severity === "block",
    validationCode: source.status,
    validationReason: source.recommendedAction,
    endDate: "",
    daysLeft: 999,
    lastCheckedAt: source.lastCheckedAt,
    severity,
    reason: `source_trust_${source.status}`,
    action: source.recommendedAction || "공식 소스 신뢰도, 실패율, 종료/숨김 항목을 재검토",
    priority: severity === "block" ? 1200 : 620
  });
}

const topQueue = Array.from(queueById.values()).sort(
  (a, b) => severityRank(a.severity) - severityRank(b.severity) || b.priority - a.priority || a.id.localeCompare(b.id, "en")
);

const counts = topQueue.reduce(
  (acc, item) => {
    acc[item.severity] = (acc[item.severity] ?? 0) + 1;
    acc.byReason[item.reason] = (acc.byReason[item.reason] ?? 0) + 1;
    if (item.host) acc.byHost[item.host] = (acc.byHost[item.host] ?? 0) + 1;
    return acc;
  },
  { block: 0, review: 0, watch: 0, routine: 0, byReason: {}, byHost: {} }
);

const summary = {
  totalItems: Number(newsReport.totalCount ?? allDeals.length),
  visibleItems: Number(newsReport.visibleCount ?? 0),
  activeOfficialBenefits: Number(alertReport?.totals?.activeOfficialBenefits ?? newsReport.activeVisibleCount ?? 0),
  hiddenItems: Number(newsReport.hiddenCount ?? 0),
  expiredItems: Number(newsReport.expiredCount ?? 0),
  failedItems: Number(newsReport.failedCount ?? 0),
  officialMissingItems: Number(newsReport.officialMissingCount ?? 0),
  exposedSearchLinks: Number(newsReport.exposedSearchLinkCount ?? 0),
  exposedNonOfficialLinks: Number(newsReport.exposedNonOfficialLinkCount ?? 0),
  nonPublishableVisibleItems: Number(newsReport.nonPublishableVisibleCount ?? 0),
  renewalItems: Array.isArray(freshnessReport?.renewalQueue) ? freshnessReport.renewalQueue.length : 0,
  watchItems: Array.isArray(freshnessReport?.watchQueue) ? freshnessReport.watchQueue.length : 0,
  manualRevalidationItems: manualActions.size,
  blockingItems: counts.block,
  reviewItems: counts.review,
  queueWatchItems: counts.watch,
  queueItems: topQueue.length
};

const report = {
  ok:
    newsReport.ok === true &&
    freshnessReport?.ok === true &&
    summary.visibleItems >= 70 &&
    summary.activeOfficialBenefits >= 70 &&
    summary.hiddenItems === 0 &&
    summary.expiredItems === 0 &&
    summary.failedItems === 0 &&
    summary.officialMissingItems === 0 &&
    summary.exposedSearchLinks === 0 &&
    summary.exposedNonOfficialLinks === 0 &&
    summary.nonPublishableVisibleItems === 0 &&
    summary.blockingItems === 0,
  generatedAt: new Date().toISOString(),
  sourceReports: {
    newsDeals: newsReport.generatedAt ?? null,
    newsFreshness: freshnessReport?.generatedAt ?? null,
    officialBenefitAlerts: alertReport?.generatedAt ?? null
  },
  summary,
  counts,
  freshness: {
    status: freshnessReport?.freshnessStatus ?? "missing",
    reportAgeHours: freshnessReport?.reportAgeHours ?? null,
    nextRefreshDueAt: freshnessReport?.nextRefreshDueAt ?? "",
    staleAfterAt: freshnessReport?.staleAfterAt ?? "",
    expiringWithin14DaysCount: freshnessReport?.expiringWithin14DaysCount ?? summary.renewalItems,
    expiringWithin30DaysCount: freshnessReport?.expiringWithin30DaysCount ?? summary.watchItems
  },
  topQueue: topQueue.slice(0, 60)
};

const markdownRows = report.topQueue
  .slice(0, 30)
  .map(
    (item) =>
      `| ${item.severity} | ${item.id} | ${item.sourceName || item.provider} | ${item.title.replace(/\|/g, "/")} | ${item.reason} | ${item.action} |`
  )
  .join("\n");

const markdown = `# Official Benefit Revalidation Priority

Generated: ${report.generatedAt}

Status: ${report.ok ? "PASS" : "REVIEW REQUIRED"}

## Summary

- Total official benefit items: ${report.summary.totalItems}
- Visible official benefits: ${report.summary.visibleItems}
- Active official benefits: ${report.summary.activeOfficialBenefits}
- Hidden items: ${report.summary.hiddenItems}
- Expired items: ${report.summary.expiredItems}
- Failed items: ${report.summary.failedItems}
- Official final URL missing: ${report.summary.officialMissingItems}
- Exposed search links: ${report.summary.exposedSearchLinks}
- Exposed non-official links: ${report.summary.exposedNonOfficialLinks}
- Blocking items: ${report.summary.blockingItems}
- Renewal queue: ${report.summary.renewalItems}
- Watch queue: ${report.summary.watchItems}
- Manual revalidation items: ${report.summary.manualRevalidationItems}

## Operating Rule

Customer-visible official benefits must stay active, publishable, and linked to official purchase, coupon, event, or application pages. Search pages, community posts, news-only landing pages, expired events, and manually hidden items remain excluded until a fresh official final URL is confirmed.

## Top Official Benefit Revalidation Queue

| Severity | ID | Source | Title | Reason | Action |
| --- | --- | --- | --- | --- | --- |
${markdownRows || "| routine | none | - | No priority official benefit revalidation items | - | 현 상태 유지 |"}
`;

writeFileSync(join(reportsDir, "news-revalidation-priority.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "NEWS_REVALIDATION_PRIORITY.md"), markdown, "utf8");

if (!report.ok) {
  console.error("Official benefit revalidation priority report found blocking items.");
  console.error(`- Blocking items: ${report.summary.blockingItems}`);
  process.exit(1);
}

console.log("Official benefit revalidation priority report passed.");
console.log(`- Visible official benefits: ${report.summary.visibleItems}/${report.summary.totalItems}`);
console.log(`- Blocking items: ${report.summary.blockingItems}`);
console.log(`- Renewal queue: ${report.summary.renewalItems}`);
console.log(`- Watch queue: ${report.summary.watchItems}`);
console.log("- reports/news-revalidation-priority.json");
console.log("- docs/NEWS_REVALIDATION_PRIORITY.md");
