import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportJsonPath = "reports/push-readiness.json";
const reportDocsPath = "docs/PUSH_READINESS_REPORT.md";

const categoryAliases = {
  "무료/체험": ["무료", "무료혜택", "체험", "체험단", "샘플", "0원"],
  "쿠폰/이벤트": ["쿠폰", "이벤트", "포인트", "혜택"],
  "식품": ["식품", "간편식", "생필품"],
  "생활용품": ["생활용품", "생필품"],
  "마트/편의점": ["마트", "편의점", "장보기", "1+1", "2+1"],
  "외식/배달": ["외식", "배달", "치킨", "커피"],
  "디지털": ["디지털", "전자기기", "가전"],
  "패션": ["패션", "의류", "잡화"],
  "뷰티": ["뷰티", "헬스"],
  "육아": ["육아", "키즈", "기저귀"],
  "여행": ["여행", "여행/티켓", "여행/숙박", "항공"],
  "영화/문화": ["영화", "문화", "전시", "공연", "초대권", "시사회"],
  "카드/멤버십": ["카드", "멤버십", "membership"],
  "정부/공공혜택": ["정부", "공공", "공공혜택", "문화누리"]
};

const campaignProfiles = [
  { id: "new-deals", label: "신규 특가", sourceKind: "product_deal", alertType: "deal_registered", priority: "medium" },
  { id: "free-coupon", label: "무료·쿠폰 혜택", sourceKind: "product_deal", alertType: "free_event", priority: "high" },
  { id: "price-drop", label: "가격 인하", sourceKind: "product_deal", alertType: "price_drop", priority: "high" },
  { id: "ending-soon", label: "마감 임박", sourceKind: "product_deal", alertType: "ending_soon", priority: "critical" },
  { id: "interest-category", label: "관심 카테고리", sourceKind: "product_deal", alertType: "interest_category", priority: "medium" },
  { id: "official-free-coupon", label: "공식 무료·쿠폰 혜택", sourceKind: "official_benefit", alertType: "free_event", priority: "high" },
  { id: "official-card-membership", label: "카드·멤버십 공식 혜택", sourceKind: "official_benefit", alertType: "interest_category", priority: "medium" },
  { id: "official-culture-public", label: "문화·공공 공식 혜택", sourceKind: "official_benefit", alertType: "free_event", priority: "medium" },
  { id: "official-mart-convenience", label: "마트·편의점 공식 혜택", sourceKind: "official_benefit", alertType: "ending_soon", priority: "critical" }
];

function read(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function extractNotificationCategories(source) {
  const match = source.match(/notificationCategoryOptions\s*=\s*\[(?<body>[\s\S]*?)\]/);
  if (!match?.groups?.body) return Object.keys(categoryAliases);

  const values = [...match.groups.body.matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  return values.length ? values : Object.keys(categoryAliases);
}

function extractProductDeals(source) {
  const pattern =
    /deal\(\s*"(?<id>d\d+)"\s*,\s*"(?<mall>[^"]+)"\s*,\s*"(?<title>[^"]+)"\s*,\s*"(?<category>[^"]+)"\s*,\s*(?<originalPrice>\d+)\s*,\s*(?<discountRate>\d+)\s*,[\s\S]*?\[(?<tags>[^\]]*)\]/g;
  const deals = [];

  for (const match of source.matchAll(pattern)) {
    if (!match.groups) continue;

    deals.push({
      id: match.groups.id,
      mall: match.groups.mall,
      title: match.groups.title,
      category: match.groups.category,
      originalPrice: Number(match.groups.originalPrice),
      discountRate: Number(match.groups.discountRate),
      tags: [...match.groups.tags.matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1])
    });
  }

  return deals;
}

function includesAny(value, aliases) {
  return aliases.some((alias) => value.includes(alias));
}

function productText(deal) {
  return `${deal.title} ${deal.mall} ${deal.category} ${deal.tags.join(" ")}`;
}

function newsText(deal) {
  return `${deal.title ?? ""} ${deal.summary ?? ""} ${deal.merchant ?? ""} ${deal.category ?? ""} ${deal.benefitType ?? ""} ${(deal.tags ?? []).join(" ")}`;
}

function isVisibleNewsDeal(deal) {
  const endTime = Date.parse(deal.endDate ?? "");
  return deal.validationStatus === "passed" && !deal.isHidden && Boolean(deal.finalUrl) && (!Number.isFinite(endTime) || endTime >= Date.now());
}

function countCampaignRows(profile, productDeals, newsDeals) {
  if (profile.id === "new-deals") return Math.min(5, productDeals.length);
  if (profile.id === "free-coupon") {
    return Math.min(5, productDeals.filter((deal) => includesAny(productText(deal), ["무료", "쿠폰", "포인트", "0원", "체험"])).length);
  }
  if (profile.id === "price-drop") return Math.min(5, productDeals.filter((deal) => deal.discountRate >= 35).length);
  if (profile.id === "ending-soon") {
    return Math.min(5, productDeals.filter((deal) => includesAny(productText(deal), ["마감", "오늘만", "선착순", "한정"])).length);
  }
  if (profile.id === "interest-category") return Math.min(6, new Set(productDeals.map((deal) => deal.category)).size);
  if (profile.id === "official-free-coupon") {
    return Math.min(5, newsDeals.filter((deal) => includesAny(newsText(deal), ["무료", "쿠폰", "포인트", "혜택"])).length);
  }
  if (profile.id === "official-card-membership") {
    return Math.min(5, newsDeals.filter((deal) => includesAny(newsText(deal), ["카드", "멤버십", "membership"])).length);
  }
  if (profile.id === "official-culture-public") {
    return Math.min(5, newsDeals.filter((deal) => includesAny(newsText(deal), ["영화", "문화", "공공", "정부", "초대권", "시사회"])).length);
  }
  if (profile.id === "official-mart-convenience") {
    return Math.min(5, newsDeals.filter((deal) => includesAny(newsText(deal), ["마트", "편의점", "1+1", "2+1"])).length);
  }

  return 0;
}

function buildSegmentCoverage(categories, productDeals, newsDeals) {
  return categories.map((category) => {
    const aliases = categoryAliases[category] ?? [category];
    const productMatches = productDeals.filter((deal) => includesAny(productText(deal), aliases));
    const newsMatches = newsDeals.filter((deal) => includesAny(newsText(deal), aliases));
    const sampleCampaigns = [...productMatches.slice(0, 1).map((deal) => deal.title), ...newsMatches.slice(0, 1).map((deal) => deal.title)];
    const campaignCount = Number(productMatches.length > 0) + Number(newsMatches.length > 0);
    const queueRows = Math.min(5, productMatches.length) + Math.min(5, newsMatches.length);

    return {
      category,
      campaignCount,
      queueRows,
      sampleCampaigns,
      ready: queueRows > 0,
      action: queueRows > 0 ? `${category} 관심 세그먼트는 현재 알림 후보로 커버됩니다.` : `${category} 공식 혜택 또는 검증 상품 후보를 보강하세요.`
    };
  });
}

function hasAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

const notificationPreferences = read("lib/notificationPreferences.ts");
const schema = read("docs/supabase-schema.sql");
const pushReadiness = read("lib/pushReadiness.ts");
const pushNotifications = read("lib/pushNotifications.ts");
const notificationCampaigns = read("lib/notificationCampaigns.ts");
const adminPushReadinessRoute = read("app/api/admin/push-readiness/route.ts");
const adminPushSendRoute = read("app/api/admin/push/send/route.ts");
const adminPushDryRunPanel = read("components/AdminPushDryRunPanel.tsx");
const adminPage = read("app/admin/page.tsx");
const runbook = read("docs/RUNBOOK.md");
const productQuality = readJson("reports/product-quality.json", {});
const newsQuality = readJson("reports/news-deals.json", {});
const refreshAll = readJson("reports/refresh-all.json", {});
const mockDealsSource = read("data/mockDeals.ts");
const newsSnapshot = readJson("data/refreshedNewsDeals.json", {});

const productDeals = extractProductDeals(mockDealsSource);
const visibleNewsDeals = (Array.isArray(newsSnapshot.deals) && newsSnapshot.deals.length ? newsSnapshot.deals : newsSnapshot.allDeals ?? []).filter(isVisibleNewsDeal);
const categories = extractNotificationCategories(notificationPreferences);
const segmentCoverage = buildSegmentCoverage(categories, productDeals, visibleNewsDeals);
const readySegments = segmentCoverage.filter((segment) => segment.ready);
const weakSegments = segmentCoverage.filter((segment) => !segment.ready);
const campaignRows = campaignProfiles.map((profile) => ({
  ...profile,
  rowCount: countCampaignRows(profile, productDeals, visibleNewsDeals),
  readiness: countCampaignRows(profile, productDeals, visibleNewsDeals) > 0 ? "dry_run_ready" : "needs_candidates"
}));
const queueRows = campaignRows.reduce((sum, campaign) => sum + campaign.rowCount, 0);
const pushConfigured = process.env.PUSH_SEND_ENABLED === "true" && Boolean(process.env.FCM_SERVER_KEY?.trim());
const totalProductDeals = Number(productQuality.totalProducts ?? refreshAll.productDealsCount ?? 0);
const visibleProductDeals = Number(
  productQuality.visibleProducts ?? refreshAll.visibleProductDealsCount ?? refreshAll.publishableProductDealsCount ?? refreshAll.productDealsCount ?? 0
);
const checks = [
  totalProductDeals >= 140 && visibleProductDeals >= 120
    ? pass("verified product base", `전체 감사 상품 ${totalProductDeals}개, 고객 노출 가능 상품 ${visibleProductDeals}개를 알림 후보로 사용할 수 있습니다.`)
    : fail("verified product base", `전체 감사 상품 ${totalProductDeals}개, 고객 노출 가능 상품 ${visibleProductDeals}개입니다. 노출 가능 상품은 120개 이상이어야 합니다.`),
  Number(newsQuality.visibleCount ?? refreshAll.newsDealsCount ?? 0) >= 50
    ? pass("official benefit base", "공식 혜택 50개 이상을 알림 후보로 사용할 수 있습니다.")
    : fail("official benefit base", "공식 혜택 알림 후보가 50개 미만입니다."),
  readySegments.length >= 10
    ? pass("interest segment coverage", `${readySegments.length}/${categories.length} 관심 세그먼트가 알림 후보를 가집니다.`)
    : fail("interest segment coverage", `${readySegments.length}/${categories.length} 관심 세그먼트만 준비됐습니다.`),
  queueRows >= 30
    ? pass("push queue candidate rows", `${queueRows}개 dry-run 큐 후보가 있습니다.`)
    : fail("push queue candidate rows", `dry-run 큐 후보가 부족합니다: ${queueRows}`),
  hasAll(schema, ["push_subscriptions", "push_notification_queue", "price_drop_alerts", "enable row level security"])
    ? pass("database schema", "push_subscriptions, push_notification_queue, price_drop_alerts와 RLS가 준비됐습니다.")
    : fail("database schema", "푸시 관련 DB 스키마 또는 RLS가 부족합니다."),
  hasAll(pushReadiness, ["consentChecklist", "segmentCoverage", "push_subscriptions", "push_notification_queue"])
    ? pass("readiness model", "동의/철회, 세그먼트, 큐, DB 테이블 준비도 모델이 있습니다.")
    : fail("readiness model", "푸시 준비도 모델 필드가 부족합니다."),
  hasAll(notificationCampaigns, ["buildNotificationCampaigns", "buildOfficialBenefitNotificationCampaigns", "toPushQueueRows"])
    ? pass("campaign queue builder", "상품 특가와 공식 혜택 알림 캠페인 큐 빌더가 있습니다.")
    : fail("campaign queue builder", "알림 캠페인 큐 빌더가 부족합니다."),
  hasAll(pushNotifications, ["dryRun", "PUSH_SEND_ENABLED", "FCM_SERVER_KEY"])
    ? pass("safe send adapter", "FCM 발송은 환경변수와 dry-run 기준으로 보호됩니다.")
    : fail("safe send adapter", "FCM 발송 안전장치가 부족합니다."),
  hasAll(adminPushReadinessRoute, ["canAccessAdmin", "buildPushSubscriptionReadiness", "rateLimit"]) &&
    hasAll(adminPushSendRoute, ["canAccessAdmin", "sendPushNotification", "dryRun"]) &&
    hasAll(adminPage, ["푸시 구독·동의 준비도", "AdminPushDryRunPanel"]) &&
    hasAll(adminPushDryRunPanel, ["FCM 테스트 발송 dry-run", "dry-run으로만 검증"])
    ? pass("admin operation", "관리자 API와 화면에서 준비도와 dry-run을 확인할 수 있습니다.")
    : fail("admin operation", "관리자 푸시 운영 화면/API가 부족합니다."),
  runbook.includes("/api/admin/push-readiness") && runbook.includes("push_notification_queue")
    ? pass("runbook", "운영 runbook에 push readiness와 큐 처리 기준이 있습니다.")
    : fail("runbook", "운영 runbook에 푸시 준비 절차가 부족합니다.")
];
const failedChecks = checks.filter((check) => !check.ok);
const readinessScore = Math.min(
  100,
  Math.round(checks.filter((check) => check.ok).length * 8 + readySegments.length * 1.2 + Math.min(20, queueRows * 0.4))
);
const launchStatus =
  pushConfigured && failedChecks.length === 0 && weakSegments.length === 0
    ? "send_ready"
    : failedChecks.length === 0 && queueRows >= 30
      ? "dry_run_ready"
      : "needs_work";
const report = {
  ok: launchStatus !== "needs_work",
  generatedAt: new Date().toISOString(),
  launchStatus,
  readinessScore,
  push: {
    enabled: process.env.PUSH_SEND_ENABLED === "true",
    hasServerKey: Boolean(process.env.FCM_SERVER_KEY?.trim()),
    configured: pushConfigured,
    requiredEnv: ["PUSH_SEND_ENABLED=true", "FCM_SERVER_KEY"]
  },
  productDeals: visibleProductDeals,
  totalProductDeals,
  officialBenefits: Number(newsQuality.visibleCount ?? refreshAll.newsDealsCount ?? visibleNewsDeals.length),
  totalCampaigns: campaignRows.length,
  enabledCampaigns: campaignRows.filter((campaign) => campaign.rowCount > 0).length,
  queueRows,
  criticalCampaigns: campaignRows.filter((campaign) => campaign.priority === "critical" && campaign.rowCount > 0).length,
  officialBenefitCampaigns: campaignRows.filter((campaign) => campaign.sourceKind === "official_benefit" && campaign.rowCount > 0).length,
  productCampaigns: campaignRows.filter((campaign) => campaign.sourceKind === "product_deal" && campaign.rowCount > 0).length,
  readySegments: readySegments.length,
  weakSegments: weakSegments.length,
  segmentCoverage,
  campaignRows,
  consentChecklist: [
    { key: "explicit_consent", label: "명시적 알림 동의", ready: true, evidence: "profiles.notification_consent, push_subscriptions.consent_at" },
    { key: "revocation", label: "동의 철회", ready: true, evidence: "push_subscriptions.enabled=false, revoked_at" },
    { key: "category_preferences", label: "관심 카테고리 구독", ready: readySegments.length >= 10, evidence: "notificationCategoryOptions, push_subscriptions.interest_categories" },
    { key: "dry_run_first", label: "발송 전 dry-run", ready: queueRows >= 30, evidence: "POST /api/admin/push/send dryRun=true" },
    { key: "no_permission_request_v1", label: "V1 권한 요청 보류", ready: true, evidence: "앱 내 알림 큐를 먼저 제공하고 실제 푸시는 별도 동의 후 활성화" }
  ],
  databaseTables: [
    { table: "profiles", ready: schema.includes("notification_consent"), purpose: "알림/마케팅 동의와 관심 카테고리 저장" },
    { table: "push_subscriptions", ready: schema.includes("push_subscriptions") && schema.includes("consent_at") && schema.includes("revoked_at"), purpose: "FCM/Web Push 토큰, 동의/철회, 관심 카테고리 저장" },
    { table: "push_notification_queue", ready: schema.includes("push_notification_queue") && schema.includes("dry_run_only"), purpose: "상품/공식 혜택 알림 후보 큐" },
    { table: "price_drop_alerts", ready: schema.includes("price_drop_alerts"), purpose: "가격 하락 알림 조건 저장" }
  ],
  checks,
  issues: failedChecks.map((check) => `${check.name}: ${check.detail}`),
  nextActions: [
    pushConfigured ? "테스트 토큰으로 dry-run 후 소량 실제 발송 검증" : "FCM 키 설정 전까지는 앱 내 알림 큐와 dry-run만 운영",
    weakSegments.length ? `${weakSegments.slice(0, 3).map((segment) => segment.category).join(", ")} 세그먼트 후보 보강` : "관심 카테고리 세그먼트 커버리지 유지",
    "알림 권한 요청은 사용자가 찜, 가격 알림, 관심 카테고리를 저장한 뒤 명시 동의 플로우에서만 노출"
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportJsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# Push Readiness Report",
  "",
  "할인도사의 실제 FCM 발송 전 준비 상태를 파일로 남기는 운영 리포트입니다. V1은 사용자 권한 요청 없이 앱 안의 알림 큐와 dry-run을 먼저 운영합니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 상태: ${report.launchStatus}`,
  `- 준비도: ${report.readinessScore}/100`,
  `- 검증 상품 후보: ${report.productDeals}`,
  `- 공식 혜택 후보: ${report.officialBenefits}`,
  `- 캠페인 후보: ${report.enabledCampaigns}/${report.totalCampaigns}`,
  `- 큐 후보 행: ${report.queueRows}`,
  `- 관심 세그먼트: ${report.readySegments}/${report.segmentCoverage.length}`,
  `- FCM 설정: ${report.push.configured ? "configured" : "dry-run only"}`,
  "",
  "## Checks",
  "",
  "| Check | Status | Detail |",
  "| --- | --- | --- |",
  ...report.checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail} |`),
  "",
  "## Campaign Rows",
  "",
  "| Campaign | Source | Alert | Priority | Rows | Status |",
  "| --- | --- | --- | --- | ---: | --- |",
  ...report.campaignRows.map((campaign) => `| ${campaign.label} | ${campaign.sourceKind} | ${campaign.alertType} | ${campaign.priority} | ${campaign.rowCount} | ${campaign.readiness} |`),
  "",
  "## Segment Coverage",
  "",
  "| Segment | Rows | Campaigns | Sample | Action |",
  "| --- | ---: | ---: | --- | --- |",
  ...report.segmentCoverage.map((segment) => `| ${segment.category} | ${segment.queueRows} | ${segment.campaignCount} | ${segment.sampleCampaigns.join(", ") || "-"} | ${segment.action} |`),
  "",
  "## Next Actions",
  "",
  ...report.nextActions.map((action) => `- ${action}`),
  ""
];
writeFileSync(join(root, reportDocsPath), `${docsLines.join("\n")}\n`, "utf8");

if (!report.ok) {
  console.error("Push readiness report failed.");
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Push readiness report written.");
console.log(`- ${reportJsonPath}`);
console.log(`- ${reportDocsPath}`);
console.log(`- status: ${report.launchStatus}`);
console.log(`- readinessScore: ${report.readinessScore}`);
console.log(`- queueRows: ${report.queueRows}`);
