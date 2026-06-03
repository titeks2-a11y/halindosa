import { DealInput } from "@/lib/deals/normalizer";

export type DealProviderName = "coupang" | "naver" | "elevenst" | "event" | "manual";

export interface DealProviderContext {
  q?: string;
  category?: string;
  now?: string;
}

export interface DealProvider {
  name: DealProviderName;
  source: string;
  requiredEnv: string[];
  isConfigured(): boolean;
  fetchDeals(context?: DealProviderContext): Promise<DealInput[]>;
}

export function hasRequiredEnv(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}
