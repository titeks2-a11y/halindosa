import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const firstPartyFeedUrl = "https://www.halindosa.com/api/feeds/free-benefits";

const requiredRouteSnippets = [
  'export const dynamic = "force-dynamic"',
  "export const revalidate = 0",
  'export const fetchCache = "force-no-store"',
  "HalindosaFreeBenefitFeedItem",
  "halindosa_first_party_verified_feed",
  "publishableOnly: true",
  "officialOnly: true",
  "verifiedOnly: true",
  '"search_link"',
  '"homepage_link"',
  '"community_link"',
  '"expired"',
  '"sold_out"',
  '"unapproved_host"',
  "canonicalUrl",
  "claimUrl",
  "canonicalHost",
  "dedupeKey",
  "displayBadges",
  "linkTrust",
  "official_verified"
];

const requiredFeedFields = [
  "id",
  "brand",
  "title",
  "description",
  "benefitType",
  "rewardValue",
  "startDate",
  "endDate",
  "sourceUrl",
  "officialUrl",
  "finalUrl",
  "claimUrl",
  "canonicalUrl",
  "canonicalHost",
  "dedupeKey",
  "deadlineStatus",
  "displayBadges",
  "imageUrl",
  "status",
  "validationStatus",
  "isOfficial",
  "isFree",
  "isVerified",
  "qualityScore",
  "freshnessScore",
  "officialScore",
  "urgencyScore",
  "rewardScore",
  "priorityScore",
  "lastCheckedAt",
  "verifiedAt",
  "updatedAt",
  "createdAt",
  "collectedAt",
  "tags"
];

const requiredStarterFiles = [
  "reports/free-benefit-feed-starter-pack.env",
  "reports/free-benefit-feed-vercel-env-commands.md",
  "docs/FREE_BENEFIT_FEED_STARTER_PACK.md",
  ".env.example"
];

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8");
}

function includesAll(content, snippets) {
  return snippets.filter((snippet) => !content.includes(snippet));
}

function pushIssues(label, missing, issues) {
  for (const snippet of missing) {
    issues.push(`${label} missing ${snippet}`);
  }
}

const issues = [];
const route = read("app/api/feeds/free-benefits/route.ts");
const feedReport = existsSync(join(root, "reports/first-party-free-benefit-feed.json"))
  ? JSON.parse(read("reports/first-party-free-benefit-feed.json"))
  : null;

if (!route) {
  issues.push("first-party free benefit feed route is missing");
} else {
  pushIssues("first-party feed route", includesAll(route, requiredRouteSnippets), issues);
  pushIssues(
    "first-party feed schema",
    requiredFeedFields.filter((field) => !route.includes(`"${field}"`)),
    issues
  );
}

for (const file of requiredStarterFiles) {
  const content = read(file);
  if (!content) {
    issues.push(`${file} is missing`);
    continue;
  }
  if (!content.includes(firstPartyFeedUrl)) {
    issues.push(`${file} should document ${firstPartyFeedUrl} as the safe first-party smoke/starter feed`);
  }
  if (!content.includes("BENEFIT_REFRESH_FEED_URLS")) {
    issues.push(`${file} should mention BENEFIT_REFRESH_FEED_URLS for first-party feed activation`);
  }
}

if (!feedReport) {
  issues.push("reports/first-party-free-benefit-feed.json is missing; run npm run benefit:first-party-feed:report");
} else {
  const summary = feedReport.summary ?? feedReport;
  if (feedReport.ok !== true) issues.push("first-party free benefit feed report should be ok=true");
  if ((summary.consumerPublishableItems ?? 0) < 50) {
    issues.push("first-party free benefit feed should expose at least 50 consumer publishable official benefits");
  }
  if ((summary.blockedSearchLinkItems ?? 0) !== 0) {
    issues.push("first-party free benefit feed should expose zero search-link items");
  }
  if ((summary.homepageLikeItems ?? 0) !== 0) {
    issues.push("first-party free benefit feed should expose zero homepage-like items");
  }
  if ((summary.duplicateGroups ?? 0) !== 0) {
    issues.push("first-party free benefit feed should expose zero duplicate groups");
  }
  if ((summary.officialRate ?? 0) < 100) {
    issues.push("first-party free benefit feed official rate should be 100%");
  }
  if ((summary.averageQualityScore ?? 0) < 70) {
    issues.push("first-party free benefit feed average quality score should stay above 70");
  }
  if ((feedReport.topCandidates ?? []).filter((item) => item.claimUrl).length < 10) {
    issues.push("first-party free benefit feed should keep at least 10 top candidate claim URLs");
  }
}

const result = {
  ok: issues.length === 0,
  checkedAt: new Date().toISOString(),
  firstPartyFeedUrl,
  route: "app/api/feeds/free-benefits/route.ts",
  requiredFieldCount: requiredFeedFields.length,
  starterFiles: requiredStarterFiles,
  reportSummary: feedReport
    ? {
        consumerPublishableItems: (feedReport.summary ?? feedReport).consumerPublishableItems,
        blockedSearchLinkItems: (feedReport.summary ?? feedReport).blockedSearchLinkItems,
        homepageLikeItems: (feedReport.summary ?? feedReport).homepageLikeItems,
        duplicateGroups: (feedReport.summary ?? feedReport).duplicateGroups,
        officialRate: (feedReport.summary ?? feedReport).officialRate,
        averageQualityScore: (feedReport.summary ?? feedReport).averageQualityScore,
        topCandidateClaimUrlCount: (feedReport.topCandidates ?? []).filter((item) => item.claimUrl).length
      }
    : null,
  issues
};

writeFileSync(join(root, "reports/first-party-free-benefit-feed-contract.json"), JSON.stringify(result, null, 2), "utf8");

if (issues.length) {
  console.error("First-party free benefit feed contract failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `First-party free benefit feed contract passed: ${requiredFeedFields.length} fields, ` +
    `${(feedReport?.summary ?? feedReport)?.consumerPublishableItems ?? 0} publishable benefits, ` +
    `officialRate=${(feedReport?.summary ?? feedReport)?.officialRate ?? "n/a"}.`
);
