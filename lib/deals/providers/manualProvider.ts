import { mockDeals } from "@/data/mockDeals";
import { DealInput } from "@/lib/deals/normalizer";
import { DealProvider, dedupeProviderDeals, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

export const ManualProvider: DealProvider = {
  name: "manual",
  source: "manual_review",
  requiredEnv: [],
  isConfigured() {
    return true;
  },
  async fetchDeals() {
    return mockDeals as DealInput[];
  },
  normalizeDeal(raw) {
    return normalizeProviderDeal(raw, "manual");
  },
  validateDeal(deal) {
    return validateProviderDeal(deal);
  },
  dedupeDeal(deals) {
    return dedupeProviderDeals(deals);
  }
};
