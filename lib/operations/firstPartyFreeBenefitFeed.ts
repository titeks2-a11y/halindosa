import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface FirstPartyFeedSourceItem {
  id?: string;
  title?: string;
  summary?: string;
  category?: string;
  benefitType?: string;
  mallName?: string;
  merchant?: string;
  sourceName?: string;
  source?: string;
  tags?: string[];
  publishable?: boolean;
  isHidden?: boolean;
  availability?: string;
  validationStatus?: string;
  validationReason?: string;
  hiddenReason?: string;
  linkType?: string;
  finalUrl?: string;
  claimUrl?: string;
  eventUrl?: string;
  sourceUrl?: string;
  expiresAt?: string;
  endDate?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  updatedAt?: string;
  qualityScore?: number;
  priorityScore?: number;
  freshnessScore?: number;
}

export interface FirstPartyFreeBenefitCandidate {
  id: string;
  title: string;
  brand: string;
  benefitType: string;
  finalUrl: string;
  claimUrl: string;
  expiresAt: string;
  qualityScore: number;
  freshnessScore: number;
  verifiedAt: string;
}

export interface FirstPartyFreeBenefitFeedReport {
  ok: boolean;
  generatedAt: string;
  source: string;
  feedEndpoint: string;
  summary: {
    totalItems: number;
    publishableItems: number;
    consumerPublishableItems: number;
    publicPolicyPublishableItems: number;
    hiddenOrInvalidItems: number;
    blockedSearchLinkItems: number;
    homepageLikeItems: number;
    expiredItems: number;
    duplicateGroups: number;
    officialRate: number;
    averageQualityScore: number;
  };
  categoryCounts: Array<{ id: string; count: number }>;
  consumerCategoryCounts: Array<{ id: string; count: number }>;
  hostCounts: Array<{ id: string; count: number }>;
  consumerHostCounts: Array<{ id: string; count: number }>;
  duplicateGroups: Array<{ key: string; ids: string[]; count: number }>;
  excludedSamples: Array<{ id?: string; title?: string; reason: string; finalUrl?: string }>;
  topCandidates: FirstPartyFreeBenefitCandidate[];
}

const blockedUrlPattern =
  /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const homepagePathPattern = /^\/?(?:index\.(?:html?|php|jsp))?$/i;
const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진/i;
const publicPolicyPattern = /정부|공공|복지|K-MOOC|HRD|고용|문화가 있는 날|서울시|정부24|복지로/i;

function readJson(path: string, fallback: unknown) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return fallback;
  }
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "");
}

function parseUrl(value: unknown) {
  try {
    const parsed = new URL(String(value ?? ""));
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getFinalUrl(item: FirstPartyFeedSourceItem) {
  return item.finalUrl || item.eventUrl || item.sourceUrl || "";
}

function getClaimUrl(item: FirstPartyFeedSourceItem) {
  return item.claimUrl || item.finalUrl || item.eventUrl || item.sourceUrl || "";
}

function isHomepageLikeUrl(value: unknown) {
  const parsed = parseUrl(value);
  if (!parsed) return true;
  return homepagePathPattern.test(parsed.pathname.replace(/\/+$/, ""));
}

function isPublicPolicyItem(item: FirstPartyFeedSourceItem) {
  return publicPolicyPattern.test(`${item.category ?? ""} ${item.mallName ?? ""} ${item.merchant ?? ""} ${item.title ?? ""}`);
}

function isActivePublishable(item: FirstPartyFeedSourceItem, nowMs: number) {
  const finalUrl = getFinalUrl(item);
  const parsed = parseUrl(finalUrl);
  const endMs = Date.parse(item.expiresAt || item.endDate || "");
  const text = `${item.title ?? ""} ${item.summary ?? ""} ${item.validationReason ?? ""} ${item.hiddenReason ?? ""}`;
  return (
    Boolean(parsed) &&
    item.publishable === true &&
    item.isHidden !== true &&
    item.availability === "active" &&
    item.validationStatus === "passed" &&
    item.linkType !== "search" &&
    !blockedUrlPattern.test(finalUrl) &&
    !isHomepageLikeUrl(finalUrl) &&
    !endedTextPattern.test(text) &&
    (!Number.isFinite(endMs) || endMs >= nowMs)
  );
}

function canonicalBenefitBuckets(item: FirstPartyFeedSourceItem, nowMs: number) {
  const haystack = `${item.title ?? ""} ${item.summary ?? ""} ${item.benefitType ?? ""} ${Array.isArray(item.tags) ? item.tags.join(" ") : ""}`;
  const buckets = new Set<string>();
  const type = String(item.benefitType ?? "");
  if (/전원|모두|100%|전체\s*지급|freebie/i.test(haystack)) buckets.add("everyone");
  if (/선착순|한정|소진\s*시|first/i.test(haystack)) buckets.add("firstCome");
  if (/coupon|쿠폰|card|membership|멤버십/i.test(type) || /쿠폰|멤버십|카드/i.test(haystack)) buckets.add("coupon");
  if (/sample|샘플|체험팩/i.test(haystack)) buckets.add("sample");
  if (/freeTrial|무료\s*체험/i.test(haystack)) buckets.add("freeTrial");
  if (/gifticon|기프티콘|초대권/i.test(haystack)) buckets.add("gifticon");
  if (/point|cashback|포인트|캐시백|페이/i.test(haystack)) buckets.add("pointCashback");
  if (/freeShipping|무료\s*배송|무배/i.test(haystack)) buckets.add("freeShipping");
  if (/signup|신규|가입|웰컴/i.test(haystack)) buckets.add("signup");

  const endMs = Date.parse(item.expiresAt || item.endDate || "");
  if (Number.isFinite(endMs)) {
    const hoursLeft = (endMs - nowMs) / 36e5;
    if (hoursLeft >= 0 && hoursLeft <= 24) buckets.add("today");
    if (hoursLeft >= 0 && hoursLeft <= 24 * 7) buckets.add("week");
  }

  if (!buckets.size) buckets.add("brandEvent");
  return Array.from(buckets);
}

function topCounts(values: Array<string | undefined>, limit = 12) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "ko"))
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

function dedupeKey(item: FirstPartyFeedSourceItem) {
  const finalUrl = parseUrl(getFinalUrl(item));
  const domain = finalUrl?.hostname.replace(/^www\./, "").toLowerCase() ?? "";
  return [
    normalizeKey(item.title),
    normalizeKey(item.mallName || item.merchant || item.sourceName),
    domain,
    normalizeKey(item.benefitType),
    item.expiresAt || item.endDate || ""
  ].join("|");
}

function toItems(payload: unknown): FirstPartyFeedSourceItem[] {
  if (Array.isArray(payload)) return payload as FirstPartyFeedSourceItem[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { deals?: unknown }).deals)) {
    return (payload as { deals: FirstPartyFeedSourceItem[] }).deals;
  }
  return [];
}

export function buildFirstPartyFreeBenefitFeedReport(): FirstPartyFreeBenefitFeedReport {
  const now = Date.now();
  const generatedAt = new Date(now).toISOString();
  const source = "data/refreshedNewsDeals.json";
  const payload = readJson(join(process.cwd(), source), []);
  const items = toItems(payload);
  const activePublishable = items.filter((item) => isActivePublishable(item, now));
  const consumerPublishable = activePublishable.filter((item) => !isPublicPolicyItem(item));
  const publicPolicyPublishable = activePublishable.filter((item) => isPublicPolicyItem(item));
  const hiddenOrInvalid = items.filter((item) => !isActivePublishable(item, now));
  const blockedSearchLinks = items.filter((item) => blockedUrlPattern.test(getFinalUrl(item)));
  const homepageLinks = items.filter((item) => isHomepageLikeUrl(getFinalUrl(item)));
  const expiredItems = items.filter((item) => {
    const endMs = Date.parse(item.expiresAt || item.endDate || "");
    return Number.isFinite(endMs) && endMs < now;
  });
  const duplicateGroups = Array.from(activePublishable.reduce((acc, item) => {
    const key = dedupeKey(item);
    const group = acc.get(key) ?? [];
    group.push(String(item.id ?? ""));
    acc.set(key, group);
    return acc;
  }, new Map<string, string[]>()).entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, ids, count: ids.length }));

  const categoryCounts = topCounts(activePublishable.flatMap((item) => canonicalBenefitBuckets(item, now)), 20);
  const consumerCategoryCounts = topCounts(consumerPublishable.flatMap((item) => canonicalBenefitBuckets(item, now)), 20);
  const hostCounts = topCounts(
    activePublishable.map((item) => parseUrl(getFinalUrl(item))?.hostname.replace(/^www\./, "").toLowerCase()),
    20
  );
  const consumerHostCounts = topCounts(
    consumerPublishable.map((item) => parseUrl(getFinalUrl(item))?.hostname.replace(/^www\./, "").toLowerCase()),
    20
  );
  const topCandidates = consumerPublishable
    .slice()
    .sort(
      (a, b) =>
        Number(b.qualityScore ?? b.priorityScore ?? 0) - Number(a.qualityScore ?? a.priorityScore ?? 0) ||
        Date.parse(b.verifiedAt || b.lastCheckedAt || b.updatedAt || "") - Date.parse(a.verifiedAt || a.lastCheckedAt || a.updatedAt || "")
    )
    .slice(0, 20)
    .map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? ""),
      brand: String(item.mallName || item.merchant || item.sourceName || ""),
      benefitType: String(item.benefitType ?? ""),
      finalUrl: getFinalUrl(item),
      claimUrl: getClaimUrl(item),
      expiresAt: item.expiresAt || item.endDate || "",
      qualityScore: Number(item.qualityScore ?? item.priorityScore ?? 0),
      freshnessScore: Number(item.freshnessScore ?? 0),
      verifiedAt: item.verifiedAt || item.lastCheckedAt || item.updatedAt || ""
    }));

  return {
    ok:
      activePublishable.length >= 100 &&
      consumerPublishable.length >= 80 &&
      blockedSearchLinks.filter((item) => activePublishable.includes(item)).length === 0 &&
      homepageLinks.filter((item) => activePublishable.includes(item)).length === 0 &&
      duplicateGroups.length === 0 &&
      topCandidates.every((item) => !publicPolicyPattern.test(`${item.brand ?? ""} ${item.title ?? ""}`)),
    generatedAt,
    source,
    feedEndpoint: "/api/feeds/free-benefits",
    summary: {
      totalItems: items.length,
      publishableItems: activePublishable.length,
      consumerPublishableItems: consumerPublishable.length,
      publicPolicyPublishableItems: publicPolicyPublishable.length,
      hiddenOrInvalidItems: hiddenOrInvalid.length,
      blockedSearchLinkItems: blockedSearchLinks.length,
      homepageLikeItems: homepageLinks.length,
      expiredItems: expiredItems.length,
      duplicateGroups: duplicateGroups.length,
      officialRate: activePublishable.length
        ? Math.round((activePublishable.filter((item) => /official/i.test(`${item.source ?? ""} ${item.linkType ?? ""}`)).length / activePublishable.length) * 100)
        : 0,
      averageQualityScore: activePublishable.length
        ? Math.round(activePublishable.reduce((sum, item) => sum + Number(item.qualityScore ?? item.priorityScore ?? 0), 0) / activePublishable.length)
        : 0
    },
    categoryCounts,
    consumerCategoryCounts,
    hostCounts,
    consumerHostCounts,
    duplicateGroups,
    excludedSamples: hiddenOrInvalid.slice(0, 30).map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.hiddenReason || item.validationReason || item.validationStatus || item.availability || "not_publishable",
      finalUrl: getFinalUrl(item)
    })),
    topCandidates
  };
}

export function buildFirstPartyFreeBenefitFeedCsv(report = buildFirstPartyFreeBenefitFeedReport()) {
  const rows = [
    ["section", "id", "title", "brand", "benefitType", "count", "qualityScore", "claimUrl", "url"],
    ...report.consumerHostCounts.map((row) => ["consumer_host", row.id, "", "", "", String(row.count), "", "", ""]),
    ...report.consumerCategoryCounts.map((row) => ["consumer_category", row.id, "", "", "", String(row.count), "", "", ""]),
    ...report.topCandidates.map((item) => [
      "top_candidate",
      item.id,
      item.title,
      item.brand,
      item.benefitType,
      "",
      String(item.qualityScore),
      item.claimUrl,
      item.finalUrl
    ])
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
}
