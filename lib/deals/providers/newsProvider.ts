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

export async function fetchJsonNewsFeed(feedUrl: string, provider: NewsDeal["provider"], timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HalindosaNewsProvider/1.0"
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`${provider}_feed_http_${response.status}`);

    return extractNewsFeedItems(await response.json());
  } finally {
    clearTimeout(timeout);
  }
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
        const items = await fetchJsonNewsFeed(feedUrl, options.name, context?.timeoutMs);
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
