import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvFeedUrls } from "./feed-url-utils.mjs";
import { deriveProductImageUrlFromPurchaseUrl, getDealImageType, getGeneratedDealImageSrc } from "./image-url-utils.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "reports");
const dataDir = join(root, "data");
const linkQualityPolicy = JSON.parse(readFileSync(join(root, "data/linkQualityPolicy.json"), "utf8"));
mkdirSync(reportsDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const requestTimeoutMs = Number(process.env.DEAL_REFRESH_TIMEOUT_MS ?? 5000);
const shouldLiveProbe = process.env.DEAL_REFRESH_LIVE_PROBE === "true";
const shouldBodyProbe = process.env.DEAL_LINK_BODY_PROBE === "true";
const now = new Date().toISOString();

const blockedHosts = [...linkQualityPolicy.blockedHosts, ...linkQualityPolicy.placeholderHosts];
const searchPatterns = linkQualityPolicy.searchPatterns;
const unavailablePatterns = linkQualityPolicy.unavailableTextPatterns;
const liveUnavailablePatterns = linkQualityPolicy.liveUnavailableTextPatterns ?? unavailablePatterns;

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path, fallback = null) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function readOperationOverrides() {
  const payload = readJson("data/dealOperationOverrides.local.json", { hidden: {}, revalidate: {}, auditLog: [] });
  const hidden = {};
  const revalidate = {};
  const resolved = new Set();
  const auditLog = Array.isArray(payload?.auditLog)
    ? [...payload.auditLog].sort((a, b) => new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime())
    : [];

  for (const item of auditLog) {
    if (!item?.id || !item?.action) continue;
    if (resolved.has(item.id)) continue;
    resolved.add(item.id);
    const createdAt = item.createdAt || now;
    if (item.action === "hide") {
      hidden[item.id] = { reason: item.reason || "admin_manual_hidden", updatedAt: createdAt };
    }
    if (item.action === "revalidate" && !hidden[item.id]) {
      revalidate[item.id] = { reason: item.reason || "report_revalidate", updatedAt: createdAt };
    }
  }

  for (const [id, entry] of Object.entries(payload?.hidden ?? {})) {
    if (!resolved.has(id)) hidden[id] = entry;
  }

  for (const [id, entry] of Object.entries(payload?.revalidate ?? {})) {
    if (!resolved.has(id) && !hidden[id]) revalidate[id] = entry;
  }

  return { hidden, revalidate, auditLog };
}

function buildRevalidationQueue(overrides) {
  return Object.entries(overrides.revalidate)
    .sort((a, b) => new Date(b[1].updatedAt ?? 0).getTime() - new Date(a[1].updatedAt ?? 0).getTime())
    .map(([id, entry]) => ({
      id,
      reason: entry.reason || "report_revalidate",
      updatedAt: entry.updatedAt || now
    }));
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
  return getEnvFeedUrls(...keys);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

function containsLiveUnavailableText(value) {
  const text = cleanText(value).toLowerCase();
  return liveUnavailablePatterns.some((pattern) => text.includes(pattern.toLowerCase()));
}

function firstNonEmptyUrl(...values) {
  return values.map((value) => cleanText(value)).find(Boolean) ?? "";
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

function buildBenefitText(input) {
  return [
    input.title,
    input.category,
    input.shipping,
    input.shippingInfo,
    input.benefitSummary,
    ...(Array.isArray(input.tags) ? input.tags : [])
  ]
    .map(cleanText)
    .join(" ")
    .toLowerCase();
}

function inferDealBenefitType(input) {
  const text = buildBenefitText(input);
  const salePrice = toNumber(input.salePrice ?? input.price, 1);

  if (/배달|외식|요기요|배민|쿠팡이츠|식당|버거|치킨|피자|커피|음료/.test(text)) return "foodDelivery";
  if (/편의점|gs25|cu|세븐일레븐|이마트24|1\+1|2\+1/.test(text)) return "convenienceStore";
  if (/마트|이마트|홈플러스|롯데마트|장보기|노브랜드|쓱배송/.test(text)) return "mart";
  if (/포인트|적립|앱테크|캐시백|페이|리워드|멤버십/.test(text)) return "point";
  if (/체험|샘플|무료체험|테스터|초대권|시사회/.test(text)) return "experience";
  if (/0원|무료|공짜|무상/.test(text) && salePrice <= 1000) return "freebie";
  if (/쿠폰|교환권|청구할인|카드할인|첫 구매|1\+1|2\+1|이벤트/.test(text)) return "coupon";
  if (/무료배송|무배|로켓배송|로켓프레시|네멤무료/.test(text)) return "freeShipping";
  if (/행사|타임세일|오늘만|마감임박|한정수량/.test(text)) return "event";
  return "discount";
}

function buildBenefitSummary(input, dealType) {
  const salePrice = toNumber(input.salePrice ?? input.price);
  const originalPrice = Math.max(toNumber(input.originalPrice ?? input.listPrice, salePrice), salePrice);
  const discountRate = toNumber(input.discountRate, originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);
  const savings = Math.max(0, originalPrice - salePrice);

  switch (dealType) {
    case "freebie":
      return "무료 또는 0원 조건으로 받을 수 있는 혜택입니다.";
    case "coupon":
      return "쿠폰, 교환권, 카드 혜택을 확인할 만한 절약 정보입니다.";
    case "freeShipping":
      return "배송비 부담을 줄일 수 있는 무료배송 특가입니다.";
    case "experience":
      return "체험단, 샘플, 무료 체험 조건을 확인할 수 있는 혜택입니다.";
    case "event":
      return "기간이 정해진 이벤트성 특가로 마감 시간을 확인하세요.";
    case "point":
      return "포인트 적립이나 앱테크형 생활비 절약 혜택입니다.";
    case "convenienceStore":
      return "편의점 1+1, 2+1, 모바일 쿠폰 조건을 확인할 수 있는 혜택입니다.";
    case "mart":
      return "마트 행사와 장보기 비용을 줄일 수 있는 생활 혜택입니다.";
    case "foodDelivery":
      return "배달, 외식, 음료 쿠폰으로 식비를 줄일 수 있는 혜택입니다.";
    case "discount":
    default:
      return savings > 0 ? `${discountRate}% 할인, 약 ${savings.toLocaleString("ko-KR")}원 절약 가능한 특가입니다.` : "판매처에서 가격 조건을 확인할 만한 특가입니다.";
  }
}

function isBlockedHost(host) {
  return blockedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function isHomeOnly(url) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchLike(url) {
  if (hasProductDetailSignal(url)) return false;
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return searchPatterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function hasProductDetailSignal(url) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return linkQualityPolicy.productDetailSignals.some((pattern) => new RegExp(pattern, "i").test(value));
}

function hasBenefitSignal(url, evidence) {
  const value = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceValue = cleanText(evidence).toLowerCase();
  return linkQualityPolicy.officialBenefitUrlSignals.some((signal) => value.includes(signal)) &&
    linkQualityPolicy.officialBenefitEvidenceSignals.some((signal) => evidenceValue.includes(signal.toLowerCase()));
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    const keepParams = new Set(["itemId", "vendorItemId", "goodsCode", "goodsNo", "goodscode", "productId", "prdNo", "prdno", "prdid", "dealNo", "dealno", "bbs_category"]);

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
    const normalizedEvidenceText = evidenceText.toLowerCase();
    if (unavailablePatterns.some((pattern) => normalizedEvidenceText.includes(pattern.toLowerCase()))) {
      return { ok: false, reason: "sold_out_or_ended_signal", linkType: "unavailable", availability: "sold_out" };
    }

    if (hasProductDetailSignal(url)) return { ok: true, reason: "direct_purchase_detail", linkType: "direct_purchase", availability: "active" };
    if (hasBenefitSignal(url, evidenceText)) return { ok: true, reason: "official_benefit_detail", linkType: "affiliate", availability: "active" };
    return { ok: false, reason: "manual_review_needed", linkType: "unavailable", availability: "unknown" };
  } catch {
    return { ok: false, reason: "broken_url", linkType: "unavailable", availability: "unknown" };
  }
}

function getValidationCode({ classification, validationReason, ok }) {
  if (ok && classification.availability === "active") return "valid";
  if (classification.availability === "sold_out") return "sold_out";
  if (classification.reason === "search_result_url") return "search_link";
  if (classification.reason === "redirect_to_home") return "homepage_link";
  if (classification.reason === "community_source") return "community_link";
  if (classification.reason === "blocked_protocol" || classification.reason === "broken_url") return "unsafe_url";
  if (validationReason === "timeout") return "timeout";
  if (validationReason === "manual_review_needed") return "mismatch";
  return "invalid";
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
      const bodySample = body.slice(0, 65535).toLowerCase();
      result.unavailableText = containsLiveUnavailableText(bodySample);
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

function parseMockDealMetadata() {
  const source = read("data/mockDeals.ts");
  const entries = [];
  const pattern =
    /deal\("(?<id>d\d+)",\s*"(?<mallName>[^"]+)",\s*"(?<title>[^"]+)",\s*"(?<category>[^"]+)",\s*(?<originalPrice>[0-9.]+),\s*(?<discountRate>[0-9.]+),\s*(?<offsetHours>[0-9.]+),\s*(?<expiresInHours>[0-9.]+),\s*\{(?<flags>[^}]+)\},\s*\[(?<tags>[^\]]*)\],\s*(?<popularityScore>[0-9.]+)(?:,\s*"(?<imageUrl>[^"]*)")?(?:,\s*"(?<link>[^"]*)")?/g;
  let match;

  while ((match = pattern.exec(source))) {
    const originalPrice = toNumber(match.groups?.originalPrice);
    const discountRate = toNumber(match.groups?.discountRate);
    const salePrice = Math.round((originalPrice * (100 - discountRate)) / 100 / 10) * 10;
    const tags = [...String(match.groups?.tags ?? "").matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1]);
    const expiresInHours = Number(match.groups?.expiresInHours ?? 24);

    entries.push({
      id: match.groups?.id ?? "",
      mallName: match.groups?.mallName ?? "",
      title: match.groups?.title ?? "",
      category: match.groups?.category ?? "기타",
      originalPrice,
      salePrice,
      discountRate,
      thumbnail: match.groups?.imageUrl ?? "",
      imageUrl: match.groups?.imageUrl ?? "",
      link: match.groups?.link ?? "",
      tags,
      sourceName: match.groups?.mallName ?? "",
      sourceUrl: match.groups?.link ?? "",
      expireAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
      popularityScore: toNumber(match.groups?.popularityScore)
    });
  }

  return entries;
}

function getManualProviderItems() {
  const mockDealMetadata = parseMockDealMetadata();
  const verifiedMap = new Map(parseVerifiedEntries().map((entry) => [entry.id, entry]));

  return mockDealMetadata.map((deal) => {
    const verified = verifiedMap.get(deal.id);
    const finalUrl = verified?.url || deal.link || "";
    const checkedAt = verified?.checkedAt || new Date().toISOString();

    return {
      provider: "manual",
      ...deal,
      finalPurchaseUrl: finalUrl,
      finalUrl,
      productUrl: finalUrl,
      purchaseUrl: finalUrl,
      originalUrl: finalUrl,
      link: finalUrl,
      evidence: verified?.evidence || `${deal.mallName} ${deal.title} 검증 상세`,
      checkedAt,
      lastCheckedAt: checkedAt,
      verifiedAt: checkedAt,
      updatedAt: checkedAt,
      source: verified?.source ?? "manual_review",
      sourceName: deal.mallName,
      sourceUrl: finalUrl,
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
  const finalUrl = firstNonEmptyUrl(
    raw.affiliateUrl,
    raw.verifiedProductUrl,
    raw.finalPurchaseUrl,
    raw.finalUrl,
    raw.productUrl,
    raw.purchaseUrl,
    raw.originalUrl,
    raw.eventUrl,
    raw.url,
    raw.link,
    raw.searchUrl
  );
  const salePrice = toNumber(raw.salePrice ?? raw.price ?? raw.lprice);
  const originalPrice = Math.max(toNumber(raw.originalPrice ?? raw.listPrice ?? raw.hprice, salePrice), salePrice);
  const discountRate = toNumber(raw.discountRate, originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);
  const category = cleanText(raw.category) || "기타";
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string") : [cleanText(raw.sourceProvider ?? raw.provider ?? raw.source ?? "manual")];
  const shipping = cleanText(raw.shipping ?? raw.shippingInfo) || "판매처 조건 확인";
  const dealType = cleanText(raw.dealType) || inferDealBenefitType({ ...raw, title, category, tags, shipping, salePrice, originalPrice, discountRate });
  const rawImageUrl = cleanText(raw.thumbnail ?? raw.imageUrl ?? raw.image);
  const derivedImageUrl = deriveProductImageUrlFromPurchaseUrl(finalUrl);
  const imageUrl = rawImageUrl || derivedImageUrl || getGeneratedDealImageSrc(category, dealType);
  const imageType = getDealImageType(imageUrl);
  const provider = cleanText(raw.sourceProvider ?? raw.provider ?? raw.source ?? "manual");
  const id = cleanText(raw.id ?? raw.externalId ?? `${provider}-${canonicalUrl(finalUrl) || normalizeKey(`${mallName}-${title}-${salePrice}`)}`) || `collected-${index}`;
  const benefitSummary = cleanText(raw.benefitSummary) || buildBenefitSummary({ ...raw, title, category, tags, shipping, salePrice, originalPrice, discountRate }, dealType);

  if (!title || !mallName || !finalUrl || salePrice < 0) {
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
      category,
      originalPrice,
      salePrice,
      discountRate,
      thumbnail: imageUrl,
      imageUrl,
      imageType,
      finalUrl,
      finalPurchaseUrl: finalUrl,
      productUrl: cleanText(raw.productUrl) || cleanText(raw.verifiedProductUrl) || finalUrl,
      verifiedProductUrl: cleanText(raw.verifiedProductUrl),
      purchaseUrl: cleanText(raw.purchaseUrl) || finalUrl,
      originalUrl: cleanText(raw.originalUrl) || finalUrl,
      affiliateUrl: cleanText(raw.affiliateUrl),
      eventUrl: cleanText(raw.eventUrl),
      shipping,
      sourceProvider: provider,
      sourceName: cleanText(raw.sourceName) || provider,
      sourceUrl: cleanText(raw.sourceUrl) || finalUrl,
      evidence: cleanText(raw.evidence ?? raw.description ?? title),
      createdAt: cleanText(raw.createdAt) || now,
      expireAt: cleanText(raw.expireAt ?? raw.expiresAt) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tags,
      dealType,
      benefitSummary,
      isFreeShipping: Boolean(raw.isFreeShipping) || dealType === "freeShipping" || /무료배송|무배|로켓배송|로켓프레시|네멤무료/.test(buildBenefitText({ ...raw, title, category, tags, shipping })),
      lastCheckedAt: cleanText(raw.lastCheckedAt ?? raw.checkedAt ?? raw.verifiedAt) || now,
      checkedAt: cleanText(raw.checkedAt ?? raw.lastCheckedAt ?? raw.verifiedAt) || now,
      verifiedAt: cleanText(raw.verifiedAt ?? raw.checkedAt ?? raw.lastCheckedAt) || now,
      updatedAt: cleanText(raw.updatedAt ?? raw.checkedAt ?? raw.lastCheckedAt) || now
    }
  };
}

async function validateCollectedDeal(deal) {
  const evidenceText = [deal.title, deal.evidence, ...(deal.tags ?? [])].join(" ");
  const classification = classifyUrl(deal.finalPurchaseUrl, evidenceText);
  const probe = classification.ok ? await probeUrl(deal.finalPurchaseUrl) : { ok: true, reason: "not_probed" };
  const finalClassification =
    probe.finalUrl && probe.finalUrl !== deal.finalPurchaseUrl ? classifyUrl(probe.finalUrl, evidenceText) : classification;
  const ok = classification.ok && finalClassification.ok && probe.ok && !probe.unavailableText;
  const isHidden = !ok;
  const validationReason = ok
    ? probe.redirected
      ? `redirect_checked:${finalClassification.reason}`
      : finalClassification.reason
    : probe.ok
      ? finalClassification.reason
      : probe.reason;
  const validationCode = getValidationCode({ classification: finalClassification, validationReason, ok });
  const publishable = !isHidden && validationCode === "valid";
  const imageScore = deal.imageType === "official" ? 12 : deal.imageType === "generated" ? 4 : -10;
  const priorityScore =
    (finalClassification.linkType === "direct_purchase" ? 45 : 30) +
    imageScore +
    (deal.salePrice >= 0 ? 12 : -20) +
    (deal.discountRate > 0 ? 8 : 0) +
    (finalClassification.availability === "active" ? 15 : -30) +
    (probe.reason === "http_ok" || probe.reason === "static_validation_only" ? 8 : -12);
  const qualityScore = Math.max(0, Math.min(100, Math.round(priorityScore)));

  return {
    ...deal,
    finalUrl: probe.finalUrl ?? deal.finalUrl,
    finalPurchaseUrl: probe.finalUrl ?? deal.finalPurchaseUrl,
    linkType: finalClassification.linkType,
    availability: finalClassification.availability,
    validationStatus: ok ? "passed" : "failed",
    validationCode,
    validationReason,
    isHidden,
    publishable,
    priorityScore,
    qualityScore,
    lastCheckedAt: now,
    checkedAt: now,
    verifiedAt: now,
    updatedAt: now,
    linkVerified: ok,
    purchaseLinkVerified: ok,
    probeStatus: probe.status ?? 0,
    probeFinalUrl: probe.finalUrl ?? deal.finalPurchaseUrl,
    probeRedirected: Boolean(probe.redirected),
    probeBodyChecked: Boolean(probe.bodyChecked)
  };
}

function applyOperationOverrideToValidatedDeal(deal, overrides) {
  const hiddenEntry = overrides.hidden[deal.id];
  if (hiddenEntry) {
    return {
      ...deal,
      validationStatus: "failed",
      validationCode: "hidden",
      validationReason: `manual_hidden:${hiddenEntry.reason || "admin_manual_hidden"}`,
      availability: "unknown",
      isHidden: true,
      publishable: false,
      priorityScore: Math.min(deal.priorityScore ?? 0, 10),
      qualityScore: Math.min(deal.qualityScore ?? deal.priorityScore ?? 0, 10),
      lastCheckedAt: hiddenEntry.updatedAt || deal.lastCheckedAt || now
    };
  }

  const revalidationEntry = overrides.revalidate[deal.id];
  if (!revalidationEntry) return deal;

  return {
    ...deal,
    validationReason: `${deal.validationReason}; revalidation_queue:${revalidationEntry.reason || "report_revalidate"}`,
    priorityScore: Math.max(deal.priorityScore ?? 0, 92),
    qualityScore: Math.max(deal.qualityScore ?? deal.priorityScore ?? 0, 92),
    revalidationQueued: true,
    revalidationReason: revalidationEntry.reason || "report_revalidate",
    revalidationQueuedAt: revalidationEntry.updatedAt || now
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

const operationOverrides = readOperationOverrides();
const revalidationQueue = buildRevalidationQueue(operationOverrides);
const revalidationIndex = new Map(revalidationQueue.map((item, index) => [item.id, index]));
const { items: fetchedItems, providerStats } = await collectProviderItems();
const normalizedResults = fetchedItems.map(normalizeCollectedItem);
const normalizedDeals = normalizedResults
  .filter((result) => result.ok)
  .map((result) => result.deal)
  .sort((a, b) => (revalidationIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (revalidationIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER));
const normalizationFailures = normalizedResults.filter((result) => !result.ok);
const validatedDeals = [];

for (const deal of normalizedDeals) {
  validatedDeals.push(applyOperationOverrideToValidatedDeal(await validateCollectedDeal(deal), operationOverrides));
}

const dedupedDeals = dedupeDeals(validatedDeals);
const verificationSteps = [
  runStep("link-validation", ["scripts/verify-product-links-live.mjs", "--body"]),
  runStep("product-quality", ["scripts/verify-products.mjs"])
];
const linkValidation = readJson("reports/link-validation.json");
const productQuality = readJson("reports/product-quality.json");
const reportBlockedItems = new Map(
  (Array.isArray(linkValidation?.auditedItems) ? linkValidation.auditedItems : [])
    .filter((item) => item.isHidden === true || item.publishable !== true || item.validationStatus !== "passed" || item.availability !== "active")
    .map((item) => [item.id, item])
);
const exposureAdjustedDeals = dedupedDeals.map((deal) => {
  const blockedItem = reportBlockedItems.get(deal.id);
  if (!blockedItem) return deal;

  const availability = blockedItem.availability === "sold_out" || blockedItem.availability === "ended" ? blockedItem.availability : "unknown";
  const validationReason = blockedItem.validationReason || blockedItem.revalidationReason || "link_validation_report_blocked";

  return {
    ...deal,
    availability,
    validationStatus: "failed",
    validationReason,
    validationCode: blockedItem.validationCode && blockedItem.validationCode !== "valid" ? blockedItem.validationCode : "mismatch",
    isHidden: true,
    publishable: false,
    linkStatus: availability === "sold_out" ? "sold_out" : "needs_review",
    purchaseStatus: availability === "sold_out" ? "sold_out" : "needs_review",
    linkLabel: "운영 재검증 중",
    purchaseConfidence: Math.min(deal.purchaseConfidence ?? 0, 35),
    reliabilityScore: Math.min(deal.reliabilityScore ?? 0, 45),
    qualityScore: Math.min(deal.qualityScore ?? deal.priorityScore ?? 0, 35)
  };
});
const visibleDeals = exposureAdjustedDeals.filter(
  (deal) =>
    !deal.isHidden &&
    deal.publishable === true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    deal.linkType !== "search" &&
    deal.linkType !== "unavailable" &&
    Boolean(deal.finalUrl || deal.finalPurchaseUrl)
);
const hiddenDeals = exposureAdjustedDeals.filter((deal) => !visibleDeals.some((visible) => visible.id === deal.id));
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
const benefitTypeCounts = {};
const freeBenefitDealTypes = new Set(["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"]);

for (const failure of [...normalizationFailures.map((result) => result.reason), ...hiddenDeals.map((deal) => deal.validationReason)]) {
  failureReasons[failure] = (failureReasons[failure] ?? 0) + 1;
}

for (const deal of visibleDeals) {
  benefitTypeCounts[deal.dealType || "unknown"] = (benefitTypeCounts[deal.dealType || "unknown"] ?? 0) + 1;
}

for (const stat of providerStats) {
  const providerDeals = exposureAdjustedDeals.filter((deal) => deal.sourceProvider === stat.provider);
  stat.normalizedCount = normalizedDeals.filter((deal) => deal.sourceProvider === stat.provider).length;
  stat.insertedCount = providerDeals.filter((deal) => deal.sourceProvider !== "manual" && !deal.isHidden).length;
  stat.updatedCount = providerDeals.filter((deal) => deal.sourceProvider === "manual" && !deal.isHidden).length;
  stat.hiddenCount = providerDeals.filter((deal) => deal.isHidden).length;
  stat.failedCount = normalizationFailures.filter((failure) => failure.provider === stat.provider).length;
}

const snapshot = {
  generatedAt: now,
  schemaVersion: 1,
  liveProbe: shouldLiveProbe,
  deals: visibleDeals,
  visibleDealIds: visibleDeals.map((deal) => deal.id),
  benefitTypeCounts,
  freeBenefitVisibleCount: visibleDeals.filter((deal) => freeBenefitDealTypes.has(deal.dealType) || deal.isFreeShipping).length,
  externalInsertedDealIds: insertedDeals.map((deal) => deal.id),
  revalidationQueue: {
    total: revalidationQueue.length,
    matchedCount: revalidationQueue.filter((item) => exposureAdjustedDeals.some((deal) => deal.id === item.id)).length,
    ids: revalidationQueue.map((item) => item.id).slice(0, 50)
  },
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
  ok: normalizationFailures.length === 0 && visibleDeals.length > 0,
  fetchedCount: fetchedItems.length,
  normalizedCount: normalizedDeals.length,
  insertedCount: insertedDeals.length,
  updatedCount: manualVisibleCount,
  hiddenCount: hiddenDeals.length,
  failedCount: normalizationFailures.length,
  visibleCount: visibleDeals.length,
  benefitTypeCounts,
  freeBenefitVisibleCount: visibleDeals.filter((deal) => freeBenefitDealTypes.has(deal.dealType) || deal.isFreeShipping).length,
  revalidationQueue: {
    total: revalidationQueue.length,
    matchedCount: revalidationQueue.filter((item) => exposureAdjustedDeals.some((deal) => deal.id === item.id)).length,
    missingCount: revalidationQueue.filter((item) => !exposureAdjustedDeals.some((deal) => deal.id === item.id)).length,
    highPriorityIds: revalidationQueue.map((item) => item.id).slice(0, 20),
    reasons: revalidationQueue.reduce((acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    }, {})
  },
  providerStats,
  liveProbe: liveProbeSummary,
  policy: {
    version: linkQualityPolicy.version,
    source: "data/linkQualityPolicy.json",
    exposurePolicy: linkQualityPolicy.exposurePolicy
  },
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
    linkValidation,
    productQuality
  },
  steps: verificationSteps
};

writeFileSync(join(reportsDir, "refresh-deals.json"), `${JSON.stringify(baseSummary, null, 2)}\n`, "utf8");

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
