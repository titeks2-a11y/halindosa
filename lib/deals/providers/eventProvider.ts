import { DealProvider, dedupeProviderDeals, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

export const EventProvider: DealProvider = {
  name: "event",
  source: "official_event_feed",
  requiredEnv: [],
  isConfigured() {
    return true;
  },
  async fetchDeals() {
    // Future production hook: consume official RSS/API/event feeds only.
    // Event URLs still pass through normalizeDeal and link validation before exposure.
    return [];
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
