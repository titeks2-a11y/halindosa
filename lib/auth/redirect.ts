const defaultSiteUrl = "http://127.0.0.1:3000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getPublicSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl);
}

export function getSafeNextPath(value?: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("://")) return "/";
  return value;
}

export function getAuthRedirectUrl(nextPath = "/") {
  const configuredRedirect = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL;
  const safeNext = getSafeNextPath(nextPath);

  if (configuredRedirect) {
    try {
      const url = new URL(configuredRedirect);
      if (url.protocol === "https:" || url.protocol === "http:") {
        url.searchParams.set("next", safeNext);
        return url.toString();
      }
    } catch {
      // Fall back to the site URL below.
    }
  }

  const url = new URL("/auth/callback", getPublicSiteUrl());
  url.searchParams.set("next", safeNext);
  return url.toString();
}
