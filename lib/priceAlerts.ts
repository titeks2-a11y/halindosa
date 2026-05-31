export const priceAlertStorageKey = "halindosa:price-alerts";

export interface StoredPriceAlert {
  dealId: string;
  title: string;
  targetPrice: number;
  createdAt: string;
}

function isStoredPriceAlert(item: unknown): item is StoredPriceAlert {
  if (!item || typeof item !== "object") return false;
  const alert = item as Partial<StoredPriceAlert>;
  return typeof alert.dealId === "string" && typeof alert.title === "string" && typeof alert.targetPrice === "number";
}

export function readStoredPriceAlerts() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(priceAlertStorageKey);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(isStoredPriceAlert) : [];
  } catch {
    return [];
  }
}

export function writeStoredPriceAlerts(alerts: StoredPriceAlert[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(priceAlertStorageKey, JSON.stringify(alerts.slice(0, 50)));
}

export function removeStoredPriceAlert(dealId: string) {
  const next = readStoredPriceAlerts().filter((alert) => alert.dealId !== dealId);
  writeStoredPriceAlerts(next);
  return next;
}
