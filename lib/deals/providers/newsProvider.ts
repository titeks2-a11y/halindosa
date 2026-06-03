import seedNewsDeals from "@/data/newsDeals.seed.json";
import type { NewsDeal } from "@/types/newsDeal";

export interface NewsDealProviderContext {
  now?: string;
  timeoutMs?: number;
}

export interface NewsDealProvider {
  name: NewsDeal["provider"];
  source: string;
  requiredEnv: string[];
  isConfigured(): boolean;
  fetchNewsDeals(context?: NewsDealProviderContext): Promise<NewsDeal[]>;
}

interface JsonFeedNewsProviderOptions {
  name: NewsDeal["provider"];
  source: string;
  envKeys: string[];
  includeSeed?: boolean;
}

export function getNewsProviderFeedUrls(...keys: string[]) {
  return keys
    .flatMap((key) => (process.env[key] ?? "").split(","))
    .map((url) => url.trim())
    .filter(Boolean);
}

function seedByProvider(provider: NewsDeal["provider"]) {
  return (seedNewsDeals as NewsDeal[]).filter((deal) => deal.provider === provider);
}

function extractNewsFeedItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (!payload || typeof payload !== "object") return [];

  const objectPayload = payload as {
    deals?: unknown;
    items?: unknown;
    newsDeals?: unknown;
    events?: unknown;
    coupons?: unknown;
    benefits?: unknown;
  };
  const candidates = [objectPayload.deals, objectPayload.items, objectPayload.newsDeals, objectPayload.events, objectPayload.coupons, objectPayload.benefits];
  const collection = candidates.find(Array.isArray);

  return Array.isArray(collection) ? collection.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeXmlEntities(value: string) {
  return stripCdata(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function xmlTagPattern(name: string) {
  const escaped = escapeRegExp(name);
  return name.includes(":") ? escaped : `(?:[\\w.-]+:)?${escaped}`;
}

function cleanXmlText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlTag(block: string, names: string[]) {
  for (const name of names) {
    const pattern = xmlTagPattern(name);
    const match = block.match(new RegExp(`<${pattern}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${pattern}>`, "i"));
    if (match?.[1]) return cleanXmlText(decodeXmlEntities(match[1]));
  }
  return "";
}

function extractAtomLinkHref(block: string) {
  const alternate = block.match(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\/?>/i);
  if (alternate?.[1]) return cleanXmlText(decodeXmlEntities(alternate[1]));

  const first = block.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\/?>/i);
  return first?.[1] ? cleanXmlText(decodeXmlEntities(first[1])) : "";
}

function splitTags(value: string) {
  return cleanXmlText(value)
    .split(/[,/|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function collectXmlBlocks(xml: string, pattern: RegExp) {
  const blocks: string[] = [];
  let match = pattern.exec(xml);

  while (match) {
    blocks.push(match[0]);
    match = pattern.exec(xml);
  }

  return blocks;
}

export function parseNewsFeedXmlItems(xml: string, provider: NewsDeal["provider"], feedUrl = ""): Record<string, unknown>[] {
  const itemBlocks = collectXmlBlocks(xml, /<item\b[\s\S]*?<\/item>/gi);
  const blocks = itemBlocks.length ? itemBlocks : collectXmlBlocks(xml, /<entry\b[\s\S]*?<\/entry>/gi);

  return blocks.map((block) => {
    const link = extractXmlTag(block, ["link"]) || extractAtomLinkHref(block) || extractXmlTag(block, ["guid", "id"]);
    const finalUrl = extractXmlTag(block, ["finalUrl", "final-url", "final_url", "eventUrl", "event-url", "event_url", "purchaseUrl", "purchase-url", "purchase_url"]) || link;
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

export async function fetchNewsFeed(feedUrl: string, provider: NewsDeal["provider"], timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "HalindosaNewsProvider/1.0"
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`${provider}_feed_http_${response.status}`);

    const body = await response.text();

    try {
      return extractNewsFeedItems(JSON.parse(body));
    } catch {
      const items = parseNewsFeedXmlItems(body, provider, feedUrl);
      if (!items.length) throw new Error(`${provider}_feed_unsupported_payload`);
      return items;
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJsonNewsFeed(feedUrl: string, provider: NewsDeal["provider"], timeoutMs = 5000) {
  return fetchNewsFeed(feedUrl, provider, timeoutMs);
}

export function createJsonFeedNewsProvider(options: JsonFeedNewsProviderOptions): NewsDealProvider {
  return {
    name: options.name,
    source: options.source,
    requiredEnv: options.envKeys,
    isConfigured() {
      return getNewsProviderFeedUrls(...options.envKeys).length > 0;
    },
    async fetchNewsDeals(context) {
      const feedUrls = getNewsProviderFeedUrls(...options.envKeys);
      const seedDeals = options.includeSeed === false ? [] : seedByProvider(options.name);
      const feedDeals: NewsDeal[] = [];

      for (const feedUrl of feedUrls) {
        const items = await fetchNewsFeed(feedUrl, options.name, context?.timeoutMs);
        feedDeals.push(
          ...items.map((item) => ({
            ...item,
            provider: options.name,
            sourceName: typeof item.sourceName === "string" ? item.sourceName : options.source,
            sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl : feedUrl
          })) as NewsDeal[]
        );
      }

      return [...seedDeals, ...feedDeals];
    }
  };
}

export function createSeedNewsProvider(provider: NewsDeal["provider"], source: string): NewsDealProvider {
  return {
    name: provider,
    source,
    requiredEnv: [],
    isConfigured() {
      return true;
    },
    async fetchNewsDeals() {
      return seedByProvider(provider);
    }
  };
}

export const NewsProvider = createJsonFeedNewsProvider({
  name: "news",
  source: "approved_news_feed",
  envKeys: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"],
  includeSeed: true
});
