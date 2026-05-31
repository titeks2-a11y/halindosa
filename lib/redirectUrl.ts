import { isHttpUrl, resolveDealDestinationUrl } from "@/lib/affiliate";
import type { Deal } from "@/types/deal";

type RedirectOptions = { analytics?: boolean; affiliate?: boolean };

export function buildDealRedirectUrl(dealId: string, from: string, options: RedirectOptions = {}) {
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

export function buildNativeSafeDealUrl(deal: Deal, from: string, options: RedirectOptions = {}) {
  const redirectUrl = buildDealRedirectUrl(deal.id, from, options);

  if (isHttpUrl(redirectUrl)) {
    return redirectUrl;
  }

  return resolveDealDestinationUrl(deal, Boolean(options.affiliate));
}
