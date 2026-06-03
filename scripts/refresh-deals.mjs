import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "reports");
const dataDir = join(root, "data");
mkdirSync(reportsDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const requestTimeoutMs = Number(process.env.DEAL_REFRESH_TIMEOUT_MS ?? 5000);
const shouldLiveProbe = process.env.DEAL_REFRESH_LIVE_PROBE === "true";
const shouldBodyProbe = process.env.DEAL_LINK_BODY_PROBE === "true";
const now = new Date().toISOString();

const blockedHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "theqoo.net",
  "instiz.net",
  "coolenjoy.net",
  "example.com"
];

const searchPatterns = [
  "/search",
  "search.",
  "shopping/search",
  "msearch",
  "/find",
  "/result",
  "query=",
  "keyword=",
  "kwd=",
  "sword=",
  "/np/search",
  "/productions/feed",
  "/category",
  "/categories"
];

const unavailablePatterns = [
  "품절",
  "일시품절",
  "구매불가",
  "판매종료",
  "판매중지",
  "재입고알림",
  "이벤트종료",
  "행사종료",
  "마감"
];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path, fallback = null) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function runStep(name, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    name,
    command: `node ${args.join(" ")}`,
    ok: result.status === 0,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function splitEnvUrls(...keys) {
  return keys
    .flatMap((key) => (process.env[key] ?? "").split(","))
    .map((url) => url.trim())
    .filter(Boolean);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

function toNumber(value, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function normalizeKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedHost(host) {
  return blockedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function isHomeOnly(url) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchLike(url) {
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return searchPatterns.some((pattern) => value.includes(pattern));
}

function hasProductDetailSignal(url) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return [
    /\/vp\/products\/\d+/,
    /\/products\/\d+/,
    /\/product\//,
    /\/p\/product\//,
    /\/goods\/\d+/,
    /\/goods\/detail/,
    /\/item\/itemview\.ssg/,
    /\/item\?/,
    /\/item\//,
    /detailview\.aspx/,
    /itemid=/,
    /goodsno=/,
    /goodscode=/,
    /goodsnum=/,
    /dealno=/,
    /prdno=/,
    /\/deal\/deal\.gs/,
    /\/dp\/[a-z0-9]+/,
    /\/gp\/product\/[a-z0-9]+/,
    /\/item\/\d+\.html/,
    /\/i\/\d+\.html/,
    /\/app\/product\/[a-z0-9]+/,
    /\/app\/goods\/goodsdetail/,
    /\/web\/goods_view\/index\.asp/,
    /\/tna\/products\/[a-z0-9-]+/,
    /\/contents\/notice\/detail\/\d+/
  ].some((pattern) => pattern.test(value));
}

function hasBenefitSignal(url, evidence) {
  const value = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceValue = cleanText(evidence).toLowerCase();
  return /event|benefit|campaign|coupon|promotion|membership|discount|culture-event|whats_new|page\/event|plus\.do|bbs_category=3|\/cpc\/cr\/|services\/life\/payment|tossfeed\/article/.test(value) &&
    /이벤트|행사|혜택|쿠폰|초대권|시사회|멤버십|포인트|무료|응모|할인|공식/.test(evidenceValue);
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    const keepParams = new Set(["itemId", "vendorItemId", "goodsCode", "goodsNo", "goodscode", "productId", "prdNo", "dealNo"]);

    for (const key of [...url.searchParams.keys()]) {
      if (!keepParams.has(key)) url.searchParams.delete(key);
    }

    url.hash = "";
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    return "";
  }
}

function classifyUrl(urlValue, evidence = "") {
  try {
    const url = new URL(urlValue);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "blocked_protocol", linkType: "unavailable", availability: "unknown" };
    if (isBlockedHost(host)) return { ok: false, reason: "community_source", linkType: "unavailable", availability: "unknown" };
    if (isHomeOnly(url)) return { ok: false, reason: "redirect_to_home", linkType: "unavailable", availability: "unknown" };
    if (isSearchLike(url)) return { ok: false, reason: "search_result_url", linkType: "search", availability: "unknown" };

    const evidenceText = cleanText(evidence);
    if (unavailablePatterns.some((pattern) => evidenceText.includes(pattern))) {
      return { ok: false, reason: "sold_out_or_ended_signal", linkType: "unavailable", availability: "sold_out" };
    }

    if (hasProductDetailSignal(url)) return { ok: true, reason: "direct_purchase_detail", linkType: "direct_purchase", availability: "active" };
    if (hasBenefitSignal(url, evidenceText)) return { ok: true, reason: "official_benefit_detail", linkType: "affiliate", availability: "active" };
    return { ok: false, reason: "manual_review_needed", linkType: "unavailable", availability: "unknown" };
  } catch {
    return { ok: false, reason: "broken_url", linkType: "unavailable", availability: "unknown" };
  }
}

async function fetchWithTimeout(url, options = {}, retry = 1) {
  for (let attempt = 0; attempt <= retry; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt >= retry) throw error;
    }
  }

  throw new Error("request_failed");
}

async function probeUrl(urlValue) {
  if (!shouldLiveProbe) {
    return {
      ok: true,
      reason: "static_validation_only",
      status: 0,
      finalUrl: urlValue,
      redirected: false,
      unavailableText: false,
      bodyChecked: false
    };
  }

  try {
    let response = await fetchWithTimeout(urlValue, { method: "HEAD", redirect: "follow" }, 1);

    if ([403, 404, 405, 501].includes(response.status) || shouldBodyProbe) {
      response = await fetchWithTimeout(
        urlValue,
        {
          method: "GET",
          redirect: "follow",
          headers: shouldBodyProbe ? { Range: "bytes=0-65535" } : {}
        },
        1
      );
    }

    const result = {
      ok: response.ok || response.status < 400,
      reason: response.ok ? "http_ok" : `http_${response.status}`,
      status: response.status,
      finalUrl: response.url || urlValue,
      redirected: Boolean(response.url && response.url !== urlValue),
      unavailableText: false,
      bodyChecked: false
    };

    if ([404, 410].includes(response.status)) return { ...result, ok: false, reason: `http_${response.status}` };
    if (response.status === 403 || response.status === 401) return { ...result, ok: false, reason: "robots_or_access_blocked" };
    if (response.status >= 500) return { ...result, ok: false, reason: `http_${response.status}` };

    const contentType = response.headers.get("content-type") ?? "";
    if (shouldBodyProbe && /text|html|json/i.test(contentType)) {
      const body = await response.text();
      result.bodyChecked = true;
      result.unavailableText = unavailablePatterns.some((pattern) => body.slice(0, 65535).includes(pattern));
      if (result.unavailableText) return { ...result, ok: false, reason: "sold_out_or_ended_text" };
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error",
      status: 0,
      finalUrl: urlValue,
      redirected: false,
      unavailableText: false,
      bodyChecked: false
    };
  }
}

function parseVerifiedEntries() {
  const source = read("data/verifiedPurchaseLinks.ts");
  const entries = [];
  const pattern = /^\s*(d\d+):\s*\{(?<body>[\s\S]*?)^\s*\},?/gm;
  let match;

  while ((match = pattern.exec(source))) {
    const body = match.groups?.body ?? "";
    entries.push({
      id: match[1],
      url: body.match(/url:\s*"([^"]+)"/)?.[1] ?? "",
      checkedAt: body.match(/checkedAt:\s*"([^"]+)"/)?.[1] ?? "",
      source: body.match(/source:\s*"([^"]+)"/)?.[1] ?? "manual_review",
      evidence: body.match(/evidence:\s*"([^"]+)"/)?.[1] ?? ""
    });
  }

  return entries;
}

function getManualProviderItems() {
  const mockDeals = read("data/mockDeals.ts");
  const dealIds = [...mockDeals.matchAll(/deal\("(d\d+)"/g)].map((match) => match[1]);
  const verifiedMap = new Map(parseVerifiedEntries().map((entry) => [entry.id, entry]));

  return dealIds.map((id) => {
    const verified = verifiedMap.get(id);
    return {
      provider: "manual",
      id,
      title: id,
      mallName: "manual",
      salePrice: 1,
      originalPrice: 1,
      finalPurchaseUrl: verified?.url ?? "",
      link: verified?.url ?? "",
      evidence: verified?.evidence ?? "",
      checkedAt: verified?.checkedAt ?? "",
      sourceProvider: "manual"
    };
  });
}

function getFeedItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.deals)) return payload.deals;
  if (payload && typeof payload === "object" && Array.isArray(payload.items)) return payload.items;
  return [];
}

async function fetchJsonFeed(url, provider) {
  const response = await fetchWithTimeout(url, {
    headers: { Accept: "application/json", "User-Agent": "HalindosaRefresh/1.0" },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`${provider}_feed_http_${response.status}`);
  }

  const payload = await response.json();
  return getFeedItems(payload).map((item) => ({ ...item, sourceProvider: provider }));
}

async function fetchNaverShopping() {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return [];

  const keywords = (process.env.DEAL_LIVE_KEYWORDS ?? "특가 할인,오늘만 특가,무료배송")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 4);
  const items = [];

  for (const keyword of keywords) {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", keyword);
    url.searchParams.set("display", "10");
    url.searchParams.set("start", "1");
    url.searchParams.set("sort", "date");

    const response = await fetchWithTimeout(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      }
    });

    if (!response.ok) throw new Error(`naver_api_http_${response.status}`);
    const payload = await response.json();
    for (const item of payload.items ?? []) {
      items.push({
        id: `naver-${item.productId ?? canonicalUrl(item.link)}`,
        title: cleanText(item.title),
        mallName: item.mallName,
        category: item.category1 || "기타",
        salePrice: toNumber(item.lprice),
        originalPrice: Math.max(toNumber(item.hprice), toNumber(item.lprice)),
        thumbnail: item.image,
        finalPurchaseUrl: item.link,
        link: item.link,
        sourceProvider: "naver",
        evidence: `Naver Shopping API ${keyword} ${item.mallName}`
      });
    }
  }

  return items;
}

async function collectProviderItems() {
  const providerSpecs = [
    { name: "manual", requiredEnv: [], fetch: async () => getManualProviderItems() },
    { name: "coupang", requiredEnv: ["COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY"], feedEnv: ["COUPANG_PARTNER_FEED_URLS"] },
    { name: "naver", requiredEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"], feedEnv: ["NAVER_PARTNER_FEED_URLS"], fetch: fetchNaverShopping },
    { name: "elevenst", requiredEnv: ["ELEVENST_API_KEY"], feedEnv: ["ELEVENST_PARTNER_FEED_URLS"] },
    { name: "event", requiredEnv: [], feedEnv: ["DEAL_EVENT_FEED_URLS"] },
    { name: "partner_feed", requiredEnv: [], feedEnv: ["DEAL_FEED_URLS", "DEAL_PRODUCTION_FEED_URLS", "DEAL_PARTNER_FEED_URLS"] }
  ];
  const providerStats = [];
  const items = [];

  for (const spec of providerSpecs) {
    const configured = spec.requiredEnv.every((key) => Boolean(process.env[key]?.trim()));
    const feedUrls = splitEnvUrls(...(spec.feedEnv ?? []));
    const fetched = [];
    const errors = [];

    try {
      if (spec.fetch && (configured || spec.name === "manual")) {
        fetched.push(...(await spec.fetch()));
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${spec.name}_fetch_failed`);
    }

    for (const feedUrl of feedUrls) {
      try {
        fetched.push(...(await fetchJsonFeed(feedUrl, spec.name)));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${spec.name}_feed_failed`);
      }
    }

    items.push(...fetched.map((item) => ({ ...item, sourceProvider: item.sourceProvider ?? spec.name })));
    providerStats.push({
      provider: spec.name,
      configured,
      feedUrls: feedUrls.length,
      fetchedCount: fetched.length,
      errorCount: errors.length,
      errors
    });
  }

  return { items, providerStats };
}

function normalizeCollectedItem(raw, index) {
  const title = cleanText(raw.title ?? raw.productName ?? raw.name);
  const mallName = cleanText(raw.mallName ?? raw.mall ?? raw.seller ?? raw.sourceProvider ?? "할인도사");
  const finalUrl = cleanText(raw.finalPurchaseUrl ?? raw.finalUrl ?? raw.purchaseUrl ?? raw.productUrl ?? raw.url ?? raw.link);
  const salePrice = toNumber(raw.salePrice ?? raw.price ?? raw.lprice);
  const originalPrice = Math.max(toNumber(raw.originalPrice ?? raw.listPrice ?? raw.hprice, salePrice), salePrice);
  const discountRate = toNumber(raw.discountRate, originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);
  const provider = cleanText(raw.sourceProvider ?? raw.provider ?? raw.source ?? "manual");
  const id = cleanText(raw.id ?? raw.externalId ?? `${provider}-${canonicalUrl(finalUrl) || normalizeKey(`${mallName}-${title}-${salePrice}`)}`) || `collected-${index}`;

  if (!title || !mallName || !finalUrl || !salePrice) {
    return {
      ok: false,
      reason: "missing_required_fields",
      provider,
      raw
    };
  }

  return {
    ok: true,
    deal: {
      id,
      title,
      mallName,
      category: cleanText(raw.category) || "기타",
      originalPrice,
      salePrice,
      discountRate,
      thumbnail: cleanText(raw.thumbnail ?? raw.imageUrl ?? raw.image),
      imageUrl: cleanText(raw.imageUrl ?? raw.thumbnail ?? raw.image),
      finalUrl,
      finalPurchaseUrl: finalUrl,
      productUrl: cleanText(raw.productUrl) || finalUrl,
      purchaseUrl: cleanText(raw.purchaseUrl) || finalUrl,
      originalUrl: cleanText(raw.originalUrl) || finalUrl,
      affiliateUrl: cleanText(raw.affiliateUrl),
      eventUrl: cleanText(raw.eventUrl),
      shipping: cleanText(raw.shipping ?? raw.shippingInfo) || "판매처 조건 확인",
      sourceProvider: provider,
      sourceName: cleanText(raw.sourceName) || provider,
      sourceUrl: cleanText(raw.sourceUrl) || finalUrl,
      evidence: cleanText(raw.evidence ?? raw.description ?? title),
      createdAt: cleanText(raw.createdAt) || now,
      expireAt: cleanText(raw.expireAt ?? raw.expiresAt) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tags: Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string") : [provider],
      lastCheckedAt: now
    }
  };
}

async function validateCollectedDeal(deal) {
  const classification = classifyUrl(deal.finalPurchaseUrl, deal.evidence);
  const probe = classification.ok ? await probeUrl(deal.finalPurchaseUrl) : { ok: true, reason: "not_probed" };
  const finalClassification =
    probe.finalUrl && probe.finalUrl !== deal.finalPurchaseUrl ? classifyUrl(probe.finalUrl, deal.evidence) : classification;
  const ok = classification.ok && finalClassification.ok && probe.ok && !probe.unavailableText;
  const isHidden = !ok;
  const priorityScore =
    (finalClassification.linkType === "direct_purchase" ? 45 : 30) +
    (deal.thumbnail ? 12 : -10) +
    (deal.salePrice > 0 ? 12 : -20) +
    (deal.discountRate > 0 ? 8 : 0) +
    (finalClassification.availability === "active" ? 15 : -30) +
    (probe.reason === "http_ok" || probe.reason === "static_validation_only" ? 8 : -12);
  const validationReason = ok
    ? probe.redirected
      ? `redirect_checked:${finalClassification.reason}`
      : finalClassification.reason
    : probe.ok
      ? finalClassification.reason
      : probe.reason;

  return {
    ...deal,
    finalUrl: probe.finalUrl ?? deal.finalUrl,
    finalPurchaseUrl: probe.finalUrl ?? deal.finalPurchaseUrl,
    linkType: finalClassification.linkType,
    availability: finalClassification.availability,
    validationStatus: ok ? "passed" : "failed",
    validationReason,
    isHidden,
    priorityScore,
    lastCheckedAt: now,
    checkedAt: now,
    linkVerified: ok,
    purchaseLinkVerified: ok,
    probeStatus: probe.status ?? 0,
    probeFinalUrl: probe.finalUrl ?? deal.finalPurchaseUrl,
    probeRedirected: Boolean(probe.redirected),
    probeBodyChecked: Boolean(probe.bodyChecked)
  };
}

function dedupeDeals(deals) {
  const unique = new Map();

  for (const deal of deals) {
    const urlKey = canonicalUrl(deal.finalPurchaseUrl);
    const titleKey = normalizeKey(`${deal.mallName}-${deal.title}-${deal.salePrice}`);
    const key = urlKey || titleKey;
    const previous = unique.get(key);

    if (!previous || deal.priorityScore > previous.priorityScore) {
      unique.set(key, deal);
    }
  }

  return [...unique.values()];
}

const { items: fetchedItems, providerStats } = await collectProviderItems();
const normalizedResults = fetchedItems.map(normalizeCollectedItem);
const normalizedDeals = normalizedResults.filter((result) => result.ok).map((result) => result.deal);
const normalizationFailures = normalizedResults.filter((result) => !result.ok);
const validatedDeals = [];

for (const deal of normalizedDeals) {
  validatedDeals.push(await validateCollectedDeal(deal));
}

const dedupedDeals = dedupeDeals(validatedDeals);
const visibleDeals = dedupedDeals.filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.availability === "active" && deal.linkType !== "search");
const hiddenDeals = dedupedDeals.filter((deal) => !visibleDeals.some((visible) => visible.id === deal.id));
const liveProbeSummary = {
  enabled: shouldLiveProbe,
  bodyProbe: shouldBodyProbe,
  checkedCount: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.probeStatus || deal.probeRedirected || deal.probeBodyChecked).length : 0,
  redirectedCount: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.probeRedirected).length : 0,
  timeoutCount: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.validationReason === "timeout").length : 0,
  robotsBlockedCount: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.validationReason === "robots_or_access_blocked").length : 0,
  http404Count: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.validationReason === "http_404").length : 0,
  http410Count: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.validationReason === "http_410").length : 0,
  http5xxCount: shouldLiveProbe ? dedupedDeals.filter((deal) => /^http_5/.test(deal.validationReason)).length : 0,
  unavailableTextCount: shouldLiveProbe ? dedupedDeals.filter((deal) => deal.validationReason === "sold_out_or_ended_text").length : 0
};
const manualVisibleCount = visibleDeals.filter((deal) => deal.sourceProvider === "manual").length;
const insertedDeals = visibleDeals.filter((deal) => deal.sourceProvider !== "manual");
const failureReasons = {};

for (const failure of [...normalizationFailures.map((result) => result.reason), ...hiddenDeals.map((deal) => deal.validationReason)]) {
  failureReasons[failure] = (failureReasons[failure] ?? 0) + 1;
}

for (const stat of providerStats) {
  const providerDeals = dedupedDeals.filter((deal) => deal.sourceProvider === stat.provider);
  stat.normalizedCount = normalizedDeals.filter((deal) => deal.sourceProvider === stat.provider).length;
  stat.insertedCount = providerDeals.filter((deal) => deal.sourceProvider !== "manual" && !deal.isHidden).length;
  stat.updatedCount = providerDeals.filter((deal) => deal.sourceProvider === "manual" && !deal.isHidden).length;
  stat.hiddenCount = providerDeals.filter((deal) => deal.isHidden).length;
  stat.failedCount = stat.hiddenCount + normalizationFailures.filter((failure) => failure.provider === stat.provider).length;
}

const snapshot = {
  generatedAt: now,
  schemaVersion: 1,
  liveProbe: shouldLiveProbe,
  deals: insertedDeals,
  visibleDealIds: visibleDeals.map((deal) => deal.id),
  hiddenDeals: hiddenDeals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    provider: deal.sourceProvider,
    finalUrl: deal.finalPurchaseUrl,
    reason: deal.validationReason
  })),
  providerStats
};

writeFileSync(join(dataDir, "refreshedDeals.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

const baseSummary = {
  generatedAt: now,
  ok: hiddenDeals.every((deal) => deal.sourceProvider !== "manual"),
  fetchedCount: fetchedItems.length,
  normalizedCount: normalizedDeals.length,
  insertedCount: insertedDeals.length,
  updatedCount: manualVisibleCount,
  hiddenCount: hiddenDeals.length,
  failedCount: hiddenDeals.length + normalizationFailures.length,
  visibleCount: visibleDeals.length,
  providerStats,
  liveProbe: liveProbeSummary,
  failureReasons,
  pipeline: [
    "collect providers",
    "normalize deal schema",
    "dedupe by canonical URL/title/mall/price",
    "block search/home/community URLs",
    "detect sold-out/ended signals",
    "optional live HTTP probe",
    "calculate priority score",
    "write data/refreshedDeals.json",
    "write reports",
    "expose only active validated deals"
  ],
  reports: {
    linkValidation: readJson("reports/link-validation.json"),
    productQuality: readJson("reports/product-quality.json")
  },
  steps: []
};

writeFileSync(join(reportsDir, "refresh-deals.json"), `${JSON.stringify(baseSummary, null, 2)}\n`, "utf8");

const verificationSteps = [
  runStep("link-validation", ["scripts/verify-product-links.mjs"]),
  runStep("product-quality", ["scripts/verify-products.mjs"])
];
const linkValidation = readJson("reports/link-validation.json");
const productQuality = readJson("reports/product-quality.json");
const summary = {
  ...baseSummary,
  ok: baseSummary.ok && verificationSteps.every((step) => step.ok),
  reports: {
    linkValidation,
    productQuality
  },
  steps: verificationSteps
};

writeFileSync(join(reportsDir, "refresh-deals.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

for (const step of verificationSteps) {
  const prefix = step.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${step.name}`);
  if (step.stdout) console.log(step.stdout);
  if (step.stderr) console.error(step.stderr);
}

console.log("Deal refresh pipeline completed.");
console.log(`- fetchedCount: ${summary.fetchedCount}`);
console.log(`- normalizedCount: ${summary.normalizedCount}`);
console.log(`- insertedCount: ${summary.insertedCount}`);
console.log(`- updatedCount: ${summary.updatedCount}`);
console.log(`- hiddenCount: ${summary.hiddenCount}`);
console.log(`- failedCount: ${summary.failedCount}`);
console.log("- reports/refresh-deals.json");
console.log("- data/refreshedDeals.json");

if (!summary.ok) {
  console.error("Deal refresh pipeline failed. Existing verified deals remain untouched.");
  process.exit(1);
}
