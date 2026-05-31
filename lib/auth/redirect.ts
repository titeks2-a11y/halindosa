const defaultSiteUrl = "http://127.0.0.1:3000";
const defaultAppScheme = "halindosa";

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

export function getNativeAuthRedirectUrl(nextPath = "/") {
  const scheme = (process.env.NEXT_PUBLIC_APP_SCHEME || defaultAppScheme).replace(/:\/?\/?$/, "");
  const url = new URL(`${scheme}://auth/callback`);
  url.searchParams.set("next", getSafeNextPath(nextPath));
  return url.toString();
}

export async function getRuntimeAuthRedirectUrl(nextPath = "/") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      return getNativeAuthRedirectUrl(nextPath);
    }
  } catch {
    // Web runtime fallback below.
  }

  return getAuthRedirectUrl(nextPath);
}
