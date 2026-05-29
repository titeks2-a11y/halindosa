import { Deal } from "@/types/deal";

const affiliateMallAllowList = new Set([
  "쿠팡",
  "11번가",
  "G마켓",
  "네이버쇼핑",
  "SSG닷컴",
  "올리브영",
  "하이마트"
]);

export function isAffiliateEligible(deal: Pick<Deal, "mall">) {
  return affiliateMallAllowList.has(deal.mall);
}

export function buildOutboundUrl(deal: Deal, from: string, includeAffiliateParams = true) {
  const outboundUrl = new URL(deal.link);

  if (includeAffiliateParams && isAffiliateEligible(deal)) {
    outboundUrl.searchParams.set("sub_id", process.env.AFFILIATE_SUB_ID ?? "halindosa-local");
    outboundUrl.searchParams.set("utm_source", "halindosa");
    outboundUrl.searchParams.set("utm_medium", "affiliate_redirect");
    outboundUrl.searchParams.set("utm_campaign", from || "unknown");
  }

  return outboundUrl.toString();
}

export function getAffiliateDisclosure(deal: Pick<Deal, "mall">) {
  if (!isAffiliateEligible(deal)) {
    return "판매처 정책에 따라 가격과 재고가 변동될 수 있습니다.";
  }

  return "제휴 링크가 포함될 수 있으며 구매 시 할인도사가 수수료를 받을 수 있습니다.";
}
