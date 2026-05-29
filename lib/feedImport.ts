import { categories } from "@/data/mockDeals";
import { Deal, DealCategory } from "@/types/deal";

export interface PartnerFeedItem {
  externalId?: string;
  mall?: string;
  title?: string;
  category?: string;
  originalPrice?: number;
  salePrice?: number;
  imageUrl?: string;
  link?: string;
  expiresAt?: string;
  tags?: string[];
}

export interface FeedImportIssue {
  index: number;
  field: string;
  message: string;
}

const allowedCategories = new Set<string>(categories.filter((category) => category !== "전체"));

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeCategory(category?: string): DealCategory {
  return allowedCategories.has(category ?? "") ? (category as DealCategory) : "기타";
}

export function validatePartnerFeed(items: PartnerFeedItem[]) {
  const issues: FeedImportIssue[] = [];

  items.forEach((item, index) => {
    if (!item.externalId?.trim()) issues.push({ index, field: "externalId", message: "외부 ID가 필요합니다." });
    if (!item.mall?.trim()) issues.push({ index, field: "mall", message: "쇼핑몰명이 필요합니다." });
    if (!item.title?.trim()) issues.push({ index, field: "title", message: "상품명이 필요합니다." });
    if (!item.link || !isValidUrl(item.link)) issues.push({ index, field: "link", message: "유효한 URL이 필요합니다." });
    if (!Number.isFinite(item.originalPrice) || Number(item.originalPrice) <= 0) {
      issues.push({ index, field: "originalPrice", message: "정상 원가가 필요합니다." });
    }
    if (!Number.isFinite(item.salePrice) || Number(item.salePrice) <= 0) {
      issues.push({ index, field: "salePrice", message: "정상 할인가가 필요합니다." });
    }
    if (Number(item.salePrice) > Number(item.originalPrice)) {
      issues.push({ index, field: "salePrice", message: "할인가가 원가보다 높을 수 없습니다." });
    }
    if (item.expiresAt && Number.isNaN(new Date(item.expiresAt).getTime())) {
      issues.push({ index, field: "expiresAt", message: "마감 시간이 ISO 날짜 형식이 아닙니다." });
    }
  });

  return issues;
}

export function normalizePartnerFeed(items: PartnerFeedItem[], source = "partner_feed") {
  const now = new Date().toISOString();

  return items.map((item) => {
    const originalPrice = Number(item.originalPrice);
    const salePrice = Number(item.salePrice);
    const discountAmount = Math.max(0, originalPrice - salePrice);
    const discountRate = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 6) : [];

    return {
      id: `${source}-${item.externalId}`,
      mall: item.mall!.trim(),
      title: item.title!.trim(),
      category: normalizeCategory(item.category),
      originalPrice,
      salePrice,
      discountRate,
      discountAmount,
      imageUrl: item.imageUrl ?? "",
      link: item.link!,
      source,
      expiresAt: item.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isHot: discountRate >= 40,
      isNew: true,
      isEndingSoon: item.expiresAt ? new Date(item.expiresAt).getTime() - Date.now() < 6 * 60 * 60 * 1000 : false,
      createdAt: now,
      tags,
      popularityScore: Math.min(99, 50 + discountRate + tags.length * 2)
    } satisfies Deal;
  });
}

export function dryRunPartnerFeedImport(items: PartnerFeedItem[], source = "partner_feed") {
  const issues = validatePartnerFeed(items);
  const validIndexes = new Set(
    items
      .map((_, index) => index)
      .filter((index) => !issues.some((issue) => issue.index === index))
  );
  const validItems = items.filter((_, index) => validIndexes.has(index));
  const normalizedDeals = normalizePartnerFeed(validItems, source);

  return {
    ok: issues.length === 0,
    source,
    received: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length,
    issues,
    previewDeals: normalizedDeals.slice(0, 10)
  };
}

export const samplePartnerFeed: PartnerFeedItem[] = [
  {
    externalId: "partner-001",
    mall: "파트너몰",
    title: "프리미엄 즉석밥 24개입",
    category: "식품",
    originalPrice: 39800,
    salePrice: 24900,
    link: "https://example.com/partner/rice",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    tags: ["무료배송", "쿠폰적용"]
  },
  {
    externalId: "partner-002",
    mall: "파트너몰",
    title: "무선 청소기 주말 특가",
    category: "가전",
    originalPrice: 259000,
    salePrice: 159000,
    link: "https://example.com/partner/vacuum",
    tags: ["카드할인", "한정수량"]
  }
];
