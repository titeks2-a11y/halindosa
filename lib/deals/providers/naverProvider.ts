import { DealProvider, dedupeProviderDeals, fetchProviderJsonFeeds, getProviderFeedUrls, hasRequiredEnv, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

const requiredEnv = ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"];

function cleanTitle(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchNaverShoppingItems(query = "특가 할인") {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return [];

  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "20");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");

  try {
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      cache: "no-store"
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as {
      items?: Array<Record<string, unknown>>;
    };

    return (payload.items ?? []).map((item) =>
      normalizeProviderDeal(
        {
          id: `naver-${String(item.productId ?? item.link ?? item.title)}`,
          title: cleanTitle(String(item.title ?? "")),
          mallName: String(item.mallName ?? "네이버쇼핑"),
          category: String(item.category1 ?? "기타"),
          salePrice: Number(item.lprice ?? 0),
          originalPrice: Math.max(Number(item.hprice ?? 0), Number(item.lprice ?? 0)),
          thumbnail: String(item.image ?? ""),
          imageUrl: String(item.image ?? ""),
          finalPurchaseUrl: String(item.link ?? ""),
          productUrl: String(item.link ?? ""),
          link: String(item.link ?? ""),
          sourceName: "naver",
          evidence: `Naver Shopping API ${query}`
        },
        "naver"
      )
    ).filter((item): item is NonNullable<typeof item> => Boolean(item));
  } catch {
    return [];
  }
}

export const NaverProvider: DealProvider = {
  name: "naver",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals(context) {
    const feedDeals = await fetchProviderJsonFeeds("naver", getProviderFeedUrls("NAVER_PARTNER_FEED_URLS"));
    const apiDeals = this.isConfigured() ? await fetchNaverShoppingItems(context?.q?.trim() || process.env.DEAL_LIVE_KEYWORDS?.split(",")[0]?.trim() || "특가 할인") : [];
    return this.dedupeDeal([...feedDeals, ...apiDeals]);
  },
  normalizeDeal(raw) {
    return normalizeProviderDeal(raw, "naver");
  },
  validateDeal(deal) {
    return validateProviderDeal(deal);
  },
  dedupeDeal(deals) {
    return dedupeProviderDeals(deals);
  }
};
