import { normalizePartnerFeed, PartnerFeedItem, validatePartnerFeed } from "@/lib/feedImport";
import { Deal } from "@/types/deal";

const requestTimeoutMs = 5000;

export function getConfiguredProductionFeedUrls() {
  return (process.env.DEAL_PRODUCTION_FEED_URLS ?? process.env.DEAL_PARTNER_FEED_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

function getFeedItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { deals?: unknown[] }).deals)) return (payload as { deals: unknown[] }).deals;
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)) return (payload as { items: unknown[] }).items;
  return [];
}

function toPartnerFeedItem(raw: unknown): PartnerFeedItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const externalId = String(item.externalId ?? item.id ?? "").trim();
  const mall = String(item.mall ?? item.mallName ?? "").trim();
  const title = String(item.title ?? "").trim();

  if (!externalId || !mall || !title) return null;

  return {
    externalId,
    mall,
    title,
    category: typeof item.category === "string" ? item.category : undefined,
    originalPrice: Number(item.originalPrice),
    salePrice: Number(item.salePrice ?? item.price),
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : typeof item.thumbnail === "string" ? item.thumbnail : undefined,
    link: typeof item.link === "string" ? item.link : typeof item.url === "string" ? item.url : undefined,
    productUrl: typeof item.productUrl === "string" ? item.productUrl : undefined,
    purchaseUrl: typeof item.purchaseUrl === "string" ? item.purchaseUrl : undefined,
    affiliateUrl: typeof item.affiliateUrl === "string" ? item.affiliateUrl : undefined,
    finalPurchaseUrl: typeof item.finalPurchaseUrl === "string" ? item.finalPurchaseUrl : undefined,
    searchUrl: typeof item.searchUrl === "string" ? item.searchUrl : undefined,
    originalUrl: typeof item.originalUrl === "string" ? item.originalUrl : undefined,
    shipping: typeof item.shipping === "string" ? item.shipping : typeof item.shippingInfo === "string" ? item.shippingInfo : undefined,
    expiresAt: typeof item.expiresAt === "string" ? item.expiresAt : typeof item.expireAt === "string" ? item.expireAt : undefined,
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : undefined
  };
}

async function fetchJsonFeed(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) return [];

    const payload = await response.json();
    return getFeedItems(payload).map(toPartnerFeedItem).filter((item): item is PartnerFeedItem => Boolean(item));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProductionDeals(): Promise<Deal[]> {
  const feedUrls = getConfiguredProductionFeedUrls();
  if (!feedUrls.length) return [];

  const settled = await Promise.allSettled(feedUrls.map(fetchJsonFeed));
  const feedItems = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  if (!feedItems.length) return [];

  const issues = validatePartnerFeed(feedItems);
  const invalidIndexes = new Set(issues.map((issue) => issue.index));
  const validItems = feedItems.filter((_, index) => !invalidIndexes.has(index));

  return normalizePartnerFeed(validItems, "production");
}
