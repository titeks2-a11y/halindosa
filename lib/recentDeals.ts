export const recentDealStorageKey = "halindosa:recent-deals";

export function readRecentDealIds() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(recentDealStorageKey);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberRecentDealId(id: string, maxItems = 20) {
  if (typeof window === "undefined") return [];

  const next = [id, ...readRecentDealIds().filter((storedId) => storedId !== id)].slice(0, maxItems);
  window.localStorage.setItem(recentDealStorageKey, JSON.stringify(next));
  return next;
}
