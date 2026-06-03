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
    requiredEnv: provider.requiredEnv
  }));
}
