import seedNewsDeals from "@/data/newsDeals.seed.json";
import type { NewsDeal } from "@/types/newsDeal";

export interface NewsDealProviderContext {
  now?: string;
}

export interface NewsDealProvider {
  name: NewsDeal["provider"];
  source: string;
  requiredEnv: string[];
  isConfigured(): boolean;
  fetchNewsDeals(context?: NewsDealProviderContext): Promise<NewsDeal[]>;
}

export function getNewsProviderFeedUrls(...keys: string[]) {
  return keys
    .flatMap((key) => (process.env[key] ?? "").split(","))
    .map((url) => url.trim())
    .filter(Boolean);
}

function seedByProvider(provider: NewsDeal["provider"]) {
  return (seedNewsDeals as NewsDeal[]).filter((deal) => deal.provider === provider);
}

export function createSeedNewsProvider(provider: NewsDeal["provider"], source: string): NewsDealProvider {
  return {
    name: provider,
    source,
    requiredEnv: [],
    isConfigured() {
      return true;
    },
    async fetchNewsDeals() {
      return seedByProvider(provider);
    }
  };
}

export const NewsProvider = createSeedNewsProvider("news", "approved_news_feed");
