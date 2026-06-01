import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import type { Deal } from "@/types/deal";

export type BenefitDecisionGuideId = "free" | "coupon" | "endingSoon" | "verified";

export type BenefitDecisionGuideItem = {
  id: BenefitDecisionGuideId;
  title: string;
  value: string;
  count: number;
  copy: string;
  action: string;
  href: string;
};

export function buildBenefitDecisionGuide(deals: Deal[]): BenefitDecisionGuideItem[] {
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");
  const freeCount = activeDeals.filter((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice === 0).length;
  const couponCount = activeDeals.filter((deal) => ["coupon", "point", "event", "foodDelivery"].includes(deal.dealType)).length;
  const urgentCount = activeDeals.filter((deal) => deal.isEndingSoon).length;
  const verifiedCount = activeDeals.filter(isVerifiedPurchaseLink).length;

  return [
    {
      id: "free",
      title: "돈 안 쓰고 받을 것",
      value: `${freeCount}개`,
      count: freeCount,
      copy: "샘플, 체험, 무료 쿠폰처럼 결제 전에 먼저 챙길 혜택입니다.",
      action: "무료 혜택 보기",
      href: "/free-benefits?dealType=freebie&sort=recommended"
    },
    {
      id: "coupon",
      title: "결제 전 적용할 것",
      value: `${couponCount}개`,
      count: couponCount,
      copy: "쿠폰, 포인트, 외식 혜택처럼 최종 결제 전에 확인하면 좋은 항목입니다.",
      action: "쿠폰 조건 보기",
      href: "/?benefit=coupon&sort=hot"
    },
    {
      id: "endingSoon",
      title: "오늘 놓치기 쉬운 것",
      value: `${urgentCount}개`,
      count: urgentCount,
      copy: "선착순, 기간 한정, 마감 임박 신호가 있는 혜택을 먼저 모았습니다.",
      action: "마감 혜택 보기",
      href: "/?endingSoonOnly=true&sort=endingSoon"
    },
    {
      id: "verified",
      title: "구매처가 확인된 것",
      value: `${verifiedCount}개`,
      count: verifiedCount,
      copy: "검색 결과보다 상품·이벤트 상세로 바로 이동 가능한 혜택입니다.",
      action: "바로 이동 상품 보기",
      href: "/?verifiedOnly=true"
    }
  ];
}
