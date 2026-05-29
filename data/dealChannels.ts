import { Deal } from "@/types/deal";

export type DealChannelType = "all" | "curated" | "mall" | "category" | "travel" | "signal";

export interface DealChannel {
  id: string;
  label: string;
  group: string;
  type: DealChannelType;
  description: string;
  value?: string;
}

export const dealChannels: DealChannel[] = [
  { id: "all", label: "전체", group: "추천", type: "all", description: "모든 실시간 특가" },
  { id: "popular", label: "인기 특가", group: "추천", type: "curated", description: "반응이 빠른 특가" },
  { id: "ending", label: "마감 임박", group: "추천", type: "curated", description: "놓치기 쉬운 종료 임박 특가" },
  { id: "news", label: "실시간 브리핑", group: "추천", type: "signal", description: "할인도사가 감지한 새 특가 단서" },
  { id: "mall-coupang", label: "쿠팡", group: "쇼핑몰", type: "mall", value: "쿠팡", description: "쿠팡 특가" },
  { id: "mall-naver", label: "네이버", group: "쇼핑몰", type: "mall", value: "네이버", description: "네이버쇼핑 계열 특가" },
  { id: "mall-gmarket", label: "G마켓", group: "쇼핑몰", type: "mall", value: "G마켓", description: "G마켓/지마켓 특가" },
  { id: "mall-11st", label: "11번가", group: "쇼핑몰", type: "mall", value: "11번가", description: "11번가 특가" },
  { id: "mall-lotteon", label: "롯데온", group: "쇼핑몰", type: "mall", value: "롯데온", description: "롯데온 특가" },
  { id: "mall-ssg", label: "SSG닷컴", group: "쇼핑몰", type: "mall", value: "SSG닷컴", description: "SSG닷컴 특가" },
  { id: "mall-oliveyoung", label: "올리브영", group: "쇼핑몰", type: "mall", value: "올리브영", description: "올리브영 특가" },
  { id: "mall-musinsa", label: "무신사", group: "쇼핑몰", type: "mall", value: "무신사", description: "무신사 패션 특가" },
  { id: "food", label: "식품/생필품", group: "상품군", type: "category", value: "식품", description: "식품과 생활 필수품" },
  { id: "digital", label: "디지털/가전", group: "상품군", type: "category", value: "전자기기", description: "디지털 기기와 가전" },
  { id: "living", label: "생활/가구", group: "상품군", type: "category", value: "생활용품", description: "생활용품과 홈 인테리어" },
  { id: "fashion", label: "패션/뷰티", group: "상품군", type: "category", value: "의류", description: "의류, 잡화, 뷰티" },
  { id: "baby", label: "육아", group: "상품군", type: "category", value: "육아", description: "육아용품 특가" },
  { id: "travel", label: "항공권/여행", group: "여행", type: "travel", value: "여행/티켓", description: "항공권, 숙박, 티켓 특가" }
];

export function getDealChannel(id?: string | null) {
  return dealChannels.find((channel) => channel.id === id || channel.label === id) ?? dealChannels[0];
}

export function isCategoryChannel(id?: string | null) {
  return getDealChannel(id).type === "category" || getDealChannel(id).type === "travel";
}

export function getProviderCategory(id?: string | null) {
  const channel = getDealChannel(id);
  return isCategoryChannel(id) ? channel.value : undefined;
}

export function dealMatchesChannel(deal: Deal, id?: string | null) {
  const channel = getDealChannel(id);
  const mall = deal.mall.toLowerCase();
  const haystack = [deal.mall, deal.title, deal.category, ...deal.tags].join(" ").toLowerCase();

  switch (channel.type) {
    case "all":
      return true;
    case "curated":
      if (channel.id === "popular") return deal.isHot || deal.popularityScore >= 85;
      if (channel.id === "ending") return deal.isEndingSoon;
      return true;
    case "mall":
      if (!channel.value) return true;
      if (channel.value === "G마켓") return /g마켓|지마켓|gmarket/.test(mall);
      if (channel.value === "네이버") return /네이버|naver/.test(mall);
      return mall.includes(channel.value.toLowerCase());
    case "category":
      if (channel.id === "digital") return deal.category === "전자기기" || deal.category === "가전";
      if (channel.id === "fashion") return deal.category === "의류" || deal.category === "뷰티";
      if (channel.id === "food") return deal.category === "식품" || /생수|라면|김치|고기|식품|생활필수/.test(haystack);
      return deal.category === channel.value;
    case "travel":
      return deal.category === "여행/티켓" || /항공|여행|숙박|호텔|티켓|공연/.test(haystack);
    case "signal":
      return deal.isNew || deal.tags.some((tag) => /실시간|핫딜|오늘만/.test(tag));
    default:
      return true;
  }
}
