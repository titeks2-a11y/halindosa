import { isNativeRuntime } from "@/lib/nativeRuntime";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isSafePublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRelativeApiPath(value: string) {
  return value.startsWith("/api/");
}

export function getPublicApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (!configured || !isSafePublicHttpUrl(configured)) return "";
  return trimTrailingSlash(configured);
}

export function hasPublicApiBaseUrl() {
  return Boolean(getPublicApiBaseUrl());
}

export async function shouldUseLocalBundleData() {
  return (await isNativeRuntime()) && !hasPublicApiBaseUrl();
}

export async function resolveRuntimeApiUrl(url: string) {
  if (!isRelativeApiPath(url)) return url;
  if (!(await isNativeRuntime())) return url;

  const baseUrl = getPublicApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Native runtime requires NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_SITE_URL for live API requests.");
  }

  return `${baseUrl}${url}`;
}

export function isCrossOriginApiRequest(url: string) {
  if (typeof window === "undefined") return false;

  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}
