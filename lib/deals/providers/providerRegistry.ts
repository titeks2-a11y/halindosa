import { CoupangProvider } from "@/lib/deals/providers/coupangProvider";
import { ElevenstProvider } from "@/lib/deals/providers/elevenstProvider";
import { EventProvider } from "@/lib/deals/providers/eventProvider";
import { ManualProvider } from "@/lib/deals/providers/manualProvider";
import { NaverProvider } from "@/lib/deals/providers/naverProvider";

export const dealProviders = [ManualProvider, CoupangProvider, NaverProvider, ElevenstProvider, EventProvider];

export function getDealProviderReadiness() {
  return dealProviders.map((provider) => ({
    name: provider.name,
    source: provider.source,
    configured: provider.isConfigured(),
    requiredEnv: provider.requiredEnv,
    mode: provider.requiredEnv.length ? "external_api" : "fallback_or_manual",
    canFallbackSafely: true
  }));
}

export async function fetchProviderDealsSafely() {
  const startedAt = new Date().toISOString();
  const settled = await Promise.allSettled(
    dealProviders.map(async (provider) => {
      const fetched = await provider.fetchDeals({ now: startedAt });
      const normalized = fetched.map((item) => provider.normalizeDeal(item)).filter((item): item is NonNullable<typeof item> => Boolean(item));
      const valid = normalized.filter((item) => provider.validateDeal(item).ok);
      const deduped = provider.dedupeDeal(valid);

      return {
        provider: provider.name,
        source: provider.source,
        configured: provider.isConfigured(),
        fetchedCount: fetched.length,
        normalizedCount: normalized.length,
        validCount: valid.length,
        dedupedCount: deduped.length,
        deals: deduped
      };
    })
  );

  return settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const provider = dealProviders[index];
    return {
      provider: provider.name,
      source: provider.source,
      configured: provider.isConfigured(),
      fetchedCount: 0,
      normalizedCount: 0,
      validCount: 0,
      dedupedCount: 0,
      deals: [],
      error: result.reason instanceof Error ? result.reason.message : "provider_failed"
    };
  });
}
