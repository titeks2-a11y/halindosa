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
  mall: string;
  title: string;
  category: DealCategory;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  discountAmount: number;
  imageUrl: string;
  link: string;
  source: string;
  expiresAt: string;
  isHot: boolean;
  isNew: boolean;
  isEndingSoon: boolean;
  createdAt: string;
  tags: string[];
  popularityScore: number;
}
