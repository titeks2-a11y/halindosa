import { Deal } from "@/types/deal";
import { getLinkQualityScore } from "@/lib/deals/quality";
import { isRealDealImageUrl } from "@/lib/deals/imageResolver";

export function hasRealDealImage(deal: Pick<Deal, "imageUrl" | "thumbnail">) {
  const image = deal.imageUrl || deal.thumbnail || "";
  return isRealDealImageUrl(image);
}

export function getDealImageQualityScore(deal: Pick<Deal, "imageUrl" | "thumbnail">) {
  return hasRealDealImage(deal) ? 14 : -4;
}

export function getCommercialDealScore(deal: Deal, now = Date.now()) {
  const expireHours = Math.max(1, (new Date(deal.expireAt).getTime() - now) / (60 * 60 * 1000));

  return (
    getLinkQualityScore(deal) +
    getDealImageQualityScore(deal) +
    Number(deal.isHot) * 40 +
    Number(deal.isFreeShipping) * 12 +
    deal.popularityScore +
    deal.discountRate * 0.8 +
    Math.max(0, 24 - expireHours)
  );
}

export function sortCommercialDeals(deals: Deal[]) {
  return [...deals].sort((a, b) => getCommercialDealScore(b) - getCommercialDealScore(a) || b.discountRate - a.discountRate);
}
