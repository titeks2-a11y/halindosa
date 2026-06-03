export const recentNewsBenefitStorageKey = "halindosa:recent-news-benefits";
export const recentNewsBenefitUpdatedEvent = "halindosa:recent-news-benefits-updated";

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function readRecentNewsBenefitIds() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(recentNewsBenefitStorageKey);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? uniqueIds(parsed.filter((id): id is string => typeof id === "string")) : [];
  } catch {
    return [];
  }
}

export function rememberRecentNewsBenefitId(id: string, maxItems = 20) {
  if (typeof window === "undefined") return [];

  const next = uniqueIds([id, ...readRecentNewsBenefitIds().filter((storedId) => storedId !== id)]).slice(0, maxItems);
  window.localStorage.setItem(recentNewsBenefitStorageKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(recentNewsBenefitUpdatedEvent, { detail: { id, ids: next } }));
  return next;
}

export function clearRecentNewsBenefitIds() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(recentNewsBenefitStorageKey);
  window.dispatchEvent(new CustomEvent(recentNewsBenefitUpdatedEvent, { detail: { ids: [] } }));
}
