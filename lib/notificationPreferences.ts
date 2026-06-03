export const notificationPreferenceStorageKey = "halindosa:notification-preferences";
export const notificationPreferenceUpdatedEvent = "halindosa:notification-preferences-updated";

export const notificationCategoryOptions = [
  "무료/체험",
  "쿠폰/이벤트",
  "식품",
  "생활용품",
  "마트/편의점",
  "외식/배달",
  "디지털",
  "패션",
  "뷰티",
  "육아",
  "여행",
  "영화/문화",
  "카드/멤버십",
  "정부/공공혜택"
] as const;

export const defaultNotificationCategories = ["무료/체험", "쿠폰/이벤트", "식품", "생활용품"];

export type NotificationSignalId = "endingSoon" | "hot" | "new" | "freeShipping";

export type NotificationSignalState = Record<NotificationSignalId, boolean>;

export interface InAppNotificationPreferences {
  signals: NotificationSignalState;
  categories: string[];
  updatedAt: string;
}

export const defaultNotificationSignals: NotificationSignalState = {
  endingSoon: true,
  hot: true,
  new: true,
  freeShipping: true
};

export const defaultNotificationPreferences: InAppNotificationPreferences = {
  signals: defaultNotificationSignals,
  categories: defaultNotificationCategories,
  updatedAt: ""
};

function sanitizeCategories(categories: unknown) {
  if (!Array.isArray(categories)) return defaultNotificationCategories;
  const allowed = new Set<string>(notificationCategoryOptions);
  const next = Array.from(new Set(categories.filter((category): category is string => typeof category === "string" && allowed.has(category))));
  return next.length ? next.slice(0, 8) : defaultNotificationCategories;
}

function sanitizeSignals(signals: unknown) {
  if (!signals || typeof signals !== "object") return defaultNotificationSignals;
  const values = signals as Partial<Record<NotificationSignalId, unknown>>;

  return {
    endingSoon: typeof values.endingSoon === "boolean" ? values.endingSoon : defaultNotificationSignals.endingSoon,
    hot: typeof values.hot === "boolean" ? values.hot : defaultNotificationSignals.hot,
    new: typeof values.new === "boolean" ? values.new : defaultNotificationSignals.new,
    freeShipping: typeof values.freeShipping === "boolean" ? values.freeShipping : defaultNotificationSignals.freeShipping
  };
}

function normalizePreferences(value: unknown): InAppNotificationPreferences {
  if (!value || typeof value !== "object") return defaultNotificationPreferences;
  const record = value as Record<string, unknown>;

  // V1 stored the four signal booleans directly. Keep that shape readable so existing users do not lose settings.
  const legacySignals = ["endingSoon", "hot", "new", "freeShipping"].some((key) => typeof record[key] === "boolean");
  const signals = legacySignals ? sanitizeSignals(record) : sanitizeSignals(record.signals);

  return {
    signals,
    categories: sanitizeCategories(record.categories),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : ""
  };
}

export function readInAppNotificationPreferences() {
  if (typeof window === "undefined") return defaultNotificationPreferences;

  try {
    const stored = window.localStorage.getItem(notificationPreferenceStorageKey);
    return stored ? normalizePreferences(JSON.parse(stored)) : defaultNotificationPreferences;
  } catch {
    return defaultNotificationPreferences;
  }
}

export function writeInAppNotificationPreferences(preferences: InAppNotificationPreferences) {
  if (typeof window === "undefined") return preferences;
  const next = {
    signals: sanitizeSignals(preferences.signals),
    categories: sanitizeCategories(preferences.categories),
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(notificationPreferenceStorageKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(notificationPreferenceUpdatedEvent, { detail: next }));
  return next;
}

export function readNotificationPreferenceCategories() {
  return readInAppNotificationPreferences().categories;
}
