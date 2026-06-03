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

export function normalizeProviderDeal(raw: unknown, providerName: DealProviderName): DealInput | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const title = String(item.title ?? item.productName ?? item.name ?? "").replace(/<[^>]+>/g, "").trim();
  const mallName = String(item.mallName ?? item.mall ?? item.seller ?? providerName).trim();
  const link = String(item.finalPurchaseUrl ?? item.purchaseUrl ?? item.productUrl ?? item.url ?? item.link ?? "").trim();
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
    purchaseUrl: typeof item.purchaseUrl === "string" ? item.purchaseUrl : link,
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
  if (!deal.link && !deal.productUrl && !deal.purchaseUrl && !deal.finalPurchaseUrl) return { ok: false, reason: "missing_purchase_url" };
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
