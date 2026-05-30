import { mockDeals } from "@/data/mockDeals";
import { normalizeDeals } from "@/lib/deals/normalizer";

export async function fetchMockDeals() {
  return normalizeDeals(mockDeals, "mock");
}
