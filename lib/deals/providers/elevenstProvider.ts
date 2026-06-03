import { DealProvider, dedupeProviderDeals, hasRequiredEnv, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

const requiredEnv = ["ELEVENST_API_KEY"];

export const ElevenstProvider: DealProvider = {
  name: "elevenst",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals() {
    if (!this.isConfigured()) return [];

    // Future production hook: call the 11st Open API or approved partner feed.
    return [];
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
