export const consentStorageKey = "halindosa:consent";

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  affiliate: boolean;
  decidedAt: string;
}

export function createConsentState(analytics: boolean, affiliate: boolean): ConsentState {
  return {
    necessary: true,
    analytics,
    affiliate,
    decidedAt: new Date().toISOString()
  };
}

export function readStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(consentStorageKey);
    return stored ? (JSON.parse(stored) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function writeStoredConsent(consent: ConsentState) {
  window.localStorage.setItem(consentStorageKey, JSON.stringify(consent));
}

export function hasAnalyticsConsent(consent: ConsentState | null) {
  return Boolean(consent?.analytics);
}

export function hasAffiliateConsent(consent: ConsentState | null) {
  return Boolean(consent?.affiliate);
}
