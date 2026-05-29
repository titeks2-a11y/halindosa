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
  { id: "all", label: "전체", group: "카테고리", type: "all", description: "모든 실시간 특가" },
  { id: "food", label: "식품", group: "카테고리", type: "category", value: "식품", description: "식품, 간편식, 생필품 특가" },
  { id: "living", label: "생활용품", group: "카테고리", type: "category", value: "생활용품", description: "생활용품과 홈 인테리어" },
  { id: "digital", label: "디지털", group: "카테고리", type: "category", value: "전자기기", description: "디지털 기기와 가전" },
  { id: "fashion", label: "패션", group: "카테고리", type: "category", value: "의류", description: "패션, 잡화, 뷰티" },
  { id: "baby", label: "육아", group: "카테고리", type: "category", value: "육아", description: "육아용품 특가" },
  { id: "travel", label: "여행", group: "카테고리", type: "travel", value: "여행/티켓", description: "항공권, 숙박, 티켓 특가" },
  { id: "etc", label: "기타", group: "카테고리", type: "category", value: "기타", description: "그 외 실속 특가" }
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
      if (channel.id === "living") return deal.category === "생활용품" || deal.category === "가전";
      if (channel.id === "etc") return deal.category === "기타";
      return deal.category === channel.value;
    case "travel":
      return deal.category === "여행/티켓" || /항공|여행|숙박|호텔|티켓|공연/.test(haystack);
    case "signal":
      return deal.isNew || deal.tags.some((tag) => /실시간|핫딜|오늘만/.test(tag));
    default:
      return true;
  }
}
