import type { Metadata } from "next";
import { FreeBenefitsClient } from "@/components/FreeBenefitsClient";
import { getDeals } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
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
  "membership",
  "card",
  "culture",
  "public",
  "point",
  "foodDelivery",
  "convenienceStore",
  "mart"
]);

export default async function FreeBenefitsPage() {
  const { deals } = await getDeals({ sort: "hot" });
  const freeBenefitDeals = deals.filter((deal: Deal) => benefitTypes.has(deal.dealType) || deal.isFreeShipping);
  const officialBenefitsResult = getVisibleNewsDeals({ limit: 36, sort: "priority" });
  const officialBenefits = officialBenefitsResult.deals.filter((deal) => officialBenefitTypes.has(deal.benefitType) || deal.category === "무료혜택");

  return (
    <FreeBenefitsClient
      deals={freeBenefitDeals}
      officialBenefits={officialBenefits}
      officialBenefitsUpdatedAt={officialBenefitsResult.updatedAt}
      officialBenefitFreshnessLabel={officialBenefitsResult.freshnessLabel}
    />
  );
}
