import { DealProvider, dedupeProviderDeals, fetchProviderJsonFeeds, getProviderFeedUrls, hasRequiredEnv, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

const requiredEnv = ["ELEVENST_API_KEY"];

export const ElevenstProvider: DealProvider = {
  name: "elevenst",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals() {
    const feedDeals = await fetchProviderJsonFeeds("elevenst", getProviderFeedUrls("ELEVENST_PARTNER_FEED_URLS"));

    // 11st Open API response formats vary by contract. Approved JSON feeds are
    // supported now, and raw API keys can be mapped here without changing UI code.
    if (!this.isConfigured()) return feedDeals;
    return this.dedupeDeal(feedDeals);
  },
  normalizeDeal(raw) {
    return normalizeProviderDeal(raw, "elevenst");
  },
  validateDeal(deal) {
    return validateProviderDeal(deal);
  },
  dedupeDeal(deals) {
    return dedupeProviderDeals(deals);
  }
};
