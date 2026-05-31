import type { Metadata } from "next";
import { FreeBenefitsClient } from "@/components/FreeBenefitsClient";
import { mockDeals } from "@/data/mockDeals";
import { Deal } from "@/types/deal";

export const metadata: Metadata = {
  title: "무료혜택 - 할인도사",
  description: "무료 샘플, 체험단, 쿠폰, 무료배송, 포인트 적립 혜택을 한눈에 확인하세요."
};

const benefitTypes = new Set(["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"]);

export default function FreeBenefitsPage() {
  const freeBenefitDeals = mockDeals.filter((deal: Deal) => benefitTypes.has(deal.dealType) || deal.isFreeShipping);

  return <FreeBenefitsClient deals={freeBenefitDeals} />;
}
