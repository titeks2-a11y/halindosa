export function buildDealRedirectUrl(dealId: string, from: string, options: { analytics?: boolean; affiliate?: boolean } = {}) {
  const baseUrl =
    typeof window !== "undefined" && window.location.protocol.startsWith("http")
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  const path = `/go/${dealId}`;
  const params = new URLSearchParams();

  params.set("from", from);
  if (options.analytics) params.set("analytics", "granted");
  if (options.affiliate) params.set("affiliate", "granted");

  if (!baseUrl) return `${path}?${params.toString()}`;

  const url = new URL(path, baseUrl);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return url.toString();
}
