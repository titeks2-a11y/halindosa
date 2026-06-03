import { DealProvider, dedupeProviderDeals, fetchProviderJsonFeeds, getProviderFeedUrls, hasRequiredEnv, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

const requiredEnv = ["COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY"];

export const CoupangProvider: DealProvider = {
  name: "coupang",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals() {
    const feedDeals = await fetchProviderJsonFeeds("coupang", getProviderFeedUrls("COUPANG_PARTNER_FEED_URLS"));

    // Coupang Partners/Open API signing differs by approved account type.
    // Until keys and a permitted endpoint are configured, feedDeals keeps the
    // provider operational without scraping or exposing search fallback links.
    if (!this.isConfigured()) return feedDeals;
    return this.dedupeDeal(feedDeals);
  },
  normalizeDeal(raw) {
    return normalizeProviderDeal(raw, "coupang");
  },
  validateDeal(deal) {
    return validateProviderDeal(deal);
  },
  dedupeDeal(deals) {
    return dedupeProviderDeals(deals);
  }
};
