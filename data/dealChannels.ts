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
  { id: "today", label: "오늘특가", group: "추천", type: "curated", description: "오늘 바로 확인할 할인 혜택" },
  { id: "popular", label: "인기 급상승", group: "추천", type: "curated", description: "반응이 빠르게 올라오는 특가" },
  { id: "freezero", label: "무료혜택", group: "추천", type: "curated", description: "무료 샘플, 0원딜, 무료배송, 쿠폰 중심" },
  { id: "ending", label: "마감임박", group: "추천", type: "curated", description: "마감 시간이 가까운 특가" },
  { id: "lowest", label: "가격 주목", group: "추천", type: "curated", description: "할인율과 반응이 높은 가격 주목 상품" },
  { id: "food", label: "식품", group: "카테고리", type: "category", value: "식품", description: "식품, 간편식, 생필품 특가" },
  { id: "living", label: "생활용품", group: "카테고리", type: "category", value: "생활용품", description: "생활용품과 홈 인테리어" },
  { id: "digital", label: "디지털", group: "카테고리", type: "category", value: "전자기기", description: "디지털 기기와 가전" },
  { id: "fashion", label: "패션", group: "카테고리", type: "category", value: "의류", description: "패션, 잡화, 뷰티" },
  { id: "baby", label: "육아", group: "카테고리", type: "category", value: "육아", description: "육아용품 특가" },
  { id: "travel", label: "여행", group: "카테고리", type: "travel", value: "여행/티켓", description: "항공권, 숙박, 티켓 특가" },
  { id: "mart", label: "편의점/마트", group: "카테고리", type: "category", value: "편의점/마트", description: "편의점, 마트, 생활비 절약 딜" },
  { id: "coupon", label: "쿠폰/이벤트", group: "카테고리", type: "category", value: "쿠폰/이벤트", description: "쿠폰, 교환권, 0원딜 이벤트" },
  { id: "coupang", label: "쿠팡", group: "쇼핑몰", type: "mall", value: "쿠팡", description: "쿠팡 특가" },
  { id: "naver", label: "네이버", group: "쇼핑몰", type: "mall", value: "네이버", description: "네이버쇼핑 특가" },
  { id: "gmarket", label: "G마켓", group: "쇼핑몰", type: "mall", value: "G마켓", description: "G마켓/지마켓 특가" },
  { id: "11st", label: "11번가", group: "쇼핑몰", type: "mall", value: "11번가", description: "11번가 특가" },
  { id: "ssg", label: "SSG", group: "쇼핑몰", type: "mall", value: "SSG", description: "SSG/이마트 특가" },
  { id: "auction", label: "옥션", group: "쇼핑몰", type: "mall", value: "옥션", description: "옥션 쿠폰/특가" },
  { id: "aliexpress", label: "알리", group: "쇼핑몰", type: "mall", value: "알리", description: "알리익스프레스 해외직구 특가" },
  { id: "lotteon", label: "롯데온", group: "쇼핑몰", type: "mall", value: "롯데온", description: "롯데온 타임딜" },
  { id: "interpark", label: "인터파크", group: "쇼핑몰", type: "mall", value: "인터파크", description: "인터파크 쇼핑/티켓 특가" },
  { id: "oliveyoung", label: "올리브영", group: "쇼핑몰", type: "mall", value: "올리브영", description: "올리브영 뷰티 특가" },
  { id: "musinsa", label: "무신사", group: "쇼핑몰", type: "mall", value: "무신사", description: "무신사 패션 특가" },
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
      if (channel.id === "today") return deal.dealType === "discount" || deal.isHot || /오늘만|타임세일/.test(haystack);
      if (channel.id === "popular") return deal.isHot || deal.popularityScore >= 85;
      if (channel.id === "freezero") return ["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType) || deal.isFreeShipping || /0원딜|무료|쿠폰/.test(haystack);
      if (channel.id === "ending") return deal.isEndingSoon;
      if (channel.id === "lowest") return deal.discountRate >= 50 || /역대가|가격\s*하락|쿠폰/.test(haystack);
      return true;
    case "mall":
      if (!channel.value) return true;
      if (channel.value === "G마켓") return /g마켓|지마켓|gmarket/.test(mall);
      if (channel.value === "네이버") return /네이버|naver/.test(mall);
      if (channel.value === "SSG") return /ssg|쓱|이마트/.test(mall);
      if (channel.value === "알리") return /알리|ali/.test(mall);
      if (channel.value === "인터파크") return /인터파크|interpark/.test(mall);
      return mall.includes(channel.value.toLowerCase());
    case "category":
      if (channel.id === "digital") return deal.category === "전자기기" || deal.category === "가전";
      if (channel.id === "fashion") return deal.category === "의류" || deal.category === "뷰티";
      if (channel.id === "food") return deal.category === "식품" || /생수|라면|김치|고기|식품|생활필수/.test(haystack);
      if (channel.id === "living") return deal.category === "생활용품" || deal.category === "가전";
      if (channel.id === "etc") return deal.category === "기타";
      if (channel.id === "mart") return deal.category === "편의점/마트" || /마트|편의점|gs25|cu|세븐/.test(haystack);
      if (channel.id === "coupon") return deal.category === "쿠폰/이벤트" || /쿠폰|이벤트|교환권|0원딜/.test(haystack);
      return deal.category === channel.value;
    case "travel":
      return deal.category === "여행/티켓" || /항공|여행|숙박|호텔|티켓|공연/.test(haystack);
    case "signal":
      return deal.isNew || deal.tags.some((tag) => /실시간|핫딜|오늘만/.test(tag));
    default:
      return true;
  }
}
