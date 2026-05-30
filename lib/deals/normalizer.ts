import { Deal, DealCategory } from "@/types/deal";

export type DealInput = Partial<Deal> & {
  id: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discountRate?: number;
  mallName?: string;
  mall?: string;
  category?: DealCategory;
  thumbnail?: string;
  imageUrl?: string;
  link: string;
  shipping?: string;
  shippingInfo?: string;
  createdAt?: string;
  expireAt?: string;
  expiresAt?: string;
  tags?: string[];
};

export function normalizeDeal(input: DealInput, source = input.source ?? "mock"): Deal {
  const mallName = input.mallName ?? input.mall ?? "할인도사";
  const thumbnail = input.thumbnail ?? input.imageUrl ?? "";
  const shipping = input.shipping ?? input.shippingInfo ?? "판매처 조건 확인";
  const expireAt = input.expireAt ?? input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const tags = input.tags ?? [];
  const discountAmount = input.discountAmount ?? Math.max(0, input.originalPrice - input.salePrice);
  const discountRate = input.discountRate ?? Math.round((discountAmount / Math.max(input.originalPrice, 1)) * 100);
  const isFreeShipping = input.isFreeShipping ?? /무료배송|무배|네멤무료|로켓프레시/.test([shipping, ...tags].join(" "));

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? `${mallName}에서 확인된 ${input.title} 특가입니다.`,
    originalPrice: input.originalPrice,
    salePrice: input.salePrice,
    discountRate,
    mallName,
    category: input.category ?? "기타",
    thumbnail,
    link: input.link,
    shipping,
    createdAt,
    expireAt,
    tags,
    isHot: input.isHot ?? false,
    isFreeShipping,
    discountAmount,
    source,
    notice: input.notice ?? "가격, 재고, 쿠폰, 배송 조건은 판매처에서 최종 확인하세요.",
    isNew: input.isNew ?? false,
    isEndingSoon: input.isEndingSoon ?? new Date(expireAt).getTime() - Date.now() < 6 * 60 * 60 * 1000,
    popularityScore: input.popularityScore ?? 0,
    mall: mallName,
    imageUrl: thumbnail,
    shippingInfo: shipping,
    expiresAt: expireAt
  };
}

export function normalizeDeals(items: DealInput[], source?: string) {
  return items.map((item) => normalizeDeal(item, source));
}
