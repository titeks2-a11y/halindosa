import { fetchLiveDeals } from "@/lib/liveDealProvider";
import { normalizeDeals } from "@/lib/deals/normalizer";

export async function fetchStagingDeals(options: { category?: string; q?: string } = {}) {
  const deals = await fetchLiveDeals(options);
  return normalizeDeals(deals, "staging");
}
