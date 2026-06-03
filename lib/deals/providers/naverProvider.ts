import { DealProvider, dedupeProviderDeals, hasRequiredEnv, normalizeProviderDeal, validateProviderDeal } from "@/lib/deals/providers/types";

const requiredEnv = ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"];

export const NaverProvider: DealProvider = {
  name: "naver",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals() {
    if (!this.isConfigured()) return [];

    // Future production hook: call Naver Shopping Search API and keep only
    // records that can be normalized into verified product detail URLs.
    return [];
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
