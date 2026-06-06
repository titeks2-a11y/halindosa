import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const mode = process.argv[2] === "events" ? "events" : "freebies";
const skipSourceRefresh = process.argv.includes("--no-refresh");

const configs = {
  freebies: {
    reportPath: "reports/freebies-refresh.json",
    docsPath: "docs/FREEBIES_REFRESH_REPORT.md",
    title: "무료혜택 Refresh Report",
    label: "무료혜택",
    minimumVisible: 8,
    match(deal, searchable) {
      return deal.category === "무료혜택" || ["freebie", "point", "public"].includes(deal.benefitType) || /무료|0원|체험|샘플|포인트|지원|문화누리/.test(searchable);
    },
    operatingAction: "무료 신청, 포인트 적립, 공공/문화 혜택은 공식 신청·혜택 상세 페이지가 확인된 항목만 홈과 무료혜택 탭에 노출합니다."
  },
  events: {
    reportPath: "reports/events-refresh.json",
    docsPath: "docs/EVENTS_REFRESH_REPORT.md",
    title: "Official Event Refresh Report",
    label: "공식 이벤트·쿠폰",
    minimumVisible: 55,
    match(deal, searchable) {
      return (
        ["coupon", "discount", "card", "culture", "membership", "travel"].includes(deal.benefitType) ||
        ["official_event", "event_news"].includes(deal.provider) ||
        /쿠폰|이벤트|행사|할인|프로모션|멤버십|카드|초대|항공권|배달/.test(searchable)
      );
    },
    operatingAction: "공식 이벤트, 쿠폰, 카드/멤버십, 문화/여행 혜택은 뉴스 원문이 아니라 공식 이벤트·쿠폰 상세 URL을 통해서만 노출합니다."
  }
};

const config = configs[mode];

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function runStep(name, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    name,
    command: `${process.execPath} ${args.join(" ")}`,
    ok: result.status === 0,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const content = readFileSync(fullPath, "utf8").trim();
      if (!content) throw new Error(`empty_json:${path}`);
      return JSON.parse(content);
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40);
    }
  }

  return {
    ...fallback,
    ok: false,
    readError: lastError instanceof Error ? lastError.message : String(lastError)
  };
}

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPublishableOfficialBenefit(deal) {
  const endTime = Date.parse(String(deal.endDate || ""));
  const expired = Number.isFinite(endTime) && endTime < Date.now();

  return (
    deal.publishable === true &&
    deal.isHidden !== true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    String(deal.linkType || "").startsWith("official") &&
    isHttpUrl(deal.finalUrl) &&
    !expired
  );
}

function searchableText(deal) {
  return [deal.title, deal.summary, deal.merchant, deal.mallName, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")]
    .filter(Boolean)
    .join(" ");
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    const value = String(item[key] || "미분류");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")));
}

const steps = [];
if (!skipSourceRefresh) {
  steps.push(runStep("refresh:news", ["scripts/refresh-news-deals.mjs"]));
  if (steps.at(-1)?.ok) steps.push(runStep("verify:news", ["scripts/verify-news-deals.mjs"]));
}

const snapshot = readJson("data/refreshedNewsDeals.json", {});
const newsReport = readJson("reports/news-deals.json", {});
const allDeals = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : [];
const matchedItems = allDeals.filter((deal) => config.match(deal, searchableText(deal)));
const visibleItems = matchedItems.filter(isPublishableOfficialBenefit);
const blockedItems = matchedItems.filter((deal) => !isPublishableOfficialBenefit(deal));
const exposedSearchLinks = visibleItems.filter((deal) => deal.linkType === "search" || /search|query|keyword|result/i.test(String(deal.finalUrl || ""))).length;
const exposedNonOfficialLinks = visibleItems.filter((deal) => !String(deal.linkType || "").startsWith("official")).length;
const ok =
  steps.every((step) => step.ok) &&
  newsReport.ok !== false &&
  visibleItems.length >= config.minimumVisible &&
  exposedSearchLinks === 0 &&
  exposedNonOfficialLinks === 0 &&
  blockedItems.every((deal) => deal.isHidden === true || deal.validationStatus === "failed" || deal.availability !== "active" || deal.publishable !== true);

const report = {
  ok,
  generatedAt: new Date().toISOString(),
  mode,
  label: config.label,
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  sourceReportGeneratedAt: newsReport.generatedAt ?? "",
  totalOfficialBenefits: allDeals.length,
  matchedCount: matchedItems.length,
  visibleCount: visibleItems.length,
  hiddenOrBlockedCount: blockedItems.length,
  exposedSearchLinks,
  exposedNonOfficialLinks,
  minimumVisible: config.minimumVisible,
  categoryCounts: countBy(visibleItems, "category"),
  benefitTypeCounts: countBy(visibleItems, "benefitType"),
  sourceCounts: countBy(visibleItems, "sourceName"),
  hosts: Array.from(new Set(visibleItems.map((deal) => deal.officialHost || hostOf(deal.finalUrl)).filter(Boolean))).sort(),
  topItems: visibleItems.slice(0, 20).map((deal) => ({
    id: deal.id,
    title: deal.title,
    merchant: deal.merchant,
    category: deal.category,
    benefitType: deal.benefitType,
    sourceName: deal.sourceName,
    host: deal.officialHost || hostOf(deal.finalUrl),
    finalUrl: deal.finalUrl,
    redirectUrl: `/go/news/${deal.id}`,
    endDate: deal.endDate,
    lastCheckedAt: deal.lastCheckedAt
  })),
  blockedItems: blockedItems.slice(0, 30).map((deal) => ({
    id: deal.id,
    title: deal.title,
    reason: deal.hiddenReason || deal.validationReason || deal.validationCode || "not_publishable",
    linkType: deal.linkType,
    availability: deal.availability,
    validationStatus: deal.validationStatus
  })),
  steps,
  operatingAction: config.operatingAction
};

const docs = [
  `# ${config.title}`,
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Mode: ${mode}`,
  `- Matched items: ${report.matchedCount}`,
  `- Visible official items: ${report.visibleCount}`,
  `- Hidden/blocked items: ${report.hiddenOrBlockedCount}`,
  `- Exposed search links: ${report.exposedSearchLinks}`,
  `- Exposed non-official links: ${report.exposedNonOfficialLinks}`,
  `- Required minimum: ${report.minimumVisible}`,
  `- Status: ${report.ok ? "PASS" : "CHECK"}`,
  "",
  "## Operating Rule",
  "",
  report.operatingAction,
  "",
  "All visible rows must keep `/go/news/[id]` redirect tracking and must resolve to official benefit, coupon, event, purchase, or application pages. Search, community, news-only, expired, hidden, and non-publishable rows remain excluded.",
  "",
  "## Top Visible Items",
  "",
  "| ID | Title | Source | Category | Host | Redirect |",
  "| --- | --- | --- | --- | --- | --- |",
  ...report.topItems
    .slice(0, 15)
    .map((item) => `| ${item.id} | ${String(item.title).replace(/\|/g, "/")} | ${item.sourceName} | ${item.category} | ${item.host} | \`${item.redirectUrl}\` |`),
  "",
  "## Blocked Items",
  "",
  report.blockedItems.length
    ? report.blockedItems.map((item) => `- ${item.id}: ${item.reason}`).join("\n")
    : "- No blocked items in this slice.",
  ""
].join("\n");

writeFileSync(join(root, config.reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(root, config.docsPath), `${docs}\n`, "utf8");

for (const step of steps) {
  console.log(`${step.ok ? "PASS" : "FAIL"} ${step.name}`);
  if (!step.ok && step.stderr) console.error(step.stderr);
}

console.log(`${config.label} refresh report written: ${config.reportPath}`);
console.log(`${config.label} refresh docs written: ${config.docsPath}`);
console.log(`- visible ${report.visibleCount}/${report.matchedCount}`);
console.log(`- exposed search links ${report.exposedSearchLinks}`);
console.log(`- exposed non-official links ${report.exposedNonOfficialLinks}`);

if (!report.ok) {
  console.error(`${config.label} refresh report failed.`);
  process.exit(1);
}
