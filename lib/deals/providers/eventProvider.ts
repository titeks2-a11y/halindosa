import { DealProvider, dedupeProviderDeals, fetchProviderJsonFeeds, getProviderFeedUrls, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

export const EventProvider: DealProvider = {
  name: "event",
  source: "official_event_feed",
  requiredEnv: [],
  isConfigured() {
    return true;
  },
  async fetchDeals() {
    // Consume official or partner-provided event feeds only. Community post
    // links are still rejected by the shared quality gate unless finalUrl is a
    // real event/product detail URL.
    return this.dedupeDeal(await fetchProviderJsonFeeds("event", getProviderFeedUrls("DEAL_EVENT_FEED_URLS")));
  },
  normalizeDeal(raw) {
    return normalizeProviderDeal(raw, "event");
  },
  validateDeal(deal) {
    return validateProviderDeal(deal);
  },
  dedupeDeal(deals) {
    return dedupeProviderDeals(deals);
  }
};
