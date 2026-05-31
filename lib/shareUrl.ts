const defaultPublicSiteUrl = "https://halindosa.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalOrNativeOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) || ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return true;
  }
}

export function getPublicShareBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured && /^https?:\/\//.test(configured)) {
    return trimTrailingSlash(configured);
  }

  if (typeof window !== "undefined" && window.location?.origin && !isLocalOrNativeOrigin(window.location.origin)) {
    return trimTrailingSlash(window.location.origin);
  }

  return defaultPublicSiteUrl;
}

export function buildPublicDealShareUrl(dealId: string) {
  return `${getPublicShareBaseUrl()}/deals/${encodeURIComponent(dealId)}`;
}

export function buildPublicAppShareUrl() {
  return getPublicShareBaseUrl();
}
