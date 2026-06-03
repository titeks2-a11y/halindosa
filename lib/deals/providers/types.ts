import { DealInput } from "@/lib/deals/normalizer";

export type DealProviderName = "coupang" | "naver" | "elevenst" | "event" | "manual";

export interface DealProviderContext {
  q?: string;
  category?: string;
  now?: string;
}

export interface DealProvider {
  name: DealProviderName;
  source: string;
  requiredEnv: string[];
  isConfigured(): boolean;
  fetchDeals(context?: DealProviderContext): Promise<DealInput[]>;
  normalizeDeal(raw: unknown, context?: DealProviderContext): DealInput | null;
  validateDeal(deal: DealInput): DealProviderValidation;
  dedupeDeal(deals: DealInput[]): DealInput[];
}

export function hasRequiredEnv(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export function getProviderFeedUrls(...keys: string[]) {
  return keys
    .flatMap((key) => (process.env[key] ?? "").split(","))
    .map((url) => url.trim())
    .filter(Boolean);
}

function getFeedItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { deals?: unknown[] }).deals)) return (payload as { deals: unknown[] }).deals;
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)) return (payload as { items: unknown[] }).items;
  return [];
}

export async function fetchProviderJsonFeeds(providerName: DealProviderName, urls: string[], timeoutMs = 5000) {
  const settled = await Promise.allSettled(
    urls.map(async (url) => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            headers: { Accept: "application/json", "User-Agent": "HalindosaProvider/1.0" },
            cache: "no-store",
            signal: controller.signal
          });

          if (!response.ok) {
            if (attempt === 0 && response.status >= 500) continue;
            return [];
          }

          const payload = await response.json();
          return getFeedItems(payload)
            .map((item) => normalizeProviderDeal({ ...(item as Record<string, unknown>), sourceProvider: providerName }, providerName))
            .filter((item): item is DealInput => Boolean(item));
        } catch {
          if (attempt === 1) return [];
        } finally {
          clearTimeout(timeout);
        }
      }

      return [];
    })
  );

  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

export interface DealProviderValidation {
  ok: boolean;
  reason: string;
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getCanonicalUrl(value: string) {
  try {
    const url = new URL(value);
    const keepParams = new Set(["itemId", "vendorItemId", "goodsCode", "goodsNo", "itemId", "goodscode", "productId"]);

    for (const key of Array.from(url.searchParams.keys())) {
      if (!keepParams.has(key)) url.searchParams.delete(key);
    }

    url.hash = "";
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname}${url.search}`;
  } catch {
    return "";
  }
}

function firstNonEmptyUrl(...values: unknown[]) {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0) ?? "";
}

function parseHttpUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function isBlockedProviderHost(host: string) {
  return [
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
  ].some((candidate) => host === candidate || host.endsWith(`.${candidate}`) || host.includes(candidate));
}

function isProviderSearchOrHomeUrl(url: URL) {
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return (
    path === "" ||
    path === "/" ||
    path === "/main" ||
    path === "/index" ||
    [
      "/search",
      "search.",
      "shopping/search",
      "msearch",
      "find",
      "result",
      "query=",
      "keyword=",
      "kwd=",
      "sword=",
      "wholesale-",
      "/np/search",
      "/productions/feed",
      "/category",
      "/categories",
      "/display"
    ].some((pattern) => value.includes(pattern))
  );
}

export function normalizeProviderDeal(raw: unknown, providerName: DealProviderName): DealInput | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const title = String(item.title ?? item.productName ?? item.name ?? "").replace(/<[^>]+>/g, "").trim();
  const mallName = String(item.mallName ?? item.mall ?? item.seller ?? providerName).trim();
  const link = firstNonEmptyUrl(item.affiliateUrl, item.verifiedProductUrl, item.finalPurchaseUrl, item.finalUrl, item.productUrl, item.purchaseUrl, item.originalUrl, item.eventUrl, item.url, item.link, item.searchUrl);
  const salePrice = toNumber(item.salePrice ?? item.price ?? item.lprice);
  const originalPrice = Math.max(toNumber(item.originalPrice ?? item.listPrice ?? item.hprice, salePrice), salePrice);

  if (!title || !mallName || !link || !salePrice) return null;

  const id = String(item.id ?? item.externalId ?? `${providerName}-${normalizeId(`${mallName}-${title}-${salePrice}`)}`).trim();

  return {
    id,
    title,
    mallName,
    category: typeof item.category === "string" ? item.category as DealInput["category"] : "기타",
    originalPrice,
    salePrice,
    discountRate: toNumber(item.discountRate),
    thumbnail: String(item.thumbnail ?? item.imageUrl ?? item.image ?? ""),
    imageUrl: String(item.imageUrl ?? item.thumbnail ?? item.image ?? ""),
    link,
    productUrl: typeof item.productUrl === "string" ? item.productUrl : link,
    verifiedProductUrl: typeof item.verifiedProductUrl === "string" ? item.verifiedProductUrl : undefined,
    purchaseUrl: typeof item.purchaseUrl === "string" ? item.purchaseUrl : link,
    finalUrl: typeof item.finalUrl === "string" ? item.finalUrl : link,
    finalPurchaseUrl: typeof item.finalPurchaseUrl === "string" ? item.finalPurchaseUrl : link,
    originalUrl: typeof item.originalUrl === "string" ? item.originalUrl : link,
    affiliateUrl: typeof item.affiliateUrl === "string" ? item.affiliateUrl : undefined,
    eventUrl: typeof item.eventUrl === "string" ? item.eventUrl : undefined,
    sourceName: typeof item.sourceName === "string" ? item.sourceName : providerName,
    sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl : link,
    shipping: typeof item.shipping === "string" ? item.shipping : typeof item.shippingInfo === "string" ? item.shippingInfo : "판매처 조건 확인",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    expireAt: typeof item.expireAt === "string" ? item.expireAt : typeof item.expiresAt === "string" ? item.expiresAt : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tags: toStringArray(item.tags) ?? [providerName, "수집"],
    source: providerName
  };
}

export function validateProviderDeal(deal: DealInput): DealProviderValidation {
  if (!deal.title?.trim()) return { ok: false, reason: "missing_title" };
  if (!deal.mallName?.trim() && !deal.mall?.trim()) return { ok: false, reason: "missing_mall" };
  if (!deal.salePrice || deal.salePrice <= 0) return { ok: false, reason: "missing_price" };
  const primaryUrl = firstNonEmptyUrl(deal.affiliateUrl, deal.verifiedProductUrl, deal.finalPurchaseUrl, deal.finalUrl, deal.productUrl, deal.purchaseUrl, deal.originalUrl, deal.eventUrl, deal.link, deal.searchUrl);
  const parsedUrl = parseHttpUrl(primaryUrl);

  if (!primaryUrl) return { ok: false, reason: "missing_purchase_url" };
  if (!parsedUrl) return { ok: false, reason: "invalid_purchase_url" };
  if (isBlockedProviderHost(parsedUrl.hostname.toLowerCase())) return { ok: false, reason: "blocked_or_community_host" };
  if (isProviderSearchOrHomeUrl(parsedUrl)) return { ok: false, reason: "search_or_home_url" };
  return { ok: true, reason: "ready" };
}

export function dedupeProviderDeals(deals: DealInput[]) {
  const unique = new Map<string, DealInput>();

  for (const deal of deals) {
    const urlKey = getCanonicalUrl(deal.finalPurchaseUrl ?? deal.purchaseUrl ?? deal.productUrl ?? deal.link);
    const titleKey = normalizeId(`${deal.mallName ?? deal.mall}-${deal.title}-${deal.salePrice}`);
    const key = urlKey || titleKey;
    const previous = unique.get(key);

    if (!previous || (deal.thumbnail && !previous.thumbnail)) {
      unique.set(key, deal);
    }
  }

  return Array.from(unique.values());
}
