export function buildDealRedirectUrl(dealId: string, from: string, options: { analytics?: boolean; affiliate?: boolean } = {}) {
  const baseUrl =
    typeof window !== "undefined" && window.location.protocol.startsWith("http")
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  const path = `/api/redirect/${dealId}`;
  const url = baseUrl ? new URL(path, baseUrl) : new URL(path, "http://127.0.0.1:3000");

  url.searchParams.set("from", from);
  if (options.analytics) url.searchParams.set("analytics", "granted");
  if (options.affiliate) url.searchParams.set("affiliate", "granted");

  return baseUrl ? url.toString() : `${path}?${url.searchParams.toString()}`;
}
