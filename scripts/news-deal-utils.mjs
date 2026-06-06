import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const root = process.cwd();
export const reportsDir = join(root, "reports");
export const dataDir = join(root, "data");

mkdirSync(reportsDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const approvedHosts = [
  "gs25.gsretail.com",
  "cu.bgfretail.com",
  "www.culture.go.kr",
  "culture.go.kr",
  "www.tworld.co.kr",
  "tworld.co.kr",
  "www.cgv.co.kr",
  "cgv.co.kr",
  "www.lottecinema.co.kr",
  "lottecinema.co.kr",
  "www.koreanair.com",
  "koreanair.com",
  "www.ssg.com",
  "www.emart.com",
  "www.homeplus.co.kr",
  "www.hyundaihmall.com",
  "www.bccard.com",
  "card.kbcard.com",
  "www.shinhancard.com",
  "new-m.pay.naver.com",
  "pay.naver.com",
  "www.yogiyo.co.kr",
  "www.musinsa.com",
  "www.lotteon.com",
  "www.oliveyoung.co.kr",
  "www.e-himart.co.kr",
  "point.pay.naver.com",
  "www.samsung.com",
  "www.mnuri.kr"
];

function readCatalogApprovedHosts() {
  const catalogPath = join(dataDir, "officialSourceCatalog.json");
  if (!existsSync(catalogPath)) return [];

  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    if (!Array.isArray(catalog)) return [];

    return catalog
      .flatMap((source) => [source?.officialUrl, ...(Array.isArray(source?.allowedFinalHosts) ? source.allowedFinalHosts : [])])
      .map((value) => {
        try {
          return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

const approvedHostSet = new Set([
  ...approvedHosts.map((host) => host.replace(/^www\./, "").toLowerCase()),
  ...readCatalogApprovedHosts()
]);

const blockedHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "dcinside.com",
  "theqoo.net",
  "blog.naver.com",
  "m.blog.naver.com",
  "news.naver.com",
  "v.daum.net",
  "news.daum.net",
  "youtube.com",
  "www.youtube.com",
  "example.com"
];

const searchPatterns = [
  "/search",
  "search?",
  "query=",
  "keyword=",
  "shopping/search",
  "msearch",
  "/find",
  "/result",
  "sword=",
  "kwd="
];

const spamWords = ["광고문의", "협찬", "체험단 모집 대행", "고수익 보장", "클릭만 하면", "무조건 지급"];
const unclearWords = ["확인 필요", "추정", "소문", "커뮤니티", "제보", "단독 기사"];
const generatedNewsBenefitImages = {
  "식품/생필품": "/deal-images/category-food.svg",
  "마트/편의점": "/deal-images/category-coupon.svg",
  "디지털/가전": "/deal-images/category-digital.svg",
  "패션/뷰티": "/deal-images/category-beauty.svg",
  "외식/배달": "/deal-images/category-coupon.svg",
  "여행/숙박": "/deal-images/category-travel.svg",
  "영화/문화": "/deal-images/category-coupon.svg",
  "카드/멤버십": "/deal-images/category-coupon.svg",
  "무료혜택": "/deal-images/category-coupon.svg",
  "정부/공공혜택": "/deal-images/category-etc.svg",
  "기타": "/deal-images/category-etc.svg"
};

export function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

export function writeJson(path, payload) {
  writeFileSync(join(root, path), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCdata(value) {
  return String(value ?? "").replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeXmlEntities(value) {
  return stripCdata(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function xmlTagPattern(name) {
  const escaped = escapeRegExp(name);
  return name.includes(":") ? escaped : `(?:[\\w.-]+:)?${escaped}`;
}

function extractXmlTag(block, names) {
  for (const name of names) {
    const pattern = xmlTagPattern(name);
    const match = block.match(new RegExp(`<${pattern}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${pattern}>`, "i"));
    if (match?.[1]) return cleanText(decodeXmlEntities(match[1]));
  }
  return "";
}

function extractXmlTagRaw(block, names) {
  for (const name of names) {
    const pattern = xmlTagPattern(name);
    const match = block.match(new RegExp(`<${pattern}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${pattern}>`, "i"));
    if (match?.[1]) return decodeXmlEntities(stripCdata(match[1])).trim();
  }
  return "";
}

function extractAtomLinkHref(block) {
  const alternate = block.match(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\/?>/i);
  if (alternate?.[1]) return cleanText(decodeXmlEntities(alternate[1]));

  const first = block.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\/?>/i);
  return first?.[1] ? cleanText(decodeXmlEntities(first[1])) : "";
}

function extractUrlCandidates(value) {
  const candidates = new Set();
  const hrefPattern = /\bhref=["']([^"']+)["']/gi;
  const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
  let match = hrefPattern.exec(String(value ?? ""));

  while (match) {
    candidates.add(cleanText(decodeXmlEntities(match[1])));
    match = hrefPattern.exec(String(value ?? ""));
  }

  match = urlPattern.exec(String(value ?? ""));
  while (match) {
    candidates.add(cleanText(decodeXmlEntities(match[0])));
    match = urlPattern.exec(String(value ?? ""));
  }

  return [...candidates].map((candidate) => candidate.replace(/[),.;\]]+$/, "")).filter(Boolean);
}

function extractOfficialUrlFromXmlBlock(block) {
  const rawFields = [
    extractXmlTagRaw(block, ["finalUrl", "final-url", "final_url", "eventUrl", "event-url", "event_url", "purchaseUrl", "purchase-url", "purchase_url"]),
    extractXmlTagRaw(block, ["description", "summary", "content", "content:encoded"]),
    extractXmlTagRaw(block, ["link"]),
    extractAtomLinkHref(block)
  ];

  return rawFields.flatMap(extractUrlCandidates).find(isApprovedOfficialUrl) ?? "";
}

function splitTags(value) {
  return cleanText(value)
    .split(/[,/|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function collectXmlBlocks(xml, pattern) {
  const blocks = [];
  let match = pattern.exec(xml);

  while (match) {
    blocks.push(match[0]);
    match = pattern.exec(xml);
  }

  return blocks;
}

function toNumber(value, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function isGeneratedNewsBenefitImage(value) {
  return /^\/deal-images\/category-[a-z-]+\.svg$/.test(String(value ?? ""));
}

function resolveNewsBenefitImage({ imageUrl, category, benefitType }) {
  const cleanedImageUrl = cleanText(imageUrl);
  if (cleanedImageUrl) {
    return {
      imageUrl: cleanedImageUrl,
      imageType: isGeneratedNewsBenefitImage(cleanedImageUrl) ? "generated" : "official"
    };
  }

  const generatedImage =
    generatedNewsBenefitImages[category] ||
    (benefitType === "travel" ? generatedNewsBenefitImages["여행/숙박"] : "") ||
    (["card", "membership", "coupon", "point"].includes(benefitType) ? generatedNewsBenefitImages["카드/멤버십"] : "") ||
    generatedNewsBenefitImages["기타"];

  return {
    imageUrl: generatedImage,
    imageType: generatedImage ? "generated" : "fallback"
  };
}

function normalizeHost(urlValue) {
  try {
    return new URL(urlValue).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isApprovedOfficialUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return false;
    return [...approvedHostSet].some((approved) => host === approved || host.endsWith(`.${approved}`));
  } catch {
    return false;
  }
}

function isSearchUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
    if (/event|benefit|campaign|coupon|promotion|membership|wday|culture-event/i.test(value)) return false;
    return searchPatterns.some((pattern) => value.includes(pattern));
  } catch {
    return true;
  }
}

function isHomeOnlyUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return ["", "/", "/main", "/index"].includes(path);
  } catch {
    return true;
  }
}

function isBlockedUrl(urlValue) {
  const host = normalizeHost(urlValue);
  return blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function resolveNewsLinkType(deal) {
  const finalUrl = String(deal.finalUrl ?? "");
  if (!finalUrl) return "invalid";
  if (isBlockedUrl(finalUrl)) return "community";
  if (isSearchUrl(finalUrl)) return "search";
  if (!isApprovedOfficialUrl(finalUrl)) return "news_only";
  if (["coupon", "card", "membership", "point", "freeShipping"].includes(deal.benefitType)) return "official_coupon";
  if (["culture", "travel", "public", "freebie", "foodDelivery", "event", "convenienceStore", "mart"].includes(deal.benefitType)) return "official_benefit";
  return "official_event";
}

function resolveAvailability(endDate, now) {
  const endsAt = Date.parse(endDate);
  if (!Number.isFinite(endsAt)) return "unknown";
  return endsAt < now ? "expired" : "active";
}

function getNewsValidationCode({ reasons, linkType, availability }) {
  if (!reasons.length && availability === "active" && String(linkType).startsWith("official")) return "valid";
  if (availability === "expired" || reasons.includes("expired_event")) return "stale";
  if (reasons.includes("search_or_result_url") || linkType === "search") return "search_link";
  if (reasons.includes("home_or_landing_url")) return "homepage_link";
  if (reasons.includes("blocked_community_or_news_host") || linkType === "community") return "community_link";
  if (reasons.includes("missing_final_url")) return "missing_final_url";
  if (reasons.includes("not_approved_official_url") || linkType === "invalid") return "unsafe_url";
  if (reasons.includes("low_confidence") || reasons.includes("unclear_benefit_condition")) return "mismatch";
  if (reasons.includes("manual_hidden")) return "hidden";
  return "invalid";
}

function scoreNewsDeal(deal, { reasons = [], availability = "unknown", linkType = "invalid", now = Date.now() } = {}) {
  const endsAt = Date.parse(deal.endDate);
  const daysLeft = Number.isFinite(endsAt) ? Math.max(0, Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000))) : 999;
  const benefitSignal =
    deal.discountRate > 0 ||
    deal.couponAmount > 0 ||
    ["freebie", "coupon", "freeShipping", "event", "membership", "card", "culture", "travel", "public", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.benefitType);
  const directOfficialBonus = linkType.startsWith("official") ? 18 : -35;
  const freshnessBonus = daysLeft <= 14 ? 8 : daysLeft <= 45 ? 5 : 2;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(deal.confidenceScore ?? 50) +
          directOfficialBonus +
          (availability === "active" ? 12 : -30) +
          (benefitSignal ? 8 : -8) +
          (deal.summary.length >= 30 ? 5 : -5) +
          freshnessBonus -
          reasons.length * 10
      )
    )
  );
}

function scoreNewsDealQuality(deal, { reasons = [], availability = "unknown", linkType = "invalid", now = Date.now() } = {}) {
  const verifiedAt = Date.parse(deal.verifiedAt);
  const freshnessHours = Number.isFinite(verifiedAt) ? Math.max(0, (now - verifiedAt) / (60 * 60 * 1000)) : 999;
  const imageBonus = deal.imageType === "official" ? 14 : deal.imageType === "generated" ? 8 : -25;
  const linkBonus = linkType.startsWith("official") ? 18 : -45;
  const availabilityBonus = availability === "active" ? 14 : -35;
  const freshnessBonus = freshnessHours <= 24 ? 12 : freshnessHours <= 72 ? 8 : freshnessHours <= 168 ? 4 : -8;
  const conditionBonus = deal.summary.length >= 30 && deal.sourceName && deal.endDate ? 8 : -6;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(deal.confidenceScore ?? 50) +
          imageBonus +
          linkBonus +
          availabilityBonus +
          freshnessBonus +
          conditionBonus -
          reasons.length * 9
      )
    )
  );
}

function canonicalKey(deal) {
  try {
    const url = new URL(deal.finalUrl);
    url.hash = "";
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname}${url.search}`;
  } catch {
    return `${deal.merchant}-${deal.title}`.toLowerCase();
  }
}

export function normalizeNewsDeal(raw, nowIso = new Date().toISOString()) {
  const title = cleanText(raw.title);
  const summary = cleanText(raw.summary ?? raw.description);
  const merchant = cleanText(raw.merchant ?? raw.mallName ?? raw.sourceName);
  const finalUrl = cleanText(raw.finalUrl ?? raw.eventUrl ?? raw.sourceUrl ?? raw.url);
  const endDate = cleanText(raw.endDate ?? raw.expireAt ?? raw.expiresAt);
  const startDate = cleanText(raw.startDate ?? raw.createdAt) || nowIso.slice(0, 10);
  const provider = cleanText(raw.provider) || "news";
  const sourceName = cleanText(raw.sourceName) || merchant;
  const originalUrl = cleanText(raw.originalUrl ?? raw.sourceUrl ?? raw.url) || finalUrl;
  const eventUrl = cleanText(raw.eventUrl) || finalUrl;
  const category = cleanText(raw.category) || "무료혜택";
  const benefitType = cleanText(raw.benefitType) || "discount";
  const resolvedImage = resolveNewsBenefitImage({
    imageUrl: raw.imageUrl,
    category,
    benefitType
  });

  return {
    id: cleanText(raw.id) || `news-${Buffer.from(`${merchant}-${title}-${finalUrl}`).toString("base64url").slice(0, 18)}`,
    title,
    summary,
    merchant,
    mallName: merchant,
    category,
    benefitType,
    discountRate: toNumber(raw.discountRate),
    price: toNumber(raw.price),
    originalPrice: toNumber(raw.originalPrice),
    couponAmount: toNumber(raw.couponAmount),
    startDate,
    endDate,
    expiresAt: cleanText(raw.expiresAt ?? raw.expireAt ?? raw.endDate) || endDate,
    updatedAt: cleanText(raw.updatedAt ?? raw.lastCheckedAt) || nowIso,
    verifiedAt: cleanText(raw.verifiedAt ?? raw.lastCheckedAt) || nowIso,
    sourceName,
    sourceUrl: cleanText(raw.sourceUrl) || finalUrl,
    source: cleanText(raw.source) || provider,
    originalUrl,
    affiliateUrl: cleanText(raw.affiliateUrl),
    eventUrl,
    finalUrl,
    linkType: cleanText(raw.linkType) || "invalid",
    availability: cleanText(raw.availability) || "unknown",
    imageUrl: resolvedImage.imageUrl,
    imageType: cleanText(raw.imageType) || resolvedImage.imageType,
    confidenceScore: toNumber(raw.confidenceScore, 50),
    qualityScore: toNumber(raw.qualityScore, 0),
    priorityScore: toNumber(raw.priorityScore, 0),
    validationStatus: "needs_review",
    validationCode: "mismatch",
    validationReason: "pending_validation",
    isHidden: false,
    publishable: false,
    hiddenReason: "",
    lastCheckedAt: nowIso,
    provider,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string") : []
  };
}

export function validateNewsDeal(deal, now = Date.now()) {
  const reasons = [];
  const text = `${deal.title} ${deal.summary} ${deal.tags.join(" ")}`;
  const endsAt = Date.parse(deal.endDate);
  const startsAt = Date.parse(deal.startDate);
  const linkType = resolveNewsLinkType(deal);
  const availability = resolveAvailability(deal.endDate, now);

  if (!deal.title || !deal.summary || !deal.merchant) reasons.push("missing_required_copy");
  if (!deal.finalUrl) reasons.push("missing_final_url");
  if (!isApprovedOfficialUrl(deal.finalUrl)) reasons.push("not_approved_official_url");
  if (isHomeOnlyUrl(deal.finalUrl)) reasons.push("home_or_landing_url");
  if (isSearchUrl(deal.finalUrl)) reasons.push("search_or_result_url");
  if (linkType === "community") reasons.push("blocked_community_or_news_host");
  if (linkType === "news_only") reasons.push("news_or_non_official_landing");
  if (!Number.isFinite(endsAt)) reasons.push("missing_end_date");
  if (Number.isFinite(endsAt) && endsAt < now) reasons.push("expired_event");
  if (Number.isFinite(startsAt) && startsAt > now + 45 * 24 * 60 * 60 * 1000) reasons.push("too_far_future");
  if (deal.confidenceScore < 70) reasons.push("low_confidence");
  if (unclearWords.some((word) => text.includes(word))) reasons.push("unclear_benefit_condition");
  if (spamWords.some((word) => text.includes(word))) reasons.push("spam_or_ad_like_copy");

  const passed = reasons.length === 0;
  const publishable = passed && availability === "active" && linkType.startsWith("official");
  const validationCode = getNewsValidationCode({ reasons, linkType, availability });
  const host = normalizeHost(deal.finalUrl);
  const benefitSignal =
    deal.discountRate > 0 ||
    deal.couponAmount > 0 ||
    ["freebie", "coupon", "freeShipping", "event", "membership", "card", "culture", "travel", "public", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.benefitType);
  const validationReason = passed ? "passed" : reasons.join(",");
  const priorityScore = scoreNewsDeal(deal, { reasons, availability, linkType, now });
  const qualityScore = scoreNewsDealQuality(deal, { reasons, availability, linkType, now });
  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        deal.confidenceScore +
          (isApprovedOfficialUrl(deal.finalUrl) ? 8 : -25) +
          (benefitSignal ? 8 : -8) +
          (deal.summary.length >= 30 ? 5 : -5) +
          (Number.isFinite(endsAt) && endsAt >= now ? 6 : -20) -
          reasons.length * 8
      )
    )
  );

  return {
    ...deal,
    confidenceScore,
    qualityScore,
    priorityScore,
    validationStatus: passed ? "passed" : "failed",
    validationCode,
    validationReason,
    isHidden: !passed,
    publishable,
    hiddenReason: passed ? "" : validationReason,
    lastCheckedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    verifiedAt: passed ? new Date(now).toISOString() : (deal.verifiedAt || ""),
    expiresAt: deal.expiresAt || deal.endDate,
    linkType,
    availability,
    officialHost: host
  };
}

export function dedupeNewsDeals(deals) {
  const unique = new Map();
  for (const deal of deals) {
    const key = canonicalKey(deal);
    const previous = unique.get(key);
    if (!previous || deal.confidenceScore > previous.confidenceScore) unique.set(key, deal);
  }
  return Array.from(unique.values());
}

function countVisibleBy(deals, getKey) {
  return Object.fromEntries(
    deals.reduce((map, deal) => {
      const key = getKey(deal);
      if (!key) return map;
      return map.set(key, (map.get(key) ?? 0) + 1);
    }, new Map())
  );
}

function topKeywordCounts(deals) {
  const counts = new Map();
  const benefitLabels = {
    discount: "할인",
    coupon: "쿠폰",
    freebie: "무료",
    freeShipping: "무료배송",
    event: "이벤트",
    membership: "멤버십",
    card: "카드할인",
    culture: "문화",
    travel: "여행",
    public: "공공혜택",
    point: "포인트",
    foodDelivery: "배달쿠폰",
    convenienceStore: "편의점행사",
    mart: "마트행사"
  };
  const add = (value, weight = 1) => {
    const keyword = cleanText(value);
    if (!keyword || keyword.length > 14) return;
    counts.set(keyword, (counts.get(keyword) ?? 0) + weight);
  };

  for (const deal of deals) {
    add(deal.category, 2);
    add(benefitLabels[deal.benefitType] ?? deal.benefitType, 2);
    add(deal.merchant, 1);
    for (const tag of deal.tags) add(tag, 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([keyword, score]) => ({ keyword, score }));
}

function hoursUntil(endDate, now) {
  const endsAt = Date.parse(endDate);
  if (!Number.isFinite(endsAt)) return Number.POSITIVE_INFINITY;
  return (endsAt - now) / (60 * 60 * 1000);
}

function buildDeadlineSummary(deals, now = Date.now()) {
  const activeDeals = deals.filter((deal) => {
    const hoursLeft = hoursUntil(deal.endDate, now);
    return Number.isFinite(hoursLeft) && hoursLeft >= 0;
  });
  const expiringTodayCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 24).length;
  const expiringThreeDaysCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 72).length;
  const expiringSevenDaysCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 168).length;
  const laterCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) > 168).length;
  const nearestEndDate =
    activeDeals
      .map((deal) => deal.endDate)
      .filter((value) => Number.isFinite(Date.parse(value)))
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? "";

  return {
    expiringTodayCount,
    expiringThreeDaysCount,
    expiringSevenDaysCount,
    laterCount,
    nearestEndDate,
    buckets: [
      { id: "today", label: "오늘 종료", count: expiringTodayCount, maxHours: 24 },
      { id: "threeDays", label: "3일 내", count: expiringThreeDaysCount, maxHours: 72 },
      { id: "sevenDays", label: "7일 내", count: expiringSevenDaysCount, maxHours: 168 },
      { id: "later", label: "여유 있음", count: laterCount, maxHours: null }
    ]
  };
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSourceTrustScores(deals) {
  const groups = new Map();

  for (const deal of deals) {
    const sourceName = deal.sourceName || deal.merchant || deal.provider || "unknown_source";
    const officialHost = deal.officialHost || normalizeHost(deal.finalUrl) || "";
    const key = `${sourceName}::${officialHost}`;
    const current = groups.get(key) ?? {
      sourceName,
      provider: deal.provider,
      officialHost,
      totalCount: 0,
      visibleCount: 0,
      hiddenCount: 0,
      failedCount: 0,
      searchLinkCount: 0,
      expiredCount: 0,
      priorityScoreSum: 0,
      lastCheckedAt: "",
      categories: new Set(),
      benefitTypes: new Set()
    };
    const visible = !deal.isHidden && deal.validationStatus === "passed";

    current.totalCount += 1;
    current.visibleCount += visible ? 1 : 0;
    current.hiddenCount += visible ? 0 : 1;
    current.failedCount += deal.validationStatus === "failed" ? 1 : 0;
    current.searchLinkCount += deal.linkType === "search" || deal.hiddenReason?.includes("search_or_result_url") ? 1 : 0;
    current.expiredCount += deal.availability === "expired" || deal.hiddenReason?.includes("expired_event") ? 1 : 0;
    current.priorityScoreSum += Number(deal.priorityScore ?? 0);
    current.lastCheckedAt = !current.lastCheckedAt || Date.parse(deal.lastCheckedAt) > Date.parse(current.lastCheckedAt) ? deal.lastCheckedAt : current.lastCheckedAt;
    if (deal.category) current.categories.add(deal.category);
    if (deal.benefitType) current.benefitTypes.add(deal.benefitType);
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((item) => {
      const averagePriorityScore = item.totalCount ? Math.round(item.priorityScoreSum / item.totalCount) : 0;
      const exposureRate = item.totalCount ? item.visibleCount / item.totalCount : 0;
      const trustScore = clampScore(
        averagePriorityScore * 0.45 +
          exposureRate * 35 +
          (item.officialHost ? 20 : 0) -
          item.hiddenCount * 4 -
          item.failedCount * 6 -
          item.searchLinkCount * 12 -
          item.expiredCount * 8
      );
      const status = trustScore >= 90 && item.searchLinkCount === 0 && item.failedCount === 0
        ? "trusted"
        : trustScore >= 75
          ? "watch"
          : "needs_review";
      const recommendedAction =
        status === "trusted"
          ? "공식 feed 후보로 우선 유지"
          : item.searchLinkCount > 0
            ? "검색 결과 URL을 공식 상세 URL로 교체"
            : item.expiredCount > 0
              ? "종료 혜택 대체 후보 준비"
              : item.failedCount > 0
                ? "실패 사유 확인 후 수동 숨김 또는 재검증"
                : "공식 링크와 혜택 조건을 재확인";

      return {
        sourceName: item.sourceName,
        provider: item.provider,
        officialHost: item.officialHost,
        totalCount: item.totalCount,
        visibleCount: item.visibleCount,
        hiddenCount: item.hiddenCount,
        failedCount: item.failedCount,
        searchLinkCount: item.searchLinkCount,
        expiredCount: item.expiredCount,
        averagePriorityScore,
        trustScore,
        status,
        lastCheckedAt: item.lastCheckedAt,
        categories: Array.from(item.categories).sort(),
        benefitTypes: Array.from(item.benefitTypes).sort(),
        recommendedAction
      };
    })
    .sort((a, b) => b.trustScore - a.trustScore || b.visibleCount - a.visibleCount || a.sourceName.localeCompare(b.sourceName));
}

export function summarizeNewsDeals(deals, generatedAt = new Date().toISOString(), providerStats = [], collectionStats = {}) {
  const visible = deals.filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.publishable === true);
  const hidden = deals.filter((deal) => deal.isHidden || deal.validationStatus !== "passed");
  const expired = deals.filter((deal) => deal.hiddenReason.includes("expired_event"));
  const officialMissing = deals.filter((deal) => deal.hiddenReason.includes("not_approved_official_url"));
  const searchLinks = deals.filter((deal) => deal.linkType === "search" || deal.hiddenReason.includes("search_or_result_url"));
  const exposedSearchLinks = searchLinks.filter((deal) => !deal.isHidden && deal.validationStatus === "passed");
  const nonOfficialLinks = deals.filter((deal) => ["news_only", "community", "invalid"].includes(deal.linkType));
  const exposedNonOfficialLinks = nonOfficialLinks.filter((deal) => !deal.isHidden && deal.validationStatus === "passed");
  const activeVisible = visible.filter((deal) => deal.availability === "active" && deal.linkType?.startsWith("official") && deal.priorityScore >= 70);
  const nonPublishableVisible = deals.filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.publishable !== true);
  const failureReasons = {};
  for (const deal of hidden) {
    for (const reason of deal.hiddenReason.split(",").filter(Boolean)) {
      failureReasons[reason] = (failureReasons[reason] ?? 0) + 1;
    }
  }

  const providerNames = new Set([...providerStats.map((stat) => stat.provider), ...deals.map((deal) => deal.provider)]);
  const enrichedProviderStats = Array.from(providerNames).map((provider) => {
    const stat = providerStats.find((item) => item.provider === provider) ?? {
      provider,
      source: "runtime_news_snapshot",
      configured: false,
      feedUrls: 0,
      fetchedCount: 0,
      errorCount: 0,
      errors: []
    };
    const providerDeals = deals.filter((deal) => deal.provider === provider);

    return {
      ...stat,
      normalizedCount: providerDeals.length,
      visibleCount: providerDeals.filter((deal) => !deal.isHidden && deal.validationStatus === "passed").length,
      hiddenCount: providerDeals.filter((deal) => deal.isHidden || deal.validationStatus !== "passed").length,
      failedCount: providerDeals.filter((deal) => deal.validationStatus === "failed").length,
      expiredCount: providerDeals.filter((deal) => deal.hiddenReason.includes("expired_event")).length,
      officialMissingCount: providerDeals.filter((deal) => deal.hiddenReason.includes("not_approved_official_url")).length
    };
  });
  const compactDeal = (deal) => ({
    id: deal.id,
    provider: deal.provider,
    title: deal.title,
    sourceName: deal.sourceName,
    source: deal.source,
    finalUrl: deal.finalUrl,
    originalUrl: deal.originalUrl,
    affiliateUrl: deal.affiliateUrl,
    eventUrl: deal.eventUrl,
    linkType: deal.linkType,
    availability: deal.availability,
    priorityScore: deal.priorityScore,
    validationStatus: deal.validationStatus,
    validationCode: deal.validationCode ?? "",
    publishable: deal.publishable === true,
    validationReason: deal.validationReason,
    hiddenReason: deal.hiddenReason,
    lastCheckedAt: deal.lastCheckedAt,
    officialHost: deal.officialHost
  });
  const failureReasonTop10 = Object.entries(failureReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));
  const recentLogs = [...deals]
    .sort((a, b) => Date.parse(b.lastCheckedAt) - Date.parse(a.lastCheckedAt))
    .slice(0, 20)
    .map((deal) => ({
      dealId: deal.id,
      provider: deal.provider,
      title: deal.title,
      status: deal.validationStatus === "passed" && !deal.isHidden ? "visible" : "hidden",
      reason: deal.validationReason || deal.hiddenReason || "passed",
      finalUrl: deal.finalUrl,
      linkType: deal.linkType,
      availability: deal.availability,
      priorityScore: deal.priorityScore,
      checkedAt: deal.lastCheckedAt
    }));
  const categoryCounts = countVisibleBy(visible, (deal) => deal.category);
  const benefitTypeCounts = countVisibleBy(visible, (deal) => deal.benefitType);
  const sourceCounts = countVisibleBy(visible, (deal) => deal.sourceName);
  const sourceTrustScores = buildSourceTrustScores(deals);
  const deadlineSummary = buildDeadlineSummary(visible);
  const collectedCountFromProviders = providerStats.reduce((sum, stat) => sum + Number(stat?.collectedCount ?? stat?.fetchedCount ?? 0), 0);
  const feedFailureCount = providerStats.filter((stat) => Number(stat?.errorCount ?? 0) > 0).length;
  const configuredEmptyFeedCount = providerStats.filter((stat) => stat?.configuredEmptyFeed === true).length;
  const collectionSummary = {
    collectedCount: Number(collectionStats.collectedCount ?? collectedCountFromProviders ?? deals.length),
    normalizedCount: Number(collectionStats.normalizedCount ?? deals.length),
    validationInputCount: Number(collectionStats.validationInputCount ?? collectionStats.normalizedCount ?? deals.length),
    dedupedCount: Number(collectionStats.dedupedCount ?? deals.length),
    duplicateRemovedCount: Number(collectionStats.duplicateRemovedCount ?? 0),
    visibleCount: visible.length,
    blockedCount: hidden.length,
    sourceCount: Object.keys(sourceCounts).length,
    categoryCount: Object.keys(categoryCounts).length,
    benefitTypeCount: Object.keys(benefitTypeCounts).length,
    failedFeedCount: feedFailureCount,
    configuredEmptyFeedCount
  };

  return {
    ok:
      hidden.length === 0 &&
      activeVisible.length === visible.length &&
      exposedSearchLinks.length === 0 &&
      exposedNonOfficialLinks.length === 0 &&
      nonPublishableVisible.length === 0,
    generatedAt,
    totalCount: deals.length,
    visibleCount: visible.length,
    hiddenCount: hidden.length,
    expiredCount: expired.length,
    officialMissingCount: officialMissing.length,
    searchLinkCount: searchLinks.length,
    exposedSearchLinkCount: exposedSearchLinks.length,
    nonOfficialLinkCount: nonOfficialLinks.length,
    exposedNonOfficialLinkCount: exposedNonOfficialLinks.length,
    activeVisibleCount: activeVisible.length,
    nonPublishableVisibleCount: nonPublishableVisible.length,
    averagePriorityScore: visible.length ? Math.round(visible.reduce((sum, deal) => sum + Number(deal.priorityScore ?? 0), 0) / visible.length) : 0,
    failedCount: hidden.length,
    categoryCounts,
    benefitTypeCounts,
    sourceCounts,
    sourceTrustScores,
    deadlineSummary,
    collectionSummary,
    topKeywords: topKeywordCounts(visible),
    providerStats: enrichedProviderStats,
    failureReasons,
    failureReasonTop10,
    visibleDealIds: visible.map((deal) => deal.id),
    hiddenDeals: hidden.map(compactDeal),
    expiredDeals: expired.map(compactDeal),
    officialMissingDeals: officialMissing.map(compactDeal),
    recentLogs,
    manualActions: [
      { action: "hide", label: "수동 숨김", description: "공식 링크 오류, 종료, 조건 불명확 항목을 즉시 사용자 노출에서 제외" },
      { action: "restore", label: "수동 복구", description: "공식 링크와 기간을 재확인한 뒤 노출 후보로 복구" },
      { action: "revalidate", label: "링크 재검증", description: "refresh:all 또는 운영 DB provider run으로 링크 상태를 재확인" }
    ]
  };
}

export function buildNewsPolicyRegressionScenarios({ now = Date.now(), generatedAt = new Date(now).toISOString() } = {}) {
  const futureDate = "2099-12-31";
  const base = {
    id: "news-regression-official-event",
    title: "공식 혜택 정책 회귀 샘플",
    summary: "공식 이벤트 상세 페이지와 명확한 혜택 조건이 있는 항목만 사용자에게 노출되어야 합니다.",
    merchant: "할인도사 검증",
    category: "무료혜택",
    benefitType: "coupon",
    discountRate: 0,
    price: 0,
    originalPrice: 0,
    couponAmount: 3000,
    startDate: "2026-01-01",
    endDate: futureDate,
    sourceName: "공식 혜택 회귀 테스트",
    sourceUrl: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
    finalUrl: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
    imageUrl: "",
    confidenceScore: 90,
    provider: "regression",
    tags: ["공식", "쿠폰"]
  };
  const samples = [
    {
      ...base,
      expectedHidden: false,
      expectedLinkTypePrefix: "official"
    },
    {
      ...base,
      id: "news-regression-official-coupon",
      title: "공식 쿠폰 정책 회귀 샘플",
      finalUrl: "https://pay.naver.com/about/coupon",
      sourceUrl: "https://pay.naver.com/about/coupon",
      expectedHidden: false,
      expectedLinkTypePrefix: "official"
    },
    {
      ...base,
      id: "news-regression-search-url",
      title: "검색 결과 URL 차단 샘플",
      finalUrl: "https://www.homeplus.co.kr/search?keyword=milk",
      sourceUrl: "https://www.homeplus.co.kr/search?keyword=milk",
      expectedHidden: true,
      expectedReason: "search_or_result_url"
    },
    {
      ...base,
      id: "news-regression-community-url",
      title: "커뮤니티 원문 차단 샘플",
      finalUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
      sourceUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
      expectedHidden: true,
      expectedReason: "blocked_community_or_news_host"
    },
    {
      ...base,
      id: "news-regression-news-only-url",
      title: "뉴스 기사 단독 링크 차단 샘플",
      finalUrl: "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=101&oid=001&aid=0000000001",
      sourceUrl: "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=101&oid=001&aid=0000000001",
      expectedHidden: true,
      expectedReason: "not_approved_official_url"
    },
    {
      ...base,
      id: "news-regression-official-home-url",
      title: "공식 홈 URL 차단 샘플",
      finalUrl: "https://point.pay.naver.com/",
      sourceUrl: "https://point.pay.naver.com/",
      expectedHidden: true,
      expectedReason: "home_or_landing_url"
    },
    {
      ...base,
      id: "news-regression-expired-event",
      title: "종료 이벤트 차단 샘플",
      endDate: "2000-01-01",
      expectedHidden: true,
      expectedReason: "expired_event"
    },
    {
      ...base,
      id: "news-regression-low-confidence",
      title: "낮은 신뢰도 차단 샘플",
      confidenceScore: 40,
      expectedHidden: true,
      expectedReason: "low_confidence"
    },
    {
      ...base,
      id: "news-regression-unclear-copy",
      title: "조건 불명확 차단 샘플",
      summary: "커뮤니티 제보 기준이라 혜택 조건 확인 필요 문구가 남아 있는 항목입니다.",
      expectedHidden: true,
      expectedReason: "unclear_benefit_condition"
    },
    {
      ...base,
      id: "news-regression-spam-copy",
      title: "광고성 문구 차단 샘플",
      summary: "클릭만 하면 무조건 지급된다는 고수익 보장성 광고 문구가 있는 항목입니다.",
      expectedHidden: true,
      expectedReason: "spam_or_ad_like_copy"
    },
    {
      ...base,
      id: "news-regression-missing-final-url",
      title: "공식 링크 누락 차단 샘플",
      finalUrl: "",
      sourceUrl: "",
      expectedHidden: true,
      expectedReason: "missing_final_url"
    },
    {
      ...base,
      id: "news-regression-unsafe-url",
      title: "위험 URL 차단 샘플",
      finalUrl: "javascript:alert(1)",
      sourceUrl: "javascript:alert(1)",
      expectedHidden: true,
      expectedReason: "not_approved_official_url"
    }
  ];
  const results = samples.map((sample) => {
    const normalized = normalizeNewsDeal(sample, generatedAt);
    const validated = validateNewsDeal(normalized, now);
    const expectedReasonOk = sample.expectedReason ? validated.hiddenReason.includes(sample.expectedReason) : true;
    const linkTypeOk = sample.expectedLinkTypePrefix ? String(validated.linkType).startsWith(sample.expectedLinkTypePrefix) : true;

    return {
      id: sample.id,
      expectedHidden: sample.expectedHidden,
      actualHidden: validated.isHidden,
      expectedReason: sample.expectedReason ?? "",
      hiddenReason: validated.hiddenReason,
      linkType: validated.linkType,
      availability: validated.availability,
      validationStatus: validated.validationStatus,
      validationCode: validated.validationCode,
      publishable: validated.publishable === true,
      priorityScore: validated.priorityScore,
      ok: validated.isHidden === sample.expectedHidden && expectedReasonOk && linkTypeOk
    };
  });

  return {
    ok: results.every((item) => item.ok),
    total: results.length,
    passed: results.filter((item) => item.ok).length,
    visiblePositiveSamples: results.filter((item) => !item.expectedHidden && !item.actualHidden).length,
    blockedNegativeSamples: results.filter((item) => item.expectedHidden && item.actualHidden).length,
    results
  };
}

function extractNewsFeedItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.deals)) return payload.deals;
  if (Array.isArray(payload?.newsDeals)) return payload.newsDeals;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.coupons)) return payload.coupons;
  if (Array.isArray(payload?.benefits)) return payload.benefits;
  return [];
}

export function parseNewsFeedXmlItems(xml, provider = "news", feedUrl = "") {
  const xmlText = String(xml);
  const blocks = collectXmlBlocks(xmlText, /<item\b[\s\S]*?<\/item>/gi);
  const entries = blocks.length ? blocks : collectXmlBlocks(xmlText, /<entry\b[\s\S]*?<\/entry>/gi);

  return entries.map((block) => {
    const link = extractXmlTag(block, ["link"]) || extractAtomLinkHref(block) || extractXmlTag(block, ["guid", "id"]);
    const explicitFinalUrl = extractXmlTag(block, ["finalUrl", "final-url", "final_url", "eventUrl", "event-url", "event_url", "purchaseUrl", "purchase-url", "purchase_url"]);
    const officialUrl = extractOfficialUrlFromXmlBlock(block);
    const finalUrl = explicitFinalUrl || officialUrl || link;
    const tags = [
      ...splitTags(extractXmlTag(block, ["tags", "keywords"])),
      ...splitTags(extractXmlTag(block, ["category"]))
    ];

    return {
      id: extractXmlTag(block, ["id", "guid"]),
      title: extractXmlTag(block, ["title"]),
      summary: extractXmlTag(block, ["summary", "description", "content", "content:encoded"]),
      merchant: extractXmlTag(block, ["merchant", "seller", "mallName", "brand", "author"]),
      category: extractXmlTag(block, ["category", "benefitCategory"]),
      benefitType: extractXmlTag(block, ["benefitType", "benefit-type", "benefit_type", "type"]),
      discountRate: extractXmlTag(block, ["discountRate", "discount-rate", "discount_rate"]),
      price: extractXmlTag(block, ["price", "salePrice", "sale-price", "sale_price"]),
      originalPrice: extractXmlTag(block, ["originalPrice", "original-price", "original_price"]),
      couponAmount: extractXmlTag(block, ["couponAmount", "coupon-amount", "coupon_amount"]),
      startDate: extractXmlTag(block, ["startDate", "start-date", "start_date", "pubDate", "published", "updated"]),
      endDate: extractXmlTag(block, ["endDate", "end-date", "end_date", "expireAt", "expiresAt", "expires"]),
      sourceName: extractXmlTag(block, ["sourceName", "source-name", "source_name", "source", "author"]),
      sourceUrl: extractXmlTag(block, ["sourceUrl", "source-url", "source_url"]) || link || feedUrl,
      finalUrl,
      imageUrl: extractXmlTag(block, ["imageUrl", "image-url", "image_url", "thumbnail", "media:thumbnail", "enclosure"]),
      confidenceScore: extractXmlTag(block, ["confidenceScore", "confidence-score", "confidence_score"]) || 80,
      provider,
      tags
    };
  });
}

export async function fetchNewsFeed(url, provider) {
  const response = await fetch(url, {
    headers: { Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml", "User-Agent": "HalindosaNewsProvider/1.0" },
    cache: "no-store",
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`${provider}_feed_http_${response.status}`);
  const body = await response.text();

  try {
    return extractNewsFeedItems(JSON.parse(body));
  } catch {
    const items = parseNewsFeedXmlItems(body, provider, url);
    if (!items.length) throw new Error(`${provider}_feed_unsupported_payload`);
    return items;
  }
}

export async function fetchJsonFeed(url, provider) {
  return fetchNewsFeed(url, provider);
}
