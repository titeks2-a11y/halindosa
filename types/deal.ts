export type DealCategory =
  | "식품"
  | "전자기기"
  | "생활용품"
  | "의류"
  | "육아"
  | "여행/티켓"
  | "뷰티"
  | "가전"
  | "기타";

export type DealSort = "latest" | "discount" | "price" | "hot" | "endingSoon";

export interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  mallName: string;
  category: DealCategory;
  thumbnail: string;
  link: string;
  shipping: string;
  createdAt: string;
  expireAt: string;
  tags: string[];
  isHot: boolean;
  isFreeShipping: boolean;
  discountAmount: number;
  source: string;
  notice: string;
  isNew: boolean;
  isEndingSoon: boolean;
  popularityScore: number;
  mall: string;
  imageUrl: string;
  shippingInfo: string;
  expiresAt: string;
}

export type DealDataMode = "mock" | "staging" | "production" | "hybrid";
