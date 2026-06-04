import { recentSearchStorageKey } from "@/lib/homeDiscoveryConfig";

const maxRecentSearchKeywordCount = 8;

export function readRecentSearchKeywords() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentSearchStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, maxRecentSearchKeywordCount) : [];
  } catch {
    return [];
  }
}

export function storeRecentSearchKeywords(keywords: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(keywords.slice(0, maxRecentSearchKeywordCount)));
}
