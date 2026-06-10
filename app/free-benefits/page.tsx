import type { Metadata } from "next";
import { FreeBenefitsClient } from "@/components/FreeBenefitsClient";
import { getDeals } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { selectPublishableFreeBenefitEvents } from "@/lib/freeBenefitEvents";
import type { Deal } from "@/types/deal";
import type { NewsBenefitType } from "@/types/newsDeal";

export const metadata: Metadata = {
  title: "무료혜택 - 할인도사",
  description: "무료 샘플, 체험단, 쿠폰, 무료배송, 포인트 적립 혜택을 한눈에 확인하세요."
};

const benefitTypes = new Set(["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"]);
const officialBenefitTypes = new Set<NewsBenefitType>([
  "coupon",
  "freebie",
  "freeShipping",
  "event",
  "gifticon",
  "membership",
  "card",
  "culture",
  "public",
  "point",
  "foodDelivery",
  "convenienceStore",
  "mart"
]);
const initialFreeBenefitDealLimit = 24;
const initialOfficialBenefitLimit = 24;
const initialOfficialBenefitEventLimit = 16;

function mergeUniqueOfficialBenefits<T extends { id: string }>(required: T[], primary: T[], limit: number) {
  const byId = new Map<string, T>();

  [...required, ...primary].forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item);
  });

  return Array.from(byId.values()).slice(0, limit);
}

export default async function FreeBenefitsPage() {
  const { deals } = await getDeals({ sort: "hot" });
  const freeBenefitDeals = deals
    .filter((deal: Deal) => benefitTypes.has(deal.dealType) || deal.isFreeShipping)
    .slice(0, initialFreeBenefitDealLimit);
  const officialBenefitsResult = getVisibleNewsDeals({ limit: initialOfficialBenefitLimit, sort: "priority" });
  const cultureInviteBenefitsResult = getVisibleNewsDeals({ limit: 8, category: "영화/문화", sort: "endingSoon", includePublicPolicy: true });
  const officialBenefits = mergeUniqueOfficialBenefits(
    cultureInviteBenefitsResult.deals.filter((deal) => officialBenefitTypes.has(deal.benefitType) || deal.category === "무료혜택" || deal.category === "영화/문화"),
    officialBenefitsResult.deals.filter((deal) => officialBenefitTypes.has(deal.benefitType) || deal.category === "무료혜택"),
    initialOfficialBenefitLimit
  );
  const officialBenefitEvents = selectPublishableFreeBenefitEvents(officialBenefits, initialOfficialBenefitEventLimit);

  return (
    <FreeBenefitsClient
      deals={freeBenefitDeals}
      officialBenefits={officialBenefits}
      officialBenefitEvents={officialBenefitEvents}
      officialBenefitsUpdatedAt={officialBenefitsResult.updatedAt}
      officialBenefitFreshnessLabel={officialBenefitsResult.freshnessLabel}
    />
  );
}
